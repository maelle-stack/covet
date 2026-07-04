import type { Archetype, ISODateTimeString, UUID } from '../common';

/** One answered quiz question. Typed, not a loose JSON blob. */
export interface ArchetypeQuizAnswer {
  questionId: string;
  answerId: string;
}

/**
 * Result of the six-question onboarding archetype quiz
 * (docs/01_consumer_experience.md). The engine initially uses only the
 * primary archetype for the behavior buffer; the secondary archetype is
 * user-facing identity nuance. Archetypes may evolve from observed behavior,
 * but never silently in a way that confuses the user.
 */
export interface ArchetypeResult {
  userId: UUID;
  primaryArchetype: Archetype;
  secondaryArchetype: Archetype;
  quizVersion: string;
  answers: readonly ArchetypeQuizAnswer[];
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}
