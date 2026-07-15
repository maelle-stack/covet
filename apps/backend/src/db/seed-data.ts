import type {
  ActivityAction,
  Commitment,
  Insight,
  PurchaseCheck,
  RecurringItem,
  SafeToSpendSnapshot,
  Transaction,
  User,
  UserSettings,
  Vault,
} from '@covet/shared-types';

/**
 * Canonical demo dataset — the single source of truth for both the Postgres
 * `seed` script and the in-memory repository. It mirrors the DISPLAYED
 * values of the mobile app's fixtures ($316 / YOU'RE GOOD / $50.00/day, 26
 * transactions, the same recurring items and vaults) so switching the app
 * from fixture mode to live mode is visually invisible.
 *
 * This is pre-integration demo data, not production seed. Real data arrives
 * via Plaid/calendar sync in later checkpoints. IDs are UUIDs so the same
 * dataset loads cleanly into the UUID-keyed schema.
 */

export const DEMO_USER_ID = '00000000-0000-4000-8000-000000000001';
const NOW = '2026-07-04T16:00:00Z';

export const demoUser: User = {
  id: DEMO_USER_ID,
  createdAt: '2026-05-01T00:00:00Z',
  updatedAt: NOW,
  firstName: 'Maelle',
  timezone: 'America/New_York',
  locale: 'en-US',
  onboardingStatus: 'completed',
  primaryArchetype: 'spontaneous',
  secondaryArchetype: 'keeper',
  activeGoal: 'know_what_i_can_spend',
  strictnessLevel: 'balanced',
  accountStatus: 'active',
};

export const demoSettings: UserSettings = {
  userId: DEMO_USER_ID,
  createdAt: '2026-05-01T00:00:00Z',
  updatedAt: NOW,
  quietHours: { start: '21:00', end: '09:00' },
  notificationPrivacyLevel: 'discreet',
  dailyPacingEnabled: true,
  dailyPacingNotificationsEnabled: true,
  saleAlertsEnabled: false,
  vaultNotificationsEnabled: true,
  reviewPromptsEnabled: true,
  biometricLockEnabled: true,
  calendarSuggestionsEnabled: true,
  walletPrimaryColor: null,
  analyticsOptOut: false,
};

const RENT_ID = '00000000-0000-4000-8000-000000000101';
const CARD_MIN_ID = '00000000-0000-4000-8000-000000000102';
const BIRTHDAY_ID = '00000000-0000-4000-8000-000000000103';
const RECURRING_RENT_ID = '00000000-0000-4000-8000-000000000201';
const RECURRING_BRUNCH_ID = '00000000-0000-4000-8000-000000000202';
const RECURRING_PILATES_ID = '00000000-0000-4000-8000-000000000203';

const rentCommitment: Commitment = {
  id: RENT_ID,
  userId: DEMO_USER_ID,
  source: 'transaction_detected',
  title: 'Rent',
  amount: 1200_00,
  estimatedAmount: null,
  confirmedAmount: 1200_00,
  dueAt: '2026-07-31T00:00:00Z',
  commitmentType: 'rent',
  hardness: 'hard',
  status: 'protected',
  protectedAmount: 1200_00,
  protectionStartAt: '2026-07-01T00:00:00Z',
  confidence: 96,
  userConfirmed: true,
  userDenied: false,
  linkedCalendarEventId: null,
  linkedTransactionId: null,
  linkedRecurringItemId: RECURRING_RENT_ID,
  createdAt: '2026-05-02T00:00:00Z',
  updatedAt: NOW,
  metadata: null,
};

const cardMinimumCommitment: Commitment = {
  ...rentCommitment,
  id: CARD_MIN_ID,
  title: 'Card minimum',
  amount: 35_00,
  confirmedAmount: 35_00,
  dueAt: '2026-07-21T00:00:00Z',
  commitmentType: 'debt_minimum',
  linkedRecurringItemId: null,
  protectedAmount: 35_00,
};

const birthdayDinnerCommitment: Commitment = {
  ...rentCommitment,
  id: BIRTHDAY_ID,
  source: 'calendar',
  title: 'Birthday dinner',
  amount: 90_00,
  estimatedAmount: 90_00,
  confirmedAmount: null,
  dueAt: '2026-07-11T23:00:00Z',
  commitmentType: 'event',
  hardness: 'semi_hard',
  status: 'candidate',
  protectedAmount: 0,
  confidence: 78,
  userConfirmed: false,
  linkedCalendarEventId: '00000000-0000-4000-8000-000000000301',
  linkedRecurringItemId: null,
};

export const demoCommitments: Commitment[] = [
  rentCommitment,
  cardMinimumCommitment,
  birthdayDinnerCommitment,
];

export const demoSnapshot: SafeToSpendSnapshot = {
  id: '00000000-0000-4000-8000-000000000401',
  userId: DEMO_USER_ID,
  amount: 316_00,
  payCycleStart: '2026-07-04',
  payCycleEnd: '2026-07-10',
  daysUntilNextIncome: 6,
  dailyPace: 50_00,
  internalProjectedPace: 41_00,
  paceProjection: [],
  status: 'YOURE_GOOD',
  confidenceScore: 88,
  externalConfidenceLabel: 'high',
  protectedHardCommitments: [
    { commitmentId: RENT_ID, title: 'Rent', hardness: 'hard', protectedAmount: 1200_00 },
    { commitmentId: CARD_MIN_ID, title: 'Card minimum', hardness: 'hard', protectedAmount: 35_00 },
  ],
  protectedSemiHardCommitments: [],
  protectedSoftCommitments: [
    {
      commitmentId: '00000000-0000-4000-8000-000000000104',
      title: 'Brunch',
      hardness: 'soft',
      protectedAmount: 75_00,
    },
  ],
  debtPressureLevel: 'normal',
  obligationPressureLevel: 'normal',
  emergencyFloorApplied: 84_00,
  behaviorBufferApplied: 63_00,
  majorChangeFlags: [],
  explanationSummary:
    "I'm protecting Rent, Card minimum, Brunch. Your pace is $50/day for the next 6 days.",
  lastCalculatedAt: NOW,
  staleAfter: '2026-07-04T22:00:00Z',
  inputsHash: 'demo-hash',
};

const MERCHANTS: ReadonlyArray<[string, number]> = [
  ['Tatte Bakery', 14_50],
  ['Blue Bottle', 6_75],
  ['Trader Joe’s', 42_10],
  ['MTA', 2_90],
  ['Sweetgreen', 16_20],
  ['CVS', 11_35],
  ['Uber', 18_40],
  ['Pilates Studio', 50_00],
  ['Spotify', 11_99],
  ['Marlow & Sons', 74_60],
  ['Bookshop', 22_00],
  ['Glossier', 34_00],
  ['Whole Foods', 58_25],
];

const ACCOUNT_ID = '00000000-0000-4000-8000-000000000501';

/** 26 transactions — past the >=25 threshold, so Insights may appear. */
export const demoTransactions: Transaction[] = Array.from({ length: 26 }, (_, i) => {
  const [merchantName, amount] = MERCHANTS[i % MERCHANTS.length] as [string, number];
  const day = String(Math.max(1, 28 - i)).padStart(2, '0');
  return {
    id: `00000000-0000-4000-8000-0000006${String(i + 1).padStart(5, '0')}`,
    userId: DEMO_USER_ID,
    accountId: ACCOUNT_ID,
    providerTransactionId: `provider-txn-${i + 1}`,
    amount,
    merchantName,
    originalDescription: null,
    category: null,
    subcategory: null,
    date: `2026-06-${day}`,
    authorizedDate: null,
    pending: i === 0,
    type: 'debit',
    isoCurrencyCode: 'USD',
    paymentChannel: 'in_store',
    confidence: 90,
    isTransfer: false,
    excludedFromIncome: false,
    excludedFromSpending: false,
    recurringCandidateId: null,
    metadata: null,
  };
});

export const demoInsights: Insight[] = [
  {
    id: '00000000-0000-4000-8000-000000000701',
    userId: DEMO_USER_ID,
    insightType: 'timing_observation',
    title: 'Your weekends run warm',
    body: 'Most of your flexible spending lands Friday through Sunday. I plan around it, so weekdays feel roomier than they look.',
    evidenceSummary: '9 of your last 12 discretionary purchases were on weekends',
    confidence: 82,
    generatedAt: NOW,
    expiresAt: null,
    status: 'active',
    relatedTransactionIds: [],
    relatedPatternIds: [],
    relatedCommitmentIds: [],
    userFeedback: null,
  },
];

export const demoActions: ActivityAction[] = [
  {
    id: 'action-birthday-dinner',
    kind: 'commitment_candidate',
    body: "Does Saturday's birthday dinner need money set aside? I'd plan around $90.",
    relatedEntityId: BIRTHDAY_ID,
  },
  {
    id: 'action-brunch',
    kind: 'recurring_detected',
    body: 'Looks like brunch usually lands around $75 on weekends. Plan around this?',
    relatedEntityId: RECURRING_BRUNCH_ID,
  },
  {
    id: 'action-payday',
    kind: 'pattern_confirmation',
    body: 'Looks like payday is every other Friday. Confirm?',
    relatedEntityId: '00000000-0000-4000-8000-000000000801',
  },
];

export const demoRecurring: RecurringItem[] = [
  {
    id: RECURRING_BRUNCH_ID,
    userId: DEMO_USER_ID,
    title: 'Brunch',
    merchantName: 'Marlow & Sons',
    amountEstimate: 75_00,
    cadence: 'weekly',
    nextExpectedAt: '2026-07-11T15:00:00Z',
    recurringType: 'habit',
    hardness: 'soft',
    confidence: 84,
    status: 'detected',
    linkedPatternId: null,
    lastSeenAt: '2026-06-28T15:00:00Z',
    userConfirmed: false,
    userPaused: false,
    createdAt: '2026-06-01T00:00:00Z',
    updatedAt: NOW,
    metadata: null,
  },
  {
    id: RECURRING_RENT_ID,
    userId: DEMO_USER_ID,
    title: 'Rent',
    merchantName: null,
    amountEstimate: 1200_00,
    cadence: 'monthly',
    nextExpectedAt: '2026-07-31T00:00:00Z',
    recurringType: 'bill',
    hardness: 'hard',
    confidence: 97,
    status: 'confirmed',
    linkedPatternId: null,
    lastSeenAt: '2026-06-30T00:00:00Z',
    userConfirmed: true,
    userPaused: false,
    createdAt: '2026-05-02T00:00:00Z',
    updatedAt: NOW,
    metadata: null,
  },
  {
    id: RECURRING_PILATES_ID,
    userId: DEMO_USER_ID,
    title: 'Pilates',
    merchantName: 'Pilates Studio',
    amountEstimate: 50_00,
    cadence: 'weekly',
    nextExpectedAt: '2026-07-08T13:00:00Z',
    recurringType: 'habit',
    hardness: 'soft',
    confidence: 88,
    status: 'confirmed',
    linkedPatternId: null,
    lastSeenAt: '2026-07-01T13:00:00Z',
    userConfirmed: true,
    userPaused: false,
    createdAt: '2026-05-20T00:00:00Z',
    updatedAt: NOW,
    metadata: null,
  },
];

export const demoVaults: Vault[] = [
  {
    id: '00000000-0000-4000-8000-000000000901',
    userId: DEMO_USER_ID,
    title: 'Camera',
    targetAmount: 600_00,
    currentProtectedAmount: 180_00,
    desiredByDate: '2026-09-15',
    status: 'active',
    activelyProtected: true,
    source: 'purchase_check',
    merchant: null,
    url: null,
    imageAssetId: null,
    affordabilityDate: '2026-08-30',
    lastRecalculatedAt: NOW,
    notificationPreferences: { affordabilityAlertsEnabled: true, saleAlertsEnabled: false },
    createdAt: '2026-06-10T00:00:00Z',
    updatedAt: NOW,
  },
  {
    // Passive desire: saved but NOT actively protected, so it does not
    // reduce Safe to Spend and Upcoming must present it as such.
    id: '00000000-0000-4000-8000-000000000902',
    userId: DEMO_USER_ID,
    title: 'Jacket',
    targetAmount: 180_00,
    currentProtectedAmount: 0,
    desiredByDate: null,
    status: 'saved',
    activelyProtected: false,
    source: 'user_entered',
    merchant: null,
    url: null,
    imageAssetId: null,
    affordabilityDate: '2026-07-10',
    lastRecalculatedAt: NOW,
    notificationPreferences: { affordabilityAlertsEnabled: true, saleAlertsEnabled: false },
    createdAt: '2026-06-20T00:00:00Z',
    updatedAt: NOW,
  },
];

export const demoSeedPurchaseCheck: PurchaseCheck = {
  id: '00000000-0000-4000-8000-000000001001',
  userId: DEMO_USER_ID,
  inputType: 'text',
  rawInput: 'can i buy this $180 jacket?',
  parsedItemName: 'Jacket',
  parsedMerchant: null,
  parsedPrice: 180_00,
  parsedUrl: null,
  screenshotAssetId: null,
  decision: 'wait',
  decisionReason: "I'd wait until Friday. This would leave your weekend too tight.",
  safeToSpendBefore: 316_00,
  safeToSpendAfterHypothetical: 136_00,
  relatedVaultId: null,
  statusAtDecision: 'YOURE_GOOD',
  createdAt: NOW,
  followUpAt: '2026-07-10T14:00:00Z',
};
