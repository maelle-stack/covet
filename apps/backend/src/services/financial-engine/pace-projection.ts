import type {
  Cents,
  CommitmentHardness,
  ISODateString,
  ISODateTimeString,
  PaceProjectionDay,
  PaceRiskLevel,
} from '@covet/shared-types';

import type { FinancialEngineConfig } from './config';

export interface PaceProjectionSourceItem {
  title: string;
  hardness: CommitmentHardness;
  /** Only items with a specific date can drive a specific day; ongoing/undated items are excluded. */
  dueAt: ISODateTimeString | null;
  /**
   * The item's full expected/confirmed cost — NOT how much cash has been
   * reserved toward it so far. A gradual-protection ramp can leave
   * `protectedAmount` at 0 well before the due date, but the pace
   * projection needs to show the day still carries that expected spend.
   */
  expectedAmount: Cents;
  /** Whether this item's protection status is `at_risk` this cycle. */
  isAtRisk: boolean;
}

function toISODate(iso: string): ISODateString {
  return iso.slice(0, 10);
}

function daysBetween(startDate: ISODateString, endDate: ISODateString): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const diff =
    (new Date(`${endDate}T00:00:00Z`).getTime() - new Date(`${startDate}T00:00:00Z`).getTime()) /
    msPerDay;
  return Math.max(1, Math.round(diff));
}

/**
 * Builds the internal, day-by-day pace plan (docs/02_financial_engine.md:
 * "it should quietly reserve for the weekend habit and monitor whether the
 * user is spending too quickly before Saturday"). `baseDailyPace` is a flat
 * split of `amount` across the cycle — identical to the simple user-facing
 * dailyPace — so that days with known due items visibly diverge from it via
 * `expectedFlexibleRoom`. This is deliberately NOT surfaced on Home by
 * default; it exists for the Notification Engine and future explanation
 * surfaces (docs/03_notification_engine.md).
 */
export function buildPaceProjection(
  payCycleStart: ISODateString,
  payCycleEnd: ISODateString,
  amount: Cents,
  items: readonly PaceProjectionSourceItem[],
  config: FinancialEngineConfig,
): PaceProjectionDay[] {
  const totalDays = Math.min(daysBetween(payCycleStart, payCycleEnd), config.maxPaceProjectionDays);
  const baseDailyPace = Math.floor(amount / totalDays);

  const byDate = new Map<ISODateString, PaceProjectionSourceItem[]>();
  for (const item of items) {
    if (item.dueAt === null) continue;
    const date = toISODate(item.dueAt);
    if (date < payCycleStart || date > payCycleEnd) continue;
    const list = byDate.get(date) ?? [];
    list.push(item);
    byDate.set(date, list);
  }

  const dueByHardness = (
    dayItems: readonly PaceProjectionSourceItem[],
    hardness: CommitmentHardness,
  ): Cents =>
    dayItems
      .filter((it) => it.hardness === hardness)
      .reduce((sum, it) => sum + it.expectedAmount, 0);

  const days: PaceProjectionDay[] = [];
  const cursor = new Date(`${payCycleStart}T00:00:00Z`);

  for (let i = 0; i < totalDays; i += 1) {
    const date = cursor.toISOString().slice(0, 10);
    const dayItems = byDate.get(date) ?? [];

    const protectedHardDue = dueByHardness(dayItems, 'hard');
    const protectedSemiHardDue = dueByHardness(dayItems, 'semi_hard');
    const protectedSoftDue = dueByHardness(dayItems, 'soft');
    const totalDue = protectedHardDue + protectedSemiHardDue + protectedSoftDue;

    const expectedFlexibleRoom = Math.max(0, baseDailyPace - totalDue);

    const essentialAtRiskToday = dayItems.some((it) => it.isAtRisk && it.hardness !== 'soft');
    const dueRatio = baseDailyPace > 0 ? totalDue / baseDailyPace : totalDue > 0 ? Infinity : 0;

    let riskLevel: PaceRiskLevel = 'low';
    if (essentialAtRiskToday || dueRatio >= config.paceRiskThresholds.highDueRatio) {
      riskLevel = 'high';
    } else if (dueRatio >= config.paceRiskThresholds.elevatedDueRatio) {
      riskLevel = 'elevated';
    }

    days.push({
      date,
      baseDailyPace,
      protectedHardDue,
      protectedSemiHardDue,
      protectedSoftDue,
      expectedFlexibleRoom,
      riskLevel,
      drivers: dayItems.map((it) => it.title),
    });

    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return days;
}
