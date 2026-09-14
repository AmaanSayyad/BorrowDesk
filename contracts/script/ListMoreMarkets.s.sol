// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {BorrowDeskMarket} from "../src/BorrowDeskMarket.sol";

/// @notice List remaining Stock Tokens on the live BorrowDeskMarket.
contract ListMoreMarkets is Script {
    address constant MARKET = 0x2e4E7E8145E4cCA7E0fEf4737A2489E4E27D9E8d;

    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        BorrowDeskMarket market = BorrowDeskMarket(MARKET);

        vm.startBroadcast(pk);

        // Already live: NVDA, AAPL, TSLA, SPY
        market.listMarket(
            0x12f190a9F9d7D37a250758b26824B97CE941bF54, // AMZN
            0xD5a1508ceD74c084eBf3cBe853e2C968fB2a651C,
            6000,
            7500,
            500
        );
        market.listMarket(
            0xe93237C50D904957Cf27E7B1133b510C669c2e74, // MSFT
            0x45C3C877C15E6BA2EBB19eA114Ea508d14C1Af2E,
            6000,
            7500,
            500
        );
        market.listMarket(
            0xc0D6457C16Cc70d6790Dd43521C899C87ce02f35, // META
            0x7C38C00C30BEe9378381E7B6135d7283356D71b1,
            5500,
            7000,
            500
        );
        market.listMarket(
            0x2e0847E8910a9732eB3fb1bb4b70a580ADAD4FE3, // GOOGL
            0xF6f373a037c30F0e5010d854385cA89185AE638b,
            6000,
            7500,
            500
        );

        vm.stopBroadcast();

        console2.log("Listed AMZN MSFT META GOOGL on", MARKET);
    }
}
