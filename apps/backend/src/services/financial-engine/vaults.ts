import type { Cents, Vault } from '@covet/shared-types';

export interface VaultAllocationResult {
  vaultId: string;
  protectedAmount: Cents;
}

export interface VaultAllocationOutcome {
  results: VaultAllocationResult[];
  totalAllocated: Cents;
}

/**
 * Vaults reduce Safe to Spend ONLY when actively protected
 * (docs/02_financial_engine.md), and only for the remaining unmet target —
 * already-protected amounts from prior cycles are not re-reserved. v1 does
 * not implement a desired-timing gradual ramp for vaults (unlike
 * commitments); this is a simplification, not a spec literal.
 */
export function allocateToVaults(
  vaults: readonly Vault[],
  availableCash: Cents,
): VaultAllocationOutcome {
  let remaining = Math.max(0, availableCash);
  const results: VaultAllocationResult[] = [];

  for (const vault of vaults.filter((v) => v.activelyProtected && v.status === 'active')) {
    const remainingTarget = Math.max(0, vault.targetAmount - vault.currentProtectedAmount);
    const allocation = Math.min(remainingTarget, remaining);
    remaining -= allocation;
    results.push({ vaultId: vault.id, protectedAmount: allocation });
  }

  const totalAllocated = results.reduce((sum, r) => sum + r.protectedAmount, 0);
  return { results, totalAllocated };
}
