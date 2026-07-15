import type {
  ActivityFeedResponse,
  ApiResponse,
  GetCurrentSafeToSpendResponse,
  GetSettingsResponse,
  PurchaseCheck,
  SafeToSpendSnapshot,
  SeedPurchaseCheckResponse,
  UpcomingResponse,
  UserSettings,
} from '@covet/shared-types';

import type { CovetApi } from './CovetApi';
import { getApiBaseUrl } from './config';
import { fixtureApi } from './fixtureApi';

/**
 * Live HTTP client. Calls the backend read endpoints and unwraps the
 * standard `{ data } | { error }` envelope, returning the same domain shapes
 * the fixture client returns. This is the only place `fetch` lives; screens
 * remain unaware of transport.
 *
 * Auth: a dev header scopes the request to the demo user until real Supabase
 * auth lands in a later checkpoint (the backend rejects this outside dev).
 */
async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    headers: { Accept: 'application/json' },
  });
  const body = (await res.json()) as ApiResponse<T>;
  if (!res.ok || 'error' in body) {
    const message = 'error' in body ? body.error.message : `Request failed (${res.status})`;
    throw new Error(message);
  }
  return body.data;
}

export const httpApi: CovetApi = {
  async getCurrentSafeToSpend(): Promise<SafeToSpendSnapshot> {
    const data = await getJson<GetCurrentSafeToSpendResponse>('/safe-to-spend/current');
    return data.snapshot;
  },

  async getActivity(): Promise<ActivityFeedResponse> {
    return getJson<ActivityFeedResponse>('/activity');
  },

  async getUpcoming(): Promise<UpcomingResponse> {
    return getJson<UpcomingResponse>('/upcoming');
  },

  async getUserSettings(): Promise<UserSettings> {
    const data = await getJson<GetSettingsResponse>('/settings');
    return data.settings;
  },

  async getSeedPurchaseCheck(): Promise<PurchaseCheck> {
    const data = await getJson<SeedPurchaseCheckResponse>('/purchase-checks/seed');
    return data.purchaseCheck;
  },

  /**
   * The create endpoint (POST) is a later gated checkpoint (engine
   * hypothetical + AI phrasing). Until then, live mode reuses the same
   * canned decisions as fixture mode so the Purchase Check screen stays
   * fully functional.
   */
  async createPurchaseCheck(rawInput: string, index: number): Promise<PurchaseCheck> {
    return fixtureApi.createPurchaseCheck(rawInput, index);
  },
};
