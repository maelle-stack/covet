# Claude Instructions for Covet

You are working on the production Covet app.

Before making any product, design, architecture, or code decisions, read every file in `/docs`.

The Covet specification is the source of truth. If existing code conflicts with the specification, the specification wins.

Do not redesign Covet.
Do not turn Covet into a budgeting app.
Do not add generic fintech dashboard patterns.
Do not add charts, category donuts, budget widgets, gamification, or unnecessary screens.
Do not implement future systems unless explicitly asked.

If anything is ambiguous, ask before building.

Build in phases:
1. Repo architecture
2. Shared types and data models
3. Financial Engine
4. Notification Engine
5. Core screens
6. Integrations
7. Testing and production hardening
