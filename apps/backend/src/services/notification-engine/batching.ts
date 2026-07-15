import type {
  CandidateEvent,
  SafeToSpendDecreaseEvent,
  SafeToSpendIncreaseEvent,
  StatusChangeEvent,
} from './types';

export type MoneyStateEvent =
  StatusChangeEvent | SafeToSpendIncreaseEvent | SafeToSpendDecreaseEvent;

export interface BatchedUnit {
  /** The event whose copy/severity leads the combined notification. */
  primary: CandidateEvent;
  /** Other events folded into it (their ids land in batchedEventIds). */
  batched: readonly CandidateEvent[];
}

function isMoneyStateEvent(event: CandidateEvent): event is MoneyStateEvent {
  return (
    event.type === 'status_change' ||
    event.type === 'safe_to_spend_increase' ||
    event.type === 'safe_to_spend_decrease'
  );
}

/**
 * Batching (docs/03_notification_engine.md): related events close together
 * combine into one clear notification instead of multiple pings. v1 batches
 * the money-state family — status changes and Safe to Spend moves arriving
 * in the same engine run describe ONE new financial state, so the user gets
 * one message ("safe to spend is $280 after groceries and your phone
 * bill"), not three. A status change leads when present because it carries
 * the most decision-relevant news; otherwise the most recent money event
 * leads. Other trigger types pass through as individual units — their
 * usefulness comes from specificity, and merging them would create the
 * vague summaries the spec warns against.
 */
export function batchEvents(events: readonly CandidateEvent[]): BatchedUnit[] {
  const moneyEvents = events.filter(isMoneyStateEvent);
  const otherEvents = events.filter((e) => !isMoneyStateEvent(e));

  const units: BatchedUnit[] = otherEvents.map((e) => ({ primary: e, batched: [] }));

  if (moneyEvents.length === 1) {
    units.push({ primary: moneyEvents[0] as CandidateEvent, batched: [] });
  } else if (moneyEvents.length > 1) {
    const statusChange = moneyEvents.find((e) => e.type === 'status_change');
    const byRecency = [...moneyEvents].sort(
      (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    );
    const primary = statusChange ?? (byRecency[0] as MoneyStateEvent);
    units.push({ primary, batched: moneyEvents.filter((e) => e.id !== primary.id) });
  }

  return units;
}
