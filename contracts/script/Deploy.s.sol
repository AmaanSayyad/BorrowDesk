// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {BorrowDeskMarket} from "../src/BorrowDeskMarket.sol";
import {MockERC20} from "../src/mocks/MockERC20.sol";
import {MockAggregator} from "../src/mocks/MockAggregator.sol";

/// @notice Local / anvil demo deployment (USDG 6 decimals to mirror mainnet).
contract DeployScript is Script {
    function run() external {
        uint256 pk = vm.envOr(
            "PRIVATE_KEY", uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80)
        );
        vm.startBroadcast(pk);

        MockERC20 usdg = new MockERC20("Global Dollar", "USDG", 6);
        MockERC20 nvda = new MockERC20("NVIDIA Stock Token", "NVDA", 18);
        MockERC20 aapl = new MockERC20("Apple Stock Token", "AAPL", 18);
        MockERC20 spy = new MockERC20("SPDR S&P 500 Stock Token", "SPY", 18);

        MockAggregator nvdaFeed = new MockAggregator(8, 230e8, "NVDA / USD");
        MockAggregator aaplFeed = new MockAggregator(8, 255e8, "AAPL / USD");
        MockAggregator spyFeed = new MockAggregator(8, 660e8, "SPY / USD");

        BorrowDeskMarket market = new BorrowDeskMarket(address(usdg));
        market.listMarket(address(nvda), address(nvdaFeed), 6000, 7500, 500);
        market.listMarket(address(aapl), address(aaplFeed), 6000, 7500, 500);
        market.listMarket(address(spy), address(spyFeed), 6500, 8000, 500);

        address deployer = vm.addr(pk);
        usdg.mint(deployer, 2_000_000e6);
        usdg.approve(address(market), type(uint256).max);
        market.addLiquidity(1_000_000e6);

        nvda.mint(deployer, 50e18);
        aapl.mint(deployer, 50e18);
        spy.mint(deployer, 20e18);

        console2.log("USDG", address(usdg));
        console2.log("NVDA", address(nvda));
        console2.log("AAPL", address(aapl));
        console2.log("SPY", address(spy));
        console2.log("BorrowDeskMarket", address(market));

        vm.stopBroadcast();
    }
}
