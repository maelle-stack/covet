import type { Cents, CurrencyCode, ISODateTimeString, UUID } from '../common';

export const ACCOUNT_TYPES = ['depository', 'credit', 'loan', 'investment', 'other'] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const ACCOUNT_SUBTYPES = ['checking', 'savings', 'credit_card', 'other'] as const;
export type AccountSubtype = (typeof ACCOUNT_SUBTYPES)[number];

export const FINANCIAL_ACCOUNT_STATUSES = ['active', 'closed', 'inactive'] as const;
export type FinancialAccountStatus = (typeof FINANCIAL_ACCOUNT_STATUSES)[number];

/**
 * A bank account under a BankConnection. Engine rules
 * (docs/02_financial_engine.md): only `checking` subtypes feed usable cash
 * for Safe to Spend; savings are excluded in v1; credit accounts can only
 * reduce Safe to Spend (debt pressure) and never increase it.
 */
export interface Account {
  id: UUID;
  userId: UUID;
  bankConnectionId: UUID;
  providerAccountId: string;
  name: string;
  officialName: string | null;
  type: AccountType;
  subtype: AccountSubtype;
  maskLast4: string | null;
  currentBalance: Cents;
  availableBalance: Cents | null;
  /** Credit accounts only: reported credit limit, for utilization tiers. */
  creditLimit: Cents | null;
  isoCurrencyCode: CurrencyCode;
  lastSyncedAt: ISODateTimeString | null;
  status: FinancialAccountStatus;
}
