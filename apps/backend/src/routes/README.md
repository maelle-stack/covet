# routes

One folder per API endpoint group per docs/05_engineering_architecture.md:
/auth, /user, /onboarding, /bank-connections, /calendar-connections,
/transactions, /commitments, /recurring, /patterns, /safe-to-spend,
/purchase-checks, /vaults, /notifications, /insights, /settings, /privacy.

Each route handler should call into the corresponding domain service under
`src/services`, using request/response types from `@covet/shared-types`.
Routes must not contain financial or notification logic themselves.
