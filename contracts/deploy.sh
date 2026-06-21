#!/bin/bash
# Echo Contract Deployment / Upgrade Script
#
# Usage:
#   export SUI_PRIVATE_KEY="suiprivkey1..."
#   bash contracts/deploy.sh
#
# Requirements: Sui CLI installed (sui client --version)

set -e

PACKAGE_DIR="$(cd "$(dirname "$0")" && pwd)"
ECHO_PACKAGE_ID="0x74ddf6ea29b138db0f55db9aea82452ad80bbecf7d26bd05caa6095d05184125"
NETWORK="testnet"

if [ -z "$SUI_PRIVATE_KEY" ]; then
  echo "❌ SUI_PRIVATE_KEY env var not set"
  echo "   Run: export SUI_PRIVATE_KEY=\"suiprivkey1...\""
  exit 1
fi

# ── Setup Sui config ─────────────────────────────────────────────────────────
echo "▶ Configuring Sui CLI for testnet…"
sui client switch --env $NETWORK 2>/dev/null || \
  sui client new-env --alias $NETWORK --rpc https://fullnode.testnet.sui.io:443

# Import key (safe — uses env var, not shell arg)
ADDR=$(node -e "
const { decodeSuiPrivateKey } = require('@mysten/sui/cryptography');
const { Ed25519Keypair } = require('@mysten/sui/keypairs/ed25519');
const kp = Ed25519Keypair.fromSecretKey(decodeSuiPrivateKey(process.env.SUI_PRIVATE_KEY).secretKey);
console.log(kp.getPublicKey().toSuiAddress());
" 2>/dev/null)

if [ -z "$ADDR" ]; then
  echo "❌ Could not derive address from private key"
  exit 1
fi

echo "▶ Wallet address: $ADDR"

# Import private key into keystore
echo "$SUI_PRIVATE_KEY" | sui keytool import --key-scheme ed25519 /dev/stdin 2>/dev/null || true
sui client switch --address "$ADDR" 2>/dev/null || true

# Check balance
echo "▶ Checking balance…"
sui client balance

# ── Find UpgradeCap ──────────────────────────────────────────────────────────
echo ""
echo "▶ Looking for UpgradeCap for package $ECHO_PACKAGE_ID…"

UPGRADE_CAP=$(node -e "
const { SuiJsonRpcClient, getJsonRpcFullnodeUrl } = require('@mysten/sui/jsonRpc');
const client = new SuiJsonRpcClient({ url: getJsonRpcFullnodeUrl('testnet'), network: 'testnet' });
async function main() {
  const objs = await client.getOwnedObjects({
    owner: '$ADDR',
    filter: { StructType: '0x2::package::UpgradeCap' },
    options: { showContent: true, showType: true },
  });
  for (const obj of objs.data || []) {
    const fields = obj.data?.content?.fields;
    if (fields?.package === '$ECHO_PACKAGE_ID') {
      console.log(obj.data.objectId);
      return;
    }
  }
  console.log('NOT_FOUND');
}
main().catch(() => console.log('ERROR'));
" 2>/dev/null)

echo "UpgradeCap: $UPGRADE_CAP"

# ── Build ────────────────────────────────────────────────────────────────────
echo ""
echo "▶ Building Move package…"
cd "$PACKAGE_DIR"
sui move build --skip-fetch-latest-git-deps

if [ "$UPGRADE_CAP" = "NOT_FOUND" ] || [ "$UPGRADE_CAP" = "ERROR" ] || [ -z "$UPGRADE_CAP" ]; then
  echo ""
  echo "⚠️  No UpgradeCap found for $ECHO_PACKAGE_ID"
  echo "   Publishing as a NEW package (existing objects will stop working)."
  echo "   To abort, press Ctrl+C. To continue, press Enter."
  read -r

  echo "▶ Publishing…"
  RESULT=$(sui client publish --gas-budget 200000000 --json 2>&1)
  echo "$RESULT"
  NEW_PKG=$(echo "$RESULT" | grep -o '"packageId":"0x[^"]*"' | head -1 | cut -d'"' -f4)
  echo ""
  echo "✅ Published! New package ID: $NEW_PKG"
  echo "   Update NEXT_PUBLIC_ECHO_PACKAGE_ID=$NEW_PKG in web/.env.local"
else
  echo ""
  echo "▶ Upgrading existing package with UpgradeCap $UPGRADE_CAP…"
  RESULT=$(sui client upgrade \
    --upgrade-capability "$UPGRADE_CAP" \
    --gas-budget 200000000 \
    --json 2>&1)
  echo "$RESULT"
  NEW_PKG=$(echo "$RESULT" | grep -o '"packageId":"0x[^"]*"' | head -1 | cut -d'"' -f4)
  echo ""
  echo "✅ Upgraded! Package ID remains: $ECHO_PACKAGE_ID"
  if [ -n "$NEW_PKG" ] && [ "$NEW_PKG" != "$ECHO_PACKAGE_ID" ]; then
    echo "   Note: Upgrade created new package version: $NEW_PKG"
  fi
fi
