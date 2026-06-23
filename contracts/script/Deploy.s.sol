// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {PredictionMarket} from "../src/PredictionMarket.sol";

contract Deploy is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        // TODO(ritual): set EXECUTOR to a registered TEE executor address.
        address executor = vm.envOr("EXECUTOR", address(0));

        vm.startBroadcast(pk);
        PredictionMarket market = new PredictionMarket(executor);
        console2.log("PredictionMarket deployed at:", address(market));
        vm.stopBroadcast();
    }
}
