import type { Cents, ISODateString, ISODateTimeString, UUID } from '../common';

export const VAULT_STATUSES = [
  'saved', // passive desire, does not reduce Safe to Spend
  'active', // actively protected, reduces Safe to Spend
  'achieved',
  'archived',
] as const;
export type VaultStatus = (typeof VAULT_STATUSES)[number];

export const VAULT_SOURCES = ['user_entered', 'purchase_check'] as const;
export type VaultSource = (typeof VAULT_SOURCES)[number];

/** Typed per-vault notification switches (no loose JSON). */
export interface VaultNotificationPreferences {
  affordabilityAlertsEnabled: boolean;
  saleAlertsEnabled: boolean;
}

/**
 * A desire or planned purchase (docs/01_consumer_experience.md Vaults).
 * Reduces Safe to Spend ONLY while `activelyProtected` is true
 * (docs/02_financial_engine.md).
 */
export interface Vault {
  id: UUID;
  userId: UUID;
  title: string;
  targetAmount: Cents;
  currentProtectedAmount: Cents;
  desiredByDate: ISODateString | null;
  status: VaultStatus;
  activelyProtected: boolean;
  source: VaultSource;
  merchant: string | null;
  url: string | null;
  imageAssetId: string | null;
  /** Engine-estimated date the purchase fits safely. */
  affordabilityDate: ISODateString | null;
  lastRecalculatedAt: ISODateTimeString | null;
  notificationPreferences: VaultNotificationPreferences;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}
