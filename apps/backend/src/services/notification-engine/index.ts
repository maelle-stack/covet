import { randomUUID } from 'node:crypto';

import type {
  Notification,
  NotificationActionType,
  NotificationSuppressionReason,
  UUID,
} from '@covet/shared-types';

import { batchEvents, type BatchedUnit } from './batching';
import { mergeNotificationEngineConfig } from './config';
import { buildCopy } from './copy';
import { evaluateEligibility } from './eligibility';
import { isWithinQuietHours, localMinutesOfDay, nextQuietHoursEnd } from './quiet-hours';
import { resolveSeverity } from './severity';
import { checkSuppression, countRecentNonProtect, relatedEntityIdOf } from './suppression';
import type { CandidateEvent, NotificationEngineInput } from './types';

export * from './config';
export * from './types';
export { batchEvents } from './batching';
export { buildCopy } from './copy';
export { evaluateEligibility, isMaterialStsChange } from './eligibility';
export { isWithinQuietHours, nextQuietHoursEnd } from './quiet-hours';
export { resolveSeverity } from './severity';

function actionTypeFor(event: CandidateEvent): NotificationActionType {
  switch (event.type) {
    case 'pattern_confirmation':
    case 'calendar_event_confirmation':
      return 'approve_deny';
    case 'commitment_at_risk':
    case 'connection_health':
    case 'security':
      return 'review';
    default:
      return 'none';
  }
}

function buildRecord(
  unit: BatchedUnit,
  input: NotificationEngineInput,
  args: {
    severity: Notification['severity'];
    suppressedReason: NotificationSuppressionReason | null;
    scheduledFor: string | null;
    quietHoursApplied: boolean;
  },
): Notification {
  const event = unit.primary;
  const copy = buildCopy(unit, args.severity);

  const statusBefore = event.type === 'status_change' ? event.statusBefore : null;
  const statusAfter = event.type === 'status_change' ? event.statusAfter : null;
  const stsBefore =
    event.type === 'safe_to_spend_increase' || event.type === 'safe_to_spend_decrease'
      ? event.amountBefore
      : null;
  const stsAfter =
    event.type === 'safe_to_spend_increase' || event.type === 'safe_to_spend_decrease'
      ? event.amountAfter
      : event.type === 'status_change'
        ? event.snapshot.amount
        : null;

  const relatedCommitmentId =
    event.type === 'commitment_protected' || event.type === 'commitment_at_risk'
      ? event.commitment.id
      : event.type === 'soft_commitment_pause'
        ? event.relatedCommitmentId
        : null;
  const relatedVaultId =
    event.type === 'vault_affordability' || event.type === 'sale_alert' ? event.vault.id : null;
  const relatedPatternId = event.type === 'pattern_confirmation' ? event.pattern.id : null;
  const relatedPurchaseCheckId =
    event.type === 'purchase_check_follow_up' ? event.purchaseCheck.id : null;

  return {
    id: randomUUID(),
    userId: input.userId,
    candidateEventId: event.id,
    triggerType: event.type,
    severity: args.severity,
    title: copy.title,
    body: copy.body,
    privacyBody: copy.privacyBody,
    createdAt: input.now,
    scheduledFor: args.scheduledFor,
    sentAt: null, // delivery is Phase 6's job
    quietHoursApplied: args.quietHoursApplied,
    batchedEventIds: unit.batched.map((e) => e.id),
    suppressedReason: args.suppressedReason,
    statusBefore,
    statusAfter,
    safeToSpendBefore: stsBefore,
    safeToSpendAfter: stsAfter,
    relatedCommitmentId,
    relatedVaultId,
    relatedPatternId,
    relatedPurchaseCheckId,
    actionType: actionTypeFor(event),
    userResponse: null,
  };
}

/**
 * The Notification Engine (docs/03_notification_engine.md): pure and
 * deterministic — consumes structured candidate events plus user context
 * and returns Notification records. Suppressed candidates come back as
 * records with `suppressedReason` set (for auditing/suppression metrics);
 * deliverable ones carry a `scheduledFor` time. Nothing here sends a push;
 * delivery (Expo/APNs) is Phase 6.
 *
 * Decision order per unit: eligibility (preferences + materiality) →
 * suppression (dismissed / seen-in-app / duplicate) → daily cap → timing
 * (Protect immediately; transaction-triggered delay; quiet-hours deferral;
 * expiry). If Covet is unsure whether to notify, it does not notify.
 */
export function processCandidateEvents(input: NotificationEngineInput): Notification[] {
  const config = mergeNotificationEngineConfig(input.config);
  const now = new Date(input.now);
  const lastAppOpenAt = input.lastAppOpenAt ? new Date(input.lastAppOpenAt) : null;
  const dismissedIds: ReadonlySet<UUID> = new Set(input.dismissedCandidateEventIds);
  const hoursSinceLastAppOpen =
    lastAppOpenAt === null ? null : (now.getTime() - lastAppOpenAt.getTime()) / (1000 * 60 * 60);

  const quietHours = input.settings.quietHours ?? {
    start: config.defaultQuietHoursStart,
    end: config.defaultQuietHoursEnd,
  };

  const units = batchEvents(input.events);
  const results: Notification[] = [];

  let nonProtectBudget = Math.max(
    0,
    config.dailyCapNonProtect - countRecentNonProtect(input.recentNotifications, now),
  );

  for (const unit of units) {
    const event = unit.primary;
    const severity = resolveSeverity(event);

    // 1. Preferences + materiality. An outright no-op (reason null) leaves
    //    no record at all; a real suppression is recorded for metrics.
    const eligibility = evaluateEligibility(event, input.settings, hoursSinceLastAppOpen, config);
    if (!eligibility.eligible) {
      if (eligibility.reason !== null) {
        results.push(
          buildRecord(unit, input, {
            severity,
            suppressedReason: eligibility.reason,
            scheduledFor: null,
            quietHoursApplied: false,
          }),
        );
      }
      continue;
    }

    // 2. Suppression: dismissed in-app, already seen on Home, duplicates.
    const suppression = checkSuppression(
      event,
      {
        lastAppOpenAt,
        dismissedCandidateEventIds: dismissedIds,
        recentNotifications: input.recentNotifications,
        now,
      },
      config,
    );
    if (suppression !== null) {
      results.push(
        buildRecord(unit, input, {
          severity,
          suppressedReason: suppression,
          scheduledFor: null,
          quietHoursApplied: false,
        }),
      );
      continue;
    }

    // 3. Daily quiet-posture cap: 0–2 non-Protect per rolling day.
    if (severity !== 'protect') {
      if (nonProtectBudget <= 0) {
        results.push(
          buildRecord(unit, input, {
            severity,
            suppressedReason: 'daily_cap_reached',
            scheduledFor: null,
            quietHoursApplied: false,
          }),
        );
        continue;
      }
      nonProtectBudget -= 1;
    }

    // 4. Timing. Protect sends immediately, even inside quiet hours.
    let scheduledFor = now;
    let quietHoursApplied = false;

    if (severity !== 'protect') {
      if (event.type === 'safe_to_spend_decrease' && event.transactionTriggered) {
        // Anti-stacking delay behind Apple Pay/bank/merchant pings.
        scheduledFor = new Date(
          scheduledFor.getTime() + config.transactionTriggeredDelayMinutes * 60 * 1000,
        );
      }

      if (isWithinQuietHours(localMinutesOfDay(scheduledFor, input.timezone), quietHours)) {
        scheduledFor = new Date(nextQuietHoursEnd(scheduledFor, input.timezone, quietHours));
        quietHoursApplied = true;
      }

      // A deferred candidate that will no longer matter by delivery time is
      // dropped rather than delivered stale.
      if (
        event.expiresAt !== null &&
        scheduledFor.getTime() > new Date(event.expiresAt).getTime()
      ) {
        results.push(
          buildRecord(unit, input, {
            severity,
            suppressedReason: 'quiet_hours_expired',
            scheduledFor: null,
            quietHoursApplied: true,
          }),
        );
        nonProtectBudget += 1; // it never went out; give the slot back
        continue;
      }
    }

    results.push(
      buildRecord(unit, input, {
        severity,
        suppressedReason: null,
        scheduledFor: scheduledFor.toISOString(),
        quietHoursApplied,
      }),
    );
  }

  return results;
}

export { relatedEntityIdOf };
