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
