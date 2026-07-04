import express, { type Express } from 'express';

/**
 * Backend service entrypoint. Route groups and domain services are wired up
 * incrementally starting Phase 3 (financial-engine) and Phase 4
 * (notification-engine). This currently exposes only a health check.
 */
const app: Express = express();
const port = process.env.PORT ?? 3000;

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

if (require.main === module) {
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`covet backend listening on ${port}`);
  });
}

export { app };
