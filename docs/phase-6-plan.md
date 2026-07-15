# Phase 6 — Integration Architecture Plan

Phase 6 wires real data into the production, fixture-backed app. The Financial
Engine and Notification Engine are finished, pure, and **not** touched here;
the Phase 5 screens are finished and change only at the `api.ts` seam. Phase 6
builds the middle: data access, HTTP endpoints, auth, and external adapters.

Backend remains the source of truth. The mobile app calls typed API methods
only and never computes Safe to Spend. No secrets live in the repo — only
`.env.example`.

## Target architecture

- **Auth**: Supabase Auth issues the JWT; the backend verifies it itself
  (`jose` + `SUPABASE_JWT_SECRET`), maps `sub` → `users.id`, provisions the
  domain user on first request.
- **Data**: `postgres.js` over `DATABASE_URL` with a hand-written repository
  layer returning shared-types models (snake_case ↔ camelCase mapping lives
  only there). Raw-SQL migrations via a small runner. No ORM.
- **API**: Express routers per endpoint group, each calling only its domain
  service. Middleware: request-id → JSON → auth → validation → handler →
  `{ data } | { error }` envelope → central error handler.
- **Mobile seam**: a `CovetApi` interface with two implementations —
  `fixtureApi` (in-app data) and `httpApi` (fetch + envelope). `api.ts` selects
  one via `EXPO_PUBLIC_API_MODE`. Screens and TanStack Query hooks are unaware.
- **External adapters** (each gated, built later): Plaid + transaction sync,
  calendar, Expo push delivery for the notification engine, and the Purchase
  Check create path using the `src/ai` abstraction (decision from the engine,
  phrasing from the model).

## Security / RLS

RLS on every table: clients read only their own rows via the anon key + JWT;
all writes go through the backend service role. Every repository query is also
scoped by `userId` (defense in depth). Service-role and provider secrets never
leave the backend; Plaid tokens encrypted at rest. Audit events for sensitive
actions; rate-limit recalculation and purchase-check endpoints.

## Recommended order

1. **6.1 — Backend runtime + data layer + mobile API seam** _(this checkpoint;
   no external providers)_: env/config, Postgres client, migration runner,
   seed, repository layer, Express envelope + read endpoints, and the mobile
   fixture/live toggle. Proves fixture→live is a config switch, not a rewrite.
2. **6.2 — Write endpoints + snapshot recalculation orchestrator** _(delivered;
   still no external providers)_.
3. **6.3** — Supabase Auth _(gated)_.
4. **6.4** — Plaid + transaction sync _(gated)_.
5. **6.5** — Calendar _(gated)_.
6. **6.6** — Notification delivery (Expo push) _(gated)_.
7. **6.7** — Purchase Check create + AI abstraction _(gated)_.
8. **6.8** — Hardening: rate limits, audit events, observability, e2e.

## 6.1 scope (delivered)

- Data source is selectable: `memory` (default, seeded demo data, no DB — the
  mode UI dev and tests run in) or `postgres` (real DB via `DATABASE_URL`).
- Live read endpoints: `/safe-to-spend/current`, `/activity`, `/upcoming`,
  `/settings`, `/purchase-checks/seed`.
- Repositories cover only the tables those reads need. Dev-only auth
  placeholder scopes requests by `x-covet-user-id` (real JWT verification is
  6.3). Explicitly **not** in 6.1: real auth, Plaid, calendar, push, AI, write
  and recalculation endpoints, and the full 19-entity repository layer.

## 6.2 scope (delivered)

- Recalculation orchestrator (`services/safe-to-spend/recalculate.ts`): the
  single caller of the Financial Engine. It gathers persisted inputs, layers on
  conservative defaults for the not-yet-modeled signals (income cadence,
  expected income, pending income, payoff behavior — pattern/Plaid-derived
  later), runs the pure engine, and appends the result. Idempotent: unchanged
  inputs (same inputs hash) are a no-op.
- Write endpoints, all backend-only (no mobile screen changes): `POST
  /safe-to-spend/recalculate`, `POST /commitments/:id/confirm`, `POST
  /commitments/:id/deny` (both mutate then recalculate and return the fresh
  snapshot), and `PATCH /settings` (notification/privacy prefs only —
  engine-affecting fields like strictness are excluded so a settings write
  never moves Safe to Spend).
- The in-memory repository is now a mutable, per-instance store; the Postgres
  repository implements the same write/recalc methods. A demo checking account
  was added to the seed so the engine has usable cash to compute from.
- Still **not** in 6.2: real auth, Plaid, transaction sync, calendar, push, AI,
  and mobile write-client wiring (no Phase 5 screen performs writes yet).

## Local dev

```
# Backend, fixture-parity memory mode (no DB):
pnpm --filter @covet/backend dev

# Backend against Postgres (e.g. local Supabase):
supabase start
DATABASE_URL=... pnpm --filter @covet/backend migrate
DATABASE_URL=... pnpm --filter @covet/backend seed
DATA_SOURCE=postgres DATABASE_URL=... pnpm --filter @covet/backend dev

# Mobile in live mode:
# set EXPO_PUBLIC_API_MODE=live and EXPO_PUBLIC_API_BASE_URL in .env.local
pnpm --filter @covet/mobile start
```
