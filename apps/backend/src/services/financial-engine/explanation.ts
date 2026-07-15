import type { Cents, ProtectedCommitmentRef } from '@covet/shared-types';

/**
 * Conclusion-first, plain-language explanation
 * (docs/02_financial_engine.md: "I'm protecting rent, your credit card
 * minimum, brunch this weekend, and a small cushion. Your pace is
 * $50/day until Friday."). Never the full formula — just what's protected
 * and the daily pace, in that order.
 */
export function buildExplanationSummary(
  protectedHard: readonly ProtectedCommitmentRef[],
  protectedSemiHard: readonly ProtectedCommitmentRef[],
  protectedSoft: readonly ProtectedCommitmentRef[],
  dailyPace: Cents | null,
  daysUntilNextIncome: number | null,
): string {
  const titles = [...protectedHard, ...protectedSemiHard, ...protectedSoft].map((c) => c.title);

  const protectingClause =
    titles.length > 0
      ? `I'm protecting ${titles.slice(0, 3).join(', ')}${titles.length > 3 ? ', and a few other things' : ''}.`
      : `I'm keeping a small cushion untouched.`;

  if (dailyPace === null) {
    return protectingClause;
  }

  const dollars = (dailyPace / 100).toFixed(0);
  const paceClause =
    daysUntilNextIncome !== null
      ? `Your pace is $${dollars}/day for the next ${daysUntilNextIncome} day${daysUntilNextIncome === 1 ? '' : 's'}.`
      : `Your pace is $${dollars}/day while I keep learning your income.`;

  return `${protectingClause} ${paceClause}`;
}
