import type { Archetype } from '@covet/shared-types';

import { ARCHETYPE_DISPLAY_NAMES } from './archetype-quiz';

/**
 * Reveal copy for the archetype result (docs/01_consumer_experience.md).
 * The result should help the user feel seen, not diagnosed — flattering but
 * honest, never shaming avoidance, spontaneity, generosity, caution, or
 * ambition. Kept out of the screen file so this taste-sensitive language
 * stays reviewable on its own.
 *
 * Each profile carries three fragments that compose into the reveal:
 *  - `lead`     — the primary temperament, stated as observation
 *  - `nuance`   — how a "little of this" reads when it's the secondary
 *  - `promise`  — what Covet does for this primary temperament
 * These mirror the doc's canonical example for The Spontaneous / Keeper.
 */
interface ArchetypeProfile {
  lead: string;
  nuance: string;
  promise: string;
}

const ARCHETYPE_PROFILES: Record<Archetype, ArchetypeProfile> = {
  drifter: {
    lead: "You'd rather not stare at your balance, and you've mostly gotten by on instinct",
    nuance: "but you'd quietly love to stop guessing",
    promise: 'Covet keeps an eye on it for you, so you can look less and still land well.',
  },
  spontaneous: {
    lead: "You follow desire quickly, and you're not sorry about it",
    nuance: 'but you still leave room to chase what you love',
    promise: 'Covet will help you enjoy the moment without accidentally borrowing from next week.',
  },
  keeper: {
    lead: 'You like knowing exactly where you stand, and a cushion makes you feel like yourself',
    nuance: 'but you still want to feel safe',
    promise: "Covet will tell you when you've earned the yes, so care never tips into missing out.",
  },
  giver: {
    lead: 'You look after the people around you, often before you look after your own balance',
    nuance: 'and you keep room for the people you love',
    promise:
      "Covet protects what you've promised others first, so generosity never turns into a scramble.",
  },
  builder: {
    lead: "You think in terms of what you're building, and money is something you'd rather aim than spend",
    nuance: 'and you keep half an eye on what it grows into',
    promise:
      'Covet keeps the day-to-day handled, so you can keep your attention on the longer game.',
  },
};

/** The display name without the leading "The" — for "…with a little Keeper." */
function shortName(archetype: Archetype): string {
  return ARCHETYPE_DISPLAY_NAMES[archetype].replace(/^The\s+/, '');
}

export interface ArchetypeReveal {
  headline: string;
  body: string;
}

/**
 * Composes the primary + secondary reveal. The headline names both; the
 * body reads as one natural sentence — primary lead, secondary nuance,
 * Covet's promise — matching the doc's example voice.
 */
export function buildArchetypeReveal(primary: Archetype, secondary: Archetype): ArchetypeReveal {
  const p = ARCHETYPE_PROFILES[primary];
  const s = ARCHETYPE_PROFILES[secondary];
  return {
    headline: `You're ${ARCHETYPE_DISPLAY_NAMES[primary]}, with a little ${shortName(secondary)}.`,
    body: `${p.lead}, ${s.nuance}. ${p.promise}`,
  };
}
