import { createHash } from 'node:crypto';

/**
 * Deterministic hash of the engine inputs that actually affect the
 * calculation, for change detection and idempotent recalculation
 * (SafeToSpendSnapshot.inputsHash, docs/05_engineering_architecture.md).
 * Caller is responsible for passing a canonical, JSON-serializable
 * representation of just the relevant inputs.
 */
export function computeInputsHash(canonicalInput: unknown): string {
  const json = JSON.stringify(canonicalInput);
  return createHash('sha256').update(json).digest('hex');
}
