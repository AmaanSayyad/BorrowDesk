// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IBorrowDeskMarket {
    function totalUsdgLiquidity() external view returns (uint256);
    function totalDebt() external view returns (uint256);
    function totalAssets() external view returns (uint256);
    function totalSupplyShares() external view returns (uint256);
    function supplyShares(address user) external view returns (uint256);
    function assetsOf(address user) external view returns (uint256);
    function utilizationBps() external view returns (uint256);
    function previewBorrowAprBps() external view returns (uint256);
    function debtOf(address user) external view returns (uint256);
    function accountHealth(address user)
        external
        view
        returns (
            uint256 collateralUsd,
            uint256 debtUsd,
            uint256 borrowingPowerUsd,
            uint256 liquidationThresholdUsd,
            bool healthy
        );
    function listedCollateralCount() external view returns (uint256);
    function getListedCollateral(uint256 index) external view returns (address);
    function markets(address token)
        external
        view
        returns (
            address priceFeed,
            uint16 ltvBps,
            uint16 liquidationThresholdBps,
            uint16 liquidationBonusBps,
            bool listed,
            uint8 tokenDecimals
        );
    function collateralBalance(address user, address token) external view returns (uint256);
}

/// @title BorrowDeskLens
/// @notice Multicall-style reads for desk + keeper UIs.
contract BorrowDeskLens {
    struct DeskSnapshot {
        uint256 idleUsdg;
        uint256 totalDebt;
        uint256 totalAssets;
        uint256 utilizationBps;
        uint256 borrowAprBps;
        uint256 listedCount;
    }

    struct AccountSnapshot {
        address user;
        uint256 collateralUsd;
        uint256 debtUsd;
        uint256 borrowPowerUsd;
        uint256 liquidationUsd;
        bool healthy;
        uint256 healthFactorWad; // 1e18 scale; type(uint256).max if no debt
        uint256 supplyAssets;
        uint256 supplyShares;
    }

    struct MarketRow {
        address token;
        address priceFeed;
        uint16 ltvBps;
        uint16 liqBps;
        uint16 bonusBps;
        bool listed;
        uint8 tokenDecimals;
    }

    IBorrowDeskMarket public immutable market;

    constructor(address market_) {
        market = IBorrowDeskMarket(market_);
    }

    function deskSnapshot() external view returns (DeskSnapshot memory s) {
        s.idleUsdg = market.totalUsdgLiquidity();
        s.totalDebt = market.totalDebt();
        s.totalAssets = market.totalAssets();
        s.utilizationBps = market.utilizationBps();
        s.borrowAprBps = market.previewBorrowAprBps();
        s.listedCount = market.listedCollateralCount();
    }

    function accountSnapshot(address user) public view returns (AccountSnapshot memory s) {
        s.user = user;
        (s.collateralUsd, s.debtUsd, s.borrowPowerUsd, s.liquidationUsd, s.healthy) =
            market.accountHealth(user);
        if (s.debtUsd == 0) {
            s.healthFactorWad = type(uint256).max;
        } else {
            s.healthFactorWad = (s.liquidationUsd * 1e18) / s.debtUsd;
        }
        s.supplyShares = market.supplyShares(user);
        s.supplyAssets = market.assetsOf(user);
    }

    function accountsSnapshot(address[] calldata users)
        external
        view
        returns (AccountSnapshot[] memory out)
    {
        out = new AccountSnapshot[](users.length);
        for (uint256 i = 0; i < users.length; i++) {
            out[i] = accountSnapshot(users[i]);
        }
    }

    function marketsPage(uint256 offset, uint256 limit)
        external
        view
        returns (MarketRow[] memory rows)
    {
        uint256 n = market.listedCollateralCount();
        if (offset >= n) return new MarketRow[](0);
        uint256 end = offset + limit;
        if (end > n) end = n;
        rows = new MarketRow[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            address token = market.getListedCollateral(i);
            (
                address priceFeed,
                uint16 ltvBps,
                uint16 liqBps,
                uint16 bonusBps,
                bool listed,
                uint8 decimals
            ) = market.markets(token);
            rows[i - offset] = MarketRow({
                token: token,
                priceFeed: priceFeed,
                ltvBps: ltvBps,
                liqBps: liqBps,
                bonusBps: bonusBps,
                listed: listed,
                tokenDecimals: decimals
            });
        }
    }
}
