import type {
  ActivityFeedResponse,
  PurchaseCheck,
  SafeToSpendSnapshot,
  UpcomingResponse,
  UserSettings,
} from '@covet/shared-types';

/**
 * The read-side data access surface needed by the Phase 6.1 endpoints. Route
 * handlers depend only on this interface; the storage backend (in-memory
 * seed vs. Postgres) is chosen at startup. Write repositories and the
 * remaining entities arrive with their endpoints in later checkpoints.
 *
 * Every method is scoped by `userId` — defense in depth alongside RLS. A
 * `null` return means "no such user / no data", which routes translate into
 * a calm 404.
 */
export interface CovetRepositories {
  getLatestSnapshot(userId: string): Promise<SafeToSpendSnapshot | null>;
  getActivity(userId: string): Promise<ActivityFeedResponse | null>;
  getUpcoming(userId: string): Promise<UpcomingResponse | null>;
  getUserSettings(userId: string): Promise<UserSettings | null>;
  getSeedPurchaseCheck(userId: string): Promise<PurchaseCheck | null>;
  /** Release any underlying resources (DB pool). No-op for in-memory. */
  close(): Promise<void>;
}

/**
 * The >=25-transaction Insights gate is a BACKEND rule
 * (docs/01_consumer_experience.md). It lives here so every data source
 * enforces it identically and the UI never re-derives it.
 */
export function gateInsights<T>(insights: readonly T[], transactionCount: number): readonly T[] {
  return transactionCount >= 25 ? insights : [];
}
