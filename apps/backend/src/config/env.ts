/**
 * Validated runtime configuration. Config is read once, here, and fails
 * fast if something required is missing — financial products degrade badly
 * when they boot half-configured. Secrets never live in the repo; only
 * `.env.example` documents the shape (docs/05_engineering_architecture.md).
 */

export type DataSource = 'memory' | 'postgres';

export interface BackendConfig {
  port: number;
  nodeEnv: string;
  /**
   * Where read endpoints get their data. `memory` serves the seeded demo
   * dataset with no external services (default — used for UI dev and
   * tests). `postgres` reads from a real database via DATABASE_URL.
   */
  dataSource: DataSource;
  databaseUrl: string | null;
}

function parseDataSource(raw: string | undefined): DataSource {
  if (raw === 'postgres') return 'postgres';
  if (raw === 'memory' || raw === undefined || raw === '') return 'memory';
  throw new Error(`Invalid DATA_SOURCE "${raw}" (expected "memory" or "postgres")`);
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): BackendConfig {
  const dataSource = parseDataSource(env.DATA_SOURCE);
  const databaseUrl = env.DATABASE_URL ?? null;

  if (dataSource === 'postgres' && !databaseUrl) {
    throw new Error('DATA_SOURCE=postgres requires DATABASE_URL to be set');
  }

  const port = Number(env.PORT ?? 3000);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`Invalid PORT "${env.PORT}"`);
  }

  return {
    port,
    nodeEnv: env.NODE_ENV ?? 'development',
    dataSource,
    databaseUrl,
  };
}
