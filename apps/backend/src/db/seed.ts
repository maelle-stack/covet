import { loadConfig } from '../config/env';
import { createSqlClient } from './client';
import {
  DEMO_USER_ID,
  demoAccounts,
  demoCommitments,
  demoInsights,
  demoRecurring,
  demoSeedPurchaseCheck,
  demoSettings,
  demoSnapshot,
  demoTransactions,
  demoUser,
  demoVaults,
} from './seed-data';

/**
 * Loads the canonical demo dataset into Postgres so `DATA_SOURCE=postgres`
 * mirrors the in-memory default (and the mobile fixtures). Idempotent:
 * deletes the demo user first (cascading to all child rows), then re-inserts.
 * This is pre-integration demo data, never production seed.
 *
 * Usage: DATABASE_URL=... pnpm --filter @covet/backend seed
 */
const BANK_CONNECTION_ID = '00000000-0000-4000-8000-0000000005a1';

export async function runSeed(databaseUrl: string): Promise<void> {
  const sql = createSqlClient(databaseUrl);
  // Structured (readonly) arrays -> a plain JSON value the driver accepts.
  const toJson = (value: unknown) => sql.json(JSON.parse(JSON.stringify(value)));
  try {
    await sql.begin(async (tx) => {
      // Cascade-clean any prior demo data for a repeatable seed.
      await tx`delete from users where id = ${DEMO_USER_ID}`;

      await tx`
        insert into users (id, created_at, updated_at, first_name, timezone, locale,
          onboarding_status, primary_archetype, secondary_archetype, active_goal,
          strictness_level, account_status)
        values (${demoUser.id}, ${demoUser.createdAt}, ${demoUser.updatedAt},
          ${demoUser.firstName}, ${demoUser.timezone}, ${demoUser.locale},
          ${demoUser.onboardingStatus}, ${demoUser.primaryArchetype},
          ${demoUser.secondaryArchetype}, ${demoUser.activeGoal},
          ${demoUser.strictnessLevel}, ${demoUser.accountStatus})`;

      await tx`
        insert into user_settings (user_id, created_at, updated_at, quiet_hours_start,
          quiet_hours_end, notification_privacy_level, daily_pacing_enabled,
          daily_pacing_notifications_enabled, sale_alerts_enabled, vault_notifications_enabled,
          review_prompts_enabled, biometric_lock_enabled, calendar_suggestions_enabled,
          wallet_primary_color, analytics_opt_out)
        values (${demoSettings.userId}, ${demoSettings.createdAt}, ${demoSettings.updatedAt},
          ${demoSettings.quietHours.start}, ${demoSettings.quietHours.end},
          ${demoSettings.notificationPrivacyLevel}, ${demoSettings.dailyPacingEnabled},
          ${demoSettings.dailyPacingNotificationsEnabled}, ${demoSettings.saleAlertsEnabled},
          ${demoSettings.vaultNotificationsEnabled}, ${demoSettings.reviewPromptsEnabled},
          ${demoSettings.biometricLockEnabled}, ${demoSettings.calendarSuggestionsEnabled},
          ${demoSettings.walletPrimaryColor}, ${demoSettings.analyticsOptOut})`;

      await tx`
        insert into bank_connections (id, user_id, provider, provider_item_id,
          institution_name, status)
        values (${BANK_CONNECTION_ID}, ${DEMO_USER_ID}, 'plaid', 'demo-item',
          'Demo Bank', 'active')`;

      for (const a of demoAccounts) {
        await tx`
          insert into accounts (id, user_id, bank_connection_id, provider_account_id, name,
            official_name, type, subtype, mask_last4, current_balance, available_balance,
            iso_currency_code, last_synced_at, status)
          values (${a.id}, ${a.userId}, ${a.bankConnectionId}, ${a.providerAccountId}, ${a.name},
            ${a.officialName}, ${a.type}, ${a.subtype}, ${a.maskLast4}, ${a.currentBalance},
            ${a.availableBalance}, ${a.isoCurrencyCode}, ${a.lastSyncedAt}, ${a.status})`;
      }

      for (const t of demoTransactions) {
        await tx`
          insert into transactions (id, user_id, account_id, provider_transaction_id, amount,
            merchant_name, date, pending, type, iso_currency_code, payment_channel, confidence,
            is_transfer, excluded_from_income, excluded_from_spending)
          values (${t.id}, ${t.userId}, ${t.accountId}, ${t.providerTransactionId}, ${t.amount},
            ${t.merchantName}, ${t.date}, ${t.pending}, ${t.type}, ${t.isoCurrencyCode},
            ${t.paymentChannel}, ${t.confidence}, ${t.isTransfer}, ${t.excludedFromIncome},
            ${t.excludedFromSpending})`;
      }

      for (const r of demoRecurring) {
        await tx`
          insert into recurring_items (id, user_id, title, merchant_name, amount_estimate,
            cadence, next_expected_at, recurring_type, hardness, confidence, status, last_seen_at,
            user_confirmed, user_paused, created_at, updated_at)
          values (${r.id}, ${r.userId}, ${r.title}, ${r.merchantName}, ${r.amountEstimate},
            ${r.cadence}, ${r.nextExpectedAt}, ${r.recurringType}, ${r.hardness}, ${r.confidence},
            ${r.status}, ${r.lastSeenAt}, ${r.userConfirmed}, ${r.userPaused}, ${r.createdAt},
            ${r.updatedAt})`;
      }

      for (const c of demoCommitments) {
        // Linked calendar events aren't seeded in 6.1, so keep that ref null.
        await tx`
          insert into commitments (id, user_id, source, title, amount, estimated_amount,
            confirmed_amount, due_at, commitment_type, hardness, status, protected_amount,
            protection_start_at, confidence, user_confirmed, user_denied,
            linked_recurring_item_id, created_at, updated_at)
          values (${c.id}, ${c.userId}, ${c.source}, ${c.title}, ${c.amount},
            ${c.estimatedAmount}, ${c.confirmedAmount}, ${c.dueAt}, ${c.commitmentType},
            ${c.hardness}, ${c.status}, ${c.protectedAmount}, ${c.protectionStartAt},
            ${c.confidence}, ${c.userConfirmed}, ${c.userDenied}, ${c.linkedRecurringItemId},
            ${c.createdAt}, ${c.updatedAt})`;
      }

      for (const v of demoVaults) {
        await tx`
          insert into vaults (id, user_id, title, target_amount, current_protected_amount,
            desired_by_date, status, actively_protected, source, affordability_date,
            last_recalculated_at, affordability_alerts_enabled, sale_alerts_enabled,
            created_at, updated_at)
          values (${v.id}, ${v.userId}, ${v.title}, ${v.targetAmount},
            ${v.currentProtectedAmount}, ${v.desiredByDate}, ${v.status}, ${v.activelyProtected},
            ${v.source}, ${v.affordabilityDate}, ${v.lastRecalculatedAt},
            ${v.notificationPreferences.affordabilityAlertsEnabled},
            ${v.notificationPreferences.saleAlertsEnabled}, ${v.createdAt}, ${v.updatedAt})`;
      }

      for (const i of demoInsights) {
        await tx`
          insert into insights (id, user_id, insight_type, title, body, evidence_summary,
            confidence, generated_at, expires_at, status, related_transaction_ids,
            related_pattern_ids, related_commitment_ids)
          values (${i.id}, ${i.userId}, ${i.insightType}, ${i.title}, ${i.body},
            ${i.evidenceSummary}, ${i.confidence}, ${i.generatedAt}, ${i.expiresAt}, ${i.status},
            ${i.relatedTransactionIds}, ${i.relatedPatternIds}, ${i.relatedCommitmentIds})`;
      }

      const s = demoSnapshot;
      await tx`
        insert into safe_to_spend_snapshots (id, user_id, amount, pay_cycle_start, pay_cycle_end,
          days_until_next_income, daily_pace, internal_projected_pace, status, confidence_score,
          external_confidence_label, protected_hard_commitments, protected_semi_hard_commitments,
          protected_soft_commitments, pace_projection, debt_pressure_level,
          obligation_pressure_level, emergency_floor_applied, behavior_buffer_applied,
          major_change_flags, explanation_summary, last_calculated_at, stale_after, inputs_hash)
        values (${s.id}, ${s.userId}, ${s.amount}, ${s.payCycleStart}, ${s.payCycleEnd},
          ${s.daysUntilNextIncome}, ${s.dailyPace}, ${s.internalProjectedPace}, ${s.status},
          ${s.confidenceScore}, ${s.externalConfidenceLabel},
          ${toJson(s.protectedHardCommitments)}, ${toJson(s.protectedSemiHardCommitments)},
          ${toJson(s.protectedSoftCommitments)}, ${toJson(s.paceProjection)},
          ${s.debtPressureLevel}, ${s.obligationPressureLevel}, ${s.emergencyFloorApplied},
          ${s.behaviorBufferApplied}, ${s.majorChangeFlags}, ${s.explanationSummary},
          ${s.lastCalculatedAt}, ${s.staleAfter}, ${s.inputsHash})`;

      const p = demoSeedPurchaseCheck;
      await tx`
        insert into purchase_checks (id, user_id, input_type, raw_input, parsed_item_name,
          parsed_price, decision, decision_reason, safe_to_spend_before,
          safe_to_spend_after_hypothetical, status_at_decision, created_at, follow_up_at)
        values (${p.id}, ${p.userId}, ${p.inputType}, ${p.rawInput}, ${p.parsedItemName},
          ${p.parsedPrice}, ${p.decision}, ${p.decisionReason}, ${p.safeToSpendBefore},
          ${p.safeToSpendAfterHypothetical}, ${p.statusAtDecision}, ${p.createdAt},
          ${p.followUpAt})`;
    });
  } finally {
    await sql.end({ timeout: 5 });
  }
}

if (require.main === module) {
  const config = loadConfig();
  if (!config.databaseUrl) {
    // eslint-disable-next-line no-console
    console.error('seed: DATABASE_URL is required');
    process.exit(1);
  }
  runSeed(config.databaseUrl)
    .then(() => {
      // eslint-disable-next-line no-console
      console.log('seeded demo dataset');
      process.exit(0);
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error('seed failed', err);
      process.exit(1);
    });
}
