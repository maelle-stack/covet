import type {
  ActivityFeedResponse,
  Cents,
  Commitment,
  Insight,
  PurchaseCheck,
  RecurringItem,
  SafeToSpendSnapshot,
  Transaction,
  UpcomingResponse,
  UserSettings,
  Vault,
} from '@covet/shared-types';
import type { Sql } from 'postgres';

import { gateInsights, type CovetRepositories } from './types';

/**
 * Postgres-backed repository. Hand-written SQL keeps money as bigint cents
 * and maps snake_case columns to the camelCase shared-types models here and
 * nowhere else. Read-only for 6.1; scoped by userId on every query as
 * defense in depth alongside RLS.
 *
 * Only the tables the current read endpoints need are queried. Actions are
 * produced by the context engine in a later checkpoint, so they read as an
 * empty list here.
 */

/** int8/bigint columns come back as strings from the driver; cents fit in a JS number. */
function cents(value: unknown): Cents {
  return Number(value);
}
function centsOrNull(value: unknown): Cents | null {
  return value === null || value === undefined ? null : Number(value);
}
function iso(value: unknown): string {
  return value instanceof Date ? value.toISOString() : String(value);
}
function isoOrNull(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return value instanceof Date ? value.toISOString() : String(value);
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapSnapshot(r: any): SafeToSpendSnapshot {
  return {
    id: r.id,
    userId: r.user_id,
    amount: cents(r.amount),
    payCycleStart: String(r.pay_cycle_start),
    payCycleEnd: String(r.pay_cycle_end),
    daysUntilNextIncome: r.days_until_next_income,
    dailyPace: centsOrNull(r.daily_pace),
    internalProjectedPace: centsOrNull(r.internal_projected_pace),
    paceProjection: r.pace_projection ?? [],
    status: r.status,
    confidenceScore: r.confidence_score,
    externalConfidenceLabel: r.external_confidence_label,
    protectedHardCommitments: r.protected_hard_commitments ?? [],
    protectedSemiHardCommitments: r.protected_semi_hard_commitments ?? [],
    protectedSoftCommitments: r.protected_soft_commitments ?? [],
    debtPressureLevel: r.debt_pressure_level,
    obligationPressureLevel: r.obligation_pressure_level,
    emergencyFloorApplied: cents(r.emergency_floor_applied),
    behaviorBufferApplied: cents(r.behavior_buffer_applied),
    majorChangeFlags: r.major_change_flags ?? [],
    explanationSummary: r.explanation_summary,
    lastCalculatedAt: iso(r.last_calculated_at),
    staleAfter: iso(r.stale_after),
    inputsHash: r.inputs_hash,
  };
}

function mapTransaction(r: any): Transaction {
  return {
    id: r.id,
    userId: r.user_id,
    accountId: r.account_id,
    providerTransactionId: r.provider_transaction_id,
    amount: cents(r.amount),
    merchantName: r.merchant_name,
    originalDescription: r.original_description,
    category: r.category,
    subcategory: r.subcategory,
    date: String(r.date),
    authorizedDate: r.authorized_date === null ? null : String(r.authorized_date),
    pending: r.pending,
    type: r.type,
    isoCurrencyCode: r.iso_currency_code,
    paymentChannel: r.payment_channel,
    confidence: r.confidence,
    isTransfer: r.is_transfer,
    excludedFromIncome: r.excluded_from_income,
    excludedFromSpending: r.excluded_from_spending,
    recurringCandidateId: r.recurring_candidate_id,
    metadata: r.metadata,
  };
}

function mapInsight(r: any): Insight {
  return {
    id: r.id,
    userId: r.user_id,
    insightType: r.insight_type,
    title: r.title,
    body: r.body,
    evidenceSummary: r.evidence_summary,
    confidence: r.confidence,
    generatedAt: iso(r.generated_at),
    expiresAt: isoOrNull(r.expires_at),
    status: r.status,
    relatedTransactionIds: r.related_transaction_ids ?? [],
    relatedPatternIds: r.related_pattern_ids ?? [],
    relatedCommitmentIds: r.related_commitment_ids ?? [],
    userFeedback: r.user_feedback,
  };
}

function mapCommitment(r: any): Commitment {
  return {
    id: r.id,
    userId: r.user_id,
    source: r.source,
    title: r.title,
    amount: centsOrNull(r.amount),
    estimatedAmount: centsOrNull(r.estimated_amount),
    confirmedAmount: centsOrNull(r.confirmed_amount),
    dueAt: isoOrNull(r.due_at),
    commitmentType: r.commitment_type,
    hardness: r.hardness,
    status: r.status,
    protectedAmount: cents(r.protected_amount),
    protectionStartAt: isoOrNull(r.protection_start_at),
    confidence: r.confidence,
    userConfirmed: r.user_confirmed,
    userDenied: r.user_denied,
    linkedCalendarEventId: r.linked_calendar_event_id,
    linkedTransactionId: r.linked_transaction_id,
    linkedRecurringItemId: r.linked_recurring_item_id,
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
    metadata: r.metadata,
  };
}

function mapRecurring(r: any): RecurringItem {
  return {
    id: r.id,
    userId: r.user_id,
    title: r.title,
    merchantName: r.merchant_name,
    amountEstimate: centsOrNull(r.amount_estimate),
    cadence: r.cadence,
    nextExpectedAt: isoOrNull(r.next_expected_at),
    recurringType: r.recurring_type,
    hardness: r.hardness,
    confidence: r.confidence,
    status: r.status,
    linkedPatternId: r.linked_pattern_id,
    lastSeenAt: isoOrNull(r.last_seen_at),
    userConfirmed: r.user_confirmed,
    userPaused: r.user_paused,
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
    metadata: r.metadata,
  };
}

function mapVault(r: any): Vault {
  return {
    id: r.id,
    userId: r.user_id,
    title: r.title,
    targetAmount: cents(r.target_amount),
    currentProtectedAmount: cents(r.current_protected_amount),
    desiredByDate: r.desired_by_date === null ? null : String(r.desired_by_date),
    status: r.status,
    activelyProtected: r.actively_protected,
    source: r.source,
    merchant: r.merchant,
    url: r.url,
    imageAssetId: r.image_asset_id,
    affordabilityDate: r.affordability_date === null ? null : String(r.affordability_date),
    lastRecalculatedAt: isoOrNull(r.last_recalculated_at),
    notificationPreferences: {
      affordabilityAlertsEnabled: r.affordability_alerts_enabled,
      saleAlertsEnabled: r.sale_alerts_enabled,
    },
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
  };
}

function mapSettings(r: any): UserSettings {
  return {
    userId: r.user_id,
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
    quietHours: { start: String(r.quiet_hours_start), end: String(r.quiet_hours_end) },
    notificationPrivacyLevel: r.notification_privacy_level,
    dailyPacingEnabled: r.daily_pacing_enabled,
    dailyPacingNotificationsEnabled: r.daily_pacing_notifications_enabled,
    saleAlertsEnabled: r.sale_alerts_enabled,
    vaultNotificationsEnabled: r.vault_notifications_enabled,
    reviewPromptsEnabled: r.review_prompts_enabled,
    biometricLockEnabled: r.biometric_lock_enabled,
    calendarSuggestionsEnabled: r.calendar_suggestions_enabled,
    walletPrimaryColor: r.wallet_primary_color,
    analyticsOptOut: r.analytics_opt_out,
  };
}

function mapPurchaseCheck(r: any): PurchaseCheck {
  return {
    id: r.id,
    userId: r.user_id,
    inputType: r.input_type,
    rawInput: r.raw_input,
    parsedItemName: r.parsed_item_name,
    parsedMerchant: r.parsed_merchant,
    parsedPrice: centsOrNull(r.parsed_price),
    parsedUrl: r.parsed_url,
    screenshotAssetId: r.screenshot_asset_id,
    decision: r.decision,
    decisionReason: r.decision_reason,
    safeToSpendBefore: cents(r.safe_to_spend_before),
    safeToSpendAfterHypothetical: cents(r.safe_to_spend_after_hypothetical),
    relatedVaultId: r.related_vault_id,
    statusAtDecision: r.status_at_decision,
    createdAt: iso(r.created_at),
    followUpAt: isoOrNull(r.follow_up_at),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function createPostgresRepositories(sql: Sql): CovetRepositories {
  return {
    async getLatestSnapshot(userId) {
      const rows = await sql`
        select * from safe_to_spend_snapshots
        where user_id = ${userId}
        order by last_calculated_at desc
        limit 1`;
      return rows[0] ? mapSnapshot(rows[0]) : null;
    },

    async getActivity(userId): Promise<ActivityFeedResponse | null> {
      const users = await sql`select 1 from users where id = ${userId} limit 1`;
      if (!users[0]) return null;

      const insightRows = await sql`
        select * from insights where user_id = ${userId} and status = 'active'
        order by generated_at desc`;
      const txnRows = await sql`
        select * from transactions where user_id = ${userId} order by date desc`;
      const txns = txnRows.map(mapTransaction);

      return {
        insights: gateInsights(insightRows.map(mapInsight), txns.length),
        // Actions are context-engine output — wired in a later checkpoint.
        actions: [],
        transactions: txns,
      };
    },

    async getUpcoming(userId): Promise<UpcomingResponse | null> {
      const users = await sql`select 1 from users where id = ${userId} limit 1`;
      if (!users[0]) return null;

      const eventRows = await sql`
        select * from commitments
        where user_id = ${userId} and commitment_type in ('event','travel')
        order by due_at asc`;
      const recurringRows = await sql`
        select * from recurring_items where user_id = ${userId}
        order by next_expected_at asc`;
      const vaultRows = await sql`select * from vaults where user_id = ${userId}`;

      return {
        events: eventRows.map(mapCommitment),
        recurring: recurringRows.map(mapRecurring),
        vaults: vaultRows.map(mapVault),
      };
    },

    async getUserSettings(userId) {
      const rows = await sql`select * from user_settings where user_id = ${userId} limit 1`;
      return rows[0] ? mapSettings(rows[0]) : null;
    },

    async getSeedPurchaseCheck(userId) {
      const rows = await sql`
        select * from purchase_checks where user_id = ${userId}
        order by created_at asc limit 1`;
      return rows[0] ? mapPurchaseCheck(rows[0]) : null;
    },

    async close() {
      await sql.end({ timeout: 5 });
    },
  };
}
