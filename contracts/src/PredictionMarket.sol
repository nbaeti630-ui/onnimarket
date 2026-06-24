// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {PrecompileConsumer} from "./PrecompileConsumer.sol";

interface IRitualWallet {
    function deposit(uint256 lockDuration) external payable;
    function balanceOf(address user) external view returns (uint256);
}

/// @title OnniMarket V2 - Trustless self-resolving crypto prediction market
/// @notice Binary (YES/NO) markets on a crypto price threshold. After the
/// deadline ANYONE can call resolve(): the contract fetches the live price
/// itself via Ritual's HTTP precompile (0x0801) inside a TEE. No oracle,
/// no owner gate. Optional on-chain AI score via the ONNX precompile (0x0800).
contract PredictionMarket is PrecompileConsumer {
    enum Outcome { Unresolved, Yes, No }

    struct Market {
        string question;
        string asset;        // CoinGecko id, e.g. "bitcoin"
        uint256 targetPrice; // threshold in USD (integer)
        uint64 deadline;     // unix timestamp; resolvable after this
        uint256 poolYes;
        uint256 poolNo;
        Outcome outcome;
        uint256 resolvedPrice;
        address creator;
        bool exists;
    }

    uint256 public marketCount;
    mapping(uint256 => Market) public markets;
    mapping(uint256 => mapping(address => uint256)) public yesStake;
    mapping(uint256 => mapping(address => uint256)) public noStake;
    mapping(uint256 => mapping(address => bool)) public claimed;

    // On-chain AI score (basis points 0-10000) per market, via Ritual ONNX.
    mapping(uint256 => uint256) public aiScoreBps;
    mapping(uint256 => bool) public aiScored;

    address public executor; // a registered TEE executor (HTTP capability)
    address public owner;

    // Default ONNX model: HuggingFace repo pinned to a commit hash (required).
    string public aiModelId =
        "hf/Ritual-Net/sample_linreg/linreg_10_features.onnx@fd0501654c4144a9900a670c5c9a074b6bd3d4ef";

    event MarketCreated(uint256 indexed id, string question, string asset, uint256 targetPrice, uint64 deadline);
    event BetPlaced(uint256 indexed id, address indexed user, bool isYes, uint256 amount);
    event MarketResolved(uint256 indexed id, Outcome outcome, uint256 observedPrice);
    event Claimed(uint256 indexed id, address indexed user, uint256 payout);
    event AiScored(uint256 indexed id, uint256 scoreBps);
    event FeesDeposited(address indexed from, uint256 amount, uint256 lockBlocks);

    error NotOwner();
    error MarketMissing();
    error BettingClosed();
    error TooEarly();
    error AlreadyResolved();
    error NotResolved();
    error NothingToClaim();
    error ZeroAmount();
    error PriceUnavailable();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(address _executor) {
        owner = msg.sender;
        executor = _executor;
    }

    function setExecutor(address _executor) external onlyOwner { executor = _executor; }
    function setAiModel(string calldata modelId) external onlyOwner { aiModelId = modelId; }

    // --------------------------------------------------------------------
    // RitualWallet funding  (THE fix: the CONTRACT must pay executor fees)
    // --------------------------------------------------------------------

    /// @notice Fund this contract's own RitualWallet balance so resolve() can
    /// pay the TEE executor fee. Anyone can top it up.
    function depositForFees(uint256 lockBlocks) external payable {
        if (msg.value == 0) revert ZeroAmount();
        IRitualWallet(RITUAL_WALLET).deposit{value: msg.value}(lockBlocks);
        emit FeesDeposited(msg.sender, msg.value, lockBlocks);
    }

    function ritualBalance() external view returns (uint256) {
        return IRitualWallet(RITUAL_WALLET).balanceOf(address(this));
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

    /// @notice Trustless self-resolve. ANYONE can call after the deadline.
    /// The TEE fetches the live price; no oracle, no owner.
    function resolve(uint256 id) external {
        Market storage m = markets[id];
        if (!m.exists) revert MarketMissing();
        if (block.timestamp < m.deadline) revert TooEarly();
        if (m.outcome != Outcome.Unresolved) revert AlreadyResolved();

        uint256 price = _fetchPrice(m.asset);
        if (price == 0) revert PriceUnavailable();
        m.resolvedPrice = price;
        m.outcome = price >= m.targetPrice ? Outcome.Yes : Outcome.No;
        emit MarketResolved(id, m.outcome, price);
    }

    /// @notice Emergency owner fallback (kept for safety / frontend compat).
    function resolveManual(uint256 id, uint256 observedPrice) external onlyOwner {
        Market storage m = markets[id];
        if (!m.exists) revert MarketMissing();
        if (block.timestamp < m.deadline) revert TooEarly();
        if (m.outcome != Outcome.Unresolved) revert AlreadyResolved();
        m.resolvedPrice = observedPrice;
        m.outcome = observedPrice >= m.targetPrice ? Outcome.Yes : Outcome.No;
        emit MarketResolved(id, m.outcome, observedPrice);
    }

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
        uint256 payout = winningStake;
        if (winningPool > 0) {
            payout += (winningStake * losingPool) / winningPool;
        }
        emit Claimed(id, msg.sender, payout);
        (bool ok, ) = msg.sender.call{value: payout}("");
        require(ok, "transfer failed");
    }

    // --------------------------------------------------------------------
    // Ritual HTTP price fetch (0x0801) -- short-running async, replayed in-tx
    // --------------------------------------------------------------------

    function _fetchPrice(string memory asset) internal returns (uint256) {
        string memory url = string.concat(
            "https://api.coingecko.com/api/v3/simple/price?ids=",
            asset,
            "&vs_currencies=usd"
        );

        string[] memory hk = new string[](1);
        string[] memory hv = new string[](1);
        hk[0] = "Accept";
        hv[0] = "application/json";

        bytes memory httpInput = abi.encode(
            executor,        // 0  executor (TEE, HTTP capability)
            new bytes[](0),  // 1  encryptedSecrets
            uint256(100),    // 2  ttl (blocks)
            new bytes[](0),  // 3  secretSignatures
            bytes(""),       // 4  userPublicKey
            url,             // 5  url
            uint8(1),        // 6  method 1 = GET
            hk,              // 7  headerKeys
            hv,              // 8  headerValues
            bytes(""),       // 9  body
            uint256(0),      // 10 dkmsKeyIndex
            uint8(0),        // 11 dkmsKeyFormat
            false            // 12 piiEnabled
        );

        bytes memory raw = _executePrecompile(HTTP_CALL_PRECOMPILE, httpInput);

        // Async result is wrapped: (bytes simmedInput, bytes actualOutput).
        // During the builder's first simulation actualOutput is empty and this
        // call reverts -- that is expected; the commitment is created on detect
        // and the tx is replayed with the settled output injected.
        (, bytes memory actualOutput) = abi.decode(raw, (bytes, bytes));

        // HTTP response ABI: (uint16 status, string[] hk, string[] hv, bytes body, string err)
        (uint16 status, , , bytes memory body, ) =
            abi.decode(actualOutput, (uint16, string[], string[], bytes, string));
        require(status == 200, "http status");

        return _parseUsd(body);
    }

    /// @dev Extracts the integer part of the number that follows "usd" in the
    /// CoinGecko JSON body, e.g. {"bitcoin":{"usd":62554}} -> 62554.
    function _parseUsd(bytes memory body) internal pure returns (uint256 price) {
        uint256 n = body.length;
        bool foundKey = false;
        uint256 j = 0;
        for (uint256 i = 0; i + 3 <= n; i++) {
            if (body[i] == 0x75 && body[i + 1] == 0x73 && body[i + 2] == 0x64) {
                foundKey = true;
                j = i + 3;
                break;
            }
        }
        require(foundKey, "usd not found");

        bool started = false;
        while (j < n) {
            uint8 c = uint8(body[j]);
            if (c >= 48 && c <= 57) {
                started = true;
                price = price * 10 + (c - 48);
            } else if (started) {
                break; // stop at first non-digit after digits (handles '.' or '}')
            }
            j++;
        }
        require(started, "price parse");
    }

    // --------------------------------------------------------------------
    // Ritual ONNX AI score (0x0800) -- synchronous on-chain ML inference
    // --------------------------------------------------------------------

    /// @notice Run the configured ONNX model on caller-provided features and
    /// store a 0-10000 bps "AI signal" for the market. Features are IEEE-754
    /// float32 bit-patterns (computed client-side). Synchronous: result in tx.
    function computeAiScore(uint256 id, int32[] calldata features) external returns (uint256) {
        if (!markets[id].exists) revert MarketMissing();

        // RitualTensor: (uint8 dtype, uint16[] shape, int32[] values). dtype 5 = FLOAT32.
        uint16[] memory shape = new uint16[](2);
        shape[0] = 1;
        shape[1] = uint16(features.length);
        bytes memory tensor = abi.encode(uint8(5), shape, features);

        bytes memory input = abi.encode(
            bytes(aiModelId), // mlModelId (UTF-8)
            tensor,           // tensorData
            uint8(2),         // inputArithmetic 2 = IEEE-754 float
            uint8(0),         // inputFixedPointScale (n/a)
            uint8(1),         // outputArithmetic 1 = fixed-point
            uint8(4),         // outputFixedPointScale = 4 decimals
            uint8(1)          // rounding 1 = half-even
        );

        bytes memory out = _executePrecompile(ONNX_PRECOMPILE, input);

        // ONNX output envelope: (bytes tensorEncoded, uint8 outArith, uint8 outScale, uint8 rounding)
        (bytes memory tensorOut, , , ) = abi.decode(out, (bytes, uint8, uint8, uint8));
        // inner RitualTensor: (uint8 dtype, uint16[] shape, int32[] values)
        (, , int32[] memory values) = abi.decode(tensorOut, (uint8, uint16[], int32[]));
        require(values.length > 0, "no output");

        // fixed-point scale 4 => raw = realValue * 10^4. Clamp to [0, 10000] bps.
        int256 v = int256(values[0]);
        if (v < 0) v = 0;
        if (v > 10000) v = 10000;
        uint256 score = uint256(v);
        aiScoreBps[id] = score;
        aiScored[id] = true;
        emit AiScored(id, score);
        return score;
    }

    // --------------------------------------------------------------------
    // Views
    // --------------------------------------------------------------------

    function getMarket(uint256 id) external view returns (Market memory) {
        return markets[id];
    }

    function yesOddsBps(uint256 id) external view returns (uint256) {
        Market storage m = markets[id];
        uint256 total = m.poolYes + m.poolNo;
        if (total == 0) return 5000;
        return (m.poolYes * 10000) / total;
    }
}
