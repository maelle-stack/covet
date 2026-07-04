import type {
  Archetype,
  ISODateTimeString,
  StrictnessLevel,
  UserGoal,
  UUID,
} from '../common';

/** Onboarding progression (docs/01_consumer_experience.md sequence). */
export const ONBOARDING_STATUSES = [
  'not_started',
  'account_created',
  'bank_connected',
  'calendar_prompted',
  'quiz_completed',
  'context_captured',
  'completed',
] as const;
export type OnboardingStatus = (typeof ONBOARDING_STATUSES)[number];

export const ACCOUNT_STATUSES = ['active', 'suspended', 'pending_deletion', 'deleted'] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

/**
 * Stable identity + product-level profile. `id` matches the Supabase Auth
 * user id. Sensitive credentials live with the auth provider, never here.
 */
export interface User {
  id: UUID;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
  firstName: string | null;
  timezone: string; // IANA, e.g. "America/New_York"
  locale: string; // BCP 47, e.g. "en-US"
  onboardingStatus: OnboardingStatus;
  primaryArchetype: Archetype | null;
  secondaryArchetype: Archetype | null;
  activeGoal: UserGoal | null;
  strictnessLevel: StrictnessLevel;
  accountStatus: AccountStatus;
}
