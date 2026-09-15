#!/usr/bin/env bash
# Verify BorrowDesk mainnet claims with cast (Foundry).
# Usage: ./script/verify-claims.sh
set -euo pipefail

RPC="${RH_RPC_URL:-https://robinhood.drpc.org}"
MARKET="${BORROWDESK_MARKET:-${NEXT_PUBLIC_BORROWDESK_MARKET:-0x17452DAB5976B770107c126fBC92aD746a3C0200}}"
USDG="0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168"
NVDA="0xd0601CE157Db5bdC3162BbaC2a2C8aF5320D9EEC"
PROVEN="0x1881Dfd2b29536F054AA0b0A4966856290388Cc2"

if ! command -v cast >/dev/null 2>&1; then
  echo "cast not found - install Foundry: https://book.getfoundry.sh/getting-started/installation"
  exit 1
fi

echo "== BorrowDesk verify-claims =="
echo "RPC    $RPC"
echo "Market $MARKET"
echo

echo "-- bytecode --"
CODE=$(cast code "$MARKET" --rpc-url "$RPC")
if [[ ${#CODE} -lt 4 || "$CODE" == "0x" ]]; then
  echo "FAIL: no bytecode at market"
  exit 1
fi
echo "OK: bytecode length ${#CODE}"

echo
echo "-- usdg() --"
GOT=$(cast call "$MARKET" "usdg()(address)" --rpc-url "$RPC")
echo "got $GOT"
GOT_LC=$(printf '%s' "$GOT" | tr '[:upper:]' '[:lower:]')
USDG_LC=$(printf '%s' "$USDG" | tr '[:upper:]' '[:lower:]')
[[ "$GOT_LC" == "$USDG_LC" ]] && echo "OK: USDG matches" || echo "WARN: USDG mismatch"

echo
echo "-- totalUsdgLiquidity() --"
cast call "$MARKET" "totalUsdgLiquidity()(uint256)" --rpc-url "$RPC"

echo
echo "-- totalDebt() --"
cast call "$MARKET" "totalDebt()(uint256)" --rpc-url "$RPC"

echo
echo "-- accountHealth(proven) --"
cast call "$MARKET" \
  "accountHealth(address)(uint256,uint256,uint256,uint256,bool)" \
  "$PROVEN" --rpc-url "$RPC"

echo
echo "-- markets(NVDA) --"
cast call "$MARKET" \
  "markets(address)(address,uint16,uint16,uint16,bool,uint8)" \
  "$NVDA" --rpc-url "$RPC"

echo
echo "-- desk config (from deployments/robinhood.json) --"
if [[ -f deployments/robinhood.json ]]; then
  python3 - <<'PY' 2>/dev/null || true
import json
from pathlib import Path
m = json.loads(Path("deployments/robinhood.json").read_text())
print("status", m.get("status"))
print("listed", ",".join(m.get("listed", [])))
print("borrowApr", m.get("borrowApr"))
print("maxOracleDelayDays", m.get("maxOracleDelayDays"))
print("judgeDeepLink", m.get("judgeDeepLink"))
PY
else
  echo "(no deployments/robinhood.json in cwd - run from openline/)"
fi

echo
echo "Sourcify: https://repo.sourcify.dev/4663/${MARKET}"
echo "Explorer: https://robinhoodchain.blockscout.com/address/${MARKET}"
echo "Done."
