# BorrowDesk contracts

Foundry project for `BorrowDeskMarket` - collateralized USDG credit against Stock Tokens.

## Commands

```bash
forge test -vv
forge build
forge script script/Deploy.s.sol --rpc-url <RPC> --broadcast --private-key <KEY>
```

## Mainnet listing checklist (Robinhood Chain)

1. Deploy `BorrowDeskMarket` with canonical USDG `0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168`
2. For each Stock Token, `listMarket(token, chainlinkFeed, ltvBps, liqBps, bonusBps)`
3. `addLiquidity` with USDG inventory
4. Verify oracle heartbeats / sequencer uptime consumers before opening public deposits

## Verification

Live market `0x2e4E7E8145E4cCA7E0fEf4737A2489E4E27D9E8d` is an **exact match** on Sourcify (chain `4663`):

- [Sourcify contract](https://sourcify.dev/server/v2/contract/4663/0x2e4E7E8145E4cCA7E0fEf4737A2489E4E27D9E8d)
- Artifacts: `verify-standard-input.json`, `verify-OpenLineMarket.flattened.sol`
- Compiler: `v0.8.30+commit.73712a01`, optimizer off, constructor USDG `0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168`

Blockscout UI verify (when Cloudflare/rate-limit allows): Standard JSON → upload `verify-standard-input.json` → contract name `OpenLineMarket`.
