import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { loadConfig } from '../config/env';
import { createSqlClient } from './client';

/**
 * Minimal forward-only migration runner. Applies the numbered .sql files in
 * `migrations/` in order, recording each in a `schema_migrations` ledger so
 * re-runs are idempotent. Raw SQL is the intentional convention here
 * (docs/05_engineering_architecture.md) — no ORM, money stays bigint cents.
 *
 * Usage: DATABASE_URL=... pnpm --filter @covet/backend migrate
 */
const MIGRATIONS_DIR = join(__dirname, 'migrations');

export async function runMigrations(databaseUrl: string): Promise<string[]> {
  const sql = createSqlClient(databaseUrl);
  const applied: string[] = [];
  try {
    await sql`
      create table if not exists schema_migrations (
        name text primary key,
        applied_at timestamptz not null default now()
      )`;

    const files = readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const done = await sql`select 1 from schema_migrations where name = ${file} limit 1`;
      if (done[0]) continue;

      const contents = readFileSync(join(MIGRATIONS_DIR, file), 'utf8');
      await sql.begin(async (tx) => {
        await tx.unsafe(contents);
        await tx`insert into schema_migrations (name) values (${file})`;
      });
      applied.push(file);
    }
    return applied;
  } finally {
    await sql.end({ timeout: 5 });
  }
}

if (require.main === module) {
  const config = loadConfig();
  if (!config.databaseUrl) {
    // eslint-disable-next-line no-console
    console.error('migrate: DATABASE_URL is required');
    process.exit(1);
  }
  runMigrations(config.databaseUrl)
    .then((applied) => {
      // eslint-disable-next-line no-console
      console.log(
        applied.length ? `applied migrations: ${applied.join(', ')}` : 'no new migrations',
      );
      process.exit(0);
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error('migration failed', err);
      process.exit(1);
    });
}
