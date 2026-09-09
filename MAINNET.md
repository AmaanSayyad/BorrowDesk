# BorrowDesk - Robinhood Chain mainnet

## Live deployment

| Field | Value |
|---|---|
| Market | [`0x2e4E7E8145E4cCA7E0fEf4737A2489E4E27D9E8d`](https://robinhoodchain.blockscout.com/address/0x2e4E7E8145E4cCA7E0fEf4737A2489E4E27D9E8d) |
| Owner | `0x1881Dfd2b29536F054AA0b0A4966856290388Cc2` |
| Create tx | [`0x011533d69bab32b19c066e45547672cdd4697043314389f223252e1c477c3675`](https://robinhoodchain.blockscout.com/tx/0x011533d69bab32b19c066e45547672cdd4697043314389f223252e1c477c3675) |
| Listed | NVDA, AAPL, TSLA, SPY |
| Pool USDG | **~5.03 USDG** available |
| Status | **Borrow proven** - position healthy |

### Proven onchain position (deployer)

| Metric | Value |
|---|---|
| Collateral (oracle USD) | ~$0.53 |
| Debt | **0.287631 USDG** |
| Borrow power remaining | ~$0.032 |
| Healthy | `true` |
| Deposited | NVDA + AAPL (wallet balances now 0 - fully deposited) |

> Security: the deployer private key was pasted in chat - treat it as compromised. Rotate ownership / remaining funds when convenient.

## Runtime

- Network: Robinhood Chain mainnet `4663`
- Preferred RPC: `https://robinhood.drpc.org` (official Cloudflare RPC often 403s forge)
- Explorer: `https://robinhoodchain.blockscout.com`
- USDG: `0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168` (**6 decimals**)

## App

```bash
cd openline
npm run dev
# open http://localhost:3000/app
```

- **Connect wallet** on Robinhood Chain (4663) for live deposit / borrow / repay / withdraw
