import type {
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
 * Typed fixture data backing the pre-integration API client, shaped
 * EXACTLY like the shared domain models. The screens are production
 * screens; only this data source is swapped for the real backend in
 * Phase 6. No Safe to Spend math happens client-side. The demo state
 * mirrors the canonical Home reference: $316 Safe to Spend, YOU'RE GOOD,
 * $50.00/day pace, three protected commitments.
 */

const USER_ID = 'demo-user';
const NOW = '2026-07-04T16:00:00Z';

export const demoUser: User = {
  id: USER_ID,
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
  userId: USER_ID,
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

const rentCommitment: Commitment = {
  id: 'commitment-rent',
  userId: USER_ID,
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
  linkedRecurringItemId: 'recurring-rent',
  createdAt: '2026-05-02T00:00:00Z',
  updatedAt: NOW,
  metadata: null,
};

const cardMinimumCommitment: Commitment = {
  ...rentCommitment,
  id: 'commitment-card-minimum',
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
  id: 'commitment-birthday-dinner',
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
  linkedCalendarEventId: 'calevent-birthday',
  linkedRecurringItemId: null,
};

export const demoCommitments: Commitment[] = [
  rentCommitment,
  cardMinimumCommitment,
  birthdayDinnerCommitment,
];

export const demoSnapshot: SafeToSpendSnapshot = {
  id: 'snapshot-demo',
  userId: USER_ID,
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
    { commitmentId: rentCommitment.id, title: 'Rent', hardness: 'hard', protectedAmount: 1200_00 },
    {
      commitmentId: cardMinimumCommitment.id,
      title: 'Card minimum',
      hardness: 'hard',
      protectedAmount: 35_00,
    },
  ],
  protectedSemiHardCommitments: [],
  protectedSoftCommitments: [
    {
      commitmentId: 'commitment-brunch',
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

/** 26 transactions — past the >=25 threshold, so Insights may appear. */
export const demoTransactions: Transaction[] = Array.from({ length: 26 }, (_, i) => {
  const [merchantName, amount] = MERCHANTS[i % MERCHANTS.length] as [string, number];
  const day = String(Math.max(1, 28 - i)).padStart(2, '0');
  return {
    id: `txn-${i + 1}`,
    userId: USER_ID,
    accountId: 'account-checking',
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
    id: 'insight-1',
    userId: USER_ID,
    insightType: 'timing_observation',
    title: 'Your weekends run warm',
    body: 'Most of your flexible spending lands Friday through Sunday. I plan around it, so weekdays feel roomier than they look.',
    evidenceSummary: '9 of your last 12 discretionary purchases were on weekends',
    confidence: 82,
    generatedAt: NOW,
    expiresAt: null,
    status: 'active',
    relatedTransactionIds: ['txn-3', 'txn-10', 'txn-17'],
    relatedPatternIds: [],
    relatedCommitmentIds: [],
    userFeedback: null,
  },
];

export const demoRecurring: RecurringItem[] = [
  {
    id: 'recurring-brunch',
    userId: USER_ID,
    title: 'Brunch',
    merchantName: 'Marlow & Sons',
    amountEstimate: 75_00,
    cadence: 'weekly',
    nextExpectedAt: '2026-07-11T15:00:00Z',
    recurringType: 'habit',
    hardness: 'soft',
    confidence: 84,
    status: 'detected',
    linkedPatternId: 'pattern-brunch',
    lastSeenAt: '2026-06-28T15:00:00Z',
    userConfirmed: false,
    userPaused: false,
    createdAt: '2026-06-01T00:00:00Z',
    updatedAt: NOW,
    metadata: null,
  },
  {
    id: 'recurring-rent',
    userId: USER_ID,
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
    id: 'recurring-pilates',
    userId: USER_ID,
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
    id: 'vault-camera',
    userId: USER_ID,
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
    id: 'vault-jacket',
    userId: USER_ID,
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

/**
 * An Activity "Action": something that needs quick user attention
 * (docs/01_consumer_experience.md). The copy is backend-authored — in
 * production these come from the context/pattern services; the screen
 * never composes review language itself.
 */
export interface ActivityAction {
  id: string;
  kind: 'commitment_candidate' | 'recurring_detected' | 'pattern_confirmation';
  body: string;
  relatedEntityId: string;
}

export const demoActions: ActivityAction[] = [
  {
    id: 'action-birthday-dinner',
    kind: 'commitment_candidate',
    body: "Does Saturday's birthday dinner need money set aside? I'd plan around $90.",
    relatedEntityId: 'commitment-birthday-dinner',
  },
  {
    id: 'action-brunch',
    kind: 'recurring_detected',
    body: 'Looks like brunch usually lands around $75 on weekends. Plan around this?',
    relatedEntityId: 'recurring-brunch',
  },
  {
    id: 'action-payday',
    kind: 'pattern_confirmation',
    body: 'Looks like payday is every other Friday. Confirm?',
    relatedEntityId: 'pattern-payday',
  },
];

/**
 * Canned Purchase Check exchanges. Every decision and its reason come from
 * the "backend" fixture — the UI never parses input or computes
 * affordability. The seeded thread opens on the $180 jacket "wait"
 * exchange; `demoPurchaseCheckReplies` supplies canned responses returned
 * (in order) as the user sends messages, covering yes / wait / no.
 */
export const demoPurchaseCheckResponse: PurchaseCheck = {
  id: 'pc-jacket',
  userId: USER_ID,
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

export const demoPurchaseCheckReplies: PurchaseCheck[] = [
  {
    ...demoPurchaseCheckResponse,
    id: 'pc-coffee',
    rawInput: 'can i grab coffee?',
    parsedItemName: 'Coffee',
    parsedPrice: 6_00,
    decision: 'yes',
    decisionReason: "You're good. Rent and your birthday dinner are still covered.",
    safeToSpendAfterHypothetical: 310_00,
    followUpAt: null,
  },
  {
    ...demoPurchaseCheckResponse,
    id: 'pc-flight',
    rawInput: 'can i book this $420 flight?',
    parsedItemName: 'Flight',
    parsedPrice: 420_00,
    decision: 'no',
    decisionReason: "Let's not — this would put rent at risk before payday.",
    safeToSpendAfterHypothetical: -104_00,
    statusAtDecision: 'YOURE_GOOD',
    followUpAt: null,
  },
  {
    ...demoPurchaseCheckResponse,
    id: 'pc-jacket-2',
    rawInput: 'what about the jacket now?',
    parsedItemName: 'Jacket',
    parsedPrice: 180_00,
    decision: 'wait',
    decisionReason: "I'd still wait until Friday. You'll have room once payday lands.",
    followUpAt: '2026-07-10T14:00:00Z',
  },
];
