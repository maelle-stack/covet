import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  ARCHETYPES,
  COMMITMENT_HARDNESS,
  COMMITMENT_STATUSES,
  DEBT_PRESSURE_LEVELS,
  EXTERNAL_CONFIDENCE_LABELS,
  NOTIFICATION_PRIVACY_LEVELS,
  NOTIFICATION_SEVERITIES,
  NOTIFICATION_TRIGGER_TYPES,
  OBLIGATION_PRESSURE_LEVELS,
  PURCHASE_DECISIONS,
  SPEND_STATUSES,
  STRICTNESS_LEVELS,
  USER_GOALS,
} from '@covet/shared-types';

const sql = readFileSync(join(__dirname, 'migrations', '0001_initial_schema.sql'), 'utf8');

/** Render a shared-types const array the way it appears in a CHECK constraint. */
const asCheckList = (values: readonly string[]) => values.map((v) => `'${v}'`).join(',');

describe('0001_initial_schema.sql', () => {
  const expectedTables = [
    'users',
    'user_settings',
    'auth_identities',
    'bank_connections',
    'accounts',
    'transactions',
    'calendar_connections',
    'calendar_events',
    'commitments',
    'recurring_items',
    'patterns',
    'archetype_results',
    'safe_to_spend_snapshots',
    'purchase_checks',
    'vaults',
    'notifications',
    'insights',
    'sync_jobs',
    'audit_events',
  ];

  it('creates all 19 core entity tables from the spec', () => {
    for (const table of expectedTables) {
      expect(sql).toContain(`create table ${table} (`);
    }
  });

  it('enables row level security on every table', () => {
    for (const table of expectedTables) {
      expect(sql).toContain(`alter table ${table} enable row level security;`);
    }
  });

  describe('CHECK constraints match @covet/shared-types enums exactly', () => {
    const cases: Array<[string, readonly string[]]> = [
      ['spend statuses', SPEND_STATUSES],
      ['strictness levels', STRICTNESS_LEVELS],
      ['commitment hardness', COMMITMENT_HARDNESS],
      ['commitment statuses', COMMITMENT_STATUSES],
      ['debt pressure tiers', DEBT_PRESSURE_LEVELS],
      ['obligation pressure levels', OBLIGATION_PRESSURE_LEVELS],
      ['archetypes', ARCHETYPES],
      ['user goals', USER_GOALS],
      ['external confidence labels', EXTERNAL_CONFIDENCE_LABELS],
      ['notification severities', NOTIFICATION_SEVERITIES],
      ['notification trigger types', NOTIFICATION_TRIGGER_TYPES],
      ['notification privacy levels', NOTIFICATION_PRIVACY_LEVELS],
      ['purchase decisions', PURCHASE_DECISIONS],
    ];

    it.each(cases)('%s', (_name, values) => {
      expect(sql).toContain(asCheckList(values));
    });
  });

  it('stores money as bigint cents, never floats', () => {
    // Core money columns must be bigint.
    for (const col of [
      'current_balance bigint',
      'amount bigint',
      'protected_amount bigint',
      'target_amount bigint',
      'safe_to_spend_before bigint',
      'emergency_floor_applied bigint',
    ]) {
      expect(sql).toContain(col);
    }
    expect(sql).not.toMatch(/\b(double precision|float4|float8)\b/);
  });

  it('quiet hours default to 21:00 → 09:00 per the notification spec', () => {
    expect(sql).toContain(`quiet_hours_start time not null default '21:00'`);
    expect(sql).toContain(`quiet_hours_end time not null default '09:00'`);
  });

  it('notification privacy defaults to discreet', () => {
    expect(sql).toContain(`notification_privacy_level text not null default 'discreet'`);
  });

  it('sale alerts default to off', () => {
    expect(sql).toContain('sale_alerts_enabled boolean not null default false');
  });

  it('preserves the protected/partial/at_risk commitment protection states', () => {
    // These three are load-bearing for Safe to Spend, Upcoming, and the
    // Notification Engine — a schema change must not collapse them back
    // into a single "confirmed" status.
    expect(COMMITMENT_STATUSES).toEqual(
      expect.arrayContaining(['protected', 'partial', 'at_risk']),
    );
  });
});
