# Echo — Social Copy-Trading on DeepBook Predict

> **Follow top predictors. Copy their trades in one tap. Earn 85% of the payout — split enforced by Move smart contract, zero middlemen.**

Built for **Sui Overflow 2026 · DeepBook Track**

Live on Sui Testnet · [suiscan.xyz](https://suiscan.xyz/testnet/object/0x7ac3de1b8ad5d43a7c04cbc22d3c84513d505a8f72d2573f3dfe7bb43d61e044)

---

## What Is Echo

Echo is the social layer for DeepBook Predict. It turns a raw binary prediction market into a two-sided marketplace where skilled traders earn passive income from their followers, and followers earn by mirroring proven strategies — all without trusting a single intermediary. Every trade, every payout split, every reputation stat lives on Sui.

The core mechanic is simple: a predictor opens a position on DeepBook Predict through Echo. That position appears in the public feed. A follower taps "Copy Trade", enters an amount, and signs one transaction. Echo atomically deposits into the follower's PredictManager, mints the identical position on DeepBook Predict, and writes a CopyRecord on-chain linking follower to predictor. When the market settles, the predictor receives 15% of the follower's payout — not because they ask for it, but because the Move contract computes and transfers it before the follower receives their 85%. There is no claiming step, no multisig, no admin.

---

## The Problem in Detail

### Prediction markets have a cold-start and discovery problem

DeepBook Predict is a technically strong prediction market infrastructure. It has accurate pricing via SVI volatility models, permissionless settlement, and composable position management through PredictManagers. What it does not have is a reason for a non-expert user to open the app and know what to do next.

A new user arrives. They see BTC/USD binary options with 15-minute expiries. There is no feed, no leaderboard, no signal. They either guess — which is gambling — or they leave. Most leave. This is not a DeepBook failure; it is the fundamental cold-start problem every prediction market faces. Without liquidity and participation, the market cannot mature.

### Skilled traders have no way to monetize their edge on-chain

There is a large population of on-chain traders who are genuinely good at directional calls. On centralized platforms like Binance Copy Trade or eToro, top traders earn a performance fee — typically 5–15% — from every follower position that wins. This creates a strong incentive for skilled traders to stay on platform and trade transparently.

On any existing on-chain prediction market, this incentive structure does not exist. A trader who calls BTC correctly 70% of the time earns only on their own capital. Their intelligence generates zero additional income. The result is that skilled traders either stay on centralized platforms where they can monetize, or they participate on-chain for themselves only, with no reason to be public or transparent.

### Followers have no verifiable signal to trust

Even if a predictor posts publicly — on Twitter, Telegram, or a Discord — there is no on-chain proof that they actually traded what they claimed. Signal providers can show screenshots. They can post after the fact. They can cherry-pick winners. The follower has no way to verify the track record without trusting the provider's own reporting.

This is why the prediction signal market is dominated by Telegram groups charging monthly fees with zero accountability. If the signal is wrong, the subscriber loses their trade and their subscription fee. The signal provider loses nothing. The incentive structure rewards confident-sounding signals, not accurate ones.

### Premium signal access has no enforcement mechanism

The highest-value predictor behavior is providing reasoning — not just the direction, but why. A predictor who explains their thesis (support level, macro event, technical pattern) helps followers learn and builds long-term trust. But sharing reasoning publicly means giving it away for free, which reduces the incentive to be thorough.

Paid reasoning channels exist but operate entirely off-chain. Payment happens through Telegram bots or PayPal. Access is revoked manually. There is no cryptographic link between the payment and the content. Echo solves this with SEAL — the encrypted reasoning is only mathematically decryptable by wallets that have paid the on-chain fee.

### The numbers behind the problem

Copy trading is not a niche. Binance Copy Trade launched in 2022 and reached millions of active followers within 18 months. eToro built its entire brand on social trading and has over 30 million registered users. The annual volume flowing through copy-trading products on centralized exchanges exceeds $2 billion. This is a proven product category with demonstrated user demand. None of it is on-chain. Echo is the first attempt to bring it to a decentralized prediction market.

---

## How Echo Solves It

### A public feed as the discovery layer

Every trade posted through Echo appears in a real-time feed. The feed shows the predictor's display name, their on-chain win rate, their current streak, their best streak, and the number of followers — all computed from settled CopyRecords, never self-reported. A follower can look at the feed and immediately understand who is performing, based on verifiable on-chain history.

The direction of each trade is hidden from non-posters. This is intentional. The feed is not a free signal service — it is a discovery layer. You can see that a predictor with a 68% win rate and a 7-trade streak just opened a position on BTC. You can see their strike price, their implied probability, their position size. To know the direction, you either copy the trade (and receive it atomically as part of the transaction) or pay the signal fee to decrypt it.

### On-chain reputation that cannot be faked

When a copy trade settles, the Move contract updates the predictor's `PredictorProfile` object in the same transaction. The `win_rate_bps` field is recomputed from `winning_trades / total_trades` using integer arithmetic with basis-point precision. The `current_streak` increments or resets. The `best_streak` updates if a new high is reached. The `copy_earnings_cents` accumulates.

Because this update happens inside `copy_trade::settle_copy` — the same function that enforces the 85/15 split — a predictor's stats are exactly as accurate as the settlement data. They cannot inflate their win rate by selectively settling. They cannot claim a streak they did not earn. The profile is a deterministic function of on-chain outcomes.

### One transaction to copy

The copy flow is designed to require exactly one wallet signature. When a follower clicks "Copy Trade" and confirms the amount, Echo builds a Programmable Transaction Block that does the following in a single atomic execution:

1. Splits the copy amount from the follower's dUSDC coin
2. Deposits the split coin into the follower's PredictManager (or creates the manager if it does not exist)
3. Calls `predict::mint` with the same oracle, strike, expiry, and direction as the predictor's trade — opening an identical position on DeepBook Predict
4. Calls `echo::copy_trade::create_copy` to write the CopyRecord shared object on-chain, linking the follower to the predictor with all trade parameters

If any step fails — insufficient balance, expired market, invalid strike — the entire PTB reverts. There is no partial state. The follower either has a live position and a CopyRecord, or nothing happened.

### The 85/15 split at settlement

Settlement uses a three-step PTB that the follower signs:

1. `predict::redeem_permissionless` — anyone can call this after expiry; it processes the oracle's settlement price and sends the payout to the follower's PredictManager balance
2. `predict_manager::withdraw` — the follower (as owner) withdraws the payout coin from their manager
3. `echo::copy_trade::settle_copy` — receives the raw payout coin, computes `predictor_cut = payout * 1500 / 10000` and `follower_payout = payout - predictor_cut`, transfers both immediately, updates the predictor's profile stats, and marks the CopyRecord as settled

The predictor does not need to be online. They do not need to claim anything. The transfer happens inside the settlement call. The CopyRecord stores the gross payout, follower payout, and predictor cut permanently on-chain — a full auditable trail.

---

## Why Echo Is Better Than What Exists

### vs. Telegram signal groups

Telegram signal groups are the dominant form of prediction signal distribution today. They charge $50–$500/month, claim extraordinary win rates, and provide zero verifiability. The provider has no skin in the game — they are not required to trade what they signal. Echo predictors must open a real position on DeepBook Predict before their signal appears in the feed. The trade is on-chain. The outcome is on-chain. The track record is on-chain. If a predictor with a 68% win rate in Echo signals UP, that 68% came from real settled positions, not curated screenshots.

### vs. Binance Copy Trade and eToro

These platforms have the right product concept — social copy-trading works, and users want it. But the execution is entirely centralized. The platform holds all funds. The platform computes the payout split. The platform can change the fee structure, freeze accounts, or delist traders without notice. The copy-trader's earnings depend on whether the platform processes the payment correctly and whether the platform remains solvent.

Echo's 85/15 split is not a platform policy. It is a constant in the Move bytecode: `const PREDICTOR_BPS: u64 = 1500`. It cannot be changed without a new contract deployment. Every user interacts directly with Sui — Echo's frontend is a UI convenience, not a custodian. If the Echo website goes offline, users can still settle their positions directly through the contracts.

### vs. Polymarket and other on-chain prediction markets

Polymarket is the largest on-chain prediction market by volume. It has no copy-trading feature, no social layer, no reputation system, and no mechanism for traders to earn from followers. Every user is individual. Polymarket also runs on an optimistic rollup with centralized price resolution for most markets, which introduces trust assumptions that do not exist in DeepBook Predict's oracle model.

### vs. doing nothing / trading alone

The alternative for a skilled predictor on any prediction market is to trade with their own capital only. Their edge is entirely self-contained. With Echo, a predictor who trades 5 dUSDC per position and attracts 20 followers each copying 5 dUSDC earns 15% of 100 dUSDC at settlement — tripling what their own position pays on a win. The more consistently they perform, the more followers accumulate, the more their on-chain reputation compounds. Echo makes skill financially scalable without any additional effort from the predictor.

---

## DeepBook Predict Integration — In Depth

DeepBook Predict is not just a dependency — it is the execution layer that makes Echo possible. Echo does not run its own matching engine, does not hold user funds, and does not compute settlement prices. All of that lives in DeepBook Predict. Echo's Move contracts are a thin but critical social layer on top.

### Market structure

Each DeepBook Predict market is identified by an oracle that tracks an underlying asset (currently BTC/USD). The oracle publishes a spot price, a forward price, and SVI (Stochastic Volatility Inspired) volatility parameters. These parameters allow the protocol to price binary options using a volatility surface model that accounts for time to expiry, moneyness, and market skew — far more sophisticated than flat probability pricing.

Echo reads oracle data in real-time from the Predict Server REST API at `https://predict-server.testnet.mystenlabs.com`. Specifically it uses:

- `/predicts/:id/oracles` — lists all active oracles with their status, expiry, min strike, and tick size
- `/oracles/:id/svi/latest` — returns the current SVI parameters (a, b, rho, m, sigma) and forward price
- `/oracles/:id/prices/latest` — returns spot and forward price
- `/positions/minted` — returns all minted positions across all traders (Echo's social feed data source)
- `/managers/:id/positions` — returns a wallet's own open and redeemed positions (Echo's portfolio data source)

The implied probability shown on each feed card is computed client-side using the SVI parameters. This is not an approximation — it uses the actual normal CDF of the log-moneyness divided by the implied vol, the same model DeepBook Predict uses internally for pricing.

### How a copy is constructed

When a predictor posts a trade, they select an oracle, a strike price, and an expiry. The strike must align to the oracle's tick size. The expiry must match an available oracle expiry. Echo validates both constraints before building the transaction.

The `MarketKey` that identifies a position is:
```
market_key::new(oracle_id, expiry_ms, strike_price_in_9_decimal_fixed_point, is_up: bool)
```

When a follower copies, Echo reuses the exact same `oracle_id`, `expiry_ms`, `strike`, and `is_up` from the predictor's on-chain position — fetched from the Predict Server. This means the follower opens an identical position at the same strike, same expiry, same direction. The only difference is the quantity (the follower chooses their own size) and the cost (determined by the current ask price at the time of copying, which may differ slightly from when the predictor opened).

### Settlement without permission

`predict::redeem_permissionless` is a critical design feature of DeepBook Predict that Echo relies on heavily. After expiry, any wallet can call this function to trigger settlement of any position. It reads the oracle's settlement price, determines the outcome, and credits the payout to the position owner's PredictManager.

This means Echo's settlement button in the portfolio page can be triggered by the follower, the predictor, or any third party. There is no settlement gatekeeper. If a predictor disappears and never settles, the follower can settle their own copy position independently. Echo's `settle_copy` function then handles the 85/15 split.

### On-chain position indexing

Echo's feed filters the full `/positions/minted` response to only show trades from wallets that have a `PredictorProfile` in the Echo registry. This creates a curated feed of traders who have opted into the Echo social layer. Predictors who just use DeepBook Predict directly do not appear in the feed. This is by design — the Echo registry is the curation mechanism, and a profile represents a commitment to being a public, accountable trader.

---

## SEAL Integration — Encrypted Premium Signals

SEAL (Secure Encryption with Access on Locks) is a Mysten Labs primitive that provides threshold encryption with on-chain access control. It allows data to be encrypted such that decryption requires a key, and the key is only released by the SEAL key server if an on-chain condition is satisfied — in Echo's case, that the requester's wallet address is in the `SignalPolicy.paid_wallets` set.

### Why SEAL and not a simple paywall

A naive premium signal implementation would store the reasoning in a database, take payment on-chain, and then serve the content via an API after verifying the payment. This introduces a centralized server that holds the content, can be taken down, can be censored, and breaks the trustless model. It also means the predictor trusts Echo to handle payments correctly.

With SEAL, there is no server that holds the plaintext. The encrypted ciphertext is uploaded to Walrus (decentralized). The SEAL key server holds the decryption key but will only release it after simulating the `seal_approve` call on-chain and confirming the requester is in `paid_wallets`. The predictor does not trust Echo. The follower does not trust Echo. Both trust the on-chain state, which neither party controls.

### The full signal lifecycle

**Posting a premium signal:**
1. Predictor writes their reasoning and direction in the Post Trade modal
2. The frontend calls `@mysten/seal`'s `SealClient.encrypt()` with a randomly generated `sealId` (32 bytes of policy object ID + 5 bytes of nonce) — this produces encrypted bytes
3. The encrypted bytes are uploaded to Walrus via `PUT /v1/blobs` — the blob is content-addressed and returns a `blobId`
4. The predictor calls `seal_signal::create_policy(blob_id, fee_dusd)` which creates a `SignalPolicy` shared object on Sui with the `blobId`, the fee, and an empty `paid_wallets` set

**Unlocking a signal:**
1. A follower visits the trade detail page — Echo queries `fetchSignalPolicies(predictor_address)` which reads `PolicyCreated` events from the chain to find the policy associated with this predictor
2. The follower clicks "Unlock Signal · X dUSDC" — Echo builds a transaction calling `seal_signal::pay_signal_fee(policy, payment_coin)` which adds the follower's address to `paid_wallets` and credits the predictor's `signal_earnings_cents`
3. After payment confirms, Echo calls `SealClient.decrypt()` — internally, the SEAL SDK creates a short-lived `SessionKey` (proves identity to key server), signs it with the follower's wallet, downloads the encrypted blob from Walrus, builds a `seal_approve` PTB, and sends it to the SEAL key server for simulation
4. The key server simulates the PTB — it reads the on-chain `SignalPolicy` and checks `vec_set::contains(&policy.paid_wallets, &follower_address)`. If true, it releases the threshold decryption key fragment
5. The SEAL SDK decrypts the bytes locally in the browser — the plaintext never touches any server
6. The decrypted JSON `{ direction: "UP", reasoning: "..." }` is rendered on screen

### What SEAL enables for Echo's business model

Without SEAL, predictor monetization is binary: either share the signal for free (no income) or withhold it completely (no trust-building). SEAL creates a third option: share the signal on a per-wallet basis with cryptographic enforcement. A predictor who has a 70% win rate and wants to monetize can charge 1 dUSDC per signal and attract 50 buyers — earning 50 dUSDC from signals alone, on top of their 15% copy cut. Every dUSDC of signal earnings is visible in `PredictorProfile.signal_earnings_cents`, making signal income transparent and verifiable.

---

## Walrus Integration — Decentralized Reasoning Storage

Walrus is Sui's decentralized blob storage layer. Echo uses it to store all trade reasoning content, both encrypted premium signals and free plain-text explanations.

### Why not IPFS, Arweave, or a database

IPFS requires a pinning service to keep content available. Content can become unavailable if no node pins it. Arweave is permanent but not native to Sui — a cross-chain bridge adds latency and complexity. A centralized database is the obvious footgun: if Echo's backend goes down, all reasoning content disappears.

Walrus blobs are stored with erasure coding across a decentralized storage network. A blob uploaded with `epochs=5` is guaranteed to be retrievable for 5 epochs. Retrieval is via a simple HTTP `GET /v1/blobs/:blobId` against any aggregator. Echo uses both Mysten's official aggregator and the community aggregator with a random selection for load balancing. The `blobId` is content-addressed — it is derived from the blob's content, so a retrieved blob can be verified by the recipient without trusting the aggregator.

Critically, Walrus is native to Sui's ecosystem. The SEAL key server is designed to work with Walrus-stored encrypted blobs. There is no additional integration layer — the `blobId` returned by Walrus is the same identifier stored in the `SignalPolicy` object on Sui.

### What gets stored on Walrus

**Free signals** — when a predictor posts with reasoning but no signal fee, the frontend uploads `JSON.stringify({ direction: "UP", reasoning: "BTC holding the 200-day MA, expecting a bounce into expiry." })` as plain text. The `blobId` is stored in the post-trade modal's response. Any viewer can fetch it directly from Walrus.

**Premium signals** — same JSON content, but encrypted with SEAL before upload. The bytes uploaded to Walrus are the SEAL `encryptedObject` output — a binary blob that contains the encrypted content and the sealId embedded in its header. The `blobId` is stored both in localStorage on the poster's device and in the on-chain `SignalPolicy`.

---

## Move Smart Contracts — Architecture in Detail

Echo's three Move modules are deployed as a single package. They share internal types through module imports — `copy_trade` depends on `predictor_profile` for reading and updating stats, and `seal_signal` depends on `predictor_profile` for crediting signal earnings.

### `echo::predictor_profile`

This module defines two key objects:

`ProfileRegistry` is a singleton shared object created at package init. It contains a `Table<address, ID>` mapping each predictor's wallet address to their `PredictorProfile` object ID. The registry is the source of truth for "is this wallet an Echo predictor". Echo's feed filters on this: only wallets present in the registry appear in the social feed.

`PredictorProfile` is a per-predictor shared object (readable by anyone, writable only by other Echo modules). It tracks: `total_trades`, `winning_trades`, `win_rate_bps` (computed as `winning_trades * 10000 / total_trades`), `total_volume_cents`, `copy_earnings_cents` (earnings from followers), `signal_earnings_cents` (earnings from SEAL signals), `current_streak`, `best_streak`, `follower_count`, `created_at_ms`, and `last_trade_at_ms`.

The `record_settlement` function on this module is `public(package)` — it can only be called by other Echo modules in the same package. Specifically `copy_trade::settle_copy` calls it after computing the payout split. This enforces the invariant that profile stats are only updated via real settlements.

### `echo::copy_trade`

This is Echo's core module. The `CopyRecord` shared object it creates contains the full audit trail: which follower copied which predictor, on which oracle, at which strike, in which direction, for which expiry, how much they put in, when they copied, and after settlement: whether they won, the gross payout, the follower's 85%, and the predictor's 15%.

`create_copy` validates several constraints before writing the record:
- Follower cannot be the predictor (`ECopyingOwnTrade`)
- Amount must be at least 1 dUSDC (`EMinimumAmount`)
- The predictor address in the call must match the profile's wallet (`EWrongPredictor`)

`settle_copy` receives the raw payout `Coin<T>`, splits it using `coin::split`, and calls `coin::keep` (which transfers to the recipient) on both parts. It then calls `predictor_profile::record_settlement` to update all stats atomically. The `CopyRecord` is marked `settled = true` and `won = true/false` based on whether the gross payout is non-zero (DeepBook Predict returns 0 on a loss).

### `echo::seal_signal`

`SignalPolicy` is the on-chain representation of a premium signal paywall. It contains the `blob_id` (bytes of the Walrus blob ID), the `fee_dusd` required to unlock, a `VecSet<address>` of wallets that have paid, and the running `total_collected_dusd`.

`seal_approve` is the function the SEAL key server calls (via simulation) to check access. Its signature matches what the SEAL SDK expects:
```move
public fun seal_approve(id: vector<u8>, policy: &SignalPolicy, ctx: &TxContext)
```
It checks `vec_set::contains(&policy.paid_wallets, &ctx.sender())` and aborts if not present. If the simulation passes, the SEAL key server releases the decryption key fragment.

`pay_signal_fee` splits the fee coin, transfers the fee to the predictor's wallet directly (not held by the contract — no custody), adds the caller to `paid_wallets`, updates `total_collected_dusd`, calls `predictor_profile::record_signal_payment` to update `signal_earnings_cents`, and emits a `SignalUnlocked` event.

---

## Frontend Architecture

The Echo frontend is a Next.js 15 App Router application with `"use client"` boundaries at the component level. Server components handle static layout; all on-chain interaction happens in client components.

**Wallet integration** uses `@mysten/dapp-kit`'s `ConnectButton` and hooks (`useCurrentAccount`, `useSignAndExecuteTransaction`, `useSignPersonalMessage`). The app wraps in `SuiClientProvider` and `WalletProvider` with the `QueryClientProvider` for caching.

**Data fetching** uses `@tanstack/react-query` with two data sources:
- The DeepBook Predict REST API (positions, oracles, prices) — stale time 15–60 seconds, with automatic background refetch
- Sui RPC via `SuiJsonRpcClient` (profiles, copy records, signal policies) — fetched via event queries and `multiGetObjects`

**Transaction building** happens entirely client-side using `@mysten/sui/transactions`. Echo constructs PTBs in TypeScript using `Transaction` from `@mysten/sui/transactions`, passes them to `useSignAndExecuteTransaction`, and handles success/failure states in component-local React state.

**Key pages:**
- `/feed` — live feed of Echo predictor trades with trust stats, direction hidden for non-posters, clickable cards navigating to `/trade/:digest`
- `/leaderboard` — ranked by win rate (minimum 5 trades), showing streak, volume, copy earnings
- `/portfolio` — user's own trades (minted positions) and copy trades (from CopyCreated events), with settlement buttons and a DonutChart win/loss ratio
- `/trade/:digest` — trade detail page with TradingView BTCUSDT chart, full trade metadata, copy provenance (who you copied, when, how much), settlement outcome, and SEAL unlock for premium signals
- `/predictor/:address` — predictor profile page with their full trade history and on-chain stats
- `/start` — Echo onboarding: connect wallet → create profile → fund with dUSDC → start trading or copying

---

## Deployed Contracts

### Echo — Sui Testnet

| | |
|---|---|
| **Package ID** | `0x7ac3de1b8ad5d43a7c04cbc22d3c84513d505a8f72d2573f3dfe7bb43d61e044` |
| **ProfileRegistry** | `0x664964fac428df569c42b4b0c415ca867ddf80efda47b625707e05551d240b43` |
| **Modules** | `echo::predictor_profile` · `echo::copy_trade` · `echo::seal_signal` |

### DeepBook Predict — Sui Testnet

| | |
|---|---|
| **Package** | `0xf5ea2b3749c65d6e56507cc35388719aadb28f9cab873696a2f8687f5c785138` |
| **Predict Object** | `0xc8736204d12f0a7277c86388a68bf8a194b0a14c5538ad13f22cbd8e2a38028a` |
| **Registry** | `0x43af14fed5480c20ff77e2263d5f794c35b9fab7e2212903127062f4fe2a6e64` |
| **dUSDC Coin Type** | `0xe95040085976bfd54a1a07225cd46c8a2b4e8e2b6732f140a0fc49850ba73e1a::dusdc::DUSDC` |
| **Predict Server** | `https://predict-server.testnet.mystenlabs.com` |

### SEAL — Sui Testnet

| | |
|---|---|
| **Key Server Object** | `0xb012378c9f3799fb5b1a7083da74a4069e3c3f1c93de0b27212a5799ce1e1e98` |
| **Aggregator** | `https://seal-aggregator-testnet.mystenlabs.com` |

### Walrus — Testnet

| | |
|---|---|
| **Aggregator** | `https://aggregator.walrus-testnet.walrus.space` |
| **Publisher** | `https://publisher.walrus-testnet.walrus.space` |

---

## Running Locally

```bash
git clone https://github.com/Rohitamalraj/Echo
cd Echo/web
npm install
npm run dev
# → http://localhost:3000
```

All contract addresses have hardcoded fallback values in `web/lib/constants.ts` so the app works out of the box on Sui Testnet without any environment configuration. To override any address, copy `.env.example` to `.env.local`.

To get testnet dUSDC for trading, use the DeepBook Predict testnet faucet. You need dUSDC in your wallet to post trades, copy trades, or pay signal fees.

---

## Demo Flow

**Wallet A — Predictor**

1. Open Echo → `/start` → create profile (e.g. "Alice") — writes `PredictorProfile` to Sui
2. `/feed` → "Post Trade" button → select BTC oracle, set strike near current price, choose UP or DOWN, set expiry (10–60 min), enter size (e.g. 5 dUSDC)
3. Optionally write reasoning and toggle "Premium Signal" with a fee (e.g. 0.5 dUSDC) — this triggers SEAL encryption + Walrus upload before the trade transaction
4. Confirm transaction — position opens on DeepBook Predict, appears in the Echo feed immediately

**Wallet B — Follower**

1. Open `/feed` → see Alice's trade card with stats (new predictor shows "no settled trades yet"), direction badge shows "🔒 Hidden"
2. Click the card → trade detail page at `/trade/:digest`
3. See TradingView BTCUSDT live chart, strike price reference, Alice's predictor stats
4. If Alice attached a premium signal: "Unlock Signal · 0.5 dUSDC" button appears — click to pay on-chain → SEAL decrypts direction and reasoning locally → displayed in a purple "Signal Unlocked" card
5. Click "Copy Trade" → modal opens (direction still hidden pre-copy) → enter 2 dUSDC → "Confirm Copy Trade" → sign one transaction
6. Success screen reveals direction — CopyRecord is now live on-chain

**Settlement (either wallet, after expiry)**

1. `/portfolio` → find the copy position under "Copy Trades" → "Settle" button
2. Single PTB: `redeem_permissionless` → `withdraw` → `settle_copy` (85/15 split)
3. Alice receives 15% of Wallet B's gross payout automatically
4. CopyRecord marked settled, Alice's `copy_earnings_cents` updated, streak updated

---

## What Is Novel

**First social copy-trading layer on any on-chain prediction market.** Copy trading is a proven, high-volume product on centralized exchanges. It has never been implemented on-chain, on a prediction market, in a trustless way. Echo is the first.

**Payout split enforced by bytecode, not agreement.** The 85/15 split is a constant in the Move module. It applies to every copy trade in every settlement, without exception. There is no way to route around it, no admin that can change it post-deployment, and no trust required from either party.

**Skin-in-the-game premium signals.** On every other signal platform, the provider can post signals without trading them. On Echo, you cannot attach a signal to a trade that does not exist. The predictor must have opened a real position before the signal is published. Their on-chain win rate is updated based on whether that real position won or lost. The signal fee they earn is contingent on actually having traded. This is a structural accountability mechanism that does not exist anywhere else.

**On-chain reputation as a composable primitive.** `PredictorProfile` is a shared Sui object. Any other protocol on Sui can read a predictor's `win_rate_bps`, `best_streak`, or `copy_earnings_cents` directly from the object. Echo's reputation data is not locked into Echo — it is a public on-chain primitive that DeFi composability can build on.

**Zero-custody architecture end-to-end.** Echo never holds user funds. There is no Echo wallet, no escrow, no multisig. Funds flow directly from the follower's wallet through their PredictManager (a DeepBook Predict primitive the user owns) into the position. At settlement, funds flow from the PredictManager directly to both wallets in the same PTB. The Echo contracts are pure logic with no balance.

---

*Sui Overflow 2026 · DeepBook Track · Built by Rohit Amalraj*
