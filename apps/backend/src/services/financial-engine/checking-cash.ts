import type { Account, Cents, Transaction } from '@covet/shared-types';

/**
 * Usable checking cash (docs/02_financial_engine.md): checking accounts
 * only — savings is excluded in v1, and credit availability never
 * contributes here. `Account.currentBalance` reflects only *posted*
 * activity (the standard Plaid semantic); pending debit transactions must
 * be subtracted immediately so the user is never shown a falsely generous
 * number before those transactions post. Pending credits are NOT added —
 * unlanded money is not cash (docs/02_financial_engine.md: "Income that has
 * not landed is not the same as cash").
 */
export function computeUsableCheckingCash(
  accounts: readonly Account[],
  transactions: readonly Transaction[],
): Cents {
  const checkingAccountIds = new Set(
    accounts.filter((a) => a.subtype === 'checking' && a.status === 'active').map((a) => a.id),
  );

  const postedCash = accounts
    .filter((a) => checkingAccountIds.has(a.id))
    .reduce((sum, a) => sum + a.currentBalance, 0);

  const pendingDebits = transactions
    .filter(
      (t) =>
        checkingAccountIds.has(t.accountId) &&
        t.pending &&
        !t.isTransfer &&
        !t.excludedFromSpending &&
        t.type === 'debit',
    )
    .reduce((sum, t) => sum + t.amount, 0);

  return postedCash - pendingDebits;
}
