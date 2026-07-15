import type { Cents, ISODateTimeString, SpendStatus, UUID } from '../common';

export const PURCHASE_CHECK_INPUT_TYPES = ['text', 'link', 'screenshot'] as const;
export type PurchaseCheckInputType = (typeof PURCHASE_CHECK_INPUT_TYPES)[number];

/** The three possible decisions: "You're good" / "I'd wait" / "Let's not". */
export const PURCHASE_DECISIONS = ['yes', 'wait', 'no'] as const;
export type PurchaseDecision = (typeof PURCHASE_DECISIONS)[number];

/**
 * A "can I buy this?" interaction (docs/01_consumer_experience.md).
 * v1 supports text; the model is architected for links and screenshots.
 * A `wait` decision schedules a follow-up so Covet can return when the
 * purchase becomes safe (docs/03_notification_engine.md).
 */
export interface PurchaseCheck {
  id: UUID;
  userId: UUID;
  inputType: PurchaseCheckInputType;
  rawInput: string;
  parsedItemName: string | null;
  parsedMerchant: string | null;
  parsedPrice: Cents | null;
  parsedUrl: string | null;
  screenshotAssetId: string | null;
  decision: PurchaseDecision;
  /** Concise, grounded reason. Never the full calculation. */
  decisionReason: string;
  safeToSpendBefore: Cents;
  safeToSpendAfterHypothetical: Cents;
  relatedVaultId: UUID | null;
  statusAtDecision: SpendStatus;
  createdAt: ISODateTimeString;
  /** When to re-evaluate for a "you're good for it now" follow-up. */
  followUpAt: ISODateTimeString | null;
}
