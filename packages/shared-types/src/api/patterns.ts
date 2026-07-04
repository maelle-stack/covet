import type { Pattern } from '../models/pattern';
import type { RecurringItem } from '../models/recurring-item';

/** POST /patterns/:id/confirm */
export interface ConfirmPatternResponse {
  pattern: Pattern;
  /** Recurring items created or updated by the confirmation, if any. */
  linkedRecurringItems: readonly RecurringItem[];
}

/** POST /patterns/:id/deny — reduces confidence in similar detections. */
export interface DenyPatternResponse {
  pattern: Pattern;
}
