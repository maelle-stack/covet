import type { Account, Commitment, RecurringItem, Transaction, Vault } from '@covet/shared-types';

let counter = 0;
function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter}`;
}

export function makeAccount(overrides: Partial<Account> = {}): Account {
  return {
    id: nextId('account'),
    userId: 'user-1',
    bankConnectionId: 'bank-1',
    providerAccountId: nextId('provider-account'),
    name: 'Checking',
    officialName: null,
    type: 'depository',
    subtype: 'checking',
    maskLast4: '1234',
    currentBalance: 100_00,
    availableBalance: 100_00,
    creditLimit: null,
    isoCurrencyCode: 'USD',
    lastSyncedAt: '2026-07-01T00:00:00Z',
    status: 'active',
    ...overrides,
  };
}

export function makeCreditAccount(overrides: Partial<Account> = {}): Account {
  return makeAccount({
    type: 'credit',
    subtype: 'credit_card',
    currentBalance: 0,
    creditLimit: 1_000_00,
    ...overrides,
  });
}

export function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: nextId('txn'),
    userId: 'user-1',
    accountId: 'account-1',
    providerTransactionId: nextId('provider-txn'),
    amount: 10_00,
    merchantName: 'Merchant',
    originalDescription: null,
    category: null,
    subcategory: null,
    date: '2026-07-01',
    authorizedDate: null,
    pending: false,
    type: 'debit',
    isoCurrencyCode: 'USD',
    paymentChannel: 'other',
    confidence: null,
    isTransfer: false,
    excludedFromIncome: false,
    excludedFromSpending: false,
    recurringCandidateId: null,
    metadata: null,
    ...overrides,
  };
}

export function makeCommitment(overrides: Partial<Commitment> = {}): Commitment {
  return {
    id: nextId('commitment'),
    userId: 'user-1',
    source: 'user_entered',
    title: 'Commitment',
    amount: 100_00,
    estimatedAmount: null,
    confirmedAmount: null,
    dueAt: null,
    commitmentType: 'other',
    hardness: 'soft',
    status: 'protected',
    protectedAmount: 0,
    protectionStartAt: null,
    confidence: null,
    userConfirmed: true,
    userDenied: false,
    linkedCalendarEventId: null,
    linkedTransactionId: null,
    linkedRecurringItemId: null,
    createdAt: '2026-06-01T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z',
    metadata: null,
    ...overrides,
  };
}

export function makeRecurringItem(overrides: Partial<RecurringItem> = {}): RecurringItem {
  return {
    id: nextId('recurring'),
    userId: 'user-1',
    title: 'Recurring item',
    merchantName: null,
    amountEstimate: 50_00,
    cadence: 'weekly',
    nextExpectedAt: null,
    recurringType: 'habit',
    hardness: 'soft',
    confidence: 80,
    status: 'confirmed',
    linkedPatternId: null,
    lastSeenAt: null,
    userConfirmed: true,
    userPaused: false,
    createdAt: '2026-06-01T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z',
    metadata: null,
    ...overrides,
  };
}

export function makeVault(overrides: Partial<Vault> = {}): Vault {
  return {
    id: nextId('vault'),
    userId: 'user-1',
    title: 'Vault',
    targetAmount: 200_00,
    currentProtectedAmount: 0,
    desiredByDate: null,
    status: 'active',
    activelyProtected: true,
    source: 'user_entered',
    merchant: null,
    url: null,
    imageAssetId: null,
    affordabilityDate: null,
    lastRecalculatedAt: null,
    notificationPreferences: { affordabilityAlertsEnabled: true, saleAlertsEnabled: false },
    createdAt: '2026-06-01T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z',
    ...overrides,
  };
}
