// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {BorrowDeskMarket} from "../src/BorrowDeskMarket.sol";

/// @notice Single-broadcast deploy + market listing for Robinhood Chain.
contract DeployMainnetOneShot is Script {
    address constant USDG = 0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168;

    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(pk);

        BorrowDeskMarket market = new BorrowDeskMarket(USDG);

        // list core liquid names only (gas-aware). Can expand later via owner.
        market.listMarket(
            0xd0601CE157Db5bdC3162BbaC2a2C8aF5320D9EEC, // NVDA
            0x379EC4f7C378F34a1B47E4F3cbeBCbAC3E8E9F15,
            6000,
            7500,
            500
        );
        market.listMarket(
            0xaF3D76f1834A1d425780943C99Ea8A608f8a93f9, // AAPL
            0x6B22A786bAa607d76728168703a39Ea9C99f2cD0,
            6000,
            7500,
            500
        );
        market.listMarket(
            0x322F0929c4625eD5bAd873c95208D54E1c003b2d, // TSLA
            0x4A1166a659A55625345e9515b32adECea5547C38,
            5000,
            6500,
            500
        );
        market.listMarket(
            0x117cc2133c37B721F49dE2A7a74833232B3B4C0C, // SPY
            0x319724394D3A0e3669269846abE664Cd621f9f6A,
            6500,
            8000,
            500
        );

        console2.log("BorrowDeskMarket", address(market));
        console2.log("owner", vm.addr(pk));

        vm.stopBroadcast();
    }
}
