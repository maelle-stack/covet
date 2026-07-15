# notification-engine

The Notification Engine (docs/03_notification_engine.md): pure and
deterministic. Consumes structured candidate events emitted by the Financial
Engine, sync jobs, Purchase Check, Vaults, calendar processing, and
connection-health checks, and returns `Notification` records. It never
calculates Safe to Spend itself and never infers risk from raw transactions.
Push delivery (Expo/APNs) is Phase 6 — `sentAt` is always null here, and
deliverable records carry a `scheduledFor` timestamp instead.

Entry point:
`processCandidateEvents(input: NotificationEngineInput): Notification[]`

Suppressed candidates come back as records with `suppressedReason` set (so
suppression effectiveness is auditable, a spec success metric); events that
were pure no-ops (e.g. a status "change" to the same status) produce no
record at all.

## Module map

- `config.ts` — every tunable constant (daily cap, quiet-hours fallback,
  transaction anti-stacking delay, duplicate window, review-push absence
  threshold, repetitive-behavior minimum evidence, sale-alert minimum
  discount, materiality thresholds). v1 assumptions to be tuned against real
  outcomes (open rate, action taken, opt-out rate).
- `types.ts` — the `CandidateEvent` discriminated union (one variant per
  shared-types trigger type, compile-time-checked for coverage) plus the
  engine input shape.
- `severity.ts` — event → Note / Nudge / Review / Protect.
- `eligibility.ts` — user preferences + materiality. This is where the
  spec's "never notify for..." list is enforced; ambiguity resolves to
  silence.
- `suppression.ts` — dismissed-in-app, seen-in-app (user opened Home after
  the money-state event), duplicate warnings (same trigger + same entity in
  the window, unless materially worsened), and the rolling-24h non-Protect
  count for the daily cap.
- `batching.ts` — money-state events (status change + Safe to Spend moves)
  in one run collapse into a single notification; a status change leads.
  Other trigger types stay individual — merging them would create the vague
  summaries the spec warns against.
- `quiet-hours.ts` — overnight-window handling (default 21:00 → 09:00
  local), deferral to the next quiet-hours end. Protect bypasses.
- `copy.ts` — the only source of notification text. Brand tone: no emoji,
  lowercase where it fits, "i" language for judgment, neutral for status
  facts, direct-but-never-shaming redirects. Always produces both `body`
  and a discreet `privacyBody` (never contains amounts, debt risk, or
  behavior details).
- `index.ts` — orchestrates: batch → severity → eligibility → suppression →
  daily cap → timing (Protect immediately; transaction-triggered delay;
  quiet-hours deferral; expiry drop).

## Implementation decisions beyond the spec's literal text

1. **"0–2 per day" is implemented as a rolling 24h count** of sent
   non-Protect notifications (input `recentNotifications` + those emitted in
   the current run), not a calendar-day counter, keeping the engine pure.
   Protect severity is exempt, per spec.
2. **`expiresAt` on candidate events** drives the `quiet_hours_expired`
   suppression: a deferred nudge that would land after it stopped mattering
   (e.g. a weekend-brunch pause delivered Monday) is dropped, not delivered
   stale. Emitters decide expiry; the engine only honors it.
3. **Seen-in-app suppression** compares `lastAppOpenAt` against the event's
   `occurredAt` for money-state events only — opening the app shows Home,
   which shows status/Safe to Spend, but does not show (say) an undelivered
   sale alert.
4. **The transaction anti-stacking delay** (spec: 3–10 minutes) defaults to
   5 minutes and applies to transaction-triggered Safe to Spend decreases;
   Protect events are never delayed.
5. **Calendar disconnects are Review severity** (bank = Protect), and only
   eligible at all when the emitter marks them as affecting planning.
6. **Quiet-hours deferral is computed against the local wall clock via
   `Intl`**; a DST transition inside the window can shift "9am" by up to an
   hour. Accepted v1 approximation.
7. **Privacy levels are enforced at delivery time (Phase 6)** — the engine
   always stores both `body` and `privacyBody` on every record
   (docs/05_engineering_architecture.md), so delivery can respect
   Full detail / Discreet / Hidden without regenerating copy.
