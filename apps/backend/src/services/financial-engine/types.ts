import type {
  Account,
  Archetype,
  BankConnectionStatus,
  Cents,
  Commitment,
  ISODateTimeString,
  RecurringItem,
  SafeToSpendSnapshot,
  StrictnessLevel,
  Transaction,
  UUID,
  Vault,
} from '@covet/shared-types';

import type { FinancialEngineConfig } from './config';

/**
 * Income cadence detection is not one of the 19 persisted models
 * (docs/05_engineering_architecture.md); it is derived from confirmed
 * `payday_cadence` Patterns and passed into the engine as a plain input.
 */
export const INCOME_CADENCE_TYPES = [
  'weekly',
  'biweekly',
  'semimonthly',
  'monthly',
  'irregular',
] as const;
export type IncomeCadenceType = (typeof INCOME_CADENCE_TYPES)[number];

export interface IncomeCadenceInput {
  type: IncomeCadenceType;
  /** Whether the user has confirmed this cadence (docs/02_financial_engine.md). */
  confirmed: boolean;
  /** Next expected income date, when knowable. Null for unconfirmed irregular income. */
  nextExpectedAt: ISODateTimeString | null;
}

/**
 * A specific expected-but-not-yet-landed deposit, considered only for the
 * capped pending-income adjustment (docs/02_financial_engine.md).
 */
export interface PendingIncomeInput {
  expectedAmount: Cents;
  expectedAt: ISODateTimeString;
  /** High confidence is required for any adjustment to apply. */
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Aggregate signal about the user's credit payoff history, used only for
 * the trusted-payoff debt-pressure reduction.
 */
export interface PayoffBehaviorInput {
  /** Consecutive cycles the user paid revolving balances in full/near-full, on time. */
  consecutiveOnTimeFullPayoffCycles: number;
  /** True if any minimum payment is currently at risk of being missed. */
  minimumPaymentAtRisk: boolean;
}

export interface SafeToSpendEngineInput {
  userId: UUID;
  /** Injected for determinism/testability instead of reading the system clock. */
  now: ISODateTimeString;

  accounts: readonly Account[];
  /** Pending, non-transfer debit transactions not yet reflected in `Account.currentBalance`. */
  transactions: readonly Transaction[];

  /** Active commitments (any status except `denied`/`completed`). */
  commitments: readonly Commitment[];
  /** Confirmed recurring bills/subscriptions/habits not already linked to a Commitment. */
  recurringItems: readonly RecurringItem[];
  /** Only vaults with `activelyProtected: true` affect Safe to Spend. */
  vaults: readonly Vault[];

  primaryArchetype: Archetype;
  strictness: StrictnessLevel;

  /**
   * Confirmed income expected to land during the current pay cycle, used
   * ONLY for the obligation-pressure ratio (docs/02_financial_engine.md:
   * "share of confirmed income for the pay cycle already accounted for by
   * mandatory obligations"). Distinct from `pendingIncome`, which is a
   * specific near-term deposit eligible for the small capped adjustment.
   */
  expectedCycleIncome: Cents;

  incomeCadence: IncomeCadenceInput;
  pendingIncome: PendingIncomeInput | null;
  payoffBehavior: PayoffBehaviorInput;

  bankConnectionStatus: BankConnectionStatus;
  calendarConnected: boolean;

  /** Previous snapshot, used for major-change-flag detection. Null for a user's first calculation. */
  previousSnapshot: SafeToSpendSnapshot | null;

  /** Overrides merged onto `DEFAULT_FINANCIAL_ENGINE_CONFIG`. */
  config?: Partial<FinancialEngineConfig>;
}
