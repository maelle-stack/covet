# db

Postgres schema and migrations (source of truth per docs/05_engineering_architecture.md).
Supabase is used for auth, RLS, and realtime, but sensitive server-side
operations go through backend services, not direct client DB access.

## Migrations

- `migrations/0001_initial_schema.sql` — the 19 core entities (User,
  UserSettings, AuthIdentity, BankConnection, Account, Transaction,
  CalendarConnection, CalendarEvent, Commitment, RecurringItem, Pattern,
  ArchetypeResult, SafeToSpendSnapshot, PurchaseCheck, Vault, Notification,
  Insight, SyncJob, AuditEvent).
- `migrations/0002_semi_hard_and_pace_projection.sql` — adds
  `protected_semi_hard_commitments` (previously folded into
  `protected_hard_commitments`) and `pace_projection` to
  `safe_to_spend_snapshots`.

## Conventions

- Money is stored as `bigint` integer cents. Never floats.
- Enum-like columns are `text` + CHECK constraints whose literals must match
  the `as const` arrays in `@covet/shared-types`. `schema.test.ts` fails the
  build if they drift.
- `snake_case` columns map to `camelCase` fields in the shared TypeScript
  models.
- `metadata jsonb` columns are extensibility-only and must never carry
  values that affect money, commitments, notifications, or trust.
- RLS is enabled everywhere: clients may only SELECT their own rows; all
  writes go through backend services using the Supabase service role.
- `safe_to_spend_snapshots` is append-only; its `protected_*_commitments`
  jsonb columns are immutable calculation-time copies of typed
  `ProtectedCommitmentRef[]` — the `commitments` table remains the source
  of truth.
