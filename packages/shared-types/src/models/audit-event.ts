import type { EntityType, ISODateTimeString, Metadata, UUID } from '../common';

export const AUDIT_EVENT_TYPES = [
  'user_created',
  'user_deleted',
  'data_export_requested',
  'data_deletion_requested',
  'bank_connected',
  'bank_disconnected',
  'calendar_connected',
  'calendar_disconnected',
  'engine_recalculated',
  'notification_sent',
  'notification_suppressed',
  'settings_changed',
  'pattern_confirmed',
  'pattern_denied',
  'commitment_confirmed',
  'commitment_denied',
  'vault_activated',
  'auth_event',
  'security_event',
  'other',
] as const;
export type AuditEventType = (typeof AUDIT_EVENT_TYPES)[number];

/**
 * Security/data/engine audit trail (docs/05_engineering_architecture.md).
 * Must not store raw sensitive values unnecessarily — reference entities,
 * don't copy their contents.
 */
export interface AuditEvent {
  id: UUID;
  /** Null for system-level events not tied to a user. */
  userId: UUID | null;
  eventType: AuditEventType;
  entityType: EntityType | null;
  entityId: UUID | null;
  createdAt: ISODateTimeString;
  metadata: Metadata | null;
}
