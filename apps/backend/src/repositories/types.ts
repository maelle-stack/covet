import type {
  Account,
  ActivityFeedResponse,
  BankConnectionStatus,
  Cents,
  Commitment,
  PurchaseCheck,
  RecurringItem,
  SafeToSpendSnapshot,
  Transaction,
  UpcomingResponse,
  User,
  UserSettings,
  Vault,
} from '@covet/shared-types';

/**
 * The raw persisted inputs the recalculation orchestrator needs to run the
 * Financial Engine. It returns durable data only; the orchestrator layers on
 * the not-yet-modeled signals (income cadence, expected income, pending
 * income, payoff behavior), which are pattern/Plaid-derived in later
 * checkpoints. Commitments/recurring are returned unfiltered — the
 * orchestrator selects what the engine should see.
 */
export interface EngineInputBundle {
  user: User;
  accounts: readonly Account[];
  transactions: readonly Transaction[];
  commitments: readonly Commitment[];
  recurringItems: readonly RecurringItem[];
  vaults: readonly Vault[];
  bankConnectionStatus: BankConnectionStatus;
  calendarConnected: boolean;
}

/** Fields a commitment confirm/deny mutation may set. */
export interface CommitmentStatusPatch {
  status: Commitment['status'];
  userConfirmed?: boolean;
  userDenied?: boolean;
  confirmedAmount?: Cents;
}

/** User-settings fields writable via PATCH /settings (notification prefs only). */
export interface UserSettingsPatch {
  notificationPrivacyLevel?: UserSettings['notificationPrivacyLevel'];
  dailyPacingNotificationsEnabled?: boolean;
  saleAlertsEnabled?: boolean;
  vaultNotificationsEnabled?: boolean;
  reviewPromptsEnabled?: boolean;
  biometricLockEnabled?: boolean;
  calendarSuggestionsEnabled?: boolean;
}

/**
 * The data access surface for the current endpoints. Route handlers depend
 * only on this interface; the storage backend (in-memory seed vs. Postgres)
 * is chosen at startup. Every method is scoped by `userId` — defense in depth
 * alongside RLS. A `null` return means "no such user / no data", which routes
 * translate into a calm 404.
 */
export interface CovetRepositories {
  // --- Reads (6.1) ---------------------------------------------------------
  getLatestSnapshot(userId: string): Promise<SafeToSpendSnapshot | null>;
  getActivity(userId: string): Promise<ActivityFeedResponse | null>;
  getUpcoming(userId: string): Promise<UpcomingResponse | null>;
  getUserSettings(userId: string): Promise<UserSettings | null>;
  getSeedPurchaseCheck(userId: string): Promise<PurchaseCheck | null>;

  // --- Recalculation + writes (6.2) ---------------------------------------
  /** Raw engine inputs for a user, or null if the user does not exist. */
  getEngineInputs(userId: string): Promise<EngineInputBundle | null>;
  /** Persists a freshly computed snapshot (the table is append-only). */
  appendSnapshot(snapshot: SafeToSpendSnapshot): Promise<void>;
  getCommitment(userId: string, commitmentId: string): Promise<Commitment | null>;
  /** Applies a status change; returns the updated commitment, or null if absent. */
  setCommitmentStatus(
    userId: string,
    commitmentId: string,
    patch: CommitmentStatusPatch,
  ): Promise<Commitment | null>;
  /** Applies a settings patch; returns the updated settings, or null if absent. */
  updateUserSettings(userId: string, patch: UserSettingsPatch): Promise<UserSettings | null>;

  /** Release any underlying resources (DB pool). No-op for in-memory. */
  close(): Promise<void>;
}

/**
 * The >=25-transaction Insights gate is a BACKEND rule
 * (docs/01_consumer_experience.md). It lives here so every data source
 * enforces it identically and the UI never re-derives it.
 */
export function gateInsights<T>(insights: readonly T[], transactionCount: number): readonly T[] {
  return transactionCount >= 25 ? insights : [];
}
