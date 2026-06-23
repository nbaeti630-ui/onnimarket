// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {PrecompileConsumer} from "./PrecompileConsumer.sol";

/// @title OnniMarket - Self-resolving crypto prediction market on Ritual Chain
/// @notice Binary (YES/NO) markets on a crypto price threshold. After the
///         deadline, anyone can call `resolve()`. The contract fetches the live
///         price itself via Ritual's HTTP precompile (0x0801) + JQ precompile
///         (0x0803) inside a TEE, so there is NO external oracle.
/// @dev This is an MVP scaffold. Spots marked `TODO(ritual)` must be filled with
///      real values from your network (executor address from TEEServiceRegistry,
///      the exact price API + JQ path). Cross-check encoding against the official
///      ritual-dapp-skills repo before mainnet.
contract PredictionMarket is PrecompileConsumer {
    enum Outcome { Unresolved, Yes, No }

    struct Market {
        string question;      // "Will BTC be above $120,000 on Jul 1 2026?"
        string asset;         // e.g. "bitcoin"
        uint256 targetPrice;  // threshold in USD (integer, no decimals)
        uint64 deadline;      // unix timestamp; resolvable after this
        uint256 poolYes;      // total wei staked on YES
        uint256 poolNo;       // total wei staked on NO
        Outcome outcome;      // result after resolution
        uint256 resolvedPrice;// price observed at resolution
        address creator;
        bool exists;
    }

    uint256 public marketCount;
    mapping(uint256 => Market) public markets;
    // marketId => user => (yesShares, noShares)
    mapping(uint256 => mapping(address => uint256)) public yesStake;
    mapping(uint256 => mapping(address => uint256)) public noStake;
    mapping(uint256 => mapping(address => bool)) public claimed;

    // TEE executor used for HTTP precompile calls.
    // TODO(ritual): set a registered executor from TEEServiceRegistry.
    address public executor;
    address public owner;

    event MarketCreated(uint256 indexed id, string question, string asset, uint256 targetPrice, uint64 deadline);
    event BetPlaced(uint256 indexed id, address indexed user, bool isYes, uint256 amount);
    event MarketResolved(uint256 indexed id, Outcome outcome, uint256 observedPrice);
    event Claimed(uint256 indexed id, address indexed user, uint256 payout);

    error NotOwner();
    error MarketMissing();
    error BettingClosed();
    error TooEarly();
    error AlreadyResolved();
    error NotResolved();
    error NothingToClaim();
    error ZeroAmount();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(address _executor) {
        owner = msg.sender;
        executor = _executor;
    }

    function setExecutor(address _executor) external onlyOwner {
        executor = _executor;
    }

    // --------------------------------------------------------------------
    // Market lifecycle
    // --------------------------------------------------------------------

    function createMarket(
        string calldata question,
        string calldata asset,
        uint256 targetPrice,
        uint64 deadline
    ) external returns (uint256 id) {
        require(deadline > block.timestamp, "deadline in past");
        id = ++marketCount;
        markets[id] = Market({
            question: question,
            asset: asset,
            targetPrice: targetPrice,
            deadline: deadline,
            poolYes: 0,
            poolNo: 0,
            outcome: Outcome.Unresolved,
            resolvedPrice: 0,
            creator: msg.sender,
            exists: true
        });
        emit MarketCreated(id, question, asset, targetPrice, deadline);
    }

    function bet(uint256 id, bool isYes) external payable {
        Market storage m = markets[id];
        if (!m.exists) revert MarketMissing();
        if (block.timestamp >= m.deadline) revert BettingClosed();
        if (msg.value == 0) revert ZeroAmount();

        if (isYes) {
            m.poolYes += msg.value;
            yesStake[id][msg.sender] += msg.value;
        } else {
            m.poolNo += msg.value;
            noStake[id][msg.sender] += msg.value;
        }
        emit BetPlaced(id, msg.sender, isYes, msg.value);
    }

    /// @notice Resolve a market by fetching the live price from inside a TEE.
    /// @dev HTTP precompile is a short-running async call: the TEE result is
    ///      replayed into THIS transaction, so `output` is available below.
    function resolve(uint256 id) external {
        Market storage m = markets[id];
        if (!m.exists) revert MarketMissing();
        if (block.timestamp < m.deadline) revert TooEarly();
        if (m.outcome != Outcome.Unresolved) revert AlreadyResolved();

        uint256 price = _fetchPrice(m.asset);
        m.resolvedPrice = price;
        m.outcome = price >= m.targetPrice ? Outcome.Yes : Outcome.No;
        emit MarketResolved(id, m.outcome, price);
    }

    /// @notice Winners claim their original stake + a pro-rata cut of the losing pool.
    function claim(uint256 id) external {
        Market storage m = markets[id];
        if (!m.exists) revert MarketMissing();
        if (m.outcome == Outcome.Unresolved) revert NotResolved();
        if (claimed[id][msg.sender]) revert NothingToClaim();

        uint256 winningStake;
        uint256 winningPool;
        uint256 losingPool;
        if (m.outcome == Outcome.Yes) {
            winningStake = yesStake[id][msg.sender];
            winningPool = m.poolYes;
            losingPool = m.poolNo;
        } else {
            winningStake = noStake[id][msg.sender];
            winningPool = m.poolNo;
            losingPool = m.poolYes;
        }
        if (winningStake == 0) revert NothingToClaim();

        claimed[id][msg.sender] = true;
        // payout = stake + stake/winningPool * losingPool
        uint256 payout = winningStake;
        if (winningPool > 0) {
            payout += (winningStake * losingPool) / winningPool;
        }
        emit Claimed(id, msg.sender, payout);
        (bool ok, ) = msg.sender.call{value: payout}("");
        require(ok, "transfer failed");
    }

    // --------------------------------------------------------------------
    // Ritual HTTP price fetch
    // --------------------------------------------------------------------

    /// @dev Builds the 13-field HTTP precompile request, calls it, then uses the
    ///      JQ precompile to extract the integer price from the JSON body.
    function _fetchPrice(string memory asset) internal returns (uint256) {
        // Example endpoint returns: {"price": 119873}
        // TODO(ritual): point this at a real price API and confirm the JSON shape.
        string memory url = string.concat(
            "https://api.example-price-feed.xyz/v1/price?asset=",
            asset
        );

        bytes memory httpInput = abi.encode(
            executor,            // 0  executor (from TEEServiceRegistry)
            new bytes[](0),      // 1  encryptedSecrets
            uint256(30),         // 2  ttl (blocks)
            new bytes[](0),      // 3  secretSignatures
            bytes(""),           // 4  userPublicKey (plaintext)
            url,                 // 5  url
            uint8(1),            // 6  method 1=GET
            new string[](0),     // 7  headerKeys
            new string[](0),     // 8  headerValues
            bytes(""),           // 9  body
            uint256(0),          // 10 dkmsKeyIndex
            uint8(0),            // 11 dkmsKeyFormat
            false                // 12 piiEnabled
        );

        bytes memory out = _executePrecompile(HTTP_CALL_PRECOMPILE, httpInput);
        (uint16 status, , , bytes memory body, string memory err) =
            abi.decode(out, (uint16, string[], string[], bytes, string));
        require(status == 200, err);

        // Extract ".price" as a number via the JQ precompile.
        return _jqUint(body, ".price");
    }

    /// @dev Uses JQ precompile (0x0803) to extract a numeric field, returned as a
    ///      decimal string, then parses it to uint. TODO(ritual): confirm JQ I/O
    ///      encoding against your node version.
    function _jqUint(bytes memory json, string memory path) internal returns (uint256) {
        bytes memory jqInput = abi.encode(json, path);
        bytes memory res = _executePrecompile(JQ_PRECOMPILE, jqInput);
        string memory s = abi.decode(res, (string));
        return _parseUint(s);
    }

    function _parseUint(string memory s) internal pure returns (uint256 result) {
        bytes memory b = bytes(s);
        for (uint256 i = 0; i < b.length; i++) {
            uint8 c = uint8(b[i]);
            if (c >= 48 && c <= 57) {
                result = result * 10 + (c - 48);
            }
            // ignore non-digit chars (handles quotes / decimals by truncation)
            if (c == 46) break; // stop at decimal point
        }
    }

    // --------------------------------------------------------------------
    // Views
    // --------------------------------------------------------------------

    function getMarket(uint256 id) external view returns (Market memory) {
        return markets[id];
    }

    /// @notice YES odds in basis points (0-10000).
    function yesOddsBps(uint256 id) external view returns (uint256) {
        Market storage m = markets[id];
        uint256 total = m.poolYes + m.poolNo;
        if (total == 0) return 5000;
        return (m.poolYes * 10000) / total;
    }
}
