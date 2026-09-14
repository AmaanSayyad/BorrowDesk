#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "Missing openline/.env - copy .env.example and fill PRIVATE_KEY (+ optional USDG_LIQUIDITY)."
  exit 1
fi

# shellcheck disable=SC1091
set -a
source .env
set +a

if [[ -z "${PRIVATE_KEY:-}" ]]; then
  echo "PRIVATE_KEY is empty in .env"
  exit 1
fi

RPC="${RH_RPC_URL:-https://rpc.mainnet.chain.robinhood.com}"
export PRIVATE_KEY
export USDG_LIQUIDITY="${USDG_LIQUIDITY:-0}"

echo "Deploying BorrowDeskMarket to Robinhood Chain…"
echo "RPC: $RPC"
echo "USDG_LIQUIDITY: $USDG_LIQUIDITY"

OUT=$(forge script script/DeployMainnet.s.sol:DeployMainnetScript \
  --root contracts \
  --rpc-url "$RPC" \
  --broadcast \
  -vvvv)

echo "$OUT"

MARKET=$(echo "$OUT" | awk '/BorrowDeskMarket/{print $NF}' | tail -1)

if [[ -z "$MARKET" || "$MARKET" == "BorrowDeskMarket" ]]; then
  echo "Could not parse market address from forge output. Check broadcast logs."
  exit 1
fi

mkdir -p deployments
cat > deployments/robinhood.json <<EOF
{
  "chainId": 4663,
  "network": "Robinhood Chain",
  "market": "$MARKET",
  "usdg": "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168",
  "rpc": "$RPC",
  "explorer": "https://robinhoodchain.blockscout.com/address/$MARKET",
  "deployedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

# Persist for Next.js without rewriting private key
if grep -q '^NEXT_PUBLIC_BORROWDESK_MARKET=' .env 2>/dev/null; then
  sed -i.bak "s|^NEXT_PUBLIC_BORROWDESK_MARKET=.*|NEXT_PUBLIC_BORROWDESK_MARKET=$MARKET|" .env
  rm -f .env.bak
else
  printf '\nNEXT_PUBLIC_BORROWDESK_MARKET=%s\n' "$MARKET" >> .env
fi

echo ""
echo "Deployed BorrowDeskMarket: $MARKET"
echo "Explorer: https://robinhoodchain.blockscout.com/address/$MARKET"
echo "Wrote deployments/robinhood.json and updated .env"
