import type { SpendStatus } from '@covet/shared-types';

import { DEMO_USER_ID } from '../../db/seed-data';
import { createMemoryRepositories } from '../../repositories/memory';
import { recalculateSafeToSpend } from './recalculate';

const VALID_STATUSES: SpendStatus[] = [
  'YOURE_GOOD',
  'TAKE_IT_EASY',
  'WAIT_UNTIL_PAYDAY',
  'LETS_NOT',
];
const NOW = '2026-07-04T16:00:00Z';

describe('recalculateSafeToSpend orchestrator', () => {
  it('computes and persists a valid snapshot from repository inputs', async () => {
    const repos = createMemoryRepositories();
    const result = await recalculateSafeToSpend(repos, DEMO_USER_ID, 'user_requested', NOW);

    expect(result).not.toBeNull();
    expect(result!.recalculated).toBe(true);
    expect(Number.isInteger(result!.snapshot.amount)).toBe(true);
    expect(VALID_STATUSES).toContain(result!.snapshot.status);
    // It becomes the latest snapshot the read endpoint would serve.
    const latest = await repos.getLatestSnapshot(DEMO_USER_ID);
    expect(latest!.id).toBe(result!.snapshot.id);
  });

  it('is idempotent: unchanged inputs produce no new snapshot', async () => {
    const repos = createMemoryRepositories();
    await recalculateSafeToSpend(repos, DEMO_USER_ID, 'user_requested', NOW);
    const second = await recalculateSafeToSpend(repos, DEMO_USER_ID, 'user_requested', NOW);
    expect(second!.recalculated).toBe(false);
  });

  it('is deterministic for a fixed clock', async () => {
    const a = await recalculateSafeToSpend(
      createMemoryRepositories(),
      DEMO_USER_ID,
      'user_requested',
      NOW,
    );
    const b = await recalculateSafeToSpend(
      createMemoryRepositories(),
      DEMO_USER_ID,
      'user_requested',
      NOW,
    );
    expect(a!.snapshot.amount).toBe(b!.snapshot.amount);
    expect(a!.snapshot.inputsHash).toBe(b!.snapshot.inputsHash);
  });

  it('returns null for an unknown user', async () => {
    const repos = createMemoryRepositories();
    const result = await recalculateSafeToSpend(
      repos,
      '00000000-0000-4000-8000-0000000000ff',
      'user_requested',
      NOW,
    );
    expect(result).toBeNull();
  });

  it('denying a commitment changes the computed inputs (frees protected cash)', async () => {
    const repos = createMemoryRepositories();
    const before = await recalculateSafeToSpend(repos, DEMO_USER_ID, 'user_requested', NOW);

    // Deny the protected Rent commitment, then recalculate.
    await repos.setCommitmentStatus(DEMO_USER_ID, '00000000-0000-4000-8000-000000000101', {
      status: 'denied',
      userDenied: true,
    });
    const after = await recalculateSafeToSpend(repos, DEMO_USER_ID, 'commitment_change', NOW);

    expect(after!.recalculated).toBe(true);
    expect(after!.snapshot.inputsHash).not.toBe(before!.snapshot.inputsHash);
    // Rent is no longer among the protected hard commitments.
    expect(after!.snapshot.protectedHardCommitments.some((c) => c.title === 'Rent')).toBe(false);
  });
});
