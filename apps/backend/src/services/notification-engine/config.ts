/**
 * All tunable Notification Engine constants (docs/03_notification_engine.md).
 * Nothing here is hard-coded inside decision modules; override per call via
 * `NotificationEngineInput.config`. Like the Financial Engine config, these
 * are v1 assumptions to be tuned against real notification outcomes (open
 * rate, action taken, opt-out rate) once the product is live.
 */
export interface NotificationEngineConfig {
  /**
   * Maximum non-Protect notifications per rolling 24h window. The spec says
   * "zero to two per day"; v1 approximates "per day" as a rolling 24h count
   * so the engine stays pure (no per-user calendar-day bookkeeping).
   * Protect-severity events are exempt.
   */
  dailyCapNonProtect: number;

  /** Fallback quiet hours when settings are missing (spec default 21:00–09:00). */
  defaultQuietHoursStart: string;
  defaultQuietHoursEnd: string;

  /**
   * Anti-stacking delay for transaction-triggered notifications so Covet
   * doesn't ping at the same instant as Apple Pay/bank/merchant alerts.
   * Spec allows 3–10 minutes.
   */
  transactionTriggeredDelayMinutes: number;

  /**
   * If the user opened the app after the event occurred (they already saw
   * the updated Home state), suppress the corresponding money-state push.
   */
  suppressWhenSeenInApp: boolean;

  /** Repeat warnings about the same behavior/commitment are suppressed within this window unless worsened. */
  duplicateSuppressionWindowHours: number;

  /**
   * Calendar/pattern Review pushes only go out if the user hasn't opened
   * the app within this many hours (otherwise the item waits in-app as an
   * Action).
   */
  reviewPushMinHoursSinceAppOpen: number;

  /** Repetitive-behavior notifications require at least this many observed occurrences. */
  repetitiveBehaviorMinOccurrences: number;

  /** Sale alerts require at least this discount fraction to be "meaningful". */
  saleAlertMinDiscountFraction: number;

  /**
   * Safe to Spend change materiality (mirrors the Financial Engine's rule):
   * any status change, any change > relativeChangeThreshold, or a decrease
   * >= the dollar threshold for the balance band.
   */
  materiality: {
    relativeChangeThreshold: number;
    lowBalanceThresholdCents: number;
    lowBalanceDecreaseThresholdCents: number;
    normalDecreaseThresholdCents: number;
    /** Increases (non-payday) must be at least this large to notify. */
    minIncreaseCents: number;
  };
}

export const DEFAULT_NOTIFICATION_ENGINE_CONFIG: NotificationEngineConfig = {
  dailyCapNonProtect: 2,

  defaultQuietHoursStart: '21:00',
  defaultQuietHoursEnd: '09:00',

  transactionTriggeredDelayMinutes: 5,

  suppressWhenSeenInApp: true,
  duplicateSuppressionWindowHours: 24,
  reviewPushMinHoursSinceAppOpen: 48,

  repetitiveBehaviorMinOccurrences: 3,
  saleAlertMinDiscountFraction: 0.15,

  materiality: {
    relativeChangeThreshold: 0.1,
    lowBalanceThresholdCents: 15_000, // $150
    lowBalanceDecreaseThresholdCents: 2_500, // $25
    normalDecreaseThresholdCents: 5_000, // $50
    minIncreaseCents: 5_000, // $50
  },
};

export function mergeNotificationEngineConfig(
  overrides: Partial<NotificationEngineConfig> | undefined,
): NotificationEngineConfig {
  if (!overrides) return DEFAULT_NOTIFICATION_ENGINE_CONFIG;
  return { ...DEFAULT_NOTIFICATION_ENGINE_CONFIG, ...overrides };
}
