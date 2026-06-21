# Echo — Social Copy-Trading on DeepBook Predict

> **Follow top predictors. Copy their trades in one tap. Earn 85% of the payout — split enforced by Move smart contract, zero middlemen.**

Built for **Sui Overflow 2026 · DeepBook Track**

---

## The Problem

DeepBook Predict is a powerful on-chain binary prediction market infrastructure — but it has a discovery and participation problem that every new prediction market faces:

### Real Users, Real Pain Points

**1. "I don't know what to trade."**
A new user lands on DeepBook Predict. They see BTC/USD binary options expiring in 10 minutes. There's no feed, no signal, no social context. They guess. They lose. They don't come back.

**2. "I'm good at this but I can't monetize my edge."**
An experienced on-chain trader consistently calls BTC direction correctly. They earn on their own positions — but their intelligence generates zero additional income. On Binance Copy Trade or eToro, top traders earn 5–15% from their followers passively. On-chain? Nothing.

**3. "I want to follow someone, but how do I know who to trust?"**
Even if a predictor posts publicly, there's no on-chain reputation — no win rate, no streak, no verifiable track record. Trust is impossible to establish without a third party.

**4. "The signal I'm paying for might be wrong or fake."**
Premium prediction signals (Telegram groups, newsletters) charge upfront with no accountability. There's no on-chain proof that the signal provider actually trades what they preach.

### Market Size

| Market | Size |
|---|---|
| Copy trading on centralized exchanges | $2B+ annual volume |
| Top copy-trade platforms (eToro, Binance) | 30M+ users |
| On-chain copy-trading infrastructure | **$0 — doesn't exist** |
| DeepBook Predict TVL target | Significant DeFi liquidity |

The entire copy-trading market exists on centralized rails. Echo brings it on-chain, enforced by Move.

---

## The Solution — Echo

Echo is the social layer for DeepBook Predict. It turns an individual trading interface into a two-sided marketplace:

```
Predictor posts trade  →  Followers see feed  →  One-tap copy  →  Auto 85/15 split at settlement
```

### How It Works

**For Predictors (Signal Providers):**
1. Connect wallet → create Echo profile (on-chain stats: win rate, streak, followers)
2. Open a position on DeepBook Predict through Echo's Post Trade modal
3. Optionally attach encrypted reasoning (SEAL) with a signal fee
4. Earn automatic 15% cut every time a follower copies and wins — enforced by Move, no claiming needed

**For Followers (Copiers):**
1. Browse the live feed — see top predictors with on-chain verified win rates and streaks
2. Tap "Copy Trade" → enter your size → sign one transaction
3. Echo atomically: deposits into your PredictManager → mints your position → records the CopyRecord on-chain
4. At settlement: 85% of your payout goes to you, 15% goes to the predictor — split happens in the same PTB, no trust required

---

## Why Echo is Better Than Existing Protocols

| Feature | Telegram Signal Groups | eToro / Binance Copy | Polymarket | **Echo** |
|---|---|---|---|---|
| On-chain execution | ❌ | ❌ | ✅ | ✅ |
| Verifiable win rate | ❌ | Centralized | ❌ | ✅ on-chain |
| Automatic earnings for predictor | ❌ | Centralized % | ❌ | ✅ Move contract |
| Payout split custody | Trust | CEX holds | N/A | **Zero — PTB atomic** |
| Premium signal access | Telegram paywall | N/A | N/A | ✅ SEAL encrypted |
| Signal accountability | None | Rating system | N/A | ✅ All trades public |
| One-transaction copy | ❌ | ❌ | ❌ | ✅ |
| Decentralized reasoning storage | ❌ | ❌ | ❌ | ✅ Walrus |

**Key differentiator:** The predictor's 15% cut is not a fee you send to a wallet you trust — it is computed and transferred atomically inside the settlement PTB by `copy_trade::settle_copy`. The contract enforces the split. There is no admin key, no upgrade authority, no rug vector.

---

## DeepBook Integration (Primary)

Echo is built **on top of DeepBook Predict**, not alongside it. Every trade on Echo is a real DeepBook Predict position.

### How Echo Uses DeepBook Predict

**1. Trade Execution — `predict::mint`**
When a follower copies a trade, Echo builds a PTB that calls:
```
predict_manager::deposit(manager, coin)          // deposit dUSDC into PredictManager
predict::mint(predict_obj, manager, market_key)  // open binary position on DeepBook
copy_trade::create_copy(copy_record, ...)        // record the social link on-chain
```
All three happen atomically in one Sui PTB. If any step fails, all revert.

**2. Market Key Construction**
Every position is uniquely identified by a `MarketKey`:
```
market_key::new(oracle_id, expiry_ms, strike_price, is_up: bool)
```
Echo reads live oracle data (SVI volatility model, spot/forward prices) from the Predict Server REST API to construct valid market keys and compute implied probabilities.

**3. Settlement — `predict::redeem_permissionless`**
At expiry, anyone can trigger settlement. Echo's settlement PTB:
```
predict::redeem_permissionless(...)     // oracle settles position → payout into manager
predict_manager::withdraw(...)          // extract Coin<dUSDC> (follower's manager, follower signs)
copy_trade::settle_copy(copy_record, payout_coin, predictor_profile, clock, ctx)
  → 15% → predictor wallet (immediate transfer)
  → 85% → follower wallet (immediate transfer)
  → PredictorProfile stats updated (win rate, streak, earnings)
  → CopySettled event emitted
```

**4. Live Feed from DeepBook**
Echo's social feed queries `/positions/minted` from the Predict Server and filters to Echo-registered predictors (wallets with a `PredictorProfile`). The leaderboard, portfolio dashboard, and trade cards all read directly from DeepBook Predict's indexer — no Echo-side database.

---

## Sui Ecosystem Integrations

### SEAL — Encrypted Premium Signals

Predictors can monetize their analysis beyond the 15% copy cut by attaching a premium signal with a paywall.

**Flow:**
1. When posting a trade, predictor writes reasoning + direction → encrypted client-side using `@mysten/seal` SDK
2. `seal_signal::create_policy(blob_id, fee_dusd)` creates an on-chain `SignalPolicy` shared object
3. Encrypted ciphertext is uploaded to Walrus → `blobId` stored in the policy
4. Any follower who wants to read the analysis calls `seal_signal::pay_signal_fee(policy, payment)`
5. SEAL key server (`seal_approve` on-chain check) verifies payment → releases decryption key
6. Follower decrypts the blob locally in browser — the key never touches a server

**What this solves:** Signal providers have zero accountability on Telegram. On Echo, the predictor must actually open the position on-chain before attaching the signal — the trade is verifiable, and the reasoning is decrypted only after paying.

### Walrus — Decentralized Blob Storage

All trade reasoning (both premium SEAL-encrypted and free plain-text) is stored on Walrus, not a centralised server.

- **Encrypted signals:** SEAL ciphertext uploaded as binary blob via `PUT /v1/blobs`
- **Plain-text signals:** JSON `{ direction, reasoning }` uploaded directly
- **Retrieval:** Fetched via Walrus aggregator `GET /v1/blobs/:blobId` — content-addressed, permanent for the epoch duration
- **Why not IPFS/Arweave:** Walrus is native to Sui, has sub-second finality for blob retrieval, and integrates directly with SEAL's key release mechanism

### Sui Move — Smart Contract Architecture

Three Move modules deployed to Sui Testnet:

**`echo::predictor_profile`**
- `ProfileRegistry` — singleton shared object mapping `address → PredictorProfile ID`
- `PredictorProfile` — per-predictor on-chain stats: `win_rate_bps`, `total_trades`, `winning_trades`, `current_streak`, `best_streak`, `copy_earnings_cents`, `signal_earnings_cents`, `follower_count`
- Stats updated atomically at settlement — no off-chain oracle, no trust

**`echo::copy_trade`**
- `CopyRecord` — shared object linking `follower → predictor` with trade parameters, settlement outcome, and payout breakdown
- `create_copy` — verifies follower ≠ predictor, minimum amount, then records the link
- `settle_copy` — enforces 85/15 split, updates `PredictorProfile`, emits `CopySettled`

**`echo::seal_signal`**
- `SignalPolicy` — shared object with `blob_id`, `fee_dusd`, `paid_wallets: VecSet<address>`
- `seal_approve` — entry function called by SEAL key server to verify payment before releasing decryption key
- `pay_signal_fee` — pays fee, adds wallet to `paid_wallets`, credits `signal_earnings_cents` to predictor profile

---

## Deployed Contracts

### Echo (Sui Testnet)

| Object | ID |
|---|---|
| **Echo Package** | `0x7ac3de1b8ad5d43a7c04cbc22d3c84513d505a8f72d2573f3dfe7bb43d61e044` |
| **ProfileRegistry** | `0x664964fac428df569c42b4b0c415ca867ddf80efda47b625707e05551d240b43` |

**Modules:** `echo::predictor_profile` · `echo::copy_trade` · `echo::seal_signal`

### DeepBook Predict (Sui Testnet)

| Object | ID |
|---|---|
| **Predict Package** | `0xf5ea2b3749c65d6e56507cc35388719aadb28f9cab873696a2f8687f5c785138` |
| **Predict Object** | `0xc8736204d12f0a7277c86388a68bf8a194b0a14c5538ad13f22cbd8e2a38028a` |
| **Registry** | `0x43af14fed5480c20ff77e2263d5f794c35b9fab7e2212903127062f4fe2a6e64` |
| **dUSDC Type** | `0xe95040085976bfd54a1a07225cd46c8a2b4e8e2b6732f140a0fc49850ba73e1a::dusdc::DUSDC` |

**Predict Server API:** `https://predict-server.testnet.mystenlabs.com`

### SEAL (Sui Testnet)

| Service | Value |
|---|---|
| Key Server Object | `0xb012378c9f3799fb5b1a7083da74a4069e3c3f1c93de0b27212a5799ce1e1e98` |
| Aggregator URL | `https://seal-aggregator-testnet.mystenlabs.com` |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Echo Frontend                         │
│              Next.js 15 · @mysten/dapp-kit                  │
├──────────────┬──────────────┬───────────────┬───────────────┤
│  /feed       │  /leaderboard│  /portfolio   │  /trade/:tx   │
│  Live trades │  Top traders │  Your P&L     │  TradingView  │
│  Copy button │  Win rates   │  Copy history │  + SEAL unlock│
└──────┬───────┴──────┬───────┴───────┬───────┴───────┬───────┘
       │              │               │               │
       ▼              ▼               ▼               ▼
┌─────────────┐ ┌──────────┐  ┌────────────┐  ┌──────────────┐
│  DeepBook   │ │  Echo    │  │  Walrus    │  │     SEAL     │
│  Predict    │ │  Move    │  │  Testnet   │  │  Key Server  │
│  Testnet    │ │ Contracts│  │  Blob Store│  │  (Mysten)    │
│             │ │          │  │            │  │              │
│ predict::   │ │predictor │  │ Reasoning  │  │ seal_approve │
│   mint      │ │_profile  │  │ blobs      │  │ verify+      │
│ redeem_perm │ │copy_trade│  │ (encrypted │  │ release key  │
│ oracle SVI  │ │seal_sig  │  │  or plain) │  │              │
└─────────────┘ └──────────┘  └────────────┘  └──────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| Wallet | `@mysten/dapp-kit`, Sui Wallet Standard |
| Chain | Sui Testnet, Sui Move |
| Trading | DeepBook Predict (`predict::mint`, `predict::redeem_permissionless`) |
| Encryption | `@mysten/seal` SDK — threshold encryption |
| Storage | Walrus Testnet (blob store) |
| Charts | TradingView Advanced Chart Widget (BTCUSDT live) |
| Price Data | DeepBook Predict Server REST API (SVI model, spot/forward) |

---

## Running Locally

```bash
cd web
npm install
cp .env.example .env.local   # fill in contract addresses (already in constants.ts)
npm run dev
# → http://localhost:3000
```

**Environment variables** (all have fallback hardcoded values in `lib/constants.ts`):
```
NEXT_PUBLIC_ECHO_PACKAGE_ID
NEXT_PUBLIC_PROFILE_REGISTRY_ID
NEXT_PUBLIC_PREDICT_PACKAGE_ID
NEXT_PUBLIC_PREDICT_OBJECT_ID
NEXT_PUBLIC_DUSDC_TYPE
NEXT_PUBLIC_WALRUS_AGGREGATOR
NEXT_PUBLIC_WALRUS_PUBLISHER
NEXT_PUBLIC_PREDICT_SERVER_URL
```

**Get testnet dUSDC:** Use the DeepBook Predict faucet on Sui Testnet to get `dUSDC` for trading.

---

## Demo Flow (Two Wallets)

**Wallet A — Predictor:**
1. Open Echo → Start → create profile "Alice"
2. Post Trade → BTC UP, $64,000 strike, 10 min expiry, 5 dUSDC, optional reasoning
3. Optionally attach premium signal with SEAL (0.5 dUSDC unlock fee)

**Wallet B — Follower:**
1. Open Feed → see Alice's trade card (direction hidden, stats visible)
2. Click card → Trade Detail page → TradingView chart + strike reference
3. Click "Unlock Signal" (if premium) → pay 0.5 dUSDC → SEAL decrypts direction + reasoning
4. Click "Copy Trade" → enter 2 dUSDC → sign one transaction
5. Echo atomically mints position + records CopyRecord on-chain

**Settlement (either wallet):**
1. Wait for expiry → Portfolio page → "Settle" button
2. One PTB: redeem from DeepBook → split 85/15 → CopyRecord marked settled
3. Alice receives 15% of Wallet B's payout automatically — no claiming, no trust

---

## What's Novel

1. **First social copy-trading layer on any on-chain prediction market** — the category doesn't exist yet
2. **85/15 payout split enforced by Move** — not an agreement, not a promise, a constraint in the contract
3. **SEAL-gated premium signals** — the predictor must have skin in the game (they opened the position) before the signal is trusted
4. **On-chain verifiable track record** — `PredictorProfile.win_rate_bps` is computed from settled CopyRecords, not self-reported
5. **Atomic copy in one PTB** — deposit + mint + CopyRecord in a single transaction; partial execution reverts automatically

---

*Sui Overflow 2026 · DeepBook Track · Built by Rohit Amalraj*
