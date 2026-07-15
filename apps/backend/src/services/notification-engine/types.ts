import type {
  CalendarEvent,
  Cents,
  Commitment,
  ISODateTimeString,
  NotificationPrivacyLevel,
  NotificationSeverity,
  NotificationTriggerType,
  Pattern,
  PurchaseCheck,
  QuietHours,
  RecurringItem,
  SafeToSpendSnapshot,
  SpendStatus,
  UUID,
  Vault,
} from '@covet/shared-types';

import type { NotificationEngineConfig } from './config';

/**
 * Structured candidate events consumed by the Notification Engine
 * (docs/03_notification_engine.md: "The Notification Engine should operate
 * from structured events... It should not independently calculate Safe to
 * Spend or infer financial risk from raw transactions."). Emitters (the
 * Financial Engine, sync jobs, purchase check, vaults, connection health)
 * construct these; this engine only judges whether/when/how to notify.
 */
interface CandidateEventBase {
  id: UUID;
  userId: UUID;
  occurredAt: ISODateTimeString;
  /**
   * After this moment the event is no longer worth delivering (e.g. a
   * quiet-hours-delayed "brunch pause" for a weekend already over).
   * Null = does not expire.
   */
  expiresAt: ISODateTimeString | null;
}

export interface StatusChangeEvent extends CandidateEventBase {
  type: 'status_change';
  statusBefore: SpendStatus;
  statusAfter: SpendStatus;
  snapshot: SafeToSpendSnapshot;
}

export interface SafeToSpendIncreaseEvent extends CandidateEventBase {
  type: 'safe_to_spend_increase';
  amountBefore: Cents;
  amountAfter: Cents;
  /** True when the increase came from income landing (payday). */
  paydayRelated: boolean;
  snapshot: SafeToSpendSnapshot;
}

export interface SafeToSpendDecreaseEvent extends CandidateEventBase {
  type: 'safe_to_spend_decrease';
  amountBefore: Cents;
  amountAfter: Cents;
  /**
   * True when caused by card/bank transactions — these get the short
   * anti-stacking delay so Covet doesn't ping at the same moment as Apple
   * Pay / bank / merchant notifications.
   */
  transactionTriggered: boolean;
  /** Short human labels for what drove the drop, e.g. ["groceries", "your phone bill"]. */
  drivers: readonly string[];
  snapshot: SafeToSpendSnapshot;
}

export interface CommitmentProtectedEvent extends CandidateEventBase {
  type: 'commitment_protected';
  commitment: Commitment;
  /** Due soon enough that the reassurance is meaningful. */
  nearTerm: boolean;
  /** Was previously partial/at_risk — protection is news, not noise. */
  previouslyUncertain: boolean;
}

export interface CommitmentAtRiskEvent extends CandidateEventBase {
  type: 'commitment_at_risk';
  commitment: Commitment;
  /** True when the situation is worse than the last time the user was warned. */
  worsenedSinceLastWarning: boolean;
}

export interface PurchaseCheckFollowUpEvent extends CandidateEventBase {
  type: 'purchase_check_follow_up';
  purchaseCheck: PurchaseCheck;
  /** The prior "wait" item is now safe to buy. */
  nowSafe: boolean;
  /** Why the decision changed, e.g. "payday landed". */
  reasonChanged: string;
}

export interface VaultAffordabilityEvent extends CandidateEventBase {
  type: 'vault_affordability';
  vault: Vault;
  becameAffordable: boolean;
  affordabilityDateChangedMaterially: boolean;
  noLongerFits: boolean;
}

export interface SaleAlertEvent extends CandidateEventBase {
  type: 'sale_alert';
  vault: Vault;
  /** 0..1 fraction off the tracked price. */
  discountFraction: number;
  /** The purchase is currently safe or nearly safe per the engine. */
  currentlySafeOrNearlySafe: boolean;
}

export interface PatternConfirmationEvent extends CandidateEventBase {
  type: 'pattern_confirmation';
  pattern: Pattern;
  /** Confirming this pattern would materially change the CURRENT pay cycle. Minor patterns wait in-app. */
  materiallyAffectsCurrentCycle: boolean;
  /** Optional linked recurring item for amount/cadence copy ("pilates is usually $50"). */
  linkedRecurringItem: RecurringItem | null;
}

export interface CalendarEventConfirmationEvent extends CandidateEventBase {
  type: 'calendar_event_confirmation';
  calendarEvent: CalendarEvent;
  mayAffectSafeToSpend: boolean;
}

export interface RepetitiveBehaviorEvent extends CandidateEventBase {
  type: 'repetitive_behavior';
  /** e.g. "delivery", "rideshares" — used directly in copy. */
  behaviorLabel: string;
  /** Deterministic evidence: repeated transactions in the same category/merchant. */
  occurrenceCount: number;
  /** The behavior is materially affecting money (declining STS / commitment pressure), not just frequent. */
  materialImpact: boolean;
  /** What it's crowding out, e.g. "friday" — optional copy detail. */
  crowdingOut: string | null;
  worsenedSinceLastWarning: boolean;
}

export interface SoftCommitmentPauseEvent extends CandidateEventBase {
  type: 'soft_commitment_pause';
  /** The habit being paused (recurring item or soft commitment title). */
  itemTitle: string;
  relatedCommitmentId: UUID | null;
  /** When the user should be good again, e.g. "in two weeks". Null = unknown. */
  resumeExpectation: string | null;
  worsenedSinceLastWarning: boolean;
}

export interface ConnectionHealthEvent extends CandidateEventBase {
  type: 'connection_health';
  provider: 'bank' | 'calendar';
  /** Calendar only: the disconnect affects upcoming-commitment planning. */
  affectsPlanning: boolean;
}

export interface SecurityEvent extends CandidateEventBase {
  type: 'security';
  summary: string;
}

export type CandidateEvent =
  | StatusChangeEvent
  | SafeToSpendIncreaseEvent
  | SafeToSpendDecreaseEvent
  | CommitmentProtectedEvent
  | CommitmentAtRiskEvent
  | PurchaseCheckFollowUpEvent
  | VaultAffordabilityEvent
  | SaleAlertEvent
  | PatternConfirmationEvent
  | CalendarEventConfirmationEvent
  | RepetitiveBehaviorEvent
  | SoftCommitmentPauseEvent
  | ConnectionHealthEvent
  | SecurityEvent;

/** Compile-time guarantee: every CandidateEvent type is a shared-types trigger type. */
export type AssertTriggerCoverage = CandidateEvent['type'] extends NotificationTriggerType
  ? true
  : never;

/** The slice of UserSettings the engine needs (kept narrow for purity/testability). */
export interface NotificationContextSettings {
  quietHours: QuietHours;
  privacyLevel: NotificationPrivacyLevel;
  dailyPacingNotificationsEnabled: boolean;
  saleAlertsEnabled: boolean;
  vaultNotificationsEnabled: boolean;
  reviewPromptsEnabled: boolean;
}

/** A previously sent/scheduled notification, for cap + duplicate suppression. */
export interface RecentNotificationRecord {
  triggerType: NotificationTriggerType;
  severity: NotificationSeverity;
  sentAt: ISODateTimeString;
  /** The commitment/vault/pattern/behavior the notification was about, when applicable. */
  relatedEntityId: UUID | null;
}

export interface NotificationEngineInput {
  userId: UUID;
  /** Injected for determinism instead of reading the system clock. */
  now: ISODateTimeString;
  /** IANA timezone for quiet-hours evaluation, e.g. "America/New_York". */
  timezone: string;
  events: readonly CandidateEvent[];
  settings: NotificationContextSettings;
  /** Last time the user opened the app. Null = never/unknown. */
  lastAppOpenAt: ISODateTimeString | null;
  /** Candidate event ids whose corresponding in-app Action the user already dismissed. */
  dismissedCandidateEventIds: readonly UUID[];
  /** Notifications actually sent recently (not suppressed ones). */
  recentNotifications: readonly RecentNotificationRecord[];
  config?: Partial<NotificationEngineConfig>;
}
