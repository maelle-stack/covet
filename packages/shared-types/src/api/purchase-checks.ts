import type { PurchaseCheck, PurchaseCheckInputType } from '../models/purchase-check';

/**
 * POST /purchase-checks/create
 * v1 supports `text`; `link` and `screenshot` are architected for launch
 * readiness (docs/01_consumer_experience.md Purchase Check).
 */
export interface CreatePurchaseCheckRequest {
  inputType: PurchaseCheckInputType;
  rawInput: string;
  url?: string;
  screenshotAssetId?: string;
}

export interface CreatePurchaseCheckResponse {
  purchaseCheck: PurchaseCheck;
}

/**
 * GET /purchase-checks/seed — the opening exchange the Purchase Check thread
 * starts from. Read-only; the create flow (POST) arrives with the AI
 * abstraction in a later checkpoint.
 */
export interface SeedPurchaseCheckResponse {
  purchaseCheck: PurchaseCheck;
}
