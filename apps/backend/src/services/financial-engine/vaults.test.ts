import { allocateToVaults } from './vaults';
import { makeVault } from './test-helpers';

describe('allocateToVaults', () => {
  it('does not allocate to a passive (not actively protected) vault', () => {
    const vault = makeVault({ activelyProtected: false, status: 'saved', targetAmount: 100_00 });
    const result = allocateToVaults([vault], 1000_00);
    expect(result.totalAllocated).toBe(0);
  });

  it('allocates only the remaining unmet target for an active vault', () => {
    const vault = makeVault({ targetAmount: 100_00, currentProtectedAmount: 40_00 });
    const result = allocateToVaults([vault], 1000_00);
    expect(result.results[0]?.protectedAmount).toBe(60_00);
  });

  it('is bounded by available cash', () => {
    const vault = makeVault({ targetAmount: 100_00, currentProtectedAmount: 0 });
    const result = allocateToVaults([vault], 30_00);
    expect(result.results[0]?.protectedAmount).toBe(30_00);
  });

  it('splits across multiple active vaults in order, cash-bounded', () => {
    const first = makeVault({ targetAmount: 100_00 });
    const second = makeVault({ targetAmount: 100_00 });
    const result = allocateToVaults([first, second], 150_00);
    expect(result.results[0]?.protectedAmount).toBe(100_00);
    expect(result.results[1]?.protectedAmount).toBe(50_00);
  });
});
