import type { ISODateTimeString, UUID } from '../common';

export const BANK_PROVIDERS = ['plaid'] as const;
export type BankProvider = (typeof BANK_PROVIDERS)[number];

export const BANK_CONNECTION_STATUSES = [
  'pending',
  'active',
  'requires_reauth',
  'error',
  'disconnected',
] as const;
export type BankConnectionStatus = (typeof BANK_CONNECTION_STATUSES)[number];

/**
 * A Plaid-linked institution. Access tokens are stored server-side only and
 * are never part of this model (docs/05_engineering_architecture.md).
 * A non-`active` status must lower engine confidence and can trigger a
 * Protect-severity connection-health notification.
 */
export interface BankConnection {
  id: UUID;
  userId: UUID;
  provider: BankProvider;
  providerItemId: string;
  institutionName: string;
  status: BankConnectionStatus;
  lastSuccessfulSyncAt: ISODateTimeString | null;
  lastWebhookAt: ISODateTimeString | null;
  requiresReauth: boolean;
  errorCode: string | null;
  createdAt: ISODateTimeString;
}
