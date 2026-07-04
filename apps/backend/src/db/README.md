# db

Postgres schema and migrations (source of truth per docs/05_engineering_architecture.md).
Supabase is used for auth, RLS, and realtime, but sensitive server-side
operations go through backend services, not direct client DB access.

`migrations/` holds versioned SQL migrations. Schema for the 19 core entities
(User, UserSettings, AuthIdentity, BankConnection, Account, Transaction,
CalendarConnection, CalendarEvent, Commitment, RecurringItem, Pattern,
ArchetypeResult, SafeToSpendSnapshot, PurchaseCheck, Vault, Notification,
Insight, SyncJob, AuditEvent) is added in Phase 2 alongside the shared types.
