import request from 'supertest';

import { createApp } from '../app';
import { createMemoryRepositories } from '../repositories/memory';

const RENT_ID = '00000000-0000-4000-8000-000000000101';
const BIRTHDAY_ID = '00000000-0000-4000-8000-000000000103';

function testApp() {
  return createApp(createMemoryRepositories());
}

describe('write endpoints (in-memory data source)', () => {
  it('POST /safe-to-spend/recalculate computes and persists a snapshot', async () => {
    const app = testApp();
    const res = await request(app)
      .post('/safe-to-spend/recalculate')
      .send({ reason: 'user_requested' });
    expect(res.status).toBe(200);
    expect(res.body.data.recalculated).toBe(true);
    expect(Number.isInteger(res.body.data.snapshot.amount)).toBe(true);

    // The recomputed snapshot is now what GET /current serves.
    const current = await request(app).get('/safe-to-spend/current');
    expect(current.body.data.snapshot.id).toBe(res.body.data.snapshot.id);
  });

  it('POST /safe-to-spend/recalculate is idempotent on unchanged inputs', async () => {
    const app = testApp();
    await request(app).post('/safe-to-spend/recalculate').send({ reason: 'user_requested' });
    const second = await request(app)
      .post('/safe-to-spend/recalculate')
      .send({ reason: 'user_requested' });
    expect(second.body.data.recalculated).toBe(false);
  });

  it('POST /safe-to-spend/recalculate rejects an invalid reason', async () => {
    const res = await request(testApp())
      .post('/safe-to-spend/recalculate')
      .send({ reason: 'because' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('invalid_reason');
  });

  it('POST /commitments/:id/confirm confirms and returns a fresh snapshot', async () => {
    const res = await request(testApp())
      .post(`/commitments/${BIRTHDAY_ID}/confirm`)
      .send({ confirmedAmount: 95_00 });
    expect(res.status).toBe(200);
    expect(res.body.data.commitment.status).toBe('protected');
    expect(res.body.data.commitment.userConfirmed).toBe(true);
    expect(res.body.data.commitment.confirmedAmount).toBe(95_00);
    expect(res.body.data.snapshot).toBeDefined();
  });

  it('POST /commitments/:id/deny denies and recalculates', async () => {
    const app = testApp();
    const res = await request(app).post(`/commitments/${RENT_ID}/deny`);
    expect(res.status).toBe(200);
    expect(res.body.data.commitment.status).toBe('denied');
    expect(res.body.data.commitment.userDenied).toBe(true);

    // Denied Rent is gone from the newly protected hard commitments.
    expect(
      res.body.data.snapshot.protectedHardCommitments.some(
        (c: { title: string }) => c.title === 'Rent',
      ),
    ).toBe(false);
  });

  it('POST /commitments/:id/confirm 404s for an unknown commitment', async () => {
    const res = await request(testApp())
      .post('/commitments/00000000-0000-4000-8000-0000000009ff/confirm')
      .send({});
    expect(res.status).toBe(404);
  });

  it('POST /commitments/:id/confirm rejects a non-integer amount', async () => {
    const res = await request(testApp())
      .post(`/commitments/${BIRTHDAY_ID}/confirm`)
      .send({ confirmedAmount: 12.5 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('invalid_amount');
  });

  it('PATCH /settings persists notification preferences (no recalculation)', async () => {
    const app = testApp();
    const res = await request(app).patch('/settings').send({ saleAlertsEnabled: true });
    expect(res.status).toBe(200);
    expect(res.body.data.settings.saleAlertsEnabled).toBe(true);

    const after = await request(app).get('/settings');
    expect(after.body.data.settings.saleAlertsEnabled).toBe(true);
  });

  it('PATCH /settings ignores unknown / engine-affecting fields', async () => {
    const app = testApp();
    const res = await request(app)
      .patch('/settings')
      .send({ strictnessLevel: 'protective', notificationPrivacyLevel: 'hidden' });
    expect(res.status).toBe(200);
    // Allow-listed field applied...
    expect(res.body.data.settings.notificationPrivacyLevel).toBe('hidden');
    // ...and there is no strictness on settings (it lives on the user).
    expect(res.body.data.settings.strictnessLevel).toBeUndefined();
  });
});
