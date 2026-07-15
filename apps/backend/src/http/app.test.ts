import request from 'supertest';

import { createApp } from '../app';
import { DEMO_USER_ID } from '../db/seed-data';
import { createMemoryRepositories } from '../repositories/memory';

function testApp() {
  return createApp(createMemoryRepositories());
}

describe('read endpoints (in-memory data source)', () => {
  it('GET /safe-to-spend/current returns the enveloped snapshot', async () => {
    const res = await request(testApp()).get('/safe-to-spend/current');
    expect(res.status).toBe(200);
    expect(res.body.data.snapshot.amount).toBe(316_00);
    expect(res.body.data.snapshot.status).toBe('YOURE_GOOD');
    expect(res.body.data.snapshot.dailyPace).toBe(50_00);
  });

  it('GET /activity returns insights (gated on >=25 txns), actions, and transactions', async () => {
    const res = await request(testApp()).get('/activity');
    expect(res.status).toBe(200);
    expect(res.body.data.transactions).toHaveLength(26);
    // 26 transactions clears the >=25 gate, so the insight is present.
    expect(res.body.data.insights).toHaveLength(1);
    expect(res.body.data.actions.length).toBeGreaterThan(0);
  });

  it('GET /upcoming returns events, recurring, and vaults (passive vault included)', async () => {
    const res = await request(testApp()).get('/upcoming');
    expect(res.status).toBe(200);
    expect(
      res.body.data.events.every((e: { commitmentType: string }) =>
        ['event', 'travel'].includes(e.commitmentType),
      ),
    ).toBe(true);
    expect(res.body.data.recurring.length).toBeGreaterThan(0);
    const jacket = res.body.data.vaults.find((v: { title: string }) => v.title === 'Jacket');
    expect(jacket.activelyProtected).toBe(false);
  });

  it('GET /settings returns the enveloped user settings', async () => {
    const res = await request(testApp()).get('/settings');
    expect(res.status).toBe(200);
    expect(res.body.data.settings.notificationPrivacyLevel).toBe('discreet');
  });

  it('GET /purchase-checks/seed returns the opening jacket exchange', async () => {
    const res = await request(testApp()).get('/purchase-checks/seed');
    expect(res.status).toBe(200);
    expect(res.body.data.purchaseCheck.decision).toBe('wait');
    expect(res.body.data.purchaseCheck.rawInput).toBe('can i buy this $180 jacket?');
  });

  it('scopes reads to the authenticated user — an unknown user gets a calm 404', async () => {
    const res = await request(testApp())
      .get('/safe-to-spend/current')
      .set('x-covet-user-id', '00000000-0000-4000-8000-0000000000ff');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('not_found');
  });

  it('honors an explicit demo user id header (same data as the default)', async () => {
    const res = await request(testApp())
      .get('/safe-to-spend/current')
      .set('x-covet-user-id', DEMO_USER_ID);
    expect(res.status).toBe(200);
    expect(res.body.data.snapshot.amount).toBe(316_00);
  });

  it('still serves the health check', async () => {
    const res = await request(testApp()).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
