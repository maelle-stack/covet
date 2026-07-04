import type {
  Cents,
  ConfidenceScore,
  CurrencyCode,
  ISODateString,
  Metadata,
  UUID,
} from '../common';

export const TRANSACTION_TYPES = ['debit', 'credit'] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const PAYMENT_CHANNELS = ['online', 'in_store', 'other'] as const;
export type PaymentChannel = (typeof PAYMENT_CHANNELS)[number];

/**
 * A bank transaction (docs/05_engineering_architecture.md).
 * Engine rules: pending transactions reduce Safe to Spend immediately;
 * transfers are excluded from income and spending by default; unclear
 * transfers that materially affect the engine surface a review Action.
 * Deduplication across pending→posted transitions is required upstream.
 */
export interface Transaction {
  id: UUID;
  userId: UUID;
  accountId: UUID;
  providerTransactionId: string;
  /** Positive = money out (debit), negative = money in (credit). */
  amount: Cents;
  merchantName: string | null;
  originalDescription: string | null;
  category: string | null;
  subcategory: string | null;
  date: ISODateString;
  authorizedDate: ISODateString | null;
  pending: boolean;
  type: TransactionType;
  isoCurrencyCode: CurrencyCode;
  paymentChannel: PaymentChannel;
  /** Categorization confidence, 0–100. Null when unclassified. */
  confidence: ConfidenceScore | null;
  isTransfer: boolean;
  excludedFromIncome: boolean;
  excludedFromSpending: boolean;
  recurringCandidateId: UUID | null;
  metadata: Metadata | null;
}
