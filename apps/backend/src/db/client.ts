import postgres, { type Sql } from 'postgres';

/**
 * Creates a postgres.js client from a connection string. This is the single
 * place a DB connection is opened; repositories receive the `Sql` instance
 * rather than importing it, which keeps them testable and connection-agnostic.
 */
export function createSqlClient(databaseUrl: string): Sql {
  return postgres(databaseUrl, {
    // Cents are bigint columns; we convert per-column in the repositories.
    // Keep a small, predictable pool for the API service.
    max: 10,
    idle_timeout: 20,
  });
}
