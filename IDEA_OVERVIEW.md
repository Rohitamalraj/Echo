# Echo — Idea Overview

**Hackathon:** Sui Overflow 2026 — DeepBook Track  
**Project Name:** Echo  
**Category:** Social Copy-Trading on Prediction Markets  

---

## Why This Doesn't Exist Yet — And Why It's Unique

### What Already Exists (The Competition)

| Platform | What It Does | What It Lacks |
|---|---|---|
| FrenFlow (Polymarket) | Copy-trading on Polymarket/Kalshi | Off-chain, centralized, not on Sui, no smart contract payout split |
| Bitget / Bybit Copy Trading | Copy perps/spot trades on CEX | Fully centralized, no on-chain settlement, no prediction markets |
| Polymarket Leaderboards | Shows top traders | No copy button, no earnings for traders being copied |
| DeepBook Predict | The raw protocol | Zero social layer, zero copy trading, zero trader profiles |

### Why Echo Doesn't Exist

**1. Nobody has built a social layer on DeepBook Predict yet.**  
DeepBook Predict just launched on testnet in May 2026. The protocol is brand new. There is no product on top of it — no leaderboard, no profiles, no copy trading. Echo would be literally the first.

**2. On-chain payout split is the key difference.**  
Every existing copy-trading product (FrenFlow, Bybit, Bitget) is handled off-chain by a company. The fee share goes through a centralized server. Echo does it inside a Move smart contract — when the trade settles, the split happens automatically with zero trust and zero middleman. That has never been done on a prediction market on Sui.

**3. Seal-gated signal access is completely new.**  
No prediction market anywhere — not Polymarket, Kalshi, Hyperliquid — lets traders encrypt and sell their reasoning with on-chain access control. Echo would be the first to combine Seal's programmable encryption with a prediction market social feed.

**4. Verified on-chain track records.**  
On Polymarket you can screenshot your wins and fake your history. On Echo, every trade, every result, every win rate is stored on-chain and cannot be faked. This is a trust primitive that doesn't exist today.

### The Unique Combination Nobody Has

```
DeepBook Predict  ←  brand new protocol, no social layer
      +
On-chain payout split  ←  smart contract enforced, no trust needed
      +
Seal-encrypted signals  ←  first on any prediction market
      +
Verified track records  ←  unfakeable, fully on-chain
```

Each of these exists separately somewhere. Nobody has combined all four on a prediction market on Sui. That's the gap Echo fills.

---

## Executive Summary

Echo is a **social copy-trading platform** built natively on DeepBook Predict — Sui's brand-new on-chain binary and range prediction market protocol. It lets experienced traders post prediction trades publicly, build a verified on-chain track record, and earn automatic revenue-sharing when followers copy their calls. Followers get one-tap access to the strategies of proven traders without needing to understand options pricing or volatility surfaces.

The platform combines three Sui-native primitives — **DeepBook Predict** (trade execution + settlement), **Seal** (encrypted premium signal gating), and **Walrus** (decentralized storage for trade reasoning logs) — in a way that has never been built before on any prediction market anywhere.

---

## 1. The Problem

### 1.1 Prediction Markets Are Broken For Retail Users

Prediction markets like Polymarket and Kalshi have proven that markets can price the future accurately — but they have a fatal user experience problem. Research across major platforms consistently identifies the same pain points:

**Too complex for 90% of users.** Order book depth charts, odds calculations, and binary strike pricing impose a steep cognitive barrier on average retail participants. Most users rely on intuitive judgment, not quantitative models.

**No social layer, no shared intelligence.** Existing markets are fundamentally single-player games — users bet in isolation, without satisfying the human need for shared conviction, bragging rights, or collective debate. This makes organic virality impossible and forces platforms to rely entirely on paid user acquisition.

**Unfair value distribution.** Current reward mechanisms tie payouts entirely to trade volume, neglecting core contributions like prediction accuracy. Rational predictors who are actually right get the same deal as random noise traders. There is no mechanism for skilled traders to monetize their edge beyond their own capital.

**Good traders have no incentive to share.** The best traders on Polymarket, Kalshi, and Hyperliquid keep their strategies private — not because they want to, but because there is no economic incentive to share. No platform pays traders for the followers they attract or the value they create for the community.

**No verifiable track records.** Any trader can screenshot wins and hide losses. There is no on-chain, unfakeable performance history. Followers have no trustworthy signal to decide whom to copy.

### 1.2 DeepBook Predict Has No Social or Accessibility Layer

DeepBook Predict launched on Sui testnet in May 2026 as the most technically advanced on-chain prediction protocol built — with SVI volatility surface pricing, sub-hour rolling BTC expiries, institutional-grade Black-Scholes oracle, and a shared liquidity vault. But it launches into the same problem all prediction protocols face: it is a protocol, not a product. It has no trader profiles, no leaderboards, no copy trading, and no mechanism to bring in users who don't already understand implied volatility.

The result is a technically excellent primitive with no accessible front door.

---

## 2. Why This Matters — Market Size & Opportunity

### 2.1 The Copy Trading Market Is Exploding

The global copy trading and social trading platform market is valued at **$2.09–$2.82 billion in 2026**, projected to reach **$10.5 billion by 2034** at a 22.4% CAGR. Over **10–20 million users** worldwide currently use copy trading products across platforms like Bitget, Bybit, eToro, and BingX.

This is entirely a CEX-dominated market. No on-chain, decentralized copy-trading product exists on a prediction market. The entire market value sits in centralized custody — waiting to be unlocked on-chain.

### 2.2 Prediction Market Volume Is Surging

- Prediction markets crossed **$5.9 billion in weekly trading volume** in early 2026, with AI agents and professional traders driving the majority of activity
- Intercontinental Exchange (owner of NYSE) committed up to **$2 billion** toward Polymarket
- CME Group launched swap-based event contracts with 24/7 trading
- Prediction markets are transitioning from niche crypto speculation into mainstream financial infrastructure

### 2.3 The Viral Flywheel Nobody Has Cracked

The single biggest unsolved problem in prediction markets is the **cold start / liquidity fragmentation loop**:

```
No traders → Unreliable prices → No new traders → Market dies
```

Echo breaks this loop. When a top trader posts a position, their followers immediately provide liquidity and volume depth behind that trade — turning a single high-conviction call into a coordinated market signal. This is the organic viral growth engine that no prediction market has built yet.

---

## 3. The Solution — Echo

### 3.1 Core Concept

Echo is a **two-sided social trading marketplace** built on top of DeepBook Predict:

- **Predictors (Traders):** Post trades publicly with reasoning, build a verified on-chain profile, earn automatic revenue sharing from followers' winnings
- **Followers (Everyone else):** Browse a leaderboard of verified traders, one-tap copy a trade, win alongside proven predictors

All payout splits are enforced by a Move smart contract — no trust, no middleman, fully on-chain and transparent.

### 3.2 How It Works — User Flows

**For a Predictor:**

1. Connect wallet → create on-chain Predictor Profile
2. Browse DeepBook Predict markets (BTC binary UP/DOWN, or range)
3. Place trade + optionally write reasoning (public or Seal-encrypted premium)
4. Trade is broadcast to the Echo social feed
5. At settlement: receive own payout + automatic **15% cut of all follower winnings**

**For a Follower:**

1. Connect wallet → browse Leaderboard (sortable by win rate, ROI, streak, recent performance)
2. Click a predictor → see their full verified track record + open positions
3. Tap "Copy Trade" → set copy amount → transaction goes on-chain
4. At settlement: receive own payout (**85%**) automatically; predictor receives 15% cut

**The Payout Split (Move Smart Contract):**

```
Follower Position Wins 100 dUSDC
    ├── 85 dUSDC → Follower wallet (auto)
    └── 15 dUSDC → Predictor wallet (auto)

No admin key. No withdrawal request. Settled at expiry in one PTB.
```

### 3.3 The Seal Premium Signal Layer

Top predictors can optionally encrypt their trade reasoning using Seal — Sui's programmable on-chain encryption layer:

- **Free tier:** Followers see the trade direction, strike, and expiry — but NOT the reasoning
- **Premium tier:** Pay a small dUSDC fee to decrypt and read the predictor's full analysis before deciding to copy
- **Seal access policy:** "decrypt if wallet has paid the signal fee for this trade"
- Predictor earns signal fees passively, even from non-copying viewers

This creates a **two-revenue-stream model** for top traders: copy-trade revenue sharing + signal subscription income.

---

## 4. Why Echo Is Better Than Existing Solutions

| Feature | Polymarket / Kalshi | FrenFlow | Bybit / Bitget Copy Trading | Echo |
|---|---|---|---|---|
| Copy trading | None | Manual copy | Auto-copy (perps/spot) | Auto-copy (prediction markets) |
| Payout split to traders | None | Fee-based, off-chain | Platform-paid | Smart contract enforced, on-chain |
| Verified track records | Screenshot only | Platform database | CEX internal | Unfakeable, fully on-chain |
| Censorship-resistant | Centralized | Centralized | Centralized | Non-custodial, Move contracts |
| Encrypted premium signals | None anywhere | None | None | Seal-gated signal access (world first) |
| Built on prediction markets | Yes | Polymarket only | No (spot/perps only) | DeepBook Predict — on Sui |
| On-chain settlement | USDC bridged | Off-chain payout | CEX custody | Full on-chain settlement |
| Self-custody | No | No | No | Yes |

**The fundamental differentiator:** every competitor either does social trading OR on-chain prediction markets — nobody does both together on a non-custodial smart contract with verified track records and encrypted signals.

---

## 5. Sui Toolset — How We Use Each Primitive

### 5.1 DeepBook Predict (Core Trading Layer)

Every trade on Echo executes directly against DeepBook Predict's protocol:

- `predict::mint` — Creates a binary (UP/DOWN) or vertical range position in the user's PredictManager
- `predict::redeem` / `predict::redeem_permissionless` — Settles position at expiry, triggers payout split
- **OracleSVI** — Reads live implied volatility surface to display market-priced probabilities on the UI
- **Vault / PLP** — Optionally exposed in analytics view for LP-aware followers
- **Public Predict Server** (`predict-server.testnet.mystenlabs.com`) — Feeds all market data, portfolio summaries, PnL history, and oracle status to the frontend without raw chain scanning

### 5.2 Seal (Encrypted Signal Gating)

Seal is Sui's programmable on-chain encryption layer — it lets developers define access policies for encrypted data stored on decentralized storage:

- **Use case:** Predictor writes trade reasoning → encrypted with Seal → stored on Walrus
- **Access policy written in Move:** "This data can only be decrypted by wallets that have paid the signal fee for trade ID X"
- **Decryption flow:** Follower pays fee → on-chain policy evaluates → Seal key servers release decryption key → follower reads reasoning
- **What this prevents:** No platform admin, no centralized server — Seal enforces access at the cryptographic layer

### 5.3 Walrus (Decentralized Storage)

Walrus stores all trade reasoning blobs (both public and Seal-encrypted):

- **Public reasoning:** stored unencrypted, permanent, content-addressed
- **Premium reasoning:** stored as Seal-encrypted blob, accessible only via on-chain policy
- **Trade history logs:** stored per predictor wallet for full auditability

### 5.4 Sui Move Contracts (Payout Split + Profile Registry)

Two core Move modules:

**`predictor_profile` module:**
- Stores predictor stats on-chain: win rate, total trades, total followers, ROI, streak
- Updated automatically on every trade settlement
- Immutable history — no predictor can edit or delete past results

**`copy_trade` module:**
- Links a follower's position to a predictor's position at mint time
- At `predict::redeem` call, intercepts settlement and routes 85% to follower, 15% to predictor
- Written as a PTB (Programmable Transaction Block) wrapper around Predict's native flows

### 5.5 Sui dApp Kit + @mysten/seal SDK (Frontend)

- `@mysten/dapp-kit` — wallet connection, transaction signing, on-chain reads
- `@mysten/seal` — client-side encryption/decryption for signal premium tier
- `@mysten/walrus` — blob storage uploads/reads for reasoning content
- **Predict server REST API** — market data, oracle feeds, portfolio, settlement history

---

## 6. Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                        │
│  Social Feed | Leaderboard | Trade Card | Copy Modal | PnL  │
└──────────────────────┬──────────────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          │                         │
┌─────────▼────────┐    ┌──────────▼──────────────┐
│  Predict Server  │    │   Sui RPC / dApp Kit     │
│  (REST API)      │    │   On-chain reads          │
│  - Markets       │    │   - Predictor profiles    │
│  - Oracle SVI    │    │   - Copy trade state      │
│  - Portfolio     │    │   - PLP vault state       │
│  - History       │    └──────────────────────────┘
└──────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                   SUI MOVE CONTRACTS                         │
│                                                              │
│  ┌─────────────────┐    ┌──────────────────────────────┐    │
│  │predictor_profile│    │      copy_trade module        │    │
│  │- win_rate       │    │- links follower → predictor   │    │
│  │- total_trades   │    │- intercepts redeem payout     │    │
│  │- roi_bps        │    │- 85% follower / 15% predictor │    │
│  │- streak         │    │- single PTB execution         │    │
│  └─────────────────┘    └──────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              DEEPBOOK PREDICT PROTOCOL (testnet)             │
│  predict::mint | predict::redeem | OracleSVI | Vault/PLP    │
└──────────────────────────────────────────────────────────────┘
                       │
         ┌─────────────┴───────────────┐
         │                             │
┌────────▼────────┐         ┌──────────▼──────────┐
│      SEAL        │         │       WALRUS         │
│ Encrypt signal   │         │ Store reasoning blobs│
│ Access policy:   │         │ Public + encrypted   │
│ "paid fee → key" │         │ content-addressed    │
└─────────────────┘         └─────────────────────┘
```

---

## 7. Revenue Model & Incentive Design

### For Predictors
- **15% cut of follower winnings** — paid automatically by smart contract at settlement
- **Signal fees** — earn dUSDC every time a follower pays to unlock Seal-encrypted reasoning
- No platform fee taken from own trades

### For Followers
- Access proven strategies without needing options/vol surface knowledge
- Pay only when they win (15% cut taken from winnings, not from capital)
- Build their own track record over time → eventually become predictors

### For Liquidity
- Copy trades add coordinated volume behind a single trade call, deepening market liquidity for that expiry/strike
- Directly addresses DeepBook Predict's cold-start problem at mainnet launch

---

## 8. What Needs to Be Built

### Smart Contracts (Move)
- `predictor_profile` — on-chain stats registry
- `copy_trade` — PTB wrapper linking follower → predictor with payout split
- `seal_signal` — access policy module: "decrypt if signal fee paid"

### Backend / Integration
- Predict server API integration (markets, oracle, portfolio, history)
- Sui event listener — update predictor profile stats on settlement
- Walrus blob upload/read service for reasoning content

### Frontend (React + Sui dApp Kit)
- Wallet connect + PredictManager creation
- Live social feed — open trade calls with predictor info
- Leaderboard — sortable by win rate, ROI, streak
- Trade card — strike, expiry, direction, implied probability, reasoning
- Copy modal — set amount, confirm, sign transaction
- Predictor profile page — full trade history, stats, earnings
- My Portfolio — open copies, PnL, settlement history
- Seal premium signal — pay to unlock, decrypt reasoning client-side

### Testnet Requirements
- dUSDC requested via Tally form
- All contracts deployed on Sui testnet
- Full user flow testable end-to-end by judges

---

## 9. Why Echo Wins the Hackathon

The DeepBook track problem statement explicitly asks for products that make Predict **composable, accessible, and viral** — not just another trading interface. Echo satisfies every stated priority:

- Integrates DeepBook Predict contract on testnet (hard requirement)
- Uses two additional Sui-native primitives — Seal + Walrus (bonus composability points)
- Solves a real, documented user pain — prediction markets are too complex for 90% of users
- Addresses the cold-start/liquidity problem — copy trades add coordinated volume depth
- Clear mainnet-day-one utility — copy trading is proven to retain users 50%+ better than solo trading
- Novel on-chain primitive — on-chain payout split for copy-trading on prediction markets does not exist anywhere
- Demable in 3 minutes — show two wallets, one predictor, one follower, watch the split settle

---

*Echo — Sui Overflow 2026 | DeepBook Track*  
*Build what matters. Build on Sui.*
