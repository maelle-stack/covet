import { computeUsableCheckingCash } from './checking-cash';
import { makeAccount, makeTransaction } from './test-helpers';

describe('computeUsableCheckingCash', () => {
  it('sums only checking accounts, excluding savings and credit', () => {
    const accounts = [
      makeAccount({ subtype: 'checking', currentBalance: 100_00 }),
      makeAccount({ subtype: 'savings', currentBalance: 500_00 }),
      makeAccount({
        type: 'credit',
        subtype: 'credit_card',
        currentBalance: 50_00,
        creditLimit: 1000_00,
      }),
    ];
    expect(computeUsableCheckingCash(accounts, [])).toBe(100_00);
  });

  it('excludes inactive checking accounts', () => {
    const accounts = [
      makeAccount({ subtype: 'checking', currentBalance: 100_00, status: 'closed' }),
    ];
    expect(computeUsableCheckingCash(accounts, [])).toBe(0);
  });

  it('subtracts pending debit transactions immediately', () => {
    const checking = makeAccount({ subtype: 'checking', currentBalance: 100_00 });
    const pendingDebit = makeTransaction({
      accountId: checking.id,
      amount: 25_00,
      pending: true,
      type: 'debit',
    });
    expect(computeUsableCheckingCash([checking], [pendingDebit])).toBe(75_00);
  });

  it('does not add pending credits as if they were landed cash', () => {
    const checking = makeAccount({ subtype: 'checking', currentBalance: 100_00 });
    const pendingCredit = makeTransaction({
      accountId: checking.id,
      amount: -50_00,
      pending: true,
      type: 'credit',
    });
    expect(computeUsableCheckingCash([checking], [pendingCredit])).toBe(100_00);
  });

  it('ignores pending transfers and excluded-from-spending transactions', () => {
    const checking = makeAccount({ subtype: 'checking', currentBalance: 100_00 });
    const transfer = makeTransaction({
      accountId: checking.id,
      amount: 25_00,
      pending: true,
      type: 'debit',
      isTransfer: true,
    });
    const excluded = makeTransaction({
      accountId: checking.id,
      amount: 25_00,
      pending: true,
      type: 'debit',
      excludedFromSpending: true,
    });
    expect(computeUsableCheckingCash([checking], [transfer, excluded])).toBe(100_00);
  });

  it('ignores pending debits on unrelated accounts', () => {
    const checking = makeAccount({ subtype: 'checking', currentBalance: 100_00 });
    const otherAccountTxn = makeTransaction({
      accountId: 'some-other-account',
      amount: 25_00,
      pending: true,
      type: 'debit',
    });
    expect(computeUsableCheckingCash([checking], [otherAccountTxn])).toBe(100_00);
  });
});
