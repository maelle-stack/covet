import type { ISODateTimeString, UUID } from '../common';

export const CALENDAR_PROVIDERS = ['google', 'apple'] as const;
export type CalendarProvider = (typeof CALENDAR_PROVIDERS)[number];

export const CALENDAR_CONNECTION_STATUSES = [
  'pending',
  'active',
  'requires_reauth',
  'error',
  'disconnected',
] as const;
export type CalendarConnectionStatus = (typeof CALENDAR_CONNECTION_STATUSES)[number];

/**
 * A connected calendar source. OAuth secrets stay on the backend
 * (Google) or with the OS permission layer (Apple).
 */
export interface CalendarConnection {
  id: UUID;
  userId: UUID;
  provider: CalendarProvider;
  status: CalendarConnectionStatus;
  lastSuccessfulSyncAt: ISODateTimeString | null;
  requiresReauth: boolean;
  /** Provider calendar ids the user chose to share. */
  selectedCalendars: readonly string[];
  createdAt: ISODateTimeString;
}
