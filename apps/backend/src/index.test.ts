import request from 'supertest';

import { app } from './index';

describe('health check', () => {
  it('responds ok, proving the service skeleton and test tooling wire up correctly', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
