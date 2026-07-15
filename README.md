# covet

# Covet

Covet is an iOS-first money management app that tells users what they can safely spend, protects upcoming commitments, and only notifies them when something important changes.

This repository contains the production Covet app.

## Stack

- React Native
- Expo
- TypeScript
- Supabase / Postgres
- Plaid
- Google Calendar / Apple Calendar
- Backend financial engine
- Notification engine

## Product Spec

The product specification lives in `/docs`.

Claude/Codex must read:

- `/CLAUDE.md`
- `/docs/00_north_star.md`
- `/docs/01_consumer_experience.md`
- `/docs/02_financial_engine.md`
- `/docs/03_notification_engine.md`
- `/docs/04_design_system.md`
- `/docs/05_engineering_architecture.md`
- `/docs/06_future_systems.md`

before making product or architecture changes.

## Core Rule

Covet is not a budgeting app, dashboard, or expense tracker.

Covet quietly manages money decisions for the user.

## Repository Layout

This is a pnpm workspace monorepo.

```
apps/
  mobile/    React Native + Expo + TypeScript iOS-first app
  backend/   Domain services (financial-engine, notification-engine, etc.),
             Postgres/Supabase access, Plaid/calendar/AI integrations
packages/
  shared-types/    Shared domain models and API contracts (frontend + backend)
  design-tokens/   Design token placeholders per docs/04_design_system.md
```

Run `pnpm install` at the repo root, then use `pnpm --filter @covet/backend dev`
or `pnpm --filter @covet/mobile start` to run an individual app.

Product logic must live in `apps/backend/src/services/*`, never in mobile
screens. See `/CLAUDE.md` and `/docs` before making product, design, or
architecture decisions.
