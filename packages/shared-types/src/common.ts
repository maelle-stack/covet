/**
 * Shared scalar aliases and cross-model enumerations used by every Covet
 * domain model (see docs/02_financial_engine.md and
 * docs/05_engineering_architecture.md).
 *
 * Enumerations are declared as `as const` arrays with derived union types so
 * that both compile-time checking and runtime validation (e.g. API input
 * validation, DB CHECK-constraint parity tests) can share one source of truth.
 */

/** UUID v4 string. */
export type UUID = string;

/** Calendar date, `YYYY-MM-DD`. */
export type ISODateString = string;

/** ISO 8601 timestamp, UTC (e.g. `2026-07-04T12:00:00Z`). */
export type ISODateTimeString = string;

/** Local wall-clock time, `HH:MM` 24-hour (used for quiet hours). */
export type LocalTimeString = string;

/**
 * Money amount in integer minor units (cents) of the associated ISO currency.
 * Never a float. All engine math and storage use cents; the UI formats to
 * dollars for display. Safe to Spend display values are rounded DOWN to the
 * dollar by the engine, but stored amounts keep full cent precision.
 */
export type Cents = number;

/** ISO 4217 currency code, e.g. `USD`. */
export type CurrencyCode = string;

/** Internal confidence score, integer 0–100. */
export type ConfidenceScore = number;

/**
 * Extensibility-only metadata bag. Flat, JSON-scalar values only.
 * MUST NOT carry anything that affects money, commitments, notifications,
 * or trust — those belong in typed fields (docs/05_engineering_architecture.md).
 */
export type Metadata = Readonly<Record<string, string | number | boolean | null>>;

/** The four user-facing engine statuses (docs/02_financial_engine.md). */
export const SPEND_STATUSES = [
  'YOURE_GOOD',
  'TAKE_IT_EASY',
  'WAIT_UNTIL_PAYDAY',
  'LETS_NOT',
] as const;
export type SpendStatus = (typeof SPEND_STATUSES)[number];

/** Strictness settings: Light, Balanced (default), Protective. */
export const STRICTNESS_LEVELS = ['light', 'balanced', 'protective'] as const;
export type StrictnessLevel = (typeof STRICTNESS_LEVELS)[number];

/** External (user-facing) confidence labels for Safe to Spend. */
export const EXTERNAL_CONFIDENCE_LABELS = ['high', 'medium', 'still_learning'] as const;
export type ExternalConfidenceLabel = (typeof EXTERNAL_CONFIDENCE_LABELS)[number];

/** Commitment hardness tiers (docs/02_financial_engine.md). */
export const COMMITMENT_HARDNESS = ['hard', 'semi_hard', 'soft'] as const;
export type CommitmentHardness = (typeof COMMITMENT_HARDNESS)[number];

/** Credit utilization pressure tiers (docs/02_financial_engine.md). */
export const DEBT_PRESSURE_LEVELS = [
  'healthy', // < 10%
  'normal', // 10–29%
  'elevated', // 30–49%
  'high', // 50–74%
  'severe', // 75–89%
  'critical', // >= 90%
] as const;
export type DebtPressureLevel = (typeof DEBT_PRESSURE_LEVELS)[number];

/**
 * Obligation pressure: `high` maps to the internal HIGH_OBLIGATION_PRESSURE
 * state (>= 75% of cycle income committed to mandatory obligations).
 */
export const OBLIGATION_PRESSURE_LEVELS = ['normal', 'high'] as const;
export type ObligationPressureLevel = (typeof OBLIGATION_PRESSURE_LEVELS)[number];

/** Public archetype names shown to users (docs/01_consumer_experience.md). */
export const ARCHETYPES = ['drifter', 'spontaneous', 'keeper', 'giver', 'builder'] as const;
export type Archetype = (typeof ARCHETYPES)[number];

/** Internal archetype names. Never shown to users. */
export const INTERNAL_ARCHETYPES = [
  'avoidant',
  'spontaneous',
  'squirrel',
  'overgenerous',
  'investor',
] as const;
export type InternalArchetype = (typeof INTERNAL_ARCHETYPES)[number];

/** Public → internal archetype mapping (docs/01_consumer_experience.md). */
export const INTERNAL_ARCHETYPE_BY_PUBLIC: Readonly<Record<Archetype, InternalArchetype>> = {
  drifter: 'avoidant',
  spontaneous: 'spontaneous',
  keeper: 'squirrel',
  giver: 'overgenerous',
  builder: 'investor',
};

/** Onboarding goal options (docs/01_consumer_experience.md). */
export const USER_GOALS = [
  'stop_overspending',
  'build_cushion',
  'pay_down_debt',
  'know_what_i_can_spend',
  'save_for_something',
  'stay_on_track',
] as const;
export type UserGoal = (typeof USER_GOALS)[number];

/** Lock-screen notification privacy levels (docs/03_notification_engine.md). */
export const NOTIFICATION_PRIVACY_LEVELS = ['full_detail', 'discreet', 'hidden'] as const;
export type NotificationPrivacyLevel = (typeof NOTIFICATION_PRIVACY_LEVELS)[number];

/** Entity kinds referenced by patterns, insights, and audit events. */
export const ENTITY_TYPES = [
  'user',
  'account',
  'bank_connection',
  'transaction',
  'calendar_connection',
  'calendar_event',
  'commitment',
  'recurring_item',
  'pattern',
  'archetype_result',
  'safe_to_spend_snapshot',
  'purchase_check',
  'vault',
  'notification',
  'insight',
  'sync_job',
] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

/** A typed reference to another entity (no ad hoc string blobs). */
export interface EntityRef {
  entityType: EntityType;
  entityId: UUID;
}
