import type { CovetApi } from './CovetApi';
import { getApiMode } from './config';
import { fixtureApi } from './fixtureApi';
import { httpApi } from './httpApi';

/**
 * The app's single API seam. Screens and hooks import `api` from here and
 * never know whether it is fixture- or HTTP-backed — the mode is chosen once,
 * by config. This is what makes the fixture→live switch invisible to the UI
 * (docs/05_engineering_architecture.md).
 */
export const api: CovetApi = getApiMode() === 'live' ? httpApi : fixtureApi;

// Re-exports so existing screens/tests keep their import paths.
export type { CovetApi, ActivityFeed, UpcomingData } from './CovetApi';
export type { ActivityAction } from '@covet/shared-types';
