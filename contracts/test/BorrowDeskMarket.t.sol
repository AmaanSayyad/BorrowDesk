// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {BorrowDeskMarket} from "../src/BorrowDeskMarket.sol";
import {MockERC20} from "../src/mocks/MockERC20.sol";
import {MockAggregator} from "../src/mocks/MockAggregator.sol";

contract BorrowDeskMarketTest is Test {
    BorrowDeskMarket internal market;
    MockERC20 internal usdg;
    MockERC20 internal nvda;
    MockAggregator internal nvdaFeed;

    address internal alice = address(0xA11CE);
    address internal bob = address(0xB0B);

    function setUp() public {
        // Match Robinhood Chain mainnet: USDG is 6 decimals
        usdg = new MockERC20("Global Dollar", "USDG", 6);
        nvda = new MockERC20("NVIDIA Stock Token", "NVDA", 18);
        nvdaFeed = new MockAggregator(8, 230e8, "NVDA / USD");

        market = new BorrowDeskMarket(address(usdg));
        market.listMarket(address(nvda), address(nvdaFeed), 6000, 7500, 500);

        usdg.mint(address(this), 1_000_000e6);
        usdg.approve(address(market), type(uint256).max);
        market.addLiquidity(500_000e6);

        nvda.mint(alice, 100e18);
        usdg.mint(alice, 50_000e6);
        usdg.mint(bob, 50_000e6);

        vm.prank(alice);
        nvda.approve(address(market), type(uint256).max);
        vm.prank(alice);
        usdg.approve(address(market), type(uint256).max);
        vm.prank(bob);
        usdg.approve(address(market), type(uint256).max);
    }

    function testDepositBorrowRepay() public {
        vm.startPrank(alice);
        market.deposit(address(nvda), 10e18);

        // 10 * $230 = $2300; 60% LTV => $1380 borrow power
        market.borrow(1_000e6);
        assertEq(usdg.balanceOf(alice), 50_000e6 + 1_000e6);

        market.repay(1_000e6);
        assertEq(market.debtOf(alice), 0);
        vm.stopPrank();
    }

    function testCannotOverBorrow() public {
        vm.startPrank(alice);
        market.deposit(address(nvda), 1e18);
        // 1 * 230 * 0.6 = $138 max
        vm.expectRevert(BorrowDeskMarket.InsufficientCollateral.selector);
        market.borrow(200e6);
        vm.stopPrank();
    }

    function testLiquidation() public {
        vm.startPrank(alice);
        market.deposit(address(nvda), 10e18);
        market.borrow(1_200e6);
        vm.stopPrank();

        nvdaFeed.setAnswer(100e8);

        vm.prank(bob);
        market.liquidate(alice, address(nvda), 600e6);

        assertLt(market.debtOf(alice), 1_200e6);
        assertGt(nvda.balanceOf(bob), 0);
    }

    function testInterestAccrues() public {
        vm.startPrank(alice);
        market.deposit(address(nvda), 10e18);
        market.borrow(500e6);
        vm.stopPrank();

        vm.warp(block.timestamp + 365 days);
        market.accrue();
        uint256 debt = market.debtOf(alice);
        assertGt(debt, 500e6);
        // Low util → near base ~2% APR
        assertApproxEqRel(debt, 510e6, 0.03e18);
    }

    function testUtilizationRaisesApr() public {
        uint256 aprIdle = market.previewBorrowAprBps();
        // Shrink idle so a modest borrow lifts util sharply
        market.removeLiquidity(498_000e6);
        vm.startPrank(alice);
        market.deposit(address(nvda), 10e18);
        market.borrow(1_200e6);
        vm.stopPrank();
        uint256 aprHigh = market.previewBorrowAprBps();
        assertGt(aprHigh, aprIdle);
        assertGt(aprHigh, 500); // >5% when util is elevated
    }

    function testSupplyEarnsOnInterest() public {
        vm.startPrank(alice);
        market.deposit(address(nvda), 10e18);
        market.borrow(1_000e6);
        vm.stopPrank();

        uint256 before = market.assetsOf(address(this));
        vm.warp(block.timestamp + 365 days);
        market.accrue();
        uint256 afterAssets = market.assetsOf(address(this));
        assertGt(afterAssets, before);
    }

    function testDepositAndBorrow() public {
        vm.startPrank(alice);
        market.depositAndBorrow(address(nvda), 5e18, 400e6);
        assertEq(market.collateralBalance(alice, address(nvda)), 5e18);
        assertEq(market.debtOf(alice), 400e6);
        vm.stopPrank();
    }

    function testAccountHealthUsesUsdScale() public {
        vm.startPrank(alice);
        market.deposit(address(nvda), 10e18);
        market.borrow(1_000e6);
        vm.stopPrank();

        (uint256 collateralUsd, uint256 debtUsd, uint256 power,, bool healthy) =
            market.accountHealth(alice);

        assertEq(debtUsd, 1_000e18);
        assertEq(collateralUsd, 2_300e18);
        assertEq(power, 1_380e18);
        assertTrue(healthy);
    }
}
