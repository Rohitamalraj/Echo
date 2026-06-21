/**
 * Echo Contract Deployment Script (Node.js / TypeScript SDK)
 *
 * Publishes the Echo Move package to Sui testnet using the TypeScript SDK.
 * Does NOT require the Sui CLI — only Node.js and @mysten/sui.
 *
 * Usage (run from repo root):
 *   cd web
 *   SUI_PRIVATE_KEY="suiprivkey1..." node ../contracts/deploy-node.mjs
 *
 * NOTE: This uses sui client publish under the hood via the SDK.
 * The private key is read from the SUI_PRIVATE_KEY env variable — never hardcoded.
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Deps (loaded from web/node_modules) ─────────────────────────────────────
const webDir = join(__dirname, '..', 'web');
const modPath = (m) => join(webDir, 'node_modules', m);

const { Ed25519Keypair } = await import(modPath('@mysten/sui/keypairs/ed25519'));
const { decodeSuiPrivateKey } = await import(modPath('@mysten/sui/cryptography'));
const { Transaction } = await import(modPath('@mysten/sui/transactions'));
const { SuiJsonRpcClient, getJsonRpcFullnodeUrl } = await import(modPath('@mysten/sui/jsonRpc'));

// ── Config ───────────────────────────────────────────────────────────────────
const PRIVATE_KEY = process.env.SUI_PRIVATE_KEY;
if (!PRIVATE_KEY) {
  console.error('❌ SUI_PRIVATE_KEY env var not set');
  console.error('   Run: SUI_PRIVATE_KEY="suiprivkey1..." node contracts/deploy-node.mjs');
  process.exit(1);
}

const suiClient = new SuiJsonRpcClient({
  url: getJsonRpcFullnodeUrl('testnet'),
  network: 'testnet',
});

const keypair = Ed25519Keypair.fromSecretKey(
  decodeSuiPrivateKey(PRIVATE_KEY).secretKey
);
const address = keypair.getPublicKey().toSuiAddress();
console.log(`▶ Deployer address: ${address}`);

// ── Check balance ─────────────────────────────────────────────────────────────
const coins = await suiClient.getCoins({ owner: address });
const suiBalance = coins.data.reduce((sum, c) =>
  c.coinType === '0x2::sui::SUI' ? sum + BigInt(c.balance) : sum, 0n);
console.log(`▶ SUI balance: ${Number(suiBalance) / 1e9} SUI`);
if (suiBalance < 100_000_000n) {
  console.error('❌ Insufficient SUI balance (need at least 0.1 SUI for gas)');
  process.exit(1);
}

// ── Find compiled bytecode ────────────────────────────────────────────────────
// The bytecode must be pre-compiled using: sui move build --path contracts/
// It's stored in contracts/build/echo/bytecode_modules/
const buildDir = join(__dirname, 'build', 'echo', 'bytecode_modules');
if (!existsSync(buildDir)) {
  console.error('❌ No compiled bytecode found at:', buildDir);
  console.error('   Run first: sui move build --path contracts/');
  console.error('   Or use the Sui CLI to compile on a machine with it installed.');
  process.exit(1);
}

const modules = readdirSync(buildDir)
  .filter(f => f.endsWith('.mv'))
  .map(f => {
    const bytes = readFileSync(join(buildDir, f));
    return Array.from(bytes);
  });

console.log(`▶ Found ${modules.length} compiled module(s)`);

// ── Dependencies (published-at addresses from the framework) ─────────────────
// These are the Sui framework packages on testnet
const dependencies = [
  '0x0000000000000000000000000000000000000000000000000000000000000001', // MoveStdlib
  '0x0000000000000000000000000000000000000000000000000000000000000002', // Sui framework
];

// ── Build and submit the publish transaction ─────────────────────────────────
console.log('▶ Building publish transaction...');
const tx = new Transaction();
const [upgradeCap] = tx.publish({ modules, dependencies });
tx.transferObjects([upgradeCap], address);
tx.setGasBudget(200_000_000);

console.log('▶ Signing and submitting...');
const result = await suiClient.signAndExecuteTransaction({
  transaction: tx,
  signer: keypair,
  options: {
    showEffects: true,
    showObjectChanges: true,
  },
});

if (result.effects?.status?.status !== 'success') {
  console.error('❌ Transaction failed:', result.effects?.status?.error);
  process.exit(1);
}

// ── Extract new package ID ────────────────────────────────────────────────────
const published = result.objectChanges?.find(c => c.type === 'published');
const newPackageId = published?.packageId;
const upgCapId = result.objectChanges?.find(
  c => c.type === 'created' && c.objectType?.includes('UpgradeCap')
)?.objectId;

console.log('');
console.log('✅ Published successfully!');
console.log(`   Transaction: https://suiscan.xyz/testnet/tx/${result.digest}`);
console.log('');
console.log('   ┌─────────────────────────────────────────────────────────────────────────');
console.log(`   │ New ECHO_PACKAGE_ID: ${newPackageId}`);
console.log(`   │ UpgradeCap ID:       ${upgCapId}`);
console.log('   └─────────────────────────────────────────────────────────────────────────');
console.log('');
console.log('📋 Update web/.env.local:');
console.log(`   NEXT_PUBLIC_ECHO_PACKAGE_ID=${newPackageId}`);
console.log('');
console.log('📋 Keep the UpgradeCap object ID safe for future upgrades!');
