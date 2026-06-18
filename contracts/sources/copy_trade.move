/// copy_trade module — records the follower→predictor link on-chain
/// and enforces the 85/15 payout split at settlement.
///
/// Settlement flow (PTB built by frontend, signed by follower):
///   1. predict::redeem_permissionless(...)   → payout into follower's manager
///   2. predict_manager::withdraw(...)        → Coin<DUSD> (owner-only, so follower signs)
///   3. copy_trade::settle_copy(copy_record, payout_coin, predictor_profile, clock, ctx)
///      → 15% transferred to predictor wallet
///      → 85% transferred back to follower wallet
///      → predictor_profile stats updated
///      → CopySettled event emitted
module echo::copy_trade {
    use sui::clock::Clock;
    use sui::coin::{Self, Coin};
    use sui::event;
    use echo::predictor_profile::{Self, PredictorProfile, ProfileRegistry};

    // ── Constants ────────────────────────────────────────────────────────────

    const PREDICTOR_BPS: u64 = 1500;
    const BPS_DENOMINATOR: u64 = 10000;

    // ── Errors ───────────────────────────────────────────────────────────────
    const EAlreadySettled: u64 = 0;
    const ENotExpiredYet: u64 = 1;
    const ECopyingOwnTrade: u64 = 2;
    const EMinimumAmount: u64 = 3;
    const EWrongPredictor: u64 = 4;

    /// Minimum copy amount: 1 dUSDC = 1_000_000 (6 decimals)
    const MIN_COPY_AMOUNT: u64 = 1_000_000;

    // ── Structs ──────────────────────────────────────────────────────────────

    /// Shared on-chain record linking a follower's copy to a predictor's trade.
    public struct CopyRecord has key, store {
        id: UID,
        follower: address,
        predictor: address,
        predictor_profile_id: ID,
        /// DeepBook Predict oracle ID for this market
        oracle_id: ID,
        /// Strike price in 9-decimal fixed-point (matches DeepBook Predict encoding)
        strike: u64,
        /// true = UP (long), false = DOWN (short)
        is_up: bool,
        /// Expiry timestamp in milliseconds
        expiry_ms: u64,
        /// Amount the follower copied in dUSDC base units
        amount_dusd: u64,
        created_at_ms: u64,
        settled: bool,
        won: bool,
        /// Gross payout follower received from DeepBook Predict
        gross_payout_dusd: u64,
        /// 85% of gross payout — what follower received
        follower_payout_dusd: u64,
        /// 15% of gross payout — what predictor received
        predictor_cut_dusd: u64,
    }

    // ── Events ───────────────────────────────────────────────────────────────

    public struct CopyCreated has copy, drop {
        copy_record_id: ID,
        follower: address,
        predictor: address,
        oracle_id: ID,
        strike: u64,
        is_up: bool,
        expiry_ms: u64,
        amount_dusd: u64,
    }

    public struct CopySettled has copy, drop {
        copy_record_id: ID,
        follower: address,
        predictor: address,
        won: bool,
        gross_payout_dusd: u64,
        follower_payout_dusd: u64,
        predictor_cut_dusd: u64,
    }

    // ── Public Entry ─────────────────────────────────────────────────────────

    /// Record that the caller (follower) is copying a predictor's trade.
    /// The actual predict::mint call is made separately in the same PTB.
    public entry fun create_copy(
        registry: &ProfileRegistry,
        predictor_profile: &mut PredictorProfile,
        oracle_id: ID,
        strike: u64,
        is_up: bool,
        expiry_ms: u64,
        amount_dusd: u64,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let follower = ctx.sender();
        let predictor = predictor_profile::wallet(predictor_profile);

        assert!(follower != predictor, ECopyingOwnTrade);
        assert!(amount_dusd >= MIN_COPY_AMOUNT, EMinimumAmount);
        assert!(clock.timestamp_ms() < expiry_ms, ENotExpiredYet);

        // Verify predictor has a profile in the registry
        assert!(
            predictor_profile::has_profile(registry, predictor),
            EWrongPredictor,
        );

        let predictor_profile_id = object::id(predictor_profile);
        predictor_profile::add_follower(predictor_profile);

        let record = CopyRecord {
            id: object::new(ctx),
            follower,
            predictor,
            predictor_profile_id,
            oracle_id,
            strike,
            is_up,
            expiry_ms,
            amount_dusd,
            created_at_ms: clock.timestamp_ms(),
            settled: false,
            won: false,
            gross_payout_dusd: 0,
            follower_payout_dusd: 0,
            predictor_cut_dusd: 0,
        };

        event::emit(CopyCreated {
            copy_record_id: object::id(&record),
            follower,
            predictor,
            oracle_id,
            strike,
            is_up,
            expiry_ms,
            amount_dusd,
        });

        transfer::share_object(record);
    }

    /// Settle a copy trade and enforce the 85/15 payout split.
    ///
    /// Caller provides `payout_coin` — the Coin<DUSD> they withdrew from their
    /// PredictManager after calling predict::redeem_permissionless in the same PTB.
    /// This function splits it 85/15 and marks the CopyRecord as settled.
    ///
    /// If payout_coin is zero (position lost), no funds are moved but stats update.
    public entry fun settle_copy<DUSD>(
        copy_record: &mut CopyRecord,
        mut payout_coin: Coin<DUSD>,
        predictor_profile: &mut PredictorProfile,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        assert!(!copy_record.settled, EAlreadySettled);
        assert!(
            object::id(predictor_profile) == copy_record.predictor_profile_id,
            EWrongPredictor,
        );
        assert!(
            clock.timestamp_ms() >= copy_record.expiry_ms,
            ENotExpiredYet,
        );

        let gross = coin::value(&payout_coin);
        let won = gross > 0;

        let follower_payout: u64;
        let predictor_cut: u64;

        if (won) {
            predictor_cut = (gross * PREDICTOR_BPS) / BPS_DENOMINATOR;
            follower_payout = gross - predictor_cut;

            // Transfer predictor's cut
            let predictor_coin = coin::split(&mut payout_coin, predictor_cut, ctx);
            transfer::public_transfer(predictor_coin, copy_record.predictor);

            // Return follower's share
            transfer::public_transfer(payout_coin, copy_record.follower);
        } else {
            // Position lost — no payout. Destroy the zero coin.
            coin::destroy_zero(payout_coin);
            follower_payout = 0;
            predictor_cut = 0;
        };

        // Update CopyRecord state
        copy_record.settled = true;
        copy_record.won = won;
        copy_record.gross_payout_dusd = gross;
        copy_record.follower_payout_dusd = follower_payout;
        copy_record.predictor_cut_dusd = predictor_cut;

        // Update predictor profile stats
        predictor_profile::record_settlement(
            predictor_profile,
            won,
            predictor_cut,
            copy_record.amount_dusd,
            clock,
        );

        event::emit(CopySettled {
            copy_record_id: object::id(copy_record),
            follower: copy_record.follower,
            predictor: copy_record.predictor,
            won,
            gross_payout_dusd: gross,
            follower_payout_dusd: follower_payout,
            predictor_cut_dusd: predictor_cut,
        });
    }

    // ── Read-Only Accessors ──────────────────────────────────────────────────

    public fun follower(r: &CopyRecord): address { r.follower }
    public fun predictor(r: &CopyRecord): address { r.predictor }
    public fun oracle_id(r: &CopyRecord): ID { r.oracle_id }
    public fun strike(r: &CopyRecord): u64 { r.strike }
    public fun is_up(r: &CopyRecord): bool { r.is_up }
    public fun expiry_ms(r: &CopyRecord): u64 { r.expiry_ms }
    public fun amount_dusd(r: &CopyRecord): u64 { r.amount_dusd }
    public fun settled(r: &CopyRecord): bool { r.settled }
    public fun won(r: &CopyRecord): bool { r.won }
    public fun follower_payout_dusd(r: &CopyRecord): u64 { r.follower_payout_dusd }
    public fun predictor_cut_dusd(r: &CopyRecord): u64 { r.predictor_cut_dusd }
}
