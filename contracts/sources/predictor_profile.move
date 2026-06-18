module echo::predictor_profile {
    use std::string::String;
    use sui::clock::Clock;
    use sui::event;
    use sui::table::{Self, Table};

    // ── Errors ──────────────────────────────────────────────────────────────
    const EProfileAlreadyExists: u64 = 0;
    const EProfileNotFound: u64 = 1;
    const EDisplayNameTooLong: u64 = 2;
    const MAX_DISPLAY_NAME_LEN: u64 = 32;

    // ── Structs ──────────────────────────────────────────────────────────────

    /// Singleton shared registry — maps wallet address → PredictorProfile ID
    public struct ProfileRegistry has key {
        id: UID,
        profiles: Table<address, ID>,
        total_predictors: u64,
    }

    /// Per-predictor on-chain stats object (shared so anyone can read)
    public struct PredictorProfile has key, store {
        id: UID,
        wallet: address,
        display_name: String,
        total_trades: u64,
        winning_trades: u64,
        /// win rate in basis points (6500 = 65.00%)
        win_rate_bps: u64,
        total_volume_cents: u64,
        copy_earnings_cents: u64,
        signal_earnings_cents: u64,
        current_streak: u64,
        best_streak: u64,
        follower_count: u64,
        created_at_ms: u64,
        last_trade_at_ms: u64,
    }

    // ── Events ───────────────────────────────────────────────────────────────

    public struct ProfileCreated has copy, drop {
        profile_id: ID,
        wallet: address,
        display_name: String,
    }

    public struct SettlementRecorded has copy, drop {
        profile_id: ID,
        won: bool,
        copy_earnings_cents: u64,
        new_win_rate_bps: u64,
        new_streak: u64,
    }

    // ── Init ─────────────────────────────────────────────────────────────────

    fun init(ctx: &mut TxContext) {
        let registry = ProfileRegistry {
            id: object::new(ctx),
            profiles: table::new(ctx),
            total_predictors: 0,
        };
        transfer::share_object(registry);
    }

    // ── Public Entry ─────────────────────────────────────────────────────────

    /// Create a PredictorProfile for the calling wallet.
    /// One profile per wallet, enforced via the registry table.
    public entry fun create_profile(
        registry: &mut ProfileRegistry,
        display_name: String,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let sender = ctx.sender();
        assert!(
            !table::contains(&registry.profiles, sender),
            EProfileAlreadyExists,
        );
        assert!(
            display_name.length() <= MAX_DISPLAY_NAME_LEN,
            EDisplayNameTooLong,
        );

        let profile = PredictorProfile {
            id: object::new(ctx),
            wallet: sender,
            display_name,
            total_trades: 0,
            winning_trades: 0,
            win_rate_bps: 0,
            total_volume_cents: 0,
            copy_earnings_cents: 0,
            signal_earnings_cents: 0,
            current_streak: 0,
            best_streak: 0,
            follower_count: 0,
            created_at_ms: clock.timestamp_ms(),
            last_trade_at_ms: 0,
        };

        let profile_id = object::id(&profile);

        event::emit(ProfileCreated {
            profile_id,
            wallet: sender,
            display_name: profile.display_name,
        });

        table::add(&mut registry.profiles, sender, profile_id);
        registry.total_predictors = registry.total_predictors + 1;

        transfer::share_object(profile);
    }

    // ── Package-Internal ─────────────────────────────────────────────────────

    /// Called by copy_trade module on settlement.
    public(package) fun record_settlement(
        profile: &mut PredictorProfile,
        won: bool,
        copy_earnings_cents: u64,
        volume_cents: u64,
        clock: &Clock,
    ) {
        profile.total_trades = profile.total_trades + 1;
        profile.total_volume_cents = profile.total_volume_cents + volume_cents;
        profile.last_trade_at_ms = clock.timestamp_ms();

        if (won) {
            profile.winning_trades = profile.winning_trades + 1;
            profile.copy_earnings_cents = profile.copy_earnings_cents + copy_earnings_cents;
            profile.current_streak = profile.current_streak + 1;
            if (profile.current_streak > profile.best_streak) {
                profile.best_streak = profile.current_streak;
            };
        } else {
            profile.current_streak = 0;
        };

        // Recalculate win rate in BPS
        if (profile.total_trades > 0) {
            profile.win_rate_bps =
                (profile.winning_trades * 10000) / profile.total_trades;
        };

        event::emit(SettlementRecorded {
            profile_id: object::id(profile),
            won,
            copy_earnings_cents,
            new_win_rate_bps: profile.win_rate_bps,
            new_streak: profile.current_streak,
        });
    }

    /// Called when a follower copies a trade from this predictor.
    public(package) fun add_follower(profile: &mut PredictorProfile) {
        profile.follower_count = profile.follower_count + 1;
    }

    /// Add signal fee earnings.
    public(package) fun add_signal_earnings(
        profile: &mut PredictorProfile,
        amount_cents: u64,
    ) {
        profile.signal_earnings_cents = profile.signal_earnings_cents + amount_cents;
    }

    // ── Read-Only Accessors ──────────────────────────────────────────────────

    public fun wallet(profile: &PredictorProfile): address { profile.wallet }
    public fun display_name(profile: &PredictorProfile): &String { &profile.display_name }
    public fun total_trades(profile: &PredictorProfile): u64 { profile.total_trades }
    public fun win_rate_bps(profile: &PredictorProfile): u64 { profile.win_rate_bps }
    public fun follower_count(profile: &PredictorProfile): u64 { profile.follower_count }
    public fun copy_earnings_cents(profile: &PredictorProfile): u64 { profile.copy_earnings_cents }
    public fun current_streak(profile: &PredictorProfile): u64 { profile.current_streak }
    public fun best_streak(profile: &PredictorProfile): u64 { profile.best_streak }

    public fun has_profile(registry: &ProfileRegistry, wallet: address): bool {
        table::contains(&registry.profiles, wallet)
    }

    public fun get_profile_id(registry: &ProfileRegistry, wallet: address): ID {
        assert!(table::contains(&registry.profiles, wallet), EProfileNotFound);
        *table::borrow(&registry.profiles, wallet)
    }

    public fun total_predictors(registry: &ProfileRegistry): u64 {
        registry.total_predictors
    }
}
