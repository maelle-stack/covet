-- 0002_semi_hard_and_pace_projection.sql
-- Phase 3.1 amendment: SafeToSpendSnapshot gains a dedicated semi-hard
-- commitment bucket (previously folded into protected_hard_commitments)
-- and an internal day-by-day pace projection.

alter table safe_to_spend_snapshots
  add column protected_semi_hard_commitments jsonb not null default '[]';

-- Array of PaceProjectionDay (@covet/shared-types): { date, baseDailyPace,
-- protectedHardDue, protectedSemiHardDue, protectedSoftDue,
-- expectedFlexibleRoom, riskLevel, drivers }. Internal only — not surfaced
-- on Home by default (docs/02_financial_engine.md).
alter table safe_to_spend_snapshots
  add column pace_projection jsonb not null default '[]';
