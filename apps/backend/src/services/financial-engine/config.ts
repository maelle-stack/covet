import type { Archetype, StrictnessLevel } from '@covet/shared-types';

/**
 * All tunable Financial Engine constants in one place, per instruction:
 * "Keep all of these configurable and well-tested. Do not hard-code them
 * deep inside the engine." Every magic number the engine uses lives here,
 * not inline in calculation modules. Values are the founder-approved v1
 * defaults; nothing here is derived from observed user behavior yet
 * (docs/02_financial_engine.md: "v1 should start with the primary
 * archetype only").
 */
export interface FinancialEngineConfig {
  /** Emergency floor as a fraction of usable checking cash. Starts at 10%. */
  emergencyFloorRate: number;

  /**
   * Behavior buffer, as a fraction of flexible discretionary cash (cash
   * remaining after the emergency floor, hard commitments, debt minimums,
   * and recurring bills/habits are protected), keyed by primary archetype
   * then strictness level.
   */
  behaviorBufferRates: Record<Archetype, Record<StrictnessLevel, number>>;

  /**
   * Additional percentage points added to the resolved behavior buffer rate
   * while HIGH_OBLIGATION_PRESSURE is active.
   */
  highObligationPressureBufferBonus: number;

  /** >= this share of confirmed pay-cycle income committed to mandatory obligations triggers HIGH_OBLIGATION_PRESSURE. */
  highObligationPressureThreshold: number;

  /** Pending income can only be considered within this many hours of the expected deposit. */
  pendingIncomeMaxHoursOut: number;
  /** Pending income adjustment is capped at this fraction of the expected deposit... */
  pendingIncomeCapRate: number;
  /** ...or this absolute cap, whichever is lower. */
  pendingIncomeCapAmountCents: number;

  /** Utilization tier upper bounds (exclusive), in ascending order. The last tier has no upper bound. */
  debtUtilizationTierBounds: {
    healthyMax: number; // < 0.10
    normalMax: number; // < 0.30
    elevatedMax: number; // < 0.50
    highMax: number; // < 0.75
    severeMax: number; // < 0.90
    // >= severeMax is 'critical'
  };
  /**
   * Debt pressure adjustment as a fraction of total revolving credit
   * balance, per tier. Approved v1 defaults (healthy 0%, normal 1%,
   * elevated 3%, high 6%, severe 12%, critical 20%) — these are
   * assumptions, not observed data, and should be tuned once the engine
   * has real usage to learn from.
   */
  debtPressureAdjustmentRates: {
    healthy: number;
    normal: number;
    elevated: number;
    high: number;
    severe: number;
    critical: number;
  };

  /** Trusted payoff adjustment: reduces the debt pressure penalty by this fraction. */
  trustedPayoffPenaltyReduction: number;
  /** Trusted payoff never applies at or above this utilization. */
  trustedPayoffMaxUtilization: number;
  /** Trusted payoff requires at least this many observed full-payoff cycles. */
  trustedPayoffMinObservedCycles: number;

  /** Rolling planning window (days) used when income is irregular and unconfirmed. */
  irregularIncomePlanningWindowDays: number;

  /** How many days out gradual commitment protection begins, per hardness x strictness. */
  protectionWindowDays: Record<'hard' | 'semi_hard' | 'soft', Record<StrictnessLevel, number>>;

  /** How long a snapshot is considered fresh before the client must show it as stale. */
  snapshotStaleAfterHours: number;

  /** Safe to Spend change materiality thresholds for major-change detection. */
  materiality: {
    /** Any change >= this fraction of the previous amount is material. */
    relativeChangeThreshold: number;
    /** Below this absolute Safe to Spend amount, a smaller dollar decrease is still material. */
    lowBalanceThresholdCents: number;
    /** Decrease threshold (cents) when the previous amount was below lowBalanceThresholdCents. */
    lowBalanceDecreaseThresholdCents: number;
    /** Decrease threshold (cents) otherwise. */
    normalDecreaseThresholdCents: number;
  };

  /** How near a hard/semi-hard commitment's due date must be to flag `commitmentAtRisk`, in days. */
  atRiskDueSoonDays: number;
  /** When income is unconfirmed/irregular, income is only treated as "soon" within this many days. */
  incomeSoonDays: number;

  /**
   * Internal confidence score (0-100) starts at 100 and is reduced by these
   * penalties (docs/02_financial_engine.md factors: fresh bank data,
   * confirmed income cadence, understood recurring obligations, low
   * pending/ambiguous transactions, connected calendar). These weights and
   * the label thresholds below are approved v1 assumptions, not derived
   * from real usage — they should be tuned once the engine has actual user
   * outcomes (notification accuracy, user-reported trust) to learn from.
   */
  confidencePenalties: {
    bankNotActive: number;
    incomeCadenceUnconfirmed: number;
    calendarDisconnected: number;
    /** Multiplied by the fraction of active commitments not yet user-confirmed. */
    unconfirmedCommitmentsMaxPenalty: number;
    /** Multiplied by pending-debit-to-cash ratio (clamped to 1). */
    pendingCashRatioMaxPenalty: number;
  };
  /** Internal score >= this maps to 'high'; >= the other maps to 'medium'; else 'still_learning'. */
  confidenceLabelThresholds: {
    high: number;
    medium: number;
  };

  /**
   * The internal pace projection is capped at this many days, primarily to
   * bound the array size for the irregular-income 30-day rolling window.
   */
  maxPaceProjectionDays: number;
  /** A day's total known-due amount vs. its base daily pace, used to classify PaceProjectionDay.riskLevel. */
  paceRiskThresholds: {
    /** total due / baseDailyPace >= this -> 'elevated'. */
    elevatedDueRatio: number;
    /** total due / baseDailyPace >= this -> 'high'. */
    highDueRatio: number;
  };
}

export const DEFAULT_FINANCIAL_ENGINE_CONFIG: FinancialEngineConfig = {
  emergencyFloorRate: 0.1,

  behaviorBufferRates: {
    keeper: { light: 0.04, balanced: 0.07, protective: 0.1 },
    builder: { light: 0.05, balanced: 0.08, protective: 0.12 },
    drifter: { light: 0.08, balanced: 0.12, protective: 0.18 },
    giver: { light: 0.09, balanced: 0.14, protective: 0.2 },
    spontaneous: { light: 0.1, balanced: 0.15, protective: 0.22 },
  },
  highObligationPressureBufferBonus: 0.05,
  highObligationPressureThreshold: 0.75,

  pendingIncomeMaxHoursOut: 72,
  pendingIncomeCapRate: 0.15,
  pendingIncomeCapAmountCents: 10_000, // $100.00

  debtUtilizationTierBounds: {
    healthyMax: 0.1,
    normalMax: 0.3,
    elevatedMax: 0.5,
    highMax: 0.75,
    severeMax: 0.9,
  },
  debtPressureAdjustmentRates: {
    healthy: 0,
    normal: 0.01,
    elevated: 0.03,
    high: 0.06,
    severe: 0.12,
    critical: 0.2,
  },

  trustedPayoffPenaltyReduction: 0.2,
  trustedPayoffMaxUtilization: 0.5,
  trustedPayoffMinObservedCycles: 3,

  irregularIncomePlanningWindowDays: 30,

  protectionWindowDays: {
    hard: { light: 10, balanced: 14, protective: 21 },
    semi_hard: { light: 5, balanced: 10, protective: 14 },
    soft: { light: 2, balanced: 4, protective: 7 },
  },

  snapshotStaleAfterHours: 6,

  materiality: {
    relativeChangeThreshold: 0.1,
    lowBalanceThresholdCents: 15_000, // $150
    lowBalanceDecreaseThresholdCents: 2_500, // $25
    normalDecreaseThresholdCents: 5_000, // $50
  },

  atRiskDueSoonDays: 3,
  incomeSoonDays: 7,

  confidencePenalties: {
    bankNotActive: 40,
    incomeCadenceUnconfirmed: 25,
    calendarDisconnected: 10,
    unconfirmedCommitmentsMaxPenalty: 15,
    pendingCashRatioMaxPenalty: 10,
  },
  confidenceLabelThresholds: {
    high: 75,
    medium: 45,
  },

  maxPaceProjectionDays: 31,
  paceRiskThresholds: {
    elevatedDueRatio: 0.5,
    highDueRatio: 1.0,
  },
};

/**
 * Shallow-per-section merge: a caller overriding `behaviorBufferRates`, for
 * example, must supply the whole nested record (partial archetype/strictness
 * overrides are not merged deeper than one level). This keeps the merge
 * logic simple and fully typed — no `any`.
 */
export function mergeFinancialEngineConfig(
  overrides: Partial<FinancialEngineConfig> | undefined,
): FinancialEngineConfig {
  if (!overrides) return DEFAULT_FINANCIAL_ENGINE_CONFIG;
  return { ...DEFAULT_FINANCIAL_ENGINE_CONFIG, ...overrides };
}
