import type {
  CalendarEvent,
  Commitment,
  Pattern,
  PurchaseCheck,
  RecurringItem,
  SafeToSpendSnapshot,
  Vault,
} from '@covet/shared-types';

import type { CandidateEvent, NotificationContextSettings, NotificationEngineInput } from './types';

let counter = 0;
export function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter}`;
}

/** Noon UTC = 8am in New York (EDT): outside default quiet hours. */
export const NOW = '2026-07-04T16:00:00Z';
export const TIMEZONE = 'America/New_York';

export function makeSnapshot(overrides: Partial<SafeToSpendSnapshot> = {}): SafeToSpendSnapshot {
  return {
    id: nextId('snap'),
    userId: 'user-1',
    amount: 416_00,
    payCycleStart: '2026-07-04',
    payCycleEnd: '2026-07-14',
    daysUntilNextIncome: 10,
    dailyPace: 41_00,
    internalProjectedPace: 41_00,
    paceProjection: [],
    status: 'YOURE_GOOD',
    confidenceScore: 90,
    externalConfidenceLabel: 'high',
    protectedHardCommitments: [],
    protectedSemiHardCommitments: [],
    protectedSoftCommitments: [],
    debtPressureLevel: 'healthy',
    obligationPressureLevel: 'normal',
    emergencyFloorApplied: 50_00,
    behaviorBufferApplied: 30_00,
    majorChangeFlags: [],
    explanationSummary: '',
    lastCalculatedAt: NOW,
    staleAfter: '2026-07-04T22:00:00Z',
    inputsHash: 'hash',
    ...overrides,
  };
}

export function makeCommitment(overrides: Partial<Commitment> = {}): Commitment {
  return {
    id: nextId('commitment'),
    userId: 'user-1',
    source: 'user_entered',
    title: 'Rent',
    amount: 1200_00,
    estimatedAmount: null,
    confirmedAmount: null,
    dueAt: '2026-07-08T00:00:00Z',
    commitmentType: 'rent',
    hardness: 'hard',
    status: 'at_risk',
    protectedAmount: 0,
    protectionStartAt: null,
    confidence: 90,
    userConfirmed: true,
    userDenied: false,
    linkedCalendarEventId: null,
    linkedTransactionId: null,
    linkedRecurringItemId: null,
    createdAt: NOW,
    updatedAt: NOW,
    metadata: null,
    ...overrides,
  };
}

export function makeVault(overrides: Partial<Vault> = {}): Vault {
  return {
    id: nextId('vault'),
    userId: 'user-1',
    title: 'Camera',
    targetAmount: 600_00,
    currentProtectedAmount: 0,
    desiredByDate: null,
    status: 'saved',
    activelyProtected: false,
    source: 'user_entered',
    merchant: null,
    url: null,
    imageAssetId: null,
    affordabilityDate: null,
    lastRecalculatedAt: null,
    notificationPreferences: { affordabilityAlertsEnabled: true, saleAlertsEnabled: true },
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

export function makePurchaseCheck(overrides: Partial<PurchaseCheck> = {}): PurchaseCheck {
  return {
    id: nextId('pc'),
    userId: 'user-1',
    inputType: 'text',
    rawInput: 'can i buy this $180 jacket?',
    parsedItemName: 'Jacket',
    parsedMerchant: null,
    parsedPrice: 180_00,
    parsedUrl: null,
    screenshotAssetId: null,
    decision: 'wait',
    decisionReason: "i'd wait until payday.",
    safeToSpendBefore: 100_00,
    safeToSpendAfterHypothetical: -80_00,
    relatedVaultId: null,
    statusAtDecision: 'TAKE_IT_EASY',
    createdAt: NOW,
    followUpAt: null,
    ...overrides,
  };
}

export function makePattern(overrides: Partial<Pattern> = {}): Pattern {
  return {
    id: nextId('pattern'),
    userId: 'user-1',
    type: 'lifestyle_habit',
    description: 'looks like pilates is usually $50.',
    confidence: 85,
    evidenceSummary: '6 similar transactions over 8 weeks',
    status: 'suggested',
    firstDetectedAt: NOW,
    lastDetectedAt: NOW,
    confirmedAt: null,
    deniedAt: null,
    relatedEntities: [],
    ...overrides,
  };
}

export function makeRecurringItem(overrides: Partial<RecurringItem> = {}): RecurringItem {
  return {
    id: nextId('recurring'),
    userId: 'user-1',
    title: 'Pilates',
    merchantName: null,
    amountEstimate: 50_00,
    cadence: 'weekly',
    nextExpectedAt: null,
    recurringType: 'habit',
    hardness: 'soft',
    confidence: 85,
    status: 'detected',
    linkedPatternId: null,
    lastSeenAt: null,
    userConfirmed: false,
    userPaused: false,
    createdAt: NOW,
    updatedAt: NOW,
    metadata: null,
    ...overrides,
  };
}

export function makeCalendarEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: nextId('calevent'),
    userId: 'user-1',
    calendarConnectionId: 'calconn-1',
    providerEventId: nextId('provider-event'),
    title: "Saturday's birthday dinner",
    startAt: '2026-07-11T23:00:00Z',
    endAt: null,
    timezone: TIMEZONE,
    location: 'Marlow & Sons',
    classification: 'birthday',
    isVirtual: false,
    virtualProvider: null,
    travelDistanceKmEstimate: null,
    travelMode: null,
    notesAvailable: false,
    spendCandidate: true,
    confidence: 80,
    linkedCommitmentId: null,
    metadata: null,
    ...overrides,
  };
}

export const DEFAULT_SETTINGS: NotificationContextSettings = {
  quietHours: { start: '21:00', end: '09:00' },
  privacyLevel: 'discreet',
  dailyPacingNotificationsEnabled: true,
  saleAlertsEnabled: false, // spec default: off
  vaultNotificationsEnabled: true,
  reviewPromptsEnabled: true,
};

let eventCounter = 0;
export function eventBase() {
  eventCounter += 1;
  return {
    id: `event-${eventCounter}`,
    userId: 'user-1',
    occurredAt: NOW,
    expiresAt: null,
  };
}

export function makeInput(
  events: CandidateEvent[],
  overrides: Partial<NotificationEngineInput> = {},
): NotificationEngineInput {
  return {
    userId: 'user-1',
    now: NOW,
    timezone: TIMEZONE,
    events,
    settings: DEFAULT_SETTINGS,
    lastAppOpenAt: null,
    dismissedCandidateEventIds: [],
    recentNotifications: [],
    ...overrides,
  };
}
