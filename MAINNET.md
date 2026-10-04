# BorrowDesk - Robinhood Chain mainnet

## Live deployment (V2)

| Field | Value |
|---|---|
| Market V2 | [`0x17452DAB5976B770107c126fBC92aD746a3C0200`](https://robinhoodchain.blockscout.com/address/0x17452DAB5976B770107c126fBC92aD746a3C0200) |
| Lens | [`0x025694b88ddd0a6ffac740df4170b8ea590355cc`](https://robinhoodchain.blockscout.com/address/0x025694b88ddd0a6ffac740df4170b8ea590355cc) |
| Legacy V1 | [`0x2e4E7E8145E4cCA7E0fEf4737A2489E4E27D9E8d`](https://robinhoodchain.blockscout.com/address/0x2e4E7E8145E4cCA7E0fEf4737A2489E4E27D9E8d) · drained / unused |
| Owner | `0x1881Dfd2b29536F054AA0b0A4966856290388Cc2` |
| Listed | 29 Stock Token / ETF markets |
| Pool USDG (idle) | **~4.80 USDG** |
| Status | **Live** - V2 supply shares · util APR · borrow proven |

### Proven onchain position (deployer · V2)

| Metric | Value |
|---|---|
| Collateral (oracle USD) | ~$1.32 |
| Debt | **~0.0001 USDG** (dust) |
| Borrow power remaining | ~$0.78 |
| Healthy | `true` |
| Health factor (UI) | **10/10** (capped · raw liq/debt) |
| Deposited | Multi-collateral (NVDA / AAPL + migrated V1 books) |

## Runtime

- Network: Robinhood Chain mainnet `4663`
- Preferred RPC: `https://robinhood.drpc.org` (official Cloudflare RPC often 403s forge)
- Explorer: `https://robinhoodchain.blockscout.com`
- USDG: `0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168` (**6 decimals**)
- App: [https://borrowdesk.fun](https://borrowdesk.fun)

## App

```bash
cd openline
npm run dev
# open http://localhost:3000/app
```

- **Connect wallet** on Robinhood Chain (4663) for live deposit / borrow / repay / withdraw / supply
