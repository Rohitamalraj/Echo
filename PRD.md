# Echo — Product Requirements Document

**Hackathon:** Sui Overflow 2026 — DeepBook Track  
**Project Name:** Echo  
**Version:** 1.0  
**Date:** June 2026  
**Status:** Active Build

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Market Opportunity](#3-market-opportunity)
4. [Product Vision & Goals](#4-product-vision--goals)
5. [User Personas](#5-user-personas)
6. [Core Feature Set](#6-core-feature-set)
7. [Detailed User Flows](#7-detailed-user-flows)
8. [Smart Contract Specifications](#8-smart-contract-specifications)
9. [Frontend Requirements](#9-frontend-requirements)
10. [Backend & Integration Requirements](#10-backend--integration-requirements)
11. [Sui Toolset Integration Map](#11-sui-toolset-integration-map)
12. [Technical Architecture](#12-technical-architecture)
13. [Data Models](#13-data-models)
14. [UI/UX Requirements](#14-uiux-requirements)
15. [Non-Functional Requirements](#15-non-functional-requirements)
16. [Success Metrics](#16-success-metrics)
17. [Risks & Mitigations](#17-risks--mitigations)
18. [Build Scope & Prioritization](#18-build-scope--prioritization)
19. [Judging Criteria Alignment](#19-judging-criteria-alignment)

---

## 1. Executive Summary

Echo is a **social copy-trading layer** built natively on top of DeepBook Predict — Sui's newly launched on-chain binary and range prediction market protocol. It bridges the gap between skilled traders with a verifiable edge and the majority of users who want to profit from prediction markets without the technical complexity.

The platform enables:
- **Predictors** (skilled traders) to broadcast trades publicly, earn automatic on-chain revenue share when followers copy their calls, and optionally sell Seal-encrypted premium signal access
- **Followers** (retail users) to one-tap copy proven strategies with a verified, unfakeable on-chain track record backing every trader profile

All payout splits are enforced by a Move smart contract at settlement — zero trust, zero middleman, zero off-chain custody. Echo combines three Sui-native primitives — **DeepBook Predict**, **Seal**, and **Walrus** — in a configuration that has never been shipped on any prediction market anywhere.

---

## 2. Problem Statement

### 2.1 Prediction Markets Are Inaccessible to Retail Users

Prediction markets like Polymarket and Kalshi have demonstrated that decentralized markets can accurately price future events. However, they remain fundamentally broken for 90% of potential users:

**Cognitive complexity barrier.** Binary strike pricing, options-style expiries, implied probability curves, and volatility surfaces are concepts that require significant financial literacy. The average retail user cannot evaluate whether a DeepBook Predict position at a given strike and expiry represents fair value.

**No shared intelligence layer.** Every existing prediction market is a single-player experience. Users bet in isolation. There is no mechanism to follow, learn from, or profit alongside smarter participants. This kills organic virality — the platform cannot grow through social word-of-mouth the way consumer apps do.

**Skilled traders are undercompensated.** Traders who are consistently right generate enormous value for market pricing and liquidity depth. Current platforms pay them nothing for this contribution beyond their own position payout. There is zero financial incentive for a skilled trader to share their strategy publicly.

**No trustworthy track records.** Any trader can selectively screenshot wins. Losses are invisible. There is no verifiable, on-chain, tamper-proof performance history that a follower can use to make an informed decision about who to copy.

**Cold-start liquidity fragmentation.** New markets have no volume, which means prices are unreliable, which means sophisticated traders won't touch them, which means markets die. There is no mechanism to pool conviction and route coordinated volume into a specific trade.

### 2.2 DeepBook Predict Has No Social or Product Layer

DeepBook Predict launched on Sui testnet in May 2026 as one of the most technically advanced on-chain prediction protocols ever built — featuring SVI (Stochastic Volatility Inspired) volatility surface pricing, sub-hour rolling BTC expiries, a Black-Scholes oracle, and a shared liquidity vault (PLP). Despite this technical depth, it faces the same adoption problem all protocols face at launch:

**It is infrastructure, not a product.** DeepBook Predict has no trader profiles, no leaderboards, no copy-trading mechanic, no social feed, and no front door for users who don't already know how to price options. Without a product layer, the protocol's user base is limited to crypto-native power traders — a fraction of the addressable market.

Echo is that product layer.

---

## 3. Market Opportunity

### 3.1 Copy Trading Market

| Metric | Value |
|---|---|
| Global copy trading market size (2026) | $2.09–$2.82 billion |
| Projected market size (2034) | $10.5 billion |
| CAGR | 22.4% |
| Current active copy trading users | 10–20 million |
| Primary incumbents | Bitget, Bybit, eToro, BingX |

**Critical gap:** Every incumbent is a centralized exchange (CEX). No on-chain, self-custodial copy-trading product exists on a prediction market. The entire market value sits inside centralized custody — waiting for a trustless on-chain version.

### 3.2 Prediction Market Volume

- Weekly prediction market volume crossed **$5.9 billion** in early 2026
- ICE (parent of NYSE) committed **$2 billion** toward Polymarket integration
- CME Group launched 24/7 event contracts in Q1 2026
- Prediction markets are transitioning from crypto-native speculation into mainstream financial infrastructure

### 3.3 The Viral Flywheel Gap

The single most important unsolved problem in prediction markets is the **cold-start / liquidity fragmentation loop**:

```
No traders → Unreliable prices → No new traders → Market dies
```

Echo breaks this loop. When a top predictor posts a position, their followers immediately route coordinated volume behind that trade. A single high-conviction call becomes a market-shaping signal with organic depth. This is the viral growth engine no prediction market has built.

---

## 4. Product Vision & Goals

### 4.1 Vision Statement

> *Make the wisdom of the best traders on DeepBook Predict accessible to everyone — and let those traders earn automatically from every prediction they get right.*

### 4.2 Core Goals

| Goal | Metric |
|---|---|
| Make prediction markets accessible to non-expert users | Follower successfully completes copy trade without understanding strike/expiry |
| Incentivize skilled traders to trade publicly | Predictor earns revenue from followers within same settlement window |
| Create verifiable, tamper-proof trader reputation | All stats stored on-chain, readable without platform trust |
| Add a social viral growth loop to DeepBook Predict | Copy trades route coordinated volume to shared positions |
| Demonstrate Sui primitive composability | DeepBook Predict + Seal + Walrus used together in a single product flow |

### 4.3 Hackathon Success Definition

The project succeeds at the hackathon if a judge can:
1. Connect wallet A (predictor), post a trade with reasoning
2. Connect wallet B (follower), browse the leaderboard, copy the trade
3. Watch both positions settle on-chain
4. See the 85/15 payout split execute automatically in a single transaction
5. See predictor profile stats update on-chain after settlement

Everything else is quality polish layered on top of this core loop.

---

## 5. User Personas

### 5.1 The Predictor — "Alex"

**Profile:** Crypto-native, 3+ years trading. Follows BTC price action closely. Consistently right on short-term directional calls but never had a way to monetize this edge beyond their own capital.

**Goals:**
- Build a public reputation backed by verifiable on-chain stats
- Earn passive income from followers copying their trades
- Optionally sell premium signal access to followers who want the reasoning

**Pain points today:**
- No platform pays them for being right publicly
- Sharing strategy on X/Twitter has no monetization attached
- Reputation is self-reported with no verification

**What Echo gives them:**
- On-chain profile tracking every trade, win rate, ROI, streak
- Automatic 15% cut of follower winnings at settlement
- Seal-encrypted signal tier for premium analysis monetization

---

### 5.2 The Follower — "Priya"

**Profile:** DeFi-curious retail user. Has SUI and dUSDC. Interested in prediction markets but intimidated by options pricing, implied vol, and strike selection. Wants to participate but doesn't know where to start.

**Goals:**
- Profit from prediction markets without needing to become a trader
- Trust someone with a proven track record rather than guessing blindly
- Understand intuitively what they're betting on before copying

**Pain points today:**
- No on-chain copy trading exists on prediction markets
- Can't verify claimed track records on any platform
- Doesn't understand DeepBook Predict's pricing model

**What Echo gives them:**
- One-tap copy trade with no need to select strike or expiry
- Leaderboard with verified, unfakeable on-chain stats
- Trade cards showing direction + implied probability in plain English

---

### 5.3 The Liquidity Provider — "David"

**Profile:** DeFi power user. Has provided liquidity in Aave, Uniswap, and now looks at DeepBook Predict's PLP vault as a yield opportunity. Wants analytics to understand vault health and position flow.

**Goals:**
- Evaluate DeepBook Predict's vault health before LPing
- Understand where the directional flow is concentrating

**What Echo gives them:**
- Leaderboard signals showing where top predictors are concentrated
- Protocol-level analytics derived from copy trade volume and settlement data

---

## 6. Core Feature Set

### 6.1 Feature Priority Matrix

| Feature | Priority | Track Requirement |
|---|---|---|
| Predictor Profile (on-chain) | P0 — Must ship | DeepBook integration |
| Social Feed (open trade calls) | P0 — Must ship | Product layer requirement |
| Copy Trade (follower → predictor link) | P0 — Must ship | Core differentiator |
| On-chain Payout Split (85/15) | P0 — Must ship | Smart contract requirement |
| Leaderboard (sortable stats) | P0 — Must ship | Discovery mechanism |
| Trade Cards (plain-language UI) | P0 — Must ship | Accessibility requirement |
| Settlement & PnL View | P0 — Must ship | Judging demo requirement |
| Seal Premium Signals | P1 — Stretch | Bonus composability |
| Walrus Trade Reasoning Storage | P1 — Stretch | Bonus composability |
| My Portfolio Page | P1 — Should ship | User retention |
| Predictor Profile Page (full history) | P1 — Should ship | Trust layer |
| PLP Vault Analytics | P2 — Nice to have | Persona coverage |

---

### 6.2 Feature Descriptions

#### F-01: Predictor Profile (On-Chain)

A Move object stored on-chain per predictor wallet. Created once via `create_profile` entry function. Stores aggregated stats updated at every trade settlement.

**Fields:**
- `wallet: address`
- `display_name: String` (set at profile creation, max 32 chars)
- `total_trades: u64`
- `winning_trades: u64`
- `win_rate_bps: u64` (basis points, e.g. 6500 = 65.00%)
- `total_volume_usd_cents: u64`
- `total_earnings_from_copies_usd_cents: u64`
- `current_streak: u64`
- `best_streak: u64`
- `follower_count: u64`
- `created_at_ms: u64`
- `last_trade_at_ms: u64`

**Rules:**
- Stats are append-only; no predictor can edit or delete past trade data
- Win rate recalculated on every settlement
- Profile readable by any wallet on-chain

---

#### F-02: Social Feed

A real-time-ish feed of all open trade calls posted by predictors. Displayed on the main homepage.

**Each feed item shows:**
- Predictor avatar (generated from wallet address)
- Predictor display name + win rate badge
- Trade direction: "BTC UP" / "BTC DOWN" / "RANGE"
- Strike price and expiry time in human-readable format ("expires in 43 min")
- Implied probability from OracleSVI (e.g. "67% chance BTC stays above $68,000")
- Predictor's reasoning preview (first 140 chars if public; "Premium — unlock to read" if Seal-gated)
- Followers who have already copied (count + wallet avatar collage)
- "Copy Trade" button
- Time since posted

**Feed ordering:** Most recent first. Optional filter by win rate (>50%, >60%, >70%).

---

#### F-03: Copy Trade

The core product mechanic. Allows a follower to mirror a predictor's open position.

**On-chain mechanics:**
1. Follower calls `copy_trade::create_copy` with:
   - `predictor_position_id` (the DeepBook Predict position object ID)
   - `amount_dusd` (follower's desired size)
   - `predictor_profile_id`
2. Contract calls `predict::mint` with follower's parameters (same direction, same expiry, same strike as predictor's original position)
3. Contract stores a `CopyRecord` object linking follower → predictor → position
4. At settlement: `copy_trade::settle_copy` calls `predict::redeem` → splits payout 85/15 → emits `CopySettled` event

**Validation rules:**
- Follower cannot copy a position that has already expired
- Follower cannot copy their own position
- Minimum copy amount enforced (to avoid dust)
- Predictor profile must exist (cannot copy an unregistered wallet)

---

#### F-04: On-Chain Payout Split (85/15)

The trust-minimized payout distribution enforced by the `copy_trade` Move module.

**Settlement flow:**

```
predict::redeem is called for follower's CopyRecord position
  → gross payout calculated by Predict protocol
  → copy_trade module intercepts:
      → 85% transferred to follower wallet
      → 15% transferred to predictor wallet (from predictor_profile)
  → CopyRecord marked as settled
  → predictor_profile stats updated (win/loss, earnings)
  → CopySettled event emitted
```

**Key constraint:** No platform admin address takes any cut. The contract has no upgrade key for the fee logic. The 15% is hardcoded at compile time.

---

#### F-05: Leaderboard

Discovery surface for followers to find predictors to copy.

**Columns shown:**
- Rank (#)
- Predictor (avatar + display name)
- Win Rate
- Total Trades
- 7-Day ROI
- Current Streak
- Followers
- Action (Copy Latest / View Profile)

**Sort options:**
- Win Rate (default)
- 7-Day ROI
- Current Streak
- Total Trades (volume)
- Followers

**Filter options:**
- Min trades: 5 / 10 / 25 (filters out low-sample-size predictors)
- Timeframe: All-time / 30D / 7D

---

#### F-06: Trade Cards

The primary UI element for displaying a single trade call. Must be readable by a non-expert.

**Trade card anatomy:**

```
┌─────────────────────────────────────────────────┐
│  [Avatar] Alex.sui         ★ 71% win rate        │
│                                                   │
│  BTC ABOVE $68,500                               │
│  Expires in 43 minutes                           │
│                                                   │
│  Implied probability: 67%                        │
│  Position size: 50 dUSDC                         │
│                                                   │
│  "I think the 4h support at 68.2k holds and     │
│   we squeeze into the expiry. High conviction."  │
│   [Public reasoning — full text]                  │
│                                                   │
│  12 people copying  •  Posted 8 min ago          │
│                                                   │
│  [   Copy Trade — Enter Amount   ]               │
└─────────────────────────────────────────────────┘
```

**Plain English translation layer:**
- "BTC ABOVE $68,500 in 43 min" replaces "binary call strike 68500 expiry T+43"
- "67% implied probability" replaces "IV surface odds"
- Direction badge: green UP arrow / red DOWN arrow / blue RANGE

---

#### F-07: Seal Premium Signal Layer (P1)

Optional encrypted reasoning access for predictors who want a second revenue stream.

**Flow:**
1. Predictor writes trade reasoning text
2. Predictor checks "Premium Signal" toggle before posting
3. Frontend encrypts the text client-side using `@mysten/seal` SDK
4. Encrypted blob uploaded to Walrus, returning a `blob_id`
5. On-chain `seal_access_policy::create` is called with parameters:
   - `blob_id`
   - `signal_fee_dusd` (predictor sets this, e.g. 0.5 dUSDC)
   - `predictor_profile_id`
6. Policy stored on-chain: "decrypt if wallet has paid fee for this blob_id"

**Follower decryption flow:**
1. Follower sees "Premium — Unlock for 0.5 dUSDC"
2. Clicks unlock → transaction: pay fee → on-chain policy records payment
3. Frontend calls Seal key servers → key released because policy satisfied
4. Frontend decrypts blob → displays reasoning text
5. Predictor's `total_signal_fees_earned` updated on-chain

---

#### F-08: Walrus Trade Reasoning Storage (P1)

Both public and premium reasoning is stored on Walrus for permanence and content-addressability.

**Public reasoning:**
- Stored as plain text blob on Walrus
- `blob_id` stored in the on-chain trade call record
- Frontend reads directly from Walrus aggregator
- Permanent, immutable, cannot be retroactively edited

**Premium reasoning:**
- Stored as Seal-encrypted blob on Walrus
- `blob_id` stored in the on-chain seal access policy
- Accessible only via Seal key release

**Storage limits:** Reasoning capped at 2,000 characters to constrain Walrus storage costs during testnet phase.

---

#### F-09: My Portfolio (P1)

Personal dashboard for a connected wallet showing all activity.

**Sections:**
- Open Positions: active copy trades not yet settled
- Settled Positions: historical trades with P&L
- Earnings (if predictor): revenue from copy followers + signal fees
- Stats summary: personal win rate, total traded, net P&L

---

#### F-10: Predictor Profile Page (P1)

Public-facing page for any predictor wallet.

**Sections:**
- Header: avatar, display name, wallet address (truncated), joined date
- Stats bar: win rate, total trades, followers, 30D ROI, streak
- Recent trades list (last 20): direction, outcome (win/loss), payout, date
- Active trade calls: open positions available to copy
- Follower list: wallets currently following this predictor

---

## 7. Detailed User Flows

### 7.1 Predictor: Post a Trade

```
1. User lands on Echo
2. Clicks "Connect Wallet" → Sui Wallet / Slippi / Suiet
3. dApp checks: does this wallet have a PredictorProfile on-chain?
   ├─ YES → load existing profile
   └─ NO  → prompt "Create Your Predictor Profile"
              → user enters display name
              → call create_profile() transaction
              → profile object created on-chain
4. User clicks "Post Trade"
5. Trade composer modal opens:
   - Fetch live markets from Predict Server API
   - User selects: Direction (UP / DOWN / RANGE)
   - User selects: Expiry (1H / 2H / 4H rolling)
   - UI shows: current strike, implied probability, cost per position
   - User enters: position size in dUSDC
   - User writes: reasoning text (optional, max 2000 chars)
   - User toggles: Public / Premium Signal
     └─ Premium: user sets signal fee (min 0.1 dUSDC)
6. User clicks "Post & Trade"
7. Transaction built:
   - predict::mint (creates position in user's PredictManager)
   - post_trade_call::create (stores trade call metadata on-chain or off-chain index)
   - [if Premium] seal_access_policy::create + Walrus blob upload
8. User signs transaction → position confirmed
9. Trade card appears in social feed immediately
```

---

### 7.2 Follower: Copy a Trade

```
1. User lands on Echo
2. Connects wallet
3. Browses social feed or leaderboard
4. Clicks a predictor's trade card or "Copy Latest" on leaderboard
5. Copy modal opens:
   - Shows predictor's trade details (direction, strike, expiry)
   - Shows predictor's stats (win rate, streak, recent trades)
   - Shows implied probability
   - Shows reasoning text (public) or "Unlock Premium Signal" button
   - Input: "How much to copy?" (dUSDC amount)
   - Shows: "If this wins, you keep 85% of your payout"
   - Shows: "Predictor earns 15% of YOUR winnings only if you win"
6. User enters amount → clicks "Confirm Copy"
7. Transaction built:
   - copy_trade::create_copy (links follower → predictor, calls predict::mint)
8. User signs → position confirmed
9. User's copy appears in "My Portfolio → Open Positions"
10. Feed card updates: "13 people copying" (incremented)
```

---

### 7.3 Settlement Flow (Both Wallets)

```
Position reaches expiry timestamp
│
├─ BTC price checked against OracleSVI / Black-Scholes oracle
│
├─ Position is IN THE MONEY (predictor was right):
│   copy_trade::settle_copy called (permissionless, anyone can trigger):
│   → predict::redeem called for follower's CopyRecord
│   → gross_payout calculated
│   → 85% transferred to follower wallet
│   → 15% transferred to predictor wallet
│   → predictor_profile updated:
│       win_rate recalculated
│       earnings incremented
│       streak incremented
│   → CopySettled event emitted
│
└─ Position is OUT OF THE MONEY (predictor was wrong):
    → follower loses their stake (standard Predict behavior)
    → predictor_profile updated:
        win_rate recalculated
        streak reset to 0
    → CopySettled event emitted (with loss outcome)
```

---

### 7.4 Premium Signal Unlock

```
Follower sees trade card with locked reasoning
1. Clicks "Unlock Signal — 0.5 dUSDC"
2. Confirmation: "Pay 0.5 dUSDC to read Alex's reasoning for this trade"
3. Transaction: pay_signal_fee(blob_id, predictor_profile_id)
   → dUSDC transferred from follower to predictor wallet
   → on-chain record: wallet has paid for blob_id
4. Frontend calls Seal key server API with proof of payment
5. Seal key server evaluates on-chain policy:
   → wallet paid for this blob_id? YES → release decryption key
6. Frontend decrypts Walrus blob → displays reasoning text
7. Predictor's signal_fees_earned incremented on-chain
```

---

## 8. Smart Contract Specifications

### 8.1 Module: `predictor_profile`

```move
module echo::predictor_profile {

    // Stored as a shared object, indexed by wallet address
    struct PredictorProfile has key, store {
        id: UID,
        wallet: address,
        display_name: String,
        total_trades: u64,
        winning_trades: u64,
        win_rate_bps: u64,          // e.g. 6500 = 65.00%
        total_volume_cents: u64,    // dUSDC in cents
        copy_earnings_cents: u64,   // earnings from follower copies
        signal_earnings_cents: u64, // earnings from Seal signal fees
        current_streak: u64,
        best_streak: u64,
        follower_count: u64,
        created_at_ms: u64,
        last_trade_at_ms: u64,
    }

    // Entry: create profile (one per wallet, enforced via dynamic field on registry)
    public entry fun create_profile(
        registry: &mut ProfileRegistry,
        display_name: String,
        clock: &Clock,
        ctx: &mut TxContext,
    )

    // Internal: update stats after settlement
    public(friend) fun record_settlement(
        profile: &mut PredictorProfile,
        won: bool,
        copy_earnings_cents: u64,
        clock: &Clock,
    )

    // Internal: increment follower count
    public(friend) fun add_follower(profile: &mut PredictorProfile)
}
```

---

### 8.2 Module: `copy_trade`

```move
module echo::copy_trade {

    // Created per copy action, stored in follower's wallet
    struct CopyRecord has key, store {
        id: UID,
        follower: address,
        predictor: address,
        predictor_profile_id: ID,
        predict_position_id: ID,    // DeepBook Predict position object
        amount_cents: u64,
        direction: u8,              // 0 = UP, 1 = DOWN, 2 = RANGE
        strike: u64,
        expiry_ms: u64,
        created_at_ms: u64,
        settled: bool,
        won: bool,
        gross_payout_cents: u64,
        follower_payout_cents: u64,
        predictor_cut_cents: u64,
    }

    // Entry: follower copies a trade
    public entry fun create_copy(
        registry: &ProfileRegistry,
        predictor_profile_id: ID,
        predict_manager: &mut PredictManager, // DeepBook Predict
        market_id: ID,
        amount: Coin<DUSD>,
        direction: u8,
        strike: u64,
        expiry_ms: u64,
        clock: &Clock,
        ctx: &mut TxContext,
    )

    // Entry: settle a copy after expiry (permissionless)
    public entry fun settle_copy(
        copy_record: &mut CopyRecord,
        predict_manager: &mut PredictManager,
        predictor_profile: &mut PredictorProfile,
        clock: &Clock,
        ctx: &mut TxContext,
    )

    // Constants
    const FOLLOWER_BPS: u64 = 8500;   // 85%
    const PREDICTOR_BPS: u64 = 1500;  // 15%
    const BPS_DENOMINATOR: u64 = 10000;
}
```

---

### 8.3 Module: `seal_signal` (P1)

```move
module echo::seal_signal {

    // Access policy for a single encrypted reasoning blob
    struct SignalPolicy has key, store {
        id: UID,
        predictor: address,
        blob_id: vector<u8>,     // Walrus blob ID
        fee_cents: u64,          // fee in dUSDC cents to unlock
        paid_wallets: VecSet<address>, // wallets that have paid
        total_collected_cents: u64,
    }

    // Entry: predictor creates policy for encrypted blob
    public entry fun create_policy(
        blob_id: vector<u8>,
        fee_cents: u64,
        ctx: &mut TxContext,
    )

    // Entry: follower pays fee to be added to paid_wallets
    // Seal key server checks this mapping before releasing key
    public entry fun pay_signal_fee(
        policy: &mut SignalPolicy,
        payment: Coin<DUSD>,
        ctx: &mut TxContext,
    )

    // Read: check if wallet has paid (called by Seal key server via RPC)
    public fun has_paid(policy: &SignalPolicy, wallet: address): bool
}
```

---

### 8.4 Events Emitted

```move
// Emitted when a copy is created
struct CopyCreated has copy, drop {
    copy_record_id: ID,
    follower: address,
    predictor: address,
    amount_cents: u64,
    direction: u8,
    expiry_ms: u64,
}

// Emitted when a copy settles
struct CopySettled has copy, drop {
    copy_record_id: ID,
    follower: address,
    predictor: address,
    won: bool,
    follower_payout_cents: u64,
    predictor_cut_cents: u64,
}

// Emitted when a signal fee is paid
struct SignalUnlocked has copy, drop {
    policy_id: ID,
    unlocker: address,
    fee_cents: u64,
}
```

---

## 9. Frontend Requirements

### 9.1 Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | React 18 + Vite | Standard dApp stack |
| Styling | TailwindCSS + shadcn/ui | Fast, accessible components |
| Wallet | `@mysten/dapp-kit` | Official Sui wallet adapter |
| On-chain reads | `@mysten/sui` (SuiClient) | RPC queries for contract state |
| Seal | `@mysten/seal` | Client-side encrypt/decrypt |
| Walrus | Walrus HTTP API (aggregator/publisher) | Blob upload/download |
| Predict API | `predict-server.testnet.mystenlabs.com` | Market data, oracle, portfolio |
| State | React Query (TanStack) | Server state + caching |
| Routing | React Router v6 | Page navigation |

---

### 9.2 Pages & Routes

| Route | Page | Description |
|---|---|---|
| `/` | Social Feed | Main feed of open trade calls |
| `/leaderboard` | Leaderboard | Sortable predictor rankings |
| `/predictor/:address` | Predictor Profile | Full stats + trade history for one predictor |
| `/portfolio` | My Portfolio | Connected wallet's positions and P&L |
| `/trade/new` | Post Trade (modal) | Trade composer — predictor only |

---

### 9.3 Component Hierarchy

```
App
├── WalletProvider (@mysten/dapp-kit)
├── QueryClientProvider
├── Navbar
│   ├── Logo
│   ├── Nav links
│   ├── ConnectButton
│   └── [if connected] WalletMenu + PredictorProfileBadge
├── Routes
│   ├── /  → FeedPage
│   │   ├── FeedFilters
│   │   └── TradeCardList
│   │       └── TradeCard (× N)
│   │           ├── PredictorBadge
│   │           ├── TradeDetails (direction, strike, expiry, implied prob)
│   │           ├── ReasoningSection (public | PremiumLock)
│   │           ├── CopyersBar
│   │           └── CopyTradeButton → CopyModal
│   │               ├── AmountInput
│   │               ├── PayoutPreview
│   │               └── ConfirmButton
│   ├── /leaderboard → LeaderboardPage
│   │   ├── SortControls
│   │   ├── FilterControls
│   │   └── LeaderboardTable
│   │       └── LeaderboardRow (× N)
│   ├── /predictor/:address → PredictorProfilePage
│   │   ├── ProfileHeader
│   │   ├── StatsBar
│   │   ├── ActiveTradeCalls
│   │   └── TradeHistoryTable
│   └── /portfolio → PortfolioPage
│       ├── PortfolioStats
│       ├── OpenPositionsTable
│       └── SettledPositionsTable
└── PostTradeModal (global, triggered from Navbar)
    ├── MarketSelector
    ├── DirectionSelector
    ├── ExpirySelector
    ├── AmountInput
    ├── ReasoningEditor
    ├── PremiumSignalToggle
    └── ConfirmButton
```

---

### 9.4 Key UI States

**Empty state (new user, no predictor profile):**
"Welcome to Echo. Connect your wallet to start following top traders — or create your Predictor Profile and start earning from your calls."

**Loading state:**
Skeleton cards matching the layout of TradeCards and LeaderboardRows.

**Error state:**
"Failed to load markets. The Predict server may be temporarily unavailable." with a retry button.

**Testnet banner:**
Persistent top banner: "Running on Sui Testnet — Use testnet dUSDC only"

---

## 10. Backend & Integration Requirements

### 10.1 DeepBook Predict Server API

All market data is sourced from the public Predict Server REST API at `predict-server.testnet.mystenlabs.com`.

**Endpoints used:**

| Endpoint | Use |
|---|---|
| `GET /markets` | Fetch all active markets (strike, expiry, direction) |
| `GET /markets/:id/oracle` | Fetch current OracleSVI implied probability |
| `GET /portfolio/:wallet` | Fetch all positions for a wallet |
| `GET /history/:wallet` | Fetch settled position history |
| `GET /prices/btc` | Current BTC spot price |

**Caching strategy:** Market list cached for 30 seconds. Oracle prices polled every 10 seconds for active trade card displays.

---

### 10.2 On-Chain Event Listener (Minimal)

For the hackathon scope, a lightweight event listener is needed to:

1. Listen for `CopySettled` events from the `copy_trade` module
2. Update predictor profile stats on-chain via `record_settlement` (or this is called inside the settle PTB)

For the hackathon, settlement stat updates happen **inside the settle transaction itself** — no off-chain listener required. The `copy_trade::settle_copy` entry function directly calls `predictor_profile::record_settlement` in the same PTB.

---

### 10.3 Walrus Integration

**Upload (predictor posting reasoning):**
```
POST https://publisher.walrus-testnet.walrus.space/v1/store
Content-Type: text/plain
Body: reasoning text (or Seal-encrypted bytes)

Response: { "blobId": "abc123..." }
```

**Download (follower reading reasoning):**
```
GET https://aggregator.walrus-testnet.walrus.space/v1/blob/{blobId}
```

For Seal-encrypted blobs, the raw bytes are fetched and then decrypted client-side via `@mysten/seal`.

---

### 10.4 Seal Integration

**Encryption (predictor, at post time):**
```typescript
import { SealClient } from '@mysten/seal';

const client = new SealClient({ suiClient, serverObjectIds: [...] });
const encryptedBytes = await client.encrypt({
  threshold: 1,
  packageId: ECHO_PACKAGE_ID,
  id: policyObjectId,          // the SignalPolicy object ID
  data: new TextEncoder().encode(reasoningText),
});
```

**Decryption (follower, after paying fee):**
```typescript
const decryptedBytes = await client.decrypt({
  data: encryptedBlob,
  sessionKey,                 // derived from wallet signature
  decryptionKeys,             // obtained from Seal key servers
});
const reasoningText = new TextDecoder().decode(decryptedBytes);
```

---

## 11. Sui Toolset Integration Map

| Primitive | Module / SDK | Where Used | Why |
|---|---|---|---|
| DeepBook Predict | `predict::mint` | `copy_trade::create_copy` | Opens follower's position against Predict protocol |
| DeepBook Predict | `predict::redeem` | `copy_trade::settle_copy` | Settles position at expiry |
| DeepBook Predict | `predict::redeem_permissionless` | Fallback settlement | Allows anyone to trigger settlement after expiry |
| DeepBook Predict | OracleSVI REST | Trade card UI | Shows implied probability in plain English |
| DeepBook Predict | Predict Server API | Market selector + feed | Live market data without raw chain scanning |
| Seal | `@mysten/seal` (client) | PostTradeModal + PremiumUnlock | Encrypt reasoning; decrypt after payment |
| Seal | `seal_signal::create_policy` | Move contract | Access policy: "paid wallet → key released" |
| Seal | `seal_signal::pay_signal_fee` | PremiumUnlock flow | Records payment; enables Seal key release |
| Walrus | HTTP publisher API | PostTradeModal | Stores reasoning blobs permanently |
| Walrus | HTTP aggregator API | TradeCard reasoning section | Reads reasoning blobs for display |
| Sui Move | `predictor_profile` module | All settlement flows | On-chain verifiable stats |
| Sui Move | `copy_trade` module | Copy + settle flows | Trustless 85/15 payout split |
| Sui dApp Kit | `@mysten/dapp-kit` | Navbar + all transactions | Wallet connection + transaction signing |
| Sui PTB | TransactionBlock | Every on-chain action | Atomic multi-step transactions |

---

## 12. Technical Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                           │
│                                                                       │
│  Social Feed  |  Leaderboard  |  Trade Cards  |  Copy Modal  | PnL  │
│                                                                       │
│  @mysten/dapp-kit  |  @mysten/seal  |  Walrus HTTP  |  React Query  │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
           ┌────────────────┼────────────────┐
           │                │                │
┌──────────▼──────┐ ┌───────▼────────┐ ┌────▼──────────────────────┐
│  Predict Server │ │   Walrus HTTP  │ │    Seal Key Servers        │
│  REST API       │ │   Aggregator   │ │    (Mysten-operated)       │
│  ─────────────  │ │   /v1/blob/:id │ │    (evaluate on-chain      │
│  /markets       │ │                │ │     policy before release) │
│  /oracle        │ │   Publisher    │ │                            │
│  /portfolio     │ │   /v1/store    │ │                            │
│  /history       │ └───────────────┘ └───────────────────────────┘
└─────────────────┘
           │
┌──────────▼──────────────────────────────────────────────────────────┐
│                    SUI RPC (Testnet Fullnode)                         │
│                                                                       │
│  suiClient.getObject()  |  suiClient.queryEvents()                  │
│  suiClient.signAndExecuteTransaction()                               │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────────┐
│                     SUI MOVE CONTRACTS                               │
│                                                                       │
│  ┌──────────────────────┐   ┌──────────────────────────────────┐    │
│  │  predictor_profile   │   │         copy_trade               │    │
│  │  ─────────────────   │   │  ──────────────────────────────  │    │
│  │  PredictorProfile    │   │  CopyRecord                      │    │
│  │  ProfileRegistry     │◄──│  create_copy()                   │    │
│  │  create_profile()    │   │  settle_copy()                   │    │
│  │  record_settlement() │   │  FOLLOWER_BPS = 8500             │    │
│  └──────────────────────┘   │  PREDICTOR_BPS = 1500            │    │
│                              └──────────────────────────────────┘    │
│  ┌──────────────────────┐                                            │
│  │    seal_signal       │                                            │
│  │  ─────────────────   │                                            │
│  │  SignalPolicy        │                                            │
│  │  create_policy()     │                                            │
│  │  pay_signal_fee()    │                                            │
│  │  has_paid()          │                                            │
│  └──────────────────────┘                                            │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────────┐
│              DEEPBOOK PREDICT PROTOCOL (Testnet)                     │
│                                                                       │
│  predict::mint           PredictManager (per wallet)                 │
│  predict::redeem         OracleSVI (volatility surface)              │
│  predict::redeem_permissionless    Vault / PLP                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 13. Data Models

### 13.1 On-Chain Objects

```
ProfileRegistry (shared object, singleton)
  └── dynamic fields: address → PredictorProfile.id

PredictorProfile (shared object, one per predictor)
  └── all stats fields (see §8.1)

CopyRecord (owned by follower wallet)
  └── links follower → predictor → DeepBook position

SignalPolicy (shared object, one per trade reasoning blob)
  └── paid_wallets set
  └── fee amount
  └── blob_id reference
```

### 13.2 Off-Chain / Indexed Data

For the hackathon, the frontend reads directly from the chain and the Predict Server. No custom indexer is needed. The following data is indexed by reading on-chain events:

| Data | Source |
|---|---|
| Open trade calls | Sui events: `CopyCreated` + Predict Server `/portfolio` |
| Leaderboard stats | Read `PredictorProfile` objects via `suiClient.getObject` |
| Settlement history | Sui events: `CopySettled` + Predict Server `/history` |
| Current BTC price | Predict Server `/prices/btc` |

---

## 14. UI/UX Requirements

### 14.1 Design Principles

1. **Prediction markets made simple.** Every technical term (strike, expiry, implied vol) must have a plain-English translation visible in the UI. No user should need to know what "SVI" means to copy a trade.

2. **Trust at a glance.** Win rate, streak, and trade count must be visible on every predictor surface (feed cards, leaderboard, copy modal). Users must be able to evaluate trustworthiness in under 5 seconds.

3. **Friction-appropriate actions.** Browsing the feed and leaderboard: zero friction (no wallet needed). Copying a trade: one confirmation modal, one signature. Premium signal unlock: one payment transaction.

4. **Outcome transparency.** Before copying, users always see: "If this wins, you keep 85% of your payout. The predictor earns the other 15% — only if you win." No hidden fee mechanics.

### 14.2 Color System

| Element | Color |
|---|---|
| BTC UP / bullish | Green (`#22c55e`) |
| BTC DOWN / bearish | Red (`#ef4444`) |
| RANGE | Blue (`#3b82f6`) |
| Win badge | Green |
| Loss badge | Red |
| Pending / open | Amber (`#f59e0b`) |
| Premium signal lock | Purple (`#a855f7`) |
| Background | Dark (`#0f172a`) |
| Card surface | Dark-mid (`#1e293b`) |

### 14.3 Responsive Requirements

- Primary target: desktop/laptop browser (1280px+)
- Functional on tablet (768px+)
- Mobile not in scope for hackathon

---

## 15. Non-Functional Requirements

| Requirement | Target |
|---|---|
| Time to copy trade (from click to signed transaction) | < 30 seconds |
| Feed load time (initial) | < 2 seconds |
| Leaderboard load time | < 2 seconds |
| Settlement transaction execution | < 5 seconds on Sui testnet |
| Trade card oracle price refresh | Every 10 seconds |
| Walrus blob retrieval | < 3 seconds |
| Browser support | Chrome/Brave latest |
| Wallet support | Sui Wallet, Suiet, Slippi |

---

## 16. Success Metrics

### 16.1 Hackathon Demo Metrics (Binary)

- [ ] Wallet A creates a Predictor Profile on-chain
- [ ] Wallet A posts a trade with reasoning
- [ ] Trade card appears in social feed within 5 seconds
- [ ] Wallet B connects, views trade card, copies trade
- [ ] CopyRecord object appears on-chain
- [ ] Settlement transaction executes correctly
- [ ] 85% payout goes to follower wallet
- [ ] 15% payout goes to predictor wallet
- [ ] Predictor profile stats update on-chain post-settlement
- [ ] (P1) Seal premium signal: encrypts, stores, unlocks, decrypts end-to-end

### 16.2 Post-Hackathon / Mainnet Metrics

- Predictor profiles created
- Copy trades executed per day
- Unique followers per predictor (average)
- Settlement success rate
- Signal fee revenue generated per top predictor

---

## 17. Risks & Mitigations

| Risk | Severity | Likelihood | Mitigation |
|---|---|---|---|
| **DeepBook Predict testnet instability** | High | Medium | Cache Predict Server responses; fall back to on-chain reads; keep demo data seeded |
| **Move payout split logic error** | High | Low-Medium | Write unit tests for split math; test with small amounts first; use BPS not floats |
| **Seal SDK integration complexity** | Medium | Medium | Start with public signals only; add Seal as a stretch goal on final build day |
| **dUSDC testnet supply** | High | Low | Request via tally.so/r/Xx102L before any coding starts |
| **predict::redeem API mismatch** | High | Medium | Read DeepBook Predict source + test on sandbox before building wrapper |
| **Walrus testnet rate limits** | Low | Low | Cache reasoning blobs in localStorage after first fetch |
| **Seal key server availability** | Medium | Low | If Seal unavailable during demo, demo public signals only |
| **4-day timeline overrun** | High | Medium | Ship P0 features first; cut P1 scope cleanly if behind |

---

## 18. Build Scope & Prioritization

### Day-by-Day Build Plan

**Day 1: Foundation**
- Request dUSDC testnet funds immediately
- Scaffold React + Vite project, install all deps
- Set up Sui Move project structure, write `predictor_profile` module
- Write `copy_trade` module (without Predict integration first, use mock)
- Test contracts compile and deploy to testnet
- Implement wallet connect + basic routing

**Day 2: Core Loop**
- Integrate `predict::mint` into `copy_trade::create_copy`
- Integrate `predict::redeem` into `copy_trade::settle_copy`
- Deploy integrated contracts to testnet
- Build Trade Card component
- Build Copy Modal component
- Build PostTrade Modal (predictor side)
- Wire up Predict Server API for market data

**Day 3: Product Polish**
- Build Leaderboard page with on-chain stat reads
- Build My Portfolio page (open + settled positions)
- Build Predictor Profile page
- End-to-end test: two wallets, full trade → copy → settle flow
- Fix settlement bugs
- (Stretch) Begin Walrus reasoning storage integration

**Day 4: Demo Ready**
- Seed demo data: 3 predictor profiles with trade history
- Final UI polish + testnet banner + empty states
- (Stretch) Seal premium signal integration
- Record demo video
- Write submission description
- Submit before June 21, 6PM PT

### MVP Cut Line

Everything below this line ships; everything above is cut if behind schedule:

```
MUST SHIP (P0):
✅ predictor_profile Move module
✅ copy_trade Move module  
✅ Social Feed page
✅ Leaderboard page
✅ Copy Modal + transaction
✅ PostTrade Modal + transaction
✅ Settlement flow
✅ On-chain payout split

CUT IF BEHIND (P1):
⬜ Walrus reasoning storage
⬜ Seal premium signals
⬜ My Portfolio full page
⬜ Predictor Profile full page
```

---

## 19. Judging Criteria Alignment

| Judging Criterion | Weight | How Echo Scores |
|---|---|---|
| **Real-World Application** | 50% | Solves a documented pain: prediction markets are too complex for retail users. Copy trading is a proven $2B+ category currently locked in CEX custody. Adds a viral growth loop (cold-start solution) directly requested in DeepBook problem statement. |
| **Product & UX** | 20% | Plain-English trade cards, one-tap copy, leaderboard trust signals, payout transparency. Non-expert users can participate without knowing what implied vol means. |
| **Technical Implementation** | 20% | Three Sui primitives composed together (Predict + Seal + Walrus). On-chain payout split in Move. Verified stats via immutable on-chain objects. PTB-based atomic settlement. |
| **Presentation & Vision** | 10% | Clear demo loop: two wallets, one trade, one copy, one settlement. Vision: the social layer that every new prediction market will need at launch. |

### DeepBook Track-Specific Alignment

The DeepBook Predict problem statement explicitly asks for:

> *"Functional applications, services, vaults, bots, or analytics... in any flavor (consumer, professional, structured, social)"*

Echo is the **social** flavor. It:
- Integrates DeepBook Predict contracts on testnet (hard requirement met)
- Creates real user demand for Predict positions via the social copy mechanic
- Addresses Predict's zero-social-layer cold start problem
- Adds a revenue stream for skilled traders that doesn't exist anywhere in the Predict ecosystem today

---

## Appendix A: Key Addresses & IDs (Testnet)

*(Deployed June 2026 — Sui Testnet)*

| Item | Value |
|---|---|
| Echo Package ID | `0x74ddf6ea29b138db0f55db9aea82452ad80bbecf7d26bd05caa6095d05184125` |
| ProfileRegistry Object ID | `0xb846a650ce785b26f151ec79a074a80b1263a9b508c0d67af92f4b524ca49f24` |
| Echo Deploy Tx | `34djymTgAwgwiMmaZrq5LHqACXL3uGNZbkywrpDFNy8Y` |
| DeepBook Predict Package ID | `0xf5ea2b3749c65d6e56507cc35388719aadb28f9cab873696a2f8687f5c785138` |
| DeepBook Predict Object ID | `0xc8736204d12f0a7277c86388a68bf8a194b0a14c5538ad13f22cbd8e2a38028a` |
| Predict Registry | `0x43af14fed5480c20ff77e2263d5f794c35b9fab7e2212903127062f4fe2a6e64` |
| Predict Server Base URL | `https://predict-server.testnet.mystenlabs.com` |
| Walrus Aggregator | `https://aggregator.walrus-testnet.walrus.space` |
| Walrus Publisher | `https://publisher.walrus-testnet.walrus.space` |
| dUSDC Coin Type | `0xe95040085976bfd54a1a07225cd46c8a2b4e8e2b6732f140a0fc49850ba73e1a::dusdc::DUSDC` |

---

## Appendix B: Dependencies

```json
{
  "dependencies": {
    "@mysten/dapp-kit": "latest",
    "@mysten/sui": "latest",
    "@mysten/seal": "latest",
    "@tanstack/react-query": "^5",
    "react": "^18",
    "react-router-dom": "^6",
    "tailwindcss": "^3"
  }
}
```

---

*Echo — Sui Overflow 2026 | DeepBook Track*  
*Build what matters. Build on Sui.*
