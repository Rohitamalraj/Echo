import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import { Transaction } from "@mysten/sui/transactions";
import {
  ECHO_PACKAGE_ID,
  PROFILE_REGISTRY_ID,
  PREDICT_PACKAGE_ID,
  PREDICT_OBJECT_ID,
  DUSDC_TYPE,
  SUI_NETWORK,
  MIN_QUANTITY,
} from "./constants";

// ── Client ───────────────────────────────────────────────────────────────────

export const suiClient = new SuiJsonRpcClient({
  url: getJsonRpcFullnodeUrl(SUI_NETWORK as "testnet"),
  network: SUI_NETWORK as "testnet",
});

// ── Types ────────────────────────────────────────────────────────────────────

export interface PredictorProfileFields {
  id: { id: string };
  wallet: string;
  display_name: string;
  total_trades: string;
  winning_trades: string;
  win_rate_bps: string;
  total_volume_cents: string;
  copy_earnings_cents: string;
  signal_earnings_cents: string;
  current_streak: string;
  best_streak: string;
  follower_count: string;
  created_at_ms: string;
  last_trade_at_ms: string;
}

export interface CopyRecordFields {
  id: { id: string };
  follower: string;
  predictor: string;
  predictor_profile_id: string;
  oracle_id: string;
  strike: string;
  is_up: boolean;
  expiry_ms: string;
  amount_dusd: string;
  created_at_ms: string;
  settled: boolean;
  won: boolean;
  gross_payout_dusd: string;
  follower_payout_dusd: string;
  predictor_cut_dusd: string;
}

// ── Read Functions ────────────────────────────────────────────────────────────

/** Check if a wallet has a PredictorProfile in the registry.
 *
 *  The `profiles` field is a Sui Table<address, ID>. Table entries are stored
 *  as dynamic fields on the Table's UID — they do NOT appear in the object's
 *  content fields. We must:
 *  1. Read the registry to get the Table object ID
 *  2. Call getDynamicFieldObject on that Table ID with the wallet address as key
 */
export async function hasProfile(wallet: string): Promise<boolean> {
  try {
    const registry = await suiClient.getObject({
      id: PROFILE_REGISTRY_ID,
      options: { showContent: true },
    });

    if (!registry.data?.content || registry.data.content.dataType !== "moveObject") {
      return false;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fields = registry.data.content.fields as any;
    const tableId: string | undefined = fields?.profiles?.fields?.id?.id;
    if (!tableId) return false;

    const entry = await suiClient.getDynamicFieldObject({
      parentId: tableId,
      name: { type: "address", value: wallet },
    });

    return !!entry.data && !entry.error;
  } catch {
    return false;
  }
}

/** Fetch a PredictorProfile by object ID */
export async function getProfile(
  profileId: string
): Promise<PredictorProfileFields | null> {
  const obj = await suiClient.getObject({
    id: profileId,
    options: { showContent: true },
  });
  if (!obj.data?.content || obj.data.content.dataType !== "moveObject") {
    return null;
  }
  return obj.data.content.fields as unknown as PredictorProfileFields;
}

/** Query all PredictorProfile objects (for leaderboard) */
export async function fetchAllProfiles(): Promise<
  PredictorProfileFields[]
> {
  const events = await suiClient.queryEvents({
    query: {
      MoveEventType: `${ECHO_PACKAGE_ID}::predictor_profile::ProfileCreated`,
    },
    limit: 100,
  });

  const profileIds = events.data.map(
    (e) => (e.parsedJson as { profile_id: string }).profile_id
  );

  if (profileIds.length === 0) return [];

  const objects = await suiClient.multiGetObjects({
    ids: profileIds,
    options: { showContent: true },
  });

  return objects
    .filter(
      (obj) =>
        obj.data?.content && obj.data.content.dataType === "moveObject"
    )
    .map((obj) => {
      const content = obj.data!.content!;
      if (content.dataType !== 'moveObject') return null;
      return content.fields as unknown as PredictorProfileFields;
    })
    .filter((x): x is PredictorProfileFields => x !== null);
}

/** Query CopyRecord events to build the social feed */
export async function fetchCopyCreatedEvents(limit = 50) {
  return suiClient.queryEvents({
    query: {
      MoveEventType: `${ECHO_PACKAGE_ID}::copy_trade::CopyCreated`,
    },
    limit,
    order: "descending",
  });
}

/** Query settled copy events */
export async function fetchCopySettledEvents(limit = 50) {
  return suiClient.queryEvents({
    query: {
      MoveEventType: `${ECHO_PACKAGE_ID}::copy_trade::CopySettled`,
    },
    limit,
    order: "descending",
  });
}

/** Get all CopyRecord objects owned/created by a wallet (via events) */
export async function fetchFollowerCopies(wallet: string) {
  const events = await suiClient.queryEvents({
    query: {
      MoveEventType: `${ECHO_PACKAGE_ID}::copy_trade::CopyCreated`,
    },
    limit: 200,
  });
  return events.data.filter(
    (e) => (e.parsedJson as { follower: string }).follower === wallet
  );
}

// ── Transaction Builders ──────────────────────────────────────────────────────

/** Build a PTB to create a predictor profile */
export function buildCreateProfileTx(displayName: string): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${ECHO_PACKAGE_ID}::predictor_profile::create_profile`,
    arguments: [
      tx.object(PROFILE_REGISTRY_ID),
      tx.pure.string(displayName),
      tx.object("0x6"), // Clock system object
    ],
  });
  return tx;
}

/** Build a PTB to record a copy on-chain + call predict::mint in same transaction.
 *
 *  Steps (atomic PTB):
 *  1. predict::create_manager  (if follower doesn't have a PredictManager)
 *  2. predict_manager::deposit (deposit dUSDC into manager)
 *  3. predict::mint            (open position on DeepBook Predict)
 *  4. echo::copy_trade::create_copy (record the link on-chain)
 */
export function buildCreateCopyTx(params: {
  predictorProfileId: string | null; // null = predictor has no Echo profile, skip create_copy
  oracleId: string;
  strike: bigint;
  isUp: boolean;
  expiryMs: bigint;
  amountDusd: bigint;
  managerObjectId: string;
  dusdCoinObjectId: string;
}): Transaction {
  const {
    predictorProfileId,
    oracleId,
    strike,
    isUp,
    expiryMs,
    amountDusd,
    managerObjectId,
    dusdCoinObjectId,
  } = params;

  // Enforce minimum quantity
  const safeAmount = amountDusd < MIN_QUANTITY ? MIN_QUANTITY : amountDusd;

  const tx = new Transaction();

  // Split exactly the copy amount so the rest stays in wallet
  const [copyCoin] = tx.splitCoins(tx.object(dusdCoinObjectId), [
    tx.pure.u64(safeAmount),
  ]);

  // Step 1: Deposit into follower's PredictManager
  tx.moveCall({
    target: `${PREDICT_PACKAGE_ID}::predict_manager::deposit`,
    typeArguments: [DUSDC_TYPE],
    arguments: [tx.object(managerObjectId), copyCoin],
  });

  // Step 2: Mint position on DeepBook Predict
  const marketKey = tx.moveCall({
    target: `${PREDICT_PACKAGE_ID}::market_key::${isUp ? "up" : "down"}`,
    arguments: [
      tx.pure.id(oracleId),
      tx.pure.u64(expiryMs),
      tx.pure.u64(strike),
    ],
  });

  tx.moveCall({
    target: `${PREDICT_PACKAGE_ID}::predict::mint`,
    typeArguments: [DUSDC_TYPE],
    arguments: [
      tx.object(PREDICT_OBJECT_ID),
      tx.object(managerObjectId),
      tx.object(oracleId),
      marketKey,
      tx.pure.u64(safeAmount),
      tx.object("0x6"), // Clock
    ],
  });

  // Step 3: Record the copy on Echo (only if predictor has an Echo profile)
  if (predictorProfileId) tx.moveCall({
    target: `${ECHO_PACKAGE_ID}::copy_trade::create_copy`,
    arguments: [
      tx.object(PROFILE_REGISTRY_ID),
      tx.object(predictorProfileId),
      tx.pure.id(oracleId),
      tx.pure.u64(strike),
      tx.pure.bool(isUp),
      tx.pure.u64(expiryMs),
      tx.pure.u64(amountDusd),
      tx.object("0x6"), // Clock
    ],
  });

  return tx;
}

/** Build a PTB to post a predictor's own trade (predict::mint only) */
export function buildPostTradeTx(params: {
  oracleId: string;
  strike: bigint;
  isUp: boolean;
  expiryMs: bigint;
  quantity: bigint;
  managerObjectId: string;
  dusdCoinObjectId: string;
}): Transaction {
  const {
    oracleId,
    strike,
    isUp,
    expiryMs,
    quantity,
    managerObjectId,
    dusdCoinObjectId,
  } = params;

  // Enforce minimum quantity (contract requires >= 1_000_000 µcontracts)
  const safeQuantity = quantity < MIN_QUANTITY ? MIN_QUANTITY : quantity;

  const tx = new Transaction();

  // Split exactly the trade amount from the wallet coin so the rest stays in wallet
  const [tradeCoin] = tx.splitCoins(tx.object(dusdCoinObjectId), [
    tx.pure.u64(safeQuantity),
  ]);

  // Deposit into manager — covers cost since cost = quantity × ask_price / 1e9 ≤ quantity
  tx.moveCall({
    target: `${PREDICT_PACKAGE_ID}::predict_manager::deposit`,
    typeArguments: [DUSDC_TYPE],
    arguments: [tx.object(managerObjectId), tradeCoin],
  });

  // market_key::up or market_key::down — direction encoded in function name
  const marketKey = tx.moveCall({
    target: `${PREDICT_PACKAGE_ID}::market_key::${isUp ? "up" : "down"}`,
    arguments: [
      tx.pure.id(oracleId),
      tx.pure.u64(expiryMs),
      tx.pure.u64(strike),
    ],
  });

  // Mint position
  tx.moveCall({
    target: `${PREDICT_PACKAGE_ID}::predict::mint`,
    typeArguments: [DUSDC_TYPE],
    arguments: [
      tx.object(PREDICT_OBJECT_ID),
      tx.object(managerObjectId),
      tx.object(oracleId),
      marketKey,
      tx.pure.u64(safeQuantity),
      tx.object("0x6"),
    ],
  });

  return tx;
}

/** Build a PTB to settle a copy and enforce 85/15 split.
 *
 *  Steps:
 *  1. predict::redeem_permissionless → payout into manager balance
 *  2. predict_manager::withdraw      → Coin<DUSD>
 *  3. echo::copy_trade::settle_copy  → split 85/15, emit CopySettled
 */
export function buildSettleCopyTx(params: {
  copyRecordId: string;
  predictorProfileId: string;
  managerObjectId: string;
  oracleId: string;
  strike: bigint;
  isUp: boolean;
  expiryMs: bigint;
  quantity: bigint;
  payoutAmount: bigint;
}): Transaction {
  const {
    copyRecordId,
    predictorProfileId,
    managerObjectId,
    oracleId,
    strike,
    isUp,
    expiryMs,
    quantity,
    payoutAmount,
  } = params;

  const tx = new Transaction();

  const marketKey = tx.moveCall({
    target: `${PREDICT_PACKAGE_ID}::market_key::${isUp ? "up" : "down"}`,
    arguments: [
      tx.pure.id(oracleId),
      tx.pure.u64(expiryMs),
      tx.pure.u64(strike),
    ],
  });

  // Step 1: Redeem permissionlessly (oracle must be settled)
  tx.moveCall({
    target: `${PREDICT_PACKAGE_ID}::predict::redeem_permissionless`,
    typeArguments: [DUSDC_TYPE],
    arguments: [
      tx.object(PREDICT_OBJECT_ID),
      tx.object(managerObjectId),
      tx.object(oracleId),
      marketKey,
      tx.pure.u64(quantity),
      tx.object("0x6"),
    ],
  });

  // Step 2: Withdraw payout from manager
  const [payoutCoin] = tx.moveCall({
    target: `${PREDICT_PACKAGE_ID}::predict_manager::withdraw`,
    typeArguments: [DUSDC_TYPE],
    arguments: [
      tx.object(managerObjectId),
      tx.pure.u64(payoutAmount),
    ],
  });

  // Step 3: Enforce 85/15 split via Echo contract
  tx.moveCall({
    target: `${ECHO_PACKAGE_ID}::copy_trade::settle_copy`,
    typeArguments: [DUSDC_TYPE],
    arguments: [
      tx.object(copyRecordId),
      payoutCoin,
      tx.object(predictorProfileId),
      tx.object("0x6"),
    ],
  });

  return tx;
}

/** Create a PredictManager (one per wallet, needed before first mint) */
export function buildCreateManagerTx(): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${PREDICT_PACKAGE_ID}::predict::create_manager`,
    arguments: [],
  });
  return tx;
}
