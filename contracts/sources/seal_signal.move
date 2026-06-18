/// seal_signal module — on-chain access policy for Seal-encrypted trade reasoning.
///
/// Flow:
///   1. Predictor encrypts reasoning off-chain using @mysten/seal SDK
///   2. Predictor uploads encrypted blob to Walrus → gets blob_id
///   3. Predictor calls create_policy(blob_id, fee_cents) → creates SignalPolicy
///   4. Follower calls pay_signal_fee(policy, payment) → added to paid_wallets
///   5. Seal key server checks has_paid(policy, follower_address) via RPC
///   6. If true → Seal releases decryption key → follower decrypts blob locally
module echo::seal_signal {
    use sui::coin::{Self, Coin};
    use sui::event;
    use sui::vec_set::{Self, VecSet};
    use echo::predictor_profile::{Self, PredictorProfile};

    // ── Errors ───────────────────────────────────────────────────────────────
    const EAlreadyPaid: u64 = 0;
    const EInsufficientPayment: u64 = 1;
    const EZeroFee: u64 = 2;

    // ── Structs ──────────────────────────────────────────────────────────────

    /// Shared object — access policy for one encrypted signal blob.
    public struct SignalPolicy has key, store {
        id: UID,
        predictor: address,
        predictor_profile_id: ID,
        /// Walrus blob ID (raw bytes)
        blob_id: vector<u8>,
        /// Fee in dUSDC base units (6 decimals) to unlock signal
        fee_dusd: u64,
        /// Wallets that have paid the fee
        paid_wallets: VecSet<address>,
        /// Running total collected
        total_collected_dusd: u64,
    }

    // ── Events ───────────────────────────────────────────────────────────────

    public struct PolicyCreated has copy, drop {
        policy_id: ID,
        predictor: address,
        blob_id: vector<u8>,
        fee_dusd: u64,
    }

    public struct SignalUnlocked has copy, drop {
        policy_id: ID,
        unlocker: address,
        fee_dusd: u64,
    }

    // ── Public Entry ─────────────────────────────────────────────────────────

    /// Predictor registers an encrypted reasoning blob with an unlock fee.
    public entry fun create_policy(
        predictor_profile: &PredictorProfile,
        blob_id: vector<u8>,
        fee_dusd: u64,
        ctx: &mut TxContext,
    ) {
        assert!(fee_dusd > 0, EZeroFee);

        let predictor_profile_id = object::id(predictor_profile);

        let policy = SignalPolicy {
            id: object::new(ctx),
            predictor: ctx.sender(),
            predictor_profile_id,
            blob_id,
            fee_dusd,
            paid_wallets: vec_set::empty(),
            total_collected_dusd: 0,
        };

        event::emit(PolicyCreated {
            policy_id: object::id(&policy),
            predictor: ctx.sender(),
            blob_id: policy.blob_id,
            fee_dusd,
        });

        transfer::share_object(policy);
    }

    /// Follower pays the signal fee to be added to paid_wallets.
    /// Seal key server checks this mapping before releasing the decryption key.
    public entry fun pay_signal_fee<DUSD>(
        policy: &mut SignalPolicy,
        predictor_profile: &mut PredictorProfile,
        payment: Coin<DUSD>,
        ctx: &mut TxContext,
    ) {
        let caller = ctx.sender();
        assert!(!vec_set::contains(&policy.paid_wallets, &caller), EAlreadyPaid);
        assert!(coin::value(&payment) >= policy.fee_dusd, EInsufficientPayment);

        // Exact fee extraction — return change if overpaid
        let fee_coin = if (coin::value(&payment) > policy.fee_dusd) {
            let mut payment_mut = payment;
            let exact = coin::split(&mut payment_mut, policy.fee_dusd, ctx);
            transfer::public_transfer(payment_mut, caller);
            exact
        } else {
            payment
        };

        // Transfer fee directly to predictor wallet
        transfer::public_transfer(fee_coin, policy.predictor);

        vec_set::insert(&mut policy.paid_wallets, caller);
        policy.total_collected_dusd = policy.total_collected_dusd + policy.fee_dusd;

        // Update predictor's signal earnings
        predictor_profile::add_signal_earnings(predictor_profile, policy.fee_dusd);

        event::emit(SignalUnlocked {
            policy_id: object::id(policy),
            unlocker: caller,
            fee_dusd: policy.fee_dusd,
        });
    }

    // ── Read-Only ────────────────────────────────────────────────────────────

    /// Seal key server calls this (via on-chain read) to verify payment before releasing key.
    public fun has_paid(policy: &SignalPolicy, wallet: address): bool {
        vec_set::contains(&policy.paid_wallets, &wallet)
    }

    public fun fee_dusd(policy: &SignalPolicy): u64 { policy.fee_dusd }
    public fun blob_id(policy: &SignalPolicy): &vector<u8> { &policy.blob_id }
    public fun predictor(policy: &SignalPolicy): address { policy.predictor }
    public fun total_collected_dusd(policy: &SignalPolicy): u64 { policy.total_collected_dusd }
}
