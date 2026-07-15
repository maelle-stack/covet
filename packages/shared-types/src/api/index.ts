/**
 * Typed API contracts for the endpoints named in
 * docs/05_engineering_architecture.md. Contracts for the remaining endpoint
 * groups (/auth, /user, /onboarding, /bank-connections,
 * /calendar-connections, /transactions, /recurring, /vaults, /insights,
 * /settings, /privacy) are added alongside their backend implementations
 * in Phases 3–6 so contracts and handlers land together.
 */
export * from './envelope';
export * from './safe-to-spend';
export * from './commitments';
export * from './patterns';
export * from './purchase-checks';
export * from './notifications';
export * from './activity';
export * from './upcoming';
export * from './settings';
