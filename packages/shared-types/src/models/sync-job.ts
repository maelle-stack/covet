import type { ISODateTimeString, Metadata, UUID } from '../common';

export const SYNC_JOB_TYPES = [
  'plaid_sync',
  'calendar_sync',
  'notification_check',
  'financial_recalculation',
  'insight_generation',
  'cleanup',
] as const;
export type SyncJobType = (typeof SYNC_JOB_TYPES)[number];

export const SYNC_JOB_STATUSES = [
  'pending',
  'running',
  'succeeded',
  'failed',
  'cancelled',
] as const;
export type SyncJobStatus = (typeof SYNC_JOB_STATUSES)[number];

/** Tracks background jobs (docs/05_engineering_architecture.md). */
export interface SyncJob {
  id: UUID;
  /** Null for system-wide jobs (e.g. cleanup). */
  userId: UUID | null;
  jobType: SyncJobType;
  status: SyncJobStatus;
  startedAt: ISODateTimeString | null;
  completedAt: ISODateTimeString | null;
  errorCode: string | null;
  errorMessage: string | null;
  retryCount: number;
  createdAt: ISODateTimeString;
  metadata: Metadata | null;
}
