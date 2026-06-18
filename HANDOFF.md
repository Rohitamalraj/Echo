# Echo — Teammate Handoff

**Hackathon:** Sui Overflow 2026 — DeepBook Track  
**Deadline:** June 21, 2026 at 6 PM PT  
**Project:** Social copy-trading on DeepBook Predict  

---

## What Echo Does

Predictors post BTC binary options trades on DeepBook Predict. Followers copy them in one tap. When the option settles, the Move smart contract automatically splits the payout — **85% to the follower, 15% to the predictor**. Every stat (win rate, streak, earnings) lives on-chain in a `PredictorProfile` object — no screenshots, no trust required.

---

## Repo Structure

```
D:\Projects\Echo\
├── contracts/          ← Sui Move smart contracts (already deployed)
│   └── sources/
│       ├── predictor_profile.move
│       ├── copy_trade.move
│       └── seal_signal.move
└── frontend/           ← Next.js 15 app (your working directory)
    ├── app/
    │   ├── page.tsx                  → Feed (/)
    │   ├── leaderboard/page.tsx      → Leaderboard (/leaderboard)
    │   ├── portfolio/page.tsx        → Portfolio (/portfolio)
    │   └── predictor/[address]/      → Predictor profile (/predictor/0x...)
    ├── components/
    │   ├── feed-page.tsx             ← main feed, live oracle data
    │   ├── leaderboard-page.tsx      ← live on-chain profiles
    │   ├── portfolio-page.tsx        ← connected wallet's positions
    │   ├── predictor-page.tsx        ← predictor stats + copy history
    │   ├── post-trade-modal.tsx      ← predictor posts a trade (PTB)
    │   ├── copy-modal.tsx            ← follower copies a trade (PTB)
    │   ├── create-profile-modal.tsx  ← first-time profile creation
    │   ├── navbar.tsx                ← wallet connect + Post Trade gate
    │   └── providers.tsx             ← dapp-kit + react-query setup
    ├── lib/
    │   ├── constants.ts              ← all addresses (reads from .env.local)
    │   ├── sui-client.ts             ← SuiJsonRpcClient + all PTB builders
    │   ├── predict-api.ts            ← DeepBook Predict Server REST client
    │   └── mock-data.ts              ← demo data (fallback when chain is empty)
    └── hooks/
        └── useProfiles.ts            ← React Query hooks for on-chain data
```

---

## Getting Started

```bash
cd D:\Projects\Echo\frontend

# 1. Install dependencies (already done, but if needed)
npm install

# 2. Set up env
cp .env.example .env.local
# .env.local is already filled in with the deployed addresses — nothing to change

# 3. Run dev server
npm run dev
# → http://localhost:3000
```

> **Note:** `.env.local` is gitignored. The `.env.example` file in the repo has all the right values — just copy it.

---

## Deployed Contracts (Sui Testnet)

All contracts were deployed on **June 18, 2026**. Do not redeploy unless something is broken.

| Name | Address |
|---|---|
| **Echo Package** | `0x74ddf6ea29b138db0f55db9aea82452ad80bbecf7d26bd05caa6095d05184125` |
| **ProfileRegistry** | `0xb846a650ce785b26f151ec79a074a80b1263a9b508c0d67af92f4b524ca49f24` |
| **Deploy Tx** | `34djymTgAwgwiMmaZrq5LHqACXL3uGNZbkywrpDFNy8Y` |

**DeepBook Predict (fixed, from mystenlabs):**

| Name | Address |
|---|---|
| Predict Package | `0xf5ea2b3749c65d6e56507cc35388719aadb28f9cab873696a2f8687f5c785138` |
| Predict Object | `0xc8736204d12f0a7277c86388a68bf8a194b0a14c5538ad13f22cbd8e2a38028a` |
| Registry | `0x43af14fed5480c20ff77e2263d5f794c35b9fab7e2212903127062f4fe2a6e64` |
| dUSDC Type | `0xe95040085976bfd54a1a07225cd46c8a2b4e8e2b6732f140a0fc49850ba73e1a::dusdc::DUSDC` |
| Predict Server | `https://predict-server.testnet.mystenlabs.com` |

---

## Smart Contracts — What Each Module Does

### `predictor_profile.move`
Tracks every predictor's on-chain stats. One `PredictorProfile` object per wallet, all IDs stored in the shared `ProfileRegistry`.

Key functions:
- `create_profile(registry, display_name, clock, ctx)` — creates a profile for the caller
- `record_settlement(profile, won, copy_earnings_cents, volume_cents, clock)` — called by copy_trade at settlement, updates win rate + streak
- `add_follower(profile)` — increments follower count

### `copy_trade.move`
The core 85/15 split enforcer. Creates an on-chain `CopyRecord` linking follower → predictor for each copy.

Key functions:
- `create_copy(registry, predictor_profile, oracle_id, strike, is_up, expiry_ms, amount_dusd, clock, ctx)` — records the copy link
- `settle_copy<DUSD>(copy_record, payout_coin, predictor_profile, clock, ctx)` — splits payout: 85% to follower, 15% to predictor

Events emitted:
- `CopyCreated { copy_record_id, follower, predictor, oracle_id, strike, is_up, expiry_ms, amount_dusd }`
- `CopySettled { copy_record_id, follower, predictor, won, gross_payout_dusd, follower_payout_dusd, predictor_cut_dusd }`

### `seal_signal.move`
Access-gated premium signals using Seal encryption. Predictors can lock their trade reasoning behind a fee wall.

Key functions:
- `create_policy(predictor_profile, blob_id, fee_dusd, ctx)` — creates a `SignalPolicy` for a Walrus blob
- `pay_signal_fee<DUSD>(policy, predictor_profile, payment, ctx)` — unlocks access for the payer
- `has_paid(policy, wallet): bool` — called by Seal key servers to decide whether to release the decryption key

---

## On-Chain Flow (Full End-to-End)

```
PREDICTOR                                   FOLLOWER
    │                                           │
    │  create_profile()                         │
    │  → PredictorProfile object created        │
    │  → ProfileCreated event emitted           │
    │                                           │
    │  Post Trade (PTB):                        │
    │  1. predict_manager::deposit(dUSDC)       │
    │  2. market_key::new(oracle, expiry,       │
    │        strike, is_up)                     │
    │  3. predict::mint(manager, key, qty)      │
    │     → position minted on DeepBook         │
    │                                           │
    │                                           │  Copy Trade (PTB):
    │                                           │  1. predict_manager::deposit(dUSDC)
    │                                           │  2. market_key::new(same params)
    │                                           │  3. predict::mint(...)
    │                                           │  4. copy_trade::create_copy(...)
    │                                           │     → CopyRecord object created
    │                                           │     → CopyCreated event emitted
    │                                           │
    │            ⏳ oracle expires               │
    │                                           │
    │                                           │  Settle (3-step PTB, follower signs):
    │                                           │  1. predict::redeem_permissionless(...)
    │                                           │     → payout credited to manager balance
    │                                           │  2. predict_manager::withdraw(amount)
    │                                           │     → Coin<DUSD> extracted
    │                                           │     (owner-only — follower signs)
    │                                           │  3. copy_trade::settle_copy(coin, ...)
    │◄──────────────────────────────────────────│     → 85/15 split enforced by Move
    │  +15% cut transferred automatically      │  +85% payout to follower wallet
    │  record_settlement() updates stats       │  CopySettled event emitted
```

**Why settle requires 3 steps:** `predict_manager::withdraw` has an owner-only check (`ctx.sender() == manager.owner()`), so the Echo contract can't pull funds automatically. The follower signs the whole PTB, authorizing the withdrawal and the split in one atomic transaction.

---

## Critical Import Note — @mysten/sui v2

The project uses `@mysten/sui@2.19.0`. The v2 API completely changed import paths:

```typescript
// ✅ CORRECT (v2)
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc"
import { Transaction } from "@mysten/sui/transactions"

// ❌ WRONG (v1 — will throw at runtime)
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client"
```

All client code already uses the correct imports. Don't change them.

---

## Frontend — What's Wired to Real On-Chain Data

| Page/Component | Data Source | Notes |
|---|---|---|
| Feed (`/`) | Live oracle sidebar: `fetchActiveOracles()` | DeepBook Predict Server |
| Feed — activity banner | `useCopyCreatedEvents(20)` | Real `CopyCreated` events |
| Leaderboard (`/leaderboard`) | `fetchAllProfiles()` via `ProfileCreated` events | Falls back to mock if 0 profiles |
| Portfolio (`/portfolio`) | `fetchFollowerCopies(wallet)` | Filters `CopyCreated` by connected wallet |
| Predictor profile (`/predictor/[address]`) | `fetchAllProfiles()` + `CopyCreated/Settled` events | Falls back to mock |
| Post Trade modal | `fetchActiveOracles()` → real expiry/strike | Signs PTB with wallet |
| Copy Trade modal | Reads user's dUSDC coins + PredictManager | Signs PTB with wallet |
| Create Profile | `buildCreateProfileTx()` | Auto-triggered on first "Post Trade" click |

**Mock fallback:** Every page that shows on-chain data falls back gracefully to demo data from `lib/mock-data.ts` when the chain has no data yet. Once dUSDC tokens arrive and real profiles are created, the live data appears automatically.

---

## PTB Builders — `lib/sui-client.ts`

All transaction builders return a `Transaction` object ready to pass to `useSignAndExecuteTransaction`.

```typescript
buildCreateProfileTx(displayName: string)
buildPostTradeTx({ oracleId, strike, isUp, expiryMs, quantity, managerObjectId, dusdCoinObjectId })
buildCreateCopyTx({ predictorProfileId, oracleId, strike, isUp, expiryMs, amountDusd, managerObjectId, dusdCoinObjectId })
buildSettleCopyTx({ copyRecordId, predictorProfileId, managerObjectId, oracleId, strike, isUp, expiryMs, quantity, payoutAmount })
buildCreateManagerTx()   // creates a PredictManager — one per wallet, needed before first mint
```

---

## What Still Needs Doing (Priority Order)

### P0 — Blocked on dUSDC tokens

We submitted a Tally form to request testnet dUSDC tokens. Once they arrive:

1. **Create PredictManager** for both demo wallets — call `buildCreateManagerTx()` from each wallet
2. **Create predictor profiles on-chain** — call `create_profile` from both wallets (or use the UI's "Post Trade" → "Create Profile" flow)
3. **Run the full end-to-end demo:**
   - Wallet A posts a trade (Post Trade modal)
   - Wallet B copies it (Copy button → Copy modal)
   - Wait for the oracle to expire
   - Wallet B settles (need to build a Settle UI — see below)
   - Verify on Suiscan: 85% went to B, 15% went to A, `CopySettled` event emitted

### P1 — Can be done now

4. **Settlement UI** — there's no frontend for `buildSettleCopyTx` yet. Need a "Settle" button in the portfolio page for expired positions. The PTB builder already exists in `sui-client.ts`, just needs a UI trigger.

5. **Walrus reasoning storage** — in `PostTradeModal`, after user types reasoning text, upload it to Walrus blob store before submitting the PTB. Store the returned `blob_id`. On feed cards, fetch and display it. Shows concrete Walrus usage to judges.

6. **Seal premium signal unlock** — `seal_signal.move` is deployed. Wire the `pay_signal_fee` transaction + Seal key fetch so followers can unlock encrypted reasoning blobs. All contract code exists, just needs the UI.

### Day 3 (June 20)

7. **Record demo video** — walk through: connect wallet → create profile → post trade → copy trade → settle → Suiscan verification
8. **Write submission description** — emphasize: tamper-proof stats, atomic 85/15 split, DeepBook Predict integration, Walrus + Seal usage

---

## Useful Links

- Suiscan (testnet): `https://suiscan.xyz/testnet`
- Echo package on Suiscan: `https://suiscan.xyz/testnet/object/0x74ddf6ea29b138db0f55db9aea82452ad80bbecf7d26bd05caa6095d05184125`
- Deploy tx: `https://suiscan.xyz/testnet/tx/34djymTgAwgwiMmaZrq5LHqACXL3uGNZbkywrpDFNy8Y`
- DeepBook Predict docs: `https://docs.deepbook.mystenlabs.com`
- Walrus testnet aggregator: `https://aggregator.walrus-testnet.walrus.space`
- dUSDC Tally request form: submitted, waiting for approval

---

## TypeScript Config Note

`tsconfig.json` target is `"ES2020"` — **do not downgrade to ES2017**. BigInt literals (`1_000_000n`) require ES2020 and are used throughout the codebase.
