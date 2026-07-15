import { createApp } from './app';
import { loadConfig } from './config/env';
import { resolveRepositories } from './repositories';

/**
 * Backend service entrypoint. Loads validated config, resolves the data
 * source (in-memory demo data by default; Postgres when configured), builds
 * the app, and listens. The Financial and Notification engines remain pure
 * services this layer calls into — never reimplemented here.
 */
const config = loadConfig();
const repos = resolveRepositories(config);
const app = createApp(repos);

export { app };

if (require.main === module) {
  const server = app.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`covet backend listening on ${config.port} (data source: ${config.dataSource})`);
  });

  const shutdown = () => {
    server.close(() => {
      void repos.close().finally(() => process.exit(0));
    });
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}
