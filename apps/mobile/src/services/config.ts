/**
 * API mode selection. `fixture` (default) serves the in-app pre-integration
 * data with no network — the mode UI development and tests run in. `live`
 * points the same typed client at the real backend. Switching modes is a
 * config change; no screen changes (docs/05_engineering_architecture.md).
 *
 * Expo inlines `EXPO_PUBLIC_*` vars at build time. Nothing secret lives here
 * — only the mode and a base URL.
 */
export type ApiMode = 'fixture' | 'live';

export function getApiMode(): ApiMode {
  return process.env.EXPO_PUBLIC_API_MODE === 'live' ? 'live' : 'fixture';
}

export function getApiBaseUrl(): string {
  return process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';
}
