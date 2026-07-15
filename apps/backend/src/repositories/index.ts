import type { BackendConfig } from '../config/env';
import { createSqlClient } from '../db/client';
import { createMemoryRepositories } from './memory';
import { createPostgresRepositories } from './postgres';
import type { CovetRepositories } from './types';

export type {
  CovetRepositories,
  EngineInputBundle,
  CommitmentStatusPatch,
  UserSettingsPatch,
} from './types';

/**
 * Resolves the repository implementation for the configured data source.
 * `memory` (default) serves the seeded demo dataset with no external
 * services; `postgres` opens a real connection. Everything above this line
 * — routes, envelope, the mobile client — is identical either way, which is
 * exactly what makes the fixture→live switch a config change, not a rewrite.
 */
export function resolveRepositories(config: BackendConfig): CovetRepositories {
  if (config.dataSource === 'postgres') {
    if (!config.databaseUrl) {
      throw new Error('postgres data source requires DATABASE_URL');
    }
    return createPostgresRepositories(createSqlClient(config.databaseUrl));
  }
  return createMemoryRepositories();
}
