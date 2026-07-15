import type { ConfidenceScore, ISODateTimeString, Metadata, UUID } from '../common';

export const CALENDAR_EVENT_CLASSIFICATIONS = [
  'virtual',
  'in_person',
  'travel',
  'academic',
  'social',
  'birthday',
  'appointment',
  'unknown',
] as const;
export type CalendarEventClassification = (typeof CALENDAR_EVENT_CLASSIFICATIONS)[number];

export const TRAVEL_MODES = [
  'walking',
  'public_transit',
  'rideshare',
  'driving',
  'train',
  'flight',
  'not_sure',
] as const;
export type TravelMode = (typeof TRAVEL_MODES)[number];

/**
 * A normalized calendar event (docs/05_engineering_architecture.md).
 * Virtual events must not become financial commitments automatically.
 * Spend candidates become Commitments only via approve/deny controls
 * (docs/01_consumer_experience.md).
 */
export interface CalendarEvent {
  id: UUID;
  userId: UUID;
  calendarConnectionId: UUID;
  providerEventId: string;
  title: string;
  startAt: ISODateTimeString;
  endAt: ISODateTimeString | null;
  timezone: string;
  location: string | null;
  classification: CalendarEventClassification;
  isVirtual: boolean;
  virtualProvider: string | null; // e.g. "zoom", "meet"
  travelDistanceKmEstimate: number | null;
  travelMode: TravelMode | null;
  notesAvailable: boolean;
  /** True when the event plausibly costs money and may become a Commitment. */
  spendCandidate: boolean;
  confidence: ConfidenceScore | null;
  linkedCommitmentId: UUID | null;
  metadata: Metadata | null;
}
