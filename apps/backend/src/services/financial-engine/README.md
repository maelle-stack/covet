# financial-engine

The Safe to Spend engine (docs/02_financial_engine.md): pure, deterministic,
no I/O, no LLM calls. Given the same inputs and `now`, always produces the
same `SafeToSpendSnapshot`.

Entry point: `calculateSafeToSpend(input: SafeToSpendEngineInput): SafeToSpendSnapshot`.

## Module map

- `config.ts` — every tunable constant (behavior buffer rates, debt pressure
  tiers/rates, pending-income cap, trusted-payoff rule, protection windows,
  materiality thresholds, confidence weights). Override via
  `SafeToSpendEngineInput.config`; nothing is hard-coded inside a
  calculation module.
- `checking-cash.ts` — usable checking cash (checking only; pending debits
  subtracted immediately; pending credits ignored).
- `pay-cycle.ts` — pay cycle start/end and days-until-income, with the
  conservative 30-day rolling window fallback for unconfirmed/irregular
  income.
- `protection-priority.ts` — unifies Commitments and RecurringItems into one
  priority queue (rent/essential bills → debt minimums → semi-hard →
  soft/habits), the gradual due-date protection ramp, and per-item status
  resolution (protected/partial/at_risk).
- `vaults.ts` — actively-protected vault allocation (remaining unmet target,
  cash-bounded).
- `behavior-buffer.ts` — archetype × strictness buffer rate, plus the
  HIGH_OBLIGATION_PRESSURE bonus.
- `obligation-pressure.ts` — mandatory-obligation-to-income ratio and the
  HIGH_OBLIGATION_PRESSURE threshold.
- `debt-pressure.ts` — utilization tiers and the trusted-payoff penalty
  reduction (never a boost).
- `pending-income.ts` — the small, capped, high-confidence-only near-term
  income adjustment.
- `confidence.ts` — internal 0-100 score → external High/Medium/Still
  learning label.
- `status.ts` — maps engine output to YOURE_GOOD/TAKE_IT_EASY/
  WAIT_UNTIL_PAYDAY/LETS_NOT.
- `major-change.ts` — candidate change flags for the Notification Engine
  (materiality, suppression, and batching are Phase 4's job, not this
  engine's).
- `explanation.ts` — conclusion-first summary text (never the full formula).
- `inputs-hash.ts` — deterministic hash for `SafeToSpendSnapshot.inputsHash`.
- `index.ts` — orchestrates all of the above into `calculateSafeToSpend`.

## Implementation decisions beyond the spec's literal text

These are documented inline where they occur, and called out because they
involved judgment calls the spec didn't fully resolve:

1. **Semi-hard commitments allocate in the hard-tier priority zone**
   (after rent/essential-bills and debt minimums, before the emergency
   floor), per docs/02_financial_engine.md's priority-order paragraph. The
   `SafeToSpendSnapshot` output only has two commitment buckets
   (`protectedHardCommitments` / `protectedSoftCommitments`) — semi-hard
   commitments are reported in `protectedHardCommitments`. This is a gap
   between the three-tier `CommitmentHardness` model and the two-bucket
   snapshot output that predates this phase; flagging for a possible
   follow-up (a third `protectedSemiHardCommitments` field) rather than
   changing the already-approved snapshot shape unilaterally.
2. **Hard-hardness RecurringItems (e.g. an essential subscription) share
   the same priority tier as rent/essential-bill Commitments**, since both
   use the same `hardness` field and the spec's priority order is
   type-agnostic about _which_ entity is hard.
3. **A confirmed item with nothing reserved yet, but not due soon, reports
   `protected`** rather than introducing an eighth status for "not yet in
   its protection window." Only when nothing is reserved AND the due date
   is within `atRiskDueSoonDays` does it become `at_risk`.
4. **Vaults don't get a gradual due-date ramp** (unlike commitments) — v1
   reserves the full remaining unmet target, cash-bounded, in one step.
5. **`internalProjectedPace` equals `dailyPace` in v1** — a real
   day-of-week-weighted projection needs habit-by-weekday data not modeled
   in this phase.
6. **Major-change flags are presence-based, not suppression-aware** (e.g.
   `connection_lost`-equivalent signals fire whenever the bank isn't
   active, every calculation, not just on the transition). Deduplication,
   suppression, and batching are explicitly the Notification Engine's
   responsibility (Phase 4) per docs/03_notification_engine.md.
7. **Emergency floor and behavior buffer are both percentages of cash**, so
   a pending debit (or any cash reduction) shrinks Safe to Spend by
   _somewhat less_ than its full dollar amount — part of it would have
   gone to the floor/buffer anyway. This is mathematically consistent with
   the spec's percentage-based floor and buffer, not a bug.
