// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AggregatorV3Interface} from "./interfaces/AggregatorV3Interface.sol";

interface IERC20Minimal {
    function decimals() external view returns (uint8);
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/// @title BorrowDeskMarket
/// @notice Multi-collateral USDG credit + permissionless USDG supply shares.
/// @dev Utilization-based borrow APR. Health math in 1e18 USD. USDG is 6 decimals on RH.
contract BorrowDeskMarket {
    struct Market {
        address priceFeed;
        uint16 ltvBps;
        uint16 liquidationThresholdBps;
        uint16 liquidationBonusBps;
        bool listed;
        uint8 tokenDecimals;
    }

    struct Account {
        mapping(address => uint256) collateral;
        uint256 debtPrincipal;
        uint256 debtIndexSnapshot;
    }

    uint256 public constant BPS = 10_000;
    uint256 public constant INDEX_SCALE = 1e18;
    /// @dev Base ~2% APR + slope ~8% at full util → up to ~10% APR.
    uint256 public constant BASE_RATE_PER_SECOND = 634_195_839;
    uint256 public constant SLOPE_PER_SECOND = 2_536_783_359;

    IERC20Minimal public immutable usdg;
    uint8 public immutable usdgDecimals;
    address public owner;
    bool private _locked;

    uint256 public maxOracleDelay = 4 days;
    uint256 public borrowIndex = INDEX_SCALE;
    uint256 public lastAccrual;
    uint256 public totalDebt;
    uint256 public totalUsdgLiquidity;
    uint256 public totalSupplyShares;
    mapping(address => uint256) public supplyShares;

    mapping(address => Market) public markets;
    mapping(address => Account) private accounts;
    address[] public listedCollaterals;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event MarketListed(
        address indexed token, address indexed priceFeed, uint16 ltvBps, uint16 liquidationThresholdBps
    );
    event Deposit(address indexed user, address indexed token, uint256 amount);
    event Withdraw(address indexed user, address indexed token, uint256 amount);
    event Borrow(address indexed user, uint256 amount, uint256 debtAfter);
    event Repay(address indexed user, uint256 amount, uint256 debtAfter);
    event Liquidate(
        address indexed liquidator,
        address indexed user,
        address indexed token,
        uint256 repayAmount,
        uint256 collateralSeized
    );
    event Supply(address indexed user, uint256 assets, uint256 shares);
    event Redeem(address indexed user, uint256 assets, uint256 shares);
    event LiquidityAdded(address indexed from, uint256 amount);
    event LiquidityRemoved(address indexed to, uint256 amount);
    event MaxOracleDelayUpdated(uint256 delay);

    error NotOwner();
    error Reentrancy();
    error ZeroAddress();
    error ZeroAmount();
    error MarketNotListed();
    error InvalidParams();
    error TransferFailed();
    error InsufficientCollateral();
    error InsufficientLiquidity();
    error HealthyPosition();
    error StaleOracle();
    error InvalidOracle();
    error ExceedsBalance();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier nonReentrant() {
        if (_locked) revert Reentrancy();
        _locked = true;
        _;
        _locked = false;
    }

    constructor(address usdg_) {
        if (usdg_ == address(0)) revert ZeroAddress();
        usdg = IERC20Minimal(usdg_);
        usdgDecimals = IERC20Minimal(usdg_).decimals();
        if (usdgDecimals > 18) revert InvalidParams();
        owner = msg.sender;
        lastAccrual = block.timestamp;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function setMaxOracleDelay(uint256 delay) external onlyOwner {
        if (delay < 1 hours || delay > 14 days) revert InvalidParams();
        maxOracleDelay = delay;
        emit MaxOracleDelayUpdated(delay);
    }

    function listMarket(
        address token,
        address priceFeed,
        uint16 ltvBps,
        uint16 liquidationThresholdBps,
        uint16 liquidationBonusBps
    ) external onlyOwner {
        if (token == address(0) || priceFeed == address(0)) revert ZeroAddress();
        if (ltvBps == 0 || ltvBps >= liquidationThresholdBps) revert InvalidParams();
        if (liquidationThresholdBps >= BPS) revert InvalidParams();
        if (liquidationBonusBps > 2_000) revert InvalidParams();

        bool alreadyListed = markets[token].listed;
        markets[token] = Market({
            priceFeed: priceFeed,
            ltvBps: ltvBps,
            liquidationThresholdBps: liquidationThresholdBps,
            liquidationBonusBps: liquidationBonusBps,
            listed: true,
            tokenDecimals: IERC20Minimal(token).decimals()
        });

        if (!alreadyListed) listedCollaterals.push(token);
        emit MarketListed(token, priceFeed, ltvBps, liquidationThresholdBps);
    }

    /// @notice Permissionless USDG supply - mints shares against idle + debt assets.
    function supply(uint256 assets) external nonReentrant returns (uint256 shares) {
        if (assets == 0) revert ZeroAmount();
        accrue();
        uint256 ta = totalAssets();
        shares = totalSupplyShares == 0 || ta == 0 ? assets : (assets * totalSupplyShares) / ta;
        if (shares == 0) revert ZeroAmount();
        _pull(usdg, msg.sender, assets);
        totalUsdgLiquidity += assets;
        totalSupplyShares += shares;
        supplyShares[msg.sender] += shares;
        emit Supply(msg.sender, assets, shares);
        emit LiquidityAdded(msg.sender, assets);
    }

    /// @notice Redeem supply shares for underlying USDG (subject to idle cash).
    function redeem(uint256 shares) external nonReentrant returns (uint256 assets) {
        if (shares == 0) revert ZeroAmount();
        if (shares > supplyShares[msg.sender]) revert ExceedsBalance();
        accrue();
        assets = (shares * totalAssets()) / totalSupplyShares;
        if (assets == 0) revert ZeroAmount();
        if (assets > totalUsdgLiquidity) revert InsufficientLiquidity();
        supplyShares[msg.sender] -= shares;
        totalSupplyShares -= shares;
        totalUsdgLiquidity -= assets;
        _push(usdg, msg.sender, assets);
        emit Redeem(msg.sender, assets, shares);
        emit LiquidityRemoved(msg.sender, assets);
    }

    /// @dev Back-compat owner helpers → supply/redeem full asset amount.
    function addLiquidity(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        accrue();
        uint256 ta = totalAssets();
        uint256 shares = totalSupplyShares == 0 || ta == 0 ? amount : (amount * totalSupplyShares) / ta;
        if (shares == 0) revert ZeroAmount();
        _pull(usdg, msg.sender, amount);
        totalUsdgLiquidity += amount;
        totalSupplyShares += shares;
        supplyShares[msg.sender] += shares;
        emit Supply(msg.sender, amount, shares);
        emit LiquidityAdded(msg.sender, amount);
    }

    function removeLiquidity(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        accrue();
        if (totalSupplyShares == 0) revert ExceedsBalance();
        uint256 shares = (amount * totalSupplyShares + totalAssets() - 1) / totalAssets();
        if (shares > supplyShares[msg.sender]) shares = supplyShares[msg.sender];
        uint256 assets = (shares * totalAssets()) / totalSupplyShares;
        if (assets > totalUsdgLiquidity) revert InsufficientLiquidity();
        supplyShares[msg.sender] -= shares;
        totalSupplyShares -= shares;
        totalUsdgLiquidity -= assets;
        _push(usdg, msg.sender, assets);
        emit Redeem(msg.sender, assets, shares);
        emit LiquidityRemoved(msg.sender, assets);
    }

    function deposit(address token, uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        if (!markets[token].listed) revert MarketNotListed();
        accrue();
        _pull(IERC20Minimal(token), msg.sender, amount);
        accounts[msg.sender].collateral[token] += amount;
        emit Deposit(msg.sender, token, amount);
    }

    function withdraw(address token, uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        if (!markets[token].listed) revert MarketNotListed();
        accrue();
        Account storage account = accounts[msg.sender];
        if (account.collateral[token] < amount) revert ExceedsBalance();
        account.collateral[token] -= amount;
        if (!_withinBorrowLimit(msg.sender)) revert InsufficientCollateral();
        _push(IERC20Minimal(token), msg.sender, amount);
        emit Withdraw(msg.sender, token, amount);
    }

    /// @notice Atomic deposit collateral then borrow USDG in one ticket.
    function depositAndBorrow(address token, uint256 depositAmount, uint256 borrowAmount)
        external
        nonReentrant
    {
        if (depositAmount == 0 || borrowAmount == 0) revert ZeroAmount();
        if (!markets[token].listed) revert MarketNotListed();
        accrue();
        _pull(IERC20Minimal(token), msg.sender, depositAmount);
        accounts[msg.sender].collateral[token] += depositAmount;
        emit Deposit(msg.sender, token, depositAmount);

        if (borrowAmount > totalUsdgLiquidity) revert InsufficientLiquidity();
        Account storage account = accounts[msg.sender];
        uint256 debt = _debtOf(account);
        account.debtPrincipal = debt + borrowAmount;
        account.debtIndexSnapshot = borrowIndex;
        totalDebt += borrowAmount;
        totalUsdgLiquidity -= borrowAmount;
        if (!_withinBorrowLimit(msg.sender)) revert InsufficientCollateral();
        _push(usdg, msg.sender, borrowAmount);
        emit Borrow(msg.sender, borrowAmount, account.debtPrincipal);
    }

    function borrow(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        accrue();
        if (amount > totalUsdgLiquidity) revert InsufficientLiquidity();
        Account storage account = accounts[msg.sender];
        uint256 debt = _debtOf(account);
        account.debtPrincipal = debt + amount;
        account.debtIndexSnapshot = borrowIndex;
        totalDebt += amount;
        totalUsdgLiquidity -= amount;
        if (!_withinBorrowLimit(msg.sender)) revert InsufficientCollateral();
        _push(usdg, msg.sender, amount);
        emit Borrow(msg.sender, amount, account.debtPrincipal);
    }

    function repay(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        accrue();
        Account storage account = accounts[msg.sender];
        uint256 debt = _debtOf(account);
        if (debt == 0) revert ZeroAmount();
        uint256 pay = amount > debt ? debt : amount;
        _pull(usdg, msg.sender, pay);
        account.debtPrincipal = debt - pay;
        account.debtIndexSnapshot = borrowIndex;
        totalDebt -= pay;
        totalUsdgLiquidity += pay;
        emit Repay(msg.sender, pay, account.debtPrincipal);
    }

    function liquidate(address user, address token, uint256 repayAmount) external nonReentrant {
        if (user == address(0) || repayAmount == 0) revert ZeroAmount();
        Market memory market = markets[token];
        if (!market.listed) revert MarketNotListed();
        accrue();
        if (_isHealthy(user)) revert HealthyPosition();
        Account storage account = accounts[user];
        uint256 debt = _debtOf(account);
        if (debt == 0) revert HealthyPosition();
        uint256 pay = repayAmount > debt ? debt : repayAmount;
        uint256 seizeUsd = (_toUsdFromUsdg(pay) * (BPS + market.liquidationBonusBps)) / BPS;
        uint256 tokenPrice = _priceUsd(token);
        uint256 seizeTokens = (seizeUsd * (10 ** market.tokenDecimals)) / tokenPrice;
        if (seizeTokens > account.collateral[token]) seizeTokens = account.collateral[token];
        _pull(usdg, msg.sender, pay);
        account.debtPrincipal = debt - pay;
        account.debtIndexSnapshot = borrowIndex;
        totalDebt -= pay;
        totalUsdgLiquidity += pay;
        account.collateral[token] -= seizeTokens;
        _push(IERC20Minimal(token), msg.sender, seizeTokens);
        emit Liquidate(msg.sender, user, token, pay, seizeTokens);
    }

    function accrue() public {
        uint256 timestamp = block.timestamp;
        if (timestamp <= lastAccrual) return;
        if (totalDebt > 0) {
            uint256 elapsed = timestamp - lastAccrual;
            uint256 rate = borrowRatePerSecond();
            uint256 interestFactor = rate * elapsed;
            uint256 interest = (totalDebt * interestFactor) / INDEX_SCALE;
            if (interest > 0) {
                totalDebt += interest;
                borrowIndex = borrowIndex + ((borrowIndex * interestFactor) / INDEX_SCALE);
            }
        }
        lastAccrual = timestamp;
    }

    function totalAssets() public view returns (uint256) {
        return totalUsdgLiquidity + totalDebt;
    }

    function utilizationBps() public view returns (uint256) {
        uint256 assets = totalUsdgLiquidity + totalDebt;
        if (assets == 0) return 0;
        return (totalDebt * BPS) / assets;
    }

    function borrowRatePerSecond() public view returns (uint256) {
        return BASE_RATE_PER_SECOND + (SLOPE_PER_SECOND * utilizationBps()) / BPS;
    }

    function previewBorrowAprBps() external view returns (uint256) {
        // APR ≈ ratePerSecond * secondsPerYear / 1e18 * 10000
        return (borrowRatePerSecond() * 365 days * BPS) / INDEX_SCALE;
    }

    function assetsOf(address user) public view returns (uint256) {
        if (totalSupplyShares == 0) return 0;
        return (supplyShares[user] * totalAssets()) / totalSupplyShares;
    }

    function collateralBalance(address user, address token) external view returns (uint256) {
        return accounts[user].collateral[token];
    }

    function debtOf(address user) public view returns (uint256) {
        Account storage account = accounts[user];
        if (account.debtPrincipal == 0) return 0;
        return (account.debtPrincipal * _currentIndex()) / account.debtIndexSnapshot;
    }

    function accountHealth(address user)
        external
        view
        returns (
            uint256 collateralUsd,
            uint256 debtUsd,
            uint256 borrowingPowerUsd,
            uint256 liquidationThresholdUsd,
            bool healthy
        )
    {
        collateralUsd = _collateralValueUsd(user);
        debtUsd = _toUsdFromUsdg(debtOf(user));
        borrowingPowerUsd = _borrowingPowerUsd(user);
        liquidationThresholdUsd = _liquidationThresholdUsd(user);
        healthy = debtUsd == 0 || (collateralUsd > 0 && debtUsd <= liquidationThresholdUsd);
    }

    function listedCollateralCount() external view returns (uint256) {
        return listedCollaterals.length;
    }

    function getListedCollateral(uint256 index) external view returns (address) {
        return listedCollaterals[index];
    }

    function _debtOf(Account storage account) internal view returns (uint256) {
        if (account.debtPrincipal == 0) return 0;
        return (account.debtPrincipal * borrowIndex) / account.debtIndexSnapshot;
    }

    function _currentIndex() internal view returns (uint256) {
        if (block.timestamp <= lastAccrual || totalDebt == 0) return borrowIndex;
        uint256 elapsed = block.timestamp - lastAccrual;
        uint256 interestFactor = borrowRatePerSecond() * elapsed;
        return borrowIndex + ((borrowIndex * interestFactor) / INDEX_SCALE);
    }

    function _isHealthy(address user) internal view returns (bool) {
        uint256 debtUsd = _toUsdFromUsdg(_debtOf(accounts[user]));
        if (debtUsd == 0) return true;
        return debtUsd <= _liquidationThresholdUsd(user);
    }

    function _withinBorrowLimit(address user) internal view returns (bool) {
        uint256 debtUsd = _toUsdFromUsdg(_debtOf(accounts[user]));
        if (debtUsd == 0) return true;
        return debtUsd <= _borrowingPowerUsd(user);
    }

    function _toUsdFromUsdg(uint256 amount) internal view returns (uint256) {
        return amount * (10 ** (18 - usdgDecimals));
    }

    function _borrowingPowerUsd(address user) internal view returns (uint256 power) {
        uint256 length = listedCollaterals.length;
        for (uint256 i = 0; i < length; i++) {
            address token = listedCollaterals[i];
            uint256 bal = accounts[user].collateral[token];
            if (bal == 0) continue;
            Market memory market = markets[token];
            power += (_tokenValueUsd(token, bal) * market.ltvBps) / BPS;
        }
    }

    function _liquidationThresholdUsd(address user) internal view returns (uint256 threshold) {
        uint256 length = listedCollaterals.length;
        for (uint256 i = 0; i < length; i++) {
            address token = listedCollaterals[i];
            uint256 bal = accounts[user].collateral[token];
            if (bal == 0) continue;
            Market memory market = markets[token];
            threshold += (_tokenValueUsd(token, bal) * market.liquidationThresholdBps) / BPS;
        }
    }

    function _collateralValueUsd(address user) internal view returns (uint256 value) {
        uint256 length = listedCollaterals.length;
        for (uint256 i = 0; i < length; i++) {
            address token = listedCollaterals[i];
            uint256 bal = accounts[user].collateral[token];
            if (bal == 0) continue;
            value += _tokenValueUsd(token, bal);
        }
    }

    function _tokenValueUsd(address token, uint256 amount) internal view returns (uint256) {
        Market memory market = markets[token];
        return (amount * _priceUsd(token)) / (10 ** market.tokenDecimals);
    }

    function _priceUsd(address token) internal view returns (uint256) {
        Market memory market = markets[token];
        AggregatorV3Interface feed = AggregatorV3Interface(market.priceFeed);
        (, int256 answer,, uint256 updatedAt,) = feed.latestRoundData();
        if (answer <= 0) revert InvalidOracle();
        if (block.timestamp > updatedAt + maxOracleDelay) revert StaleOracle();
        uint8 feedDecimals = feed.decimals();
        uint256 price = uint256(answer);
        if (feedDecimals < 18) price = price * (10 ** (18 - feedDecimals));
        else if (feedDecimals > 18) price = price / (10 ** (feedDecimals - 18));
        return price;
    }

    function _pull(IERC20Minimal token, address from, uint256 amount) internal {
        (bool ok, bytes memory data) =
            address(token).call(abi.encodeWithSelector(token.transferFrom.selector, from, address(this), amount));
        if (!ok || (data.length != 0 && !abi.decode(data, (bool)))) revert TransferFailed();
    }

    function _push(IERC20Minimal token, address to, uint256 amount) internal {
        (bool ok, bytes memory data) =
            address(token).call(abi.encodeWithSelector(token.transfer.selector, to, amount));
        if (!ok || (data.length != 0 && !abi.decode(data, (bool)))) revert TransferFailed();
    }
}
