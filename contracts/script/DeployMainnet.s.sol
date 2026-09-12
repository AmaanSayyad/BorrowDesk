// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {BorrowDeskMarket} from "../src/BorrowDeskMarket.sol";

interface IERC20Approve {
    function decimals() external view returns (uint8);
    function balanceOf(address) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
}

/// @notice Deploy BorrowDeskMarket to Robinhood Chain mainnet (4663).
/// @dev Env:
///   PRIVATE_KEY          - deployer key (hex with or without 0x)
///   USDG_LIQUIDITY       - optional human USDG to seed (e.g. 500). Default 0.
contract DeployMainnetScript is Script {
    address constant USDG = 0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168;

    address constant NVDA = 0xd0601CE157Db5bdC3162BbaC2a2C8aF5320D9EEC;
    address constant AAPL = 0xaF3D76f1834A1d425780943C99Ea8A608f8a93f9;
    address constant TSLA = 0x322F0929c4625eD5bAd873c95208D54E1c003b2d;
    address constant AMZN = 0x12f190a9F9d7D37a250758b26824B97CE941bF54;
    address constant MSFT = 0xe93237C50D904957Cf27E7B1133b510C669c2e74;
    address constant META = 0xc0D6457C16Cc70d6790Dd43521C899C87ce02f35;
    address constant GOOGL = 0x2e0847E8910a9732eB3fb1bb4b70a580ADAD4FE3;
    address constant SPY = 0x117cc2133c37B721F49dE2A7a74833232B3B4C0C;

    address constant FEED_NVDA = 0x379EC4f7C378F34a1B47E4F3cbeBCbAC3E8E9F15;
    address constant FEED_AAPL = 0x6B22A786bAa607d76728168703a39Ea9C99f2cD0;
    address constant FEED_TSLA = 0x4A1166a659A55625345e9515b32adECea5547C38;
    address constant FEED_AMZN = 0xD5a1508ceD74c084eBf3cBe853e2C968fB2a651C;
    address constant FEED_MSFT = 0x45C3C877C15E6BA2EBB19eA114Ea508d14C1Af2E;
    address constant FEED_META = 0x7C38C00C30BEe9378381E7B6135d7283356D71b1;
    address constant FEED_GOOGL = 0xF6f373a037c30F0e5010d854385cA89185AE638b;
    address constant FEED_SPY = 0x319724394D3A0e3669269846abE664Cd621f9f6A;

    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        uint256 liquidityHuman = vm.envOr("USDG_LIQUIDITY", uint256(0));
        address deployer = vm.addr(pk);

        vm.startBroadcast(pk);

        BorrowDeskMarket market = new BorrowDeskMarket(USDG);

        market.listMarket(NVDA, FEED_NVDA, 6000, 7500, 500);
        market.listMarket(AAPL, FEED_AAPL, 6000, 7500, 500);
        market.listMarket(TSLA, FEED_TSLA, 5000, 6500, 500);
        market.listMarket(AMZN, FEED_AMZN, 6000, 7500, 500);
        market.listMarket(MSFT, FEED_MSFT, 6000, 7500, 500);
        market.listMarket(META, FEED_META, 5500, 7000, 500);
        market.listMarket(GOOGL, FEED_GOOGL, 6000, 7500, 500);
        market.listMarket(SPY, FEED_SPY, 6500, 8000, 500);

        if (liquidityHuman > 0) {
            IERC20Approve token = IERC20Approve(USDG);
            uint256 amount = liquidityHuman * (10 ** uint256(token.decimals()));
            require(token.balanceOf(deployer) >= amount, "insufficient USDG");
            require(token.approve(address(market), amount), "approve failed");
            market.addLiquidity(amount);
        }

        console2.log("BorrowDeskMarket", address(market));
        console2.log("USDG", USDG);
        console2.log("owner", deployer);
        console2.log("liquidityHuman", liquidityHuman);

        vm.stopBroadcast();
    }
}
