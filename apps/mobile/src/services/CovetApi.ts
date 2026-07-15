import type {
  ActivityFeedResponse,
  PurchaseCheck,
  SafeToSpendSnapshot,
  UpcomingResponse,
  UserSettings,
} from '@covet/shared-types';

/**
 * The typed client contract every screen depends on. Both the fixture and
 * the live HTTP implementation satisfy this interface, which is exactly what
 * lets the app switch data sources without touching a screen. Screens and
 * hooks import `api` (the selected implementation) and these types — never a
 * concrete backend.
 */
export interface CovetApi {
  getCurrentSafeToSpend(): Promise<SafeToSpendSnapshot>;
  getActivity(): Promise<ActivityFeedResponse>;
  getUpcoming(): Promise<UpcomingResponse>;
  getUserSettings(): Promise<UserSettings>;
  getSeedPurchaseCheck(): Promise<PurchaseCheck>;
  /**
   * Sends a Purchase Check message. The create path (parsing + engine
   * hypothetical + AI phrasing) is a later backend checkpoint; until then
   * both implementations return canned, fixture-backed decisions.
   */
  createPurchaseCheck(rawInput: string, index: number): Promise<PurchaseCheck>;
}

/** Back-compat aliases for the shapes screens/tests already import by name. */
export type ActivityFeed = ActivityFeedResponse;
export type UpcomingData = UpcomingResponse;
