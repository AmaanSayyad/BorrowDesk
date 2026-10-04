# BorrowDesk

**Keep the stocks. Borrow the dollar.**

Collateralized USDG credit lines against Robinhood Chain Stock Tokens - deposit NVDA / AAPL / TSLA / SPY, borrow Global Dollar, see liquidation math before you sign.

## Links

| | |
|---|---|
| **Live app** | [https://borrowdesk.fun](https://borrowdesk.fun) · [Open desk](https://borrowdesk.fun/app) · [Verify claims](https://borrowdesk.fun/verify) |
| **Vercel** | [https://borrowdesk.vercel.app](https://borrowdesk.vercel.app) |
| **GitHub** | [github.com/AmaanSayyad/BorrowDesk](https://github.com/AmaanSayyad/BorrowDesk) |
| **Hackathon** | [Arbitrum Open House Singapore Online Buildathon](https://arbitrum-singapore.hackquest.io/buildathons/Arbitrum-Open-House-Singapore-Online-Buildathon) |
| **Market V2** | [`0x1745…0200`](https://robinhoodchain.blockscout.com/address/0x17452DAB5976B770107c126fBC92aD746a3C0200) · [Sourcify exact match](https://repo.sourcify.dev/4663/0x17452DAB5976B770107c126fBC92aD746a3C0200) |
| **Lens** | [`0x0256…55cc`](https://robinhoodchain.blockscout.com/address/0x025694b88ddd0a6ffac740df4170b8ea590355cc) · [Sourcify exact match](https://repo.sourcify.dev/4663/0x025694b88ddd0a6ffac740df4170b8ea590355cc) |
| **Legacy V1** | [`0x2e4E…9E8d`](https://robinhoodchain.blockscout.com/address/0x2e4E7E8145E4cCA7E0fEf4737A2489E4E27D9E8d) · drained / unused · [Sourcify](https://repo.sourcify.dev/4663/0x2e4E7E8145E4cCA7E0fEf4737A2489E4E27D9E8d) |
| **USDG** | [`0x5fc5…d168`](https://robinhoodchain.blockscout.com/address/0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168) |
| **Explorer** | [robinhoodchain.blockscout.com](https://robinhoodchain.blockscout.com) |
| **RPC** | `https://robinhood.drpc.org` · chain id `4663` |
| **Manifest** | [`deployments/robinhood.json`](./deployments/robinhood.json) |
| **Local** | `npm run dev` → [http://localhost:3000](http://localhost:3000) · [app](http://localhost:3000/app) |

| | |
|---|---|
| **Product one-liner** | Stock Tokens → USDG credit on Robinhood Chain (4663) |
| **Status** | Mainnet live · V2 + Lens verified · V1 drained · HF /10 UI |

---

## Table of contents

1. [What this is and who it's for](#what-this-is-and-who-its-for)
2. [Story & inspiration](#story--inspiration)
3. [Problem](#problem)
4. [Solution](#solution)
5. [How it works](#how-it-works)
6. [Target users](#target-users)
7. [Features](#features)
8. [Addresses & live proof](#addresses--live-proof)
9. [Sponsor & partner integrations](#sponsor--partner-integrations)
10. [Tech stack](#tech-stack)
11. [Architecture](#architecture)
12. [Competitors](#competitors)
13. [Go to market](#go-to-market)
14. [Business model](#business-model)
15. [Roadmap](#roadmap)
16. [Team](#team)
17. [Run locally](#run-locally)
18. [Verify / tests](#verify--tests)
19. [Repo layout](#repo-layout)
20. [Security notes](#security-notes)
21. [License](#license)

---

## What this is and who it's for

**What:** A collateralized lending market on **Robinhood Chain** where holders of official Stock Tokens (NVDA, AAPL, TSLA, SPY, …) deposit equity exposure as collateral and borrow **USDG (Global Dollar)** without selling. Health, LTV, liquidation threshold, interest accrual, and partial liquidation are enforced onchain. The desk UI shows liq price, buffer, oracle provenance, and repay receipts before you sign.

**Who it's for**

| Audience | Why they care |
|---|---|
| Stock Token holders | Unlock dollar liquidity without selling equity upside |
| Crypto-native borrowers | USDG credit against real equity marks on RH Chain |
| Liquidators | Partial liquidations with bonus via Look up · accrue interest onchain |
| Judges / operators | Live mainnet market, Reown wallet, desk tabs, ⌘K search |

**Not this product:** We are not a spot DEX, not a perp venue, and not an issuer of Stock Tokens or USDG. We compose the assets Robinhood / Paxos already put onchain.

---

## Story & inspiration

In 2025-2026, **Robinhood Chain** launched as an EVM home for tokenized equities: Stock Tokens with Chainlink-style feeds, Global Dollar (USDG) as the dollar rail, and an open permissionless L2. At the same time, most “stock leverage” still lived on CEXes or non-RH venues - holders of NVDA / AAPL tokens could not post those assets as collateral for USDG credit on the same chain.

BorrowDesk is built RH-Chain-native from day one: a `BorrowDeskMarket` V2 with multi-collateral accounts, supply shares, utilization APR, oracle-priced LTV bands, and partial liquidation - plus a full credit desk (Fund, Protocol, health /10, ticket, markets, risk, look up, asset pages, TradingView).

The inspiration is simple: **bring dollar credit to where the stocks already are**, let those stocks be collateral, and show liquidation foresight so nobody is surprised by a liquidatable LTV.

> Positioning: _Keep the stocks. Borrow the dollar._

---

## Problem

1. **Equity locked as dead collateral.** Stock Token holders who need USDG must sell or leave RH Chain.
2. **Credit venues ignore the asset.** Generic money markets are crypto-collateral first; equity marks and 24/5 sessions need different risk.
3. **Opaque liquidation UX.** Most lending UIs hide liq price, buffer $, and interest until after you sign.
4. **Desk UX is missing.** Deposit / borrow / repay / liquidate / oracle freshness should feel like one credit desk, not five scattered pages.
5. **Wallet friction.** Injected-only connect blocks WalletConnect / mobile judges.

---

## Solution

| Pillar | What we ship |
|---|---|
| Multi-collateral credit | Deposit NVDA / AAPL / TSLA / SPY into one account; borrow USDG |
| Oracle-priced risk | Chainlink-style AggregatorV3 feeds; per-asset LTV / liq / bonus bands |
| Foresight ticket | LTV slider, est. liq price, drop-to-liquidatable, interest/day, repay receipt |
| Partial liquidation | Repay underwater debt, seize collateral at bonus - not full-debt-only |
| Live desk | Overview · Borrow · Fund · Positions · Markets · Protocol · Risk · Look up · Start |
| Reown wallet | AppKit (WalletConnect + injected) on chain 4663 |

---

## How it works

### Trust model

User funds only move when the connected wallet signs ERC-20 `approve` + market calls (`deposit`, `borrow`, `repay`, `withdraw`, `supply`, `redeem`, `liquidate`). The market owner can list markets, set oracle delay, and seed USDG liquidity - **not** seize healthy user collateral. Oracles are external AggregatorV3 feeds; stale reads revert when beyond `maxOracleDelay` (default **4 days** for 24/5 equity weekends).

### End-to-end credit (happy path)

```mermaid
sequenceDiagram
  autonumber
  actor User
  participant Wallet as Wallet (Reown / MetaMask / WC)
  participant Desk as BorrowDesk (Next.js)
  participant Market as BorrowDeskMarket
  participant Oracle as Chainlink-style feeds
  participant USDG as USDG ERC-20
  participant Stock as Stock Token ERC-20

  User->>Wallet: Connect (Robinhood Chain 4663)
  User->>Desk: Open Borrow ticket
  Desk->>Oracle: Read marks + freshness
  User->>Stock: approve(market, amount)
  User->>Market: deposit(token, amount)
  Market->>Market: Update collateral + health
  User->>Market: borrow(usdgAmount)
  Market->>Oracle: Price collateral / check LTV
  Market->>USDG: Transfer USDG to user
  Market-->>Desk: Borrow event → UI / history
  User->>USDG: approve(market) + repay
  User->>Market: withdraw(token) if still healthy
```

### Liquidation path

```mermaid
sequenceDiagram
  autonumber
  actor Liquidator
  participant Desk as Look up / liquidate
  participant Market as BorrowDeskMarket
  participant USDG as USDG
  participant Stock as Collateral token

  Liquidator->>Desk: Look up borrower address
  Desk->>Market: accountHealth(borrower)
  alt unhealthy (debt > liq threshold)
    Liquidator->>USDG: approve(market, repay)
    Liquidator->>Market: liquidate(user, token, repayAmount)
    Market->>USDG: Pull repay from liquidator
    Market->>Stock: Seize collateral + bonus → liquidator
  else healthy
    Desk-->>Liquidator: Cannot liquidate
  end
```

---

## Target users

- **Stock Token holders** - borrow USDG against NVDA / AAPL / TSLA / SPY without selling.
- **USDG seekers** - dollar liquidity on RH Chain with equity collateral.
- **Liquidators** - partial repay + seize with liquidation bonus.
- **Desk operators / judges** - live market, Reown connect, onboarding path, explorer links.

---

## Features

### Markets (desk)

| Symbol | Role | LTV band (config) |
|---|---|---|
| SPY | Broad index · highest LTV | ~65% |
| NVDA / AAPL | Mega-cap · standard | ~60% |
| TSLA | Higher vol · tighter | ~50% |
| AMZN / MSFT / META / GOOGL + 21 more | Listed on mainnet (29 total) | Equity-tuned bands |

Settlement asset: **USDG** (`0x5fc5…d168`, 6 decimals).  
Marks: onchain AggregatorV3 + RHJ `/prices` API fallback in UI.  
Charts: TradingView embeds on asset pages.

### Credit actions

- Deposit / withdraw Stock Tokens
- Borrow / repay USDG
- Supply / redeem USDG (V2 supply shares)
- Accrue interest onchain (~5% base · utilization APR on V2)
- Partial liquidate unhealthy accounts
- Multi-collateral account health (HF on a **0–10** UI scale, LTV, borrow power, liq threshold)

### Desk UX

- Desk tabs: Overview · Borrow · Fund · Positions · Markets · Protocol · Risk · Look up · Start
- Fund desk: get stock (swap) · supply USDG · batch deposit+borrow
- Borrow sheet: LTV slider, liq price, buffer, interest/day
- Repay receipt: est. principal / interest / days open
- ⌘K command palette (tickers, desks, actions)
- Oracle provenance strip (freshness, 4d weekend policy)
- Per-asset risk reasons + stress “drop to HF ≈ 1”
- Reown AppKit wallet modal
- Judge path onboarding (ETH gas + Stock Tokens + deposit → borrow)

---

## Addresses & live proof

Public addresses only. **Never commit** private keys or `.env`.

### Mainnet (Robinhood Chain `4663`)

| Role | Address | Notes |
|---|---|---|
| **BorrowDeskMarket V2** | [`0x17452DAB5976B770107c126fBC92aD746a3C0200`](https://robinhoodchain.blockscout.com/address/0x17452DAB5976B770107c126fBC92aD746a3C0200) | Live credit market · util APR · [Sourcify exact match](https://repo.sourcify.dev/4663/0x17452DAB5976B770107c126fBC92aD746a3C0200) |
| **BorrowDeskLens** | [`0x025694b88ddd0a6ffac740df4170b8ea590355cc`](https://robinhoodchain.blockscout.com/address/0x025694b88ddd0a6ffac740df4170b8ea590355cc) | Desk reads · [Sourcify exact match](https://repo.sourcify.dev/4663/0x025694b88ddd0a6ffac740df4170b8ea590355cc) |
| **Legacy V1** | [`0x2e4E7E8145E4cCA7E0fEf4737A2489E4E27D9E8d`](https://robinhoodchain.blockscout.com/address/0x2e4E7E8145E4cCA7E0fEf4737A2489E4E27D9E8d) | Drained · unused · funds migrated to V2 · [Sourcify](https://repo.sourcify.dev/4663/0x2e4E7E8145E4cCA7E0fEf4737A2489E4E27D9E8d) |
| **Owner** | `0x1881Dfd2b29536F054AA0b0A4966856290388Cc2` | Market owner (rotate if key compromised) |
| **USDG** | `0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168` | Global Dollar · 6 decimals |
| **V2 deploy tx** | [`0xe937fb…dfa0`](https://robinhoodchain.blockscout.com/tx/0xe937fb4b81a7ac7f88e1f8bc586661e06ff296764305ff7fa88a40c91a7edfa0) | Market create |
| **RPC (preferred)** | `https://robinhood.drpc.org` | Official Cloudflare RPC often 403s forge |
| **Explorer** | [robinhoodchain.blockscout.com](https://robinhoodchain.blockscout.com) | |

### Listed collateral + feeds

| Symbol | Token | Feed |
|---|---|---|
| NVDA | `0xd0601CE157Db5bdC3162BbaC2a2C8aF5320D9EEC` | `0x379EC4f7C378F34a1B47E4F3cbeBCbAC3E8E9F15` |
| AAPL | `0xaF3D76f1834A1d425780943C99Ea8A608f8a93f9` | `0x6B22A786bAa607d76728168703a39Ea9C99f2cD0` |
| TSLA | `0x322F0929c4625eD5bAd873c95208D54E1c003b2d` | `0x4A1166a659A55625345e9515b32adECea5547C38` |
| SPY | `0x117cc2133c37B721F49dE2A7a74833232B3B4C0C` | `0x319724394D3A0e3669269846abE664Cd621f9f6A` |

### Proven onchain position (deployer · V2)

| Metric | Value |
|---|---|
| Collateral (oracle USD) | ~$1.32 |
| Debt | **~0.0001 USDG** (dust) |
| Pool liquidity (idle) | **~4.80 USDG** |
| Healthy | `true` |
| Deposited | Multi-collateral (NVDA / AAPL + migrated V1 books) |
| Health factor (UI) | **10/10** (capped display · raw liq/debt) |

See `MAINNET.md` for the latest snapshot.

**Interest:** ~**5% base APR** plus utilization-based borrow APR on V2 (`BorrowDeskMarket.sol`).

---

## Sponsor & partner integrations

BorrowDesk wires the Open House stack for **chain, wallet, dollar rail, and desk UX** - not for custody of user funds beyond the market contract.

```mermaid
flowchart LR
  Desk[BorrowDesk desk]
  RH[Robinhood Chain]
  USDG[Paxos / USDG]
  Stocks[Stock Tokens]
  Oracle[AggregatorV3 feeds]
  Reown[Reown AppKit]
  Arb[Arbitrum Open House]

  Desk -->|deposit / borrow / repay| RH
  RH --> Stocks
  RH --> USDG
  Desk -->|marks + health| Oracle
  Desk -->|connect| Reown
  Desk -.->|buildathon| Arb
```

| Partner | Role in BorrowDesk |
|---|---|
| **Arbitrum Open House Singapore** | Buildathon context / stack |
| **Robinhood Chain** | Settlement L2 (4663), Stock Tokens, explorer |
| **Paxos / USDG** | Borrow asset (Global Dollar) |
| **Reown** | WalletConnect + multi-wallet AppKit (`NEXT_PUBLIC_REOWN_PROJECT_ID`) |
| **Chainlink-style feeds** | Onchain equity marks via AggregatorV3 |
| **TradingView** | Asset charts / tape embeds |
| ZeroDev · Quicknode · Dune · Trail of Bits · GMX · Pendle | Open House ecosystem strip (landing) |

**Reown setup:** create a project at [dashboard.reown.com](https://dashboard.reown.com), set `NEXT_PUBLIC_REOWN_PROJECT_ID`, and allowlist `http://localhost:3000` + your deploy origin under Configuration.

---

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind 4, Framer Motion |
| Wallets | Reown AppKit + `@reown/appkit-adapter-wagmi`, wagmi 3, viem 2 |
| Data | TanStack Query |
| Contracts | Solidity 0.8.24, Foundry |
| Networks | Robinhood Chain mainnet `4663` |
| Prices | Onchain AggregatorV3 + `/api/prices/[symbol]` (RHJ) |
| Charts | TradingView embeds |

---

## Architecture

### System shape

```mermaid
flowchart TB
  subgraph Client
    W[Wallet via Reown]
    UI[Next.js desk /app]
  end

  subgraph Onchain["Robinhood Chain 4663"]
    M[BorrowDeskMarket]
    S[Stock Tokens]
    U[USDG]
    O[Price feeds]
  end

  W --> UI
  UI -->|wagmi write/read| M
  M --> S
  M --> U
  M --> O
  W --> M
```

### Contract surface

```
User wallet
   │  approve + deposit / withdraw / borrow / repay / supply / redeem / liquidate / accrue
   ▼
BorrowDeskMarket V2
   ├── markets[token] → feed, ltvBps, liqBps, bonusBps, listed
   ├── accounts[user] → collateral map, debt principal + index
   ├── supplyShares / totalSupplyShares / assetsOf
   ├── borrowIndex / lastAccrual / totalDebt / totalUsdgLiquidity
   ├── utilizationBps / previewBorrowAprBps
   └── accountHealth(user) → collateralUsd, debtUsd, power, liqUsd, healthy
BorrowDeskLens → batched desk reads
```

Design notes live in `contracts/src/BorrowDeskMarket.sol` and `contracts/README.md`.

---

## Competitors

| Venue | Thesis | Closest threat |
|---|---|---|
| **Pledge** | Stock tokens → USDG credit | Direct twin - beat on UX + partial liq + foresight |
| **OpenGap** | Buy tokenized stocks on discount (Solana) | Steal desk craft; they have no lending |
| **PumpRobin** | RH Chain memecoin launchpad | Steal brand/search density |
| **StocksCalendar** | Research desk + Hermes | Steal provenance / intel UX |
| **Mandate** | Bounded agent trading, downside first | Steal “show risk before Borrow” |
| **lpTOKEN** | LP → ERC-20 shares | Steal supplier / inventory craft |

**BorrowDesk differentiation:**

1. Live multi-collateral Stock Token → USDG credit on Robinhood Chain
2. Partial liquidation (not full-debt-only)
3. Liq price / LTV slider / repay receipt before sign
4. Desk IA (tabs, ⌘K, oracle strip, per-asset risk bands)
5. Reown wallet path for judges + mobile

---

## Go to market

1. **Mainnet desk** - 29 feed-backed Stock Token / ETF markets listed live, borrow proven, Reown connect.
2. **Judge path** - Get started tab: chain 4663 → ETH gas → Stock Tokens → deposit → borrow.
3. **Liquidity narrative** - grow USDG inventory beyond toy-scale (~$4.80 idle today); show pool clearly in UI.
4. **Distribution** - Open House demos, RH Chain explorer links, Stock Token holder loops.
5. **Trust** - rotate compromised deployer key, public addresses in this README, toned security copy.

---

## Business model

| Stream | Mechanism |
|---|---|
| **Borrow interest** | ~5% APR on outstanding USDG debt (accrues via borrow index) |
| **Liquidation bonus** | Liquidators repay USDG and seize collateral at configured bonus bps |
| **Protocol inventory** | Owner-seeded + public USDG supply shares earn as utilization grows |

No token launch. Primary demo metric today: **healthy borrows against live Stock Token collateral**.

---

## Roadmap

| Phase | Focus | Status |
|---|---|---|
| 0 | Market contract, Foundry tests, deploy script | Done |
| 1 | Mainnet list NVDA/AAPL/TSLA/SPY + seed USDG + proven borrow | Done |
| 2 | Desk UI: health, ticket, markets, liquidate, asset pages, TV | Done |
| 3 | Reown AppKit, LTV slider, repay receipt, desk tabs, ⌘K, oracle strip | Done |
| 4 | V2 market: supply shares, util APR, Fund desk, Lens, Sourcify exact match | Done |
| 5 | V1 → V2 liquidity + collateral migration · HF /10 UI · borrowdesk.fun | Done |
| Next | Grow pool, ownership rotation, event-risk chips, liquidation bots | In progress |
| Later | Audits, larger inventory, more Stock Token bands | Planned |

**Explicit non-goals (buildathon):** spot trading as a venue, issuing Stock Tokens, perps, cross-chain deploy.

---

## Team

| | |
|---|---|
| **Product** | BorrowDesk |
| **Event** | Arbitrum Open House Singapore Online Buildathon |
| **Chain** | Robinhood Chain mainnet |

### Builder

**Amaan Sayyad** - blockchain developer · entrepreneur  
Hackathon builder · shipped Web3 products · founder / speaker / grantee

| | |
|---|---|
| X | [@amaanbiz](https://x.com/amaanbiz) |
| GitHub | [AmaanSayyad](https://github.com/AmaanSayyad) |
| LinkedIn | [amaan-sayyad-](https://www.linkedin.com/in/amaan-sayyad-/) |
| Portfolio | [amaan-sayyad-portfolio.vercel.app](https://amaan-sayyad-portfolio.vercel.app/) |

For security reports, contact privately - do not open issues that include exploit PoCs against live funds.

---

## Run locally

### Prerequisites

- Node **≥ 20**
- Optional: Foundry (`forge`) for contracts

### 1. Install

```bash
cd openline
npm install
```

### 2. Env

```bash
cp .env.example .env
# Edit .env - never commit it.
```

Minimum for the live desk:

```bash
NEXT_PUBLIC_CHAIN_ID=4663
NEXT_PUBLIC_RH_RPC_URL=https://robinhood.drpc.org
NEXT_PUBLIC_BORROWDESK_MARKET=0x17452DAB5976B770107c126fBC92aD746a3C0200
NEXT_PUBLIC_BORROWDESK_LENS=0x025694b88ddd0a6ffac740df4170b8ea590355cc
NEXT_PUBLIC_SITE_URL=https://borrowdesk.fun
NEXT_PUBLIC_REOWN_PROJECT_ID=          # from dashboard.reown.com
```

Optional deploy / seed (server-only - never commit):

```bash
PRIVATE_KEY=
RH_RPC_URL=https://robinhood.drpc.org
USDG_LIQUIDITY=500
```

### 3. Desk

```bash
npm run dev
# → http://localhost:3000
# App → http://localhost:3000/app
```

Connect via Reown on **Robinhood Chain (4663)** with Stock Tokens + ETH for gas.

### 4. Contracts (optional)

```bash
npm run test:contracts
# or
cd contracts && forge test -vv
```

Mainnet deploy helper:

```bash
npm run deploy:mainnet
```

---

## Verify / tests

```bash
npm run lint
npm run build
npm run test:contracts
```

Manual E2E checklist:

1. Connect wallet (Reown) on chain 4663  
2. Deposit listed Stock Token  
3. Borrow USDG (see liq foresight)  
4. Accrue / repay (see receipt)  
5. Withdraw if healthy  
6. Liquidate path only when `accountHealth` is unhealthy  

---

## Repo layout

| Path | What it is |
|---|---|
| `src/app/` | Next.js App Router (landing + `/app` desk + `/app/[symbol]`) |
| `src/components/` | Desk, landing, charts, UI |
| `src/hooks/` | Live market, oracles, prices, activity |
| `src/lib/` | Chains, wagmi/Reown, tokens, ABI, deployments |
| `contracts/` | Foundry · `BorrowDeskMarket.sol` |
| `public/tokens/` | Local Stock Token logos |
| `public/partners/` | Open House partner marks |
| `public/brand/` | BorrowDesk mark |
| `deployments/` | Mainnet artifacts |
| `MAINNET.md` | Live deploy + proven position notes |
| `.env.example` | Env template |

---

## Security notes

- Never commit `.env`, private keys, or wallet JSON.
- Deployer key was exposed in an earlier chat - **treat as compromised**; rotate ownership and drain residual funds when convenient.
- Oracles: equity feeds are 24/5; `maxOracleDelay = 4 days` covers weekends - document this in demos.
- Do not relax health / LTV checks in the market.
- Reown project ID is public; protect the dashboard and allowlisted origins.
- Pool is currently toy-scale (~5 USDG) - size inventory before promoting uncapped deposits.

---

## License

Proprietary / buildathon submission unless a `LICENSE` file is added to this package.

Copyright (c) 2026 BorrowDesk builders.

---

## Further reading

1. [`MAINNET.md`](./MAINNET.md) - live addresses + proven position  
2. [`contracts/README.md`](./contracts/README.md) - Foundry deploy checklist  
3. [`contracts/src/BorrowDeskMarket.sol`](./contracts/src/BorrowDeskMarket.sol) - market logic  
4. [Robinhood Chain docs - Stock Tokens](https://docs.robinhood.com/chain/stock-tokens/)  
5. [Reown dashboard](https://dashboard.reown.com) - wallet project config  
6. [Arbitrum Open House Singapore](https://arbitrum-singapore.hackquest.io/buildathons/Arbitrum-Open-House-Singapore-Online-Buildathon)
