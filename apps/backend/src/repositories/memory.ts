import type {
  Account,
  ActivityFeedResponse,
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

import {
  DEMO_USER_ID,
  demoAccounts,
  demoActions,
  demoCommitments,
  demoInsights,
  demoRecurring,
  demoSeedPurchaseCheck,
  demoSettings,
  demoSnapshot,
  demoTransactions,
  demoUser,
  demoVaults,
} from '../db/seed-data';
import {
  gateInsights,
  type CommitmentStatusPatch,
  type CovetRepositories,
  type EngineInputBundle,
  type UserSettingsPatch,
} from './types';

/** Deep clone so each repository instance owns isolated, mutable state. */
function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

interface MemoryStore {
  user: User;
  settings: UserSettings;
  accounts: Account[];
  transactions: Transaction[];
  commitments: Commitment[];
  recurring: RecurringItem[];
  vaults: Vault[];
  /** Append-only, newest last. */
  snapshots: SafeToSpendSnapshot[];
  seedPurchaseCheck: PurchaseCheck;
}

/**
 * In-memory repository backed by a mutable clone of the canonical demo
 * dataset. It is the default data source: the real backend serves reads,
 * recalculation, and writes with zero external services, so UI development,
 * CI, and the fixture→live switch all work without a database. Each instance
 * is isolated (fresh clone), which keeps route tests hermetic.
 */
export function createMemoryRepositories(): CovetRepositories {
  const store: MemoryStore = {
    user: clone(demoUser),
    settings: clone(demoSettings),
    accounts: clone(demoAccounts),
    transactions: clone(demoTransactions),
    commitments: clone(demoCommitments),
    recurring: clone(demoRecurring),
    vaults: clone(demoVaults),
    snapshots: [clone(demoSnapshot)],
    seedPurchaseCheck: clone(demoSeedPurchaseCheck),
  };

  const owns = (userId: string) => userId === DEMO_USER_ID;

  return {
    async getLatestSnapshot(userId): Promise<SafeToSpendSnapshot | null> {
      if (!owns(userId) || store.snapshots.length === 0) return null;
      return store.snapshots[store.snapshots.length - 1]!;
    },

    async getActivity(userId): Promise<ActivityFeedResponse | null> {
      if (!owns(userId)) return null;
      return {
        insights: gateInsights(clone(demoInsights), store.transactions.length),
        actions: demoActions,
        transactions: store.transactions,
      };
    },

    async getUpcoming(userId): Promise<UpcomingResponse | null> {
      if (!owns(userId)) return null;
      return {
        events: store.commitments.filter(
          (c) => c.commitmentType === 'event' || c.commitmentType === 'travel',
        ),
        recurring: store.recurring,
        vaults: store.vaults,
      };
    },

    async getUserSettings(userId): Promise<UserSettings | null> {
      return owns(userId) ? store.settings : null;
    },

    async getSeedPurchaseCheck(userId): Promise<PurchaseCheck | null> {
      return owns(userId) ? store.seedPurchaseCheck : null;
    },

    async getEngineInputs(userId): Promise<EngineInputBundle | null> {
      if (!owns(userId)) return null;
      return {
        user: store.user,
        accounts: store.accounts,
        transactions: store.transactions,
        commitments: store.commitments,
        recurringItems: store.recurring,
        vaults: store.vaults,
        // The demo has an active bank connection and a connected calendar
        // (the birthday dinner came from it). Real derivation from
        // bank/calendar connection rows arrives with those integrations.
        bankConnectionStatus: 'active',
        calendarConnected: true,
      };
    },

    async appendSnapshot(snapshot): Promise<void> {
      store.snapshots.push(clone(snapshot));
    },

    async getCommitment(userId, commitmentId): Promise<Commitment | null> {
      if (!owns(userId)) return null;
      return store.commitments.find((c) => c.id === commitmentId) ?? null;
    },

    async setCommitmentStatus(userId, commitmentId, patch): Promise<Commitment | null> {
      if (!owns(userId)) return null;
      const commitment = store.commitments.find((c) => c.id === commitmentId);
      if (!commitment) return null;
      applyCommitmentPatch(commitment, patch);
      return commitment;
    },

    async updateUserSettings(userId, patch): Promise<UserSettings | null> {
      if (!owns(userId)) return null;
      applySettingsPatch(store.settings, patch);
      return store.settings;
    },

    async close() {
      /* nothing to release */
    },
  };
}

function applyCommitmentPatch(commitment: Commitment, patch: CommitmentStatusPatch): void {
  commitment.status = patch.status;
  if (patch.userConfirmed !== undefined) commitment.userConfirmed = patch.userConfirmed;
  if (patch.userDenied !== undefined) commitment.userDenied = patch.userDenied;
  if (patch.confirmedAmount !== undefined) commitment.confirmedAmount = patch.confirmedAmount;
  commitment.updatedAt = new Date().toISOString();
}

function applySettingsPatch(settings: UserSettings, patch: UserSettingsPatch): void {
  if (patch.notificationPrivacyLevel !== undefined)
    settings.notificationPrivacyLevel = patch.notificationPrivacyLevel;
  if (patch.dailyPacingNotificationsEnabled !== undefined)
    settings.dailyPacingNotificationsEnabled = patch.dailyPacingNotificationsEnabled;
  if (patch.saleAlertsEnabled !== undefined) settings.saleAlertsEnabled = patch.saleAlertsEnabled;
  if (patch.vaultNotificationsEnabled !== undefined)
    settings.vaultNotificationsEnabled = patch.vaultNotificationsEnabled;
  if (patch.reviewPromptsEnabled !== undefined)
    settings.reviewPromptsEnabled = patch.reviewPromptsEnabled;
  if (patch.biometricLockEnabled !== undefined)
    settings.biometricLockEnabled = patch.biometricLockEnabled;
  if (patch.calendarSuggestionsEnabled !== undefined)
    settings.calendarSuggestionsEnabled = patch.calendarSuggestionsEnabled;
  settings.updatedAt = new Date().toISOString();
}
