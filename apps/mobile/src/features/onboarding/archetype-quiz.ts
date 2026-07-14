import type { Archetype } from '@covet/shared-types';

/**
 * The six-question archetype quiz (docs/01_consumer_experience.md). Each
 * answer leans toward one public archetype; the result takes the top two
 * leans as primary + secondary. This is lightweight identity scoring for
 * onboarding feel — NOT the engine's behavior model, which is backend-owned.
 * Copy is observational and adult: how someone actually behaves around
 * money, never a personality-quiz gimmick.
 */
export interface QuizAnswer {
  id: string;
  label: string;
  leans: Archetype;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  answers: readonly QuizAnswer[];
}

export const ARCHETYPE_QUIZ: readonly QuizQuestion[] = [
  {
    id: 'tight',
    prompt: 'When money feels tight, what do you usually do?',
    answers: [
      { id: 'tight-avoid', label: 'Stop looking at it for a while', leans: 'drifter' },
      { id: 'tight-hold', label: 'Pull everything back and hold the line', leans: 'keeper' },
      { id: 'tight-spend', label: 'Treat myself anyway — I need the lift', leans: 'spontaneous' },
      { id: 'tight-plan', label: 'Map out how to earn or save my way out', leans: 'builder' },
    ],
  },
  {
    id: 'desire',
    prompt: 'What kind of purchase tends to get you?',
    answers: [
      { id: 'desire-impulse', label: 'The thing I saw ten minutes ago', leans: 'spontaneous' },
      { id: 'desire-gift', label: 'Something for someone I love', leans: 'giver' },
      { id: 'desire-quality', label: 'A better version of something I already own', leans: 'builder' },
      { id: 'desire-none', label: 'Honestly, I put most things back', leans: 'keeper' },
    ],
  },
  {
    id: 'payday',
    prompt: 'Payday lands. First instinct?',
    answers: [
      { id: 'payday-celebrate', label: 'Make a plan for the evening', leans: 'spontaneous' },
      { id: 'payday-tuck', label: 'Move some of it somewhere safe', leans: 'keeper' },
      { id: 'payday-cover', label: 'Cover everyone I owe or promised', leans: 'giver' },
      { id: 'payday-invest', label: 'Put it toward something that grows', leans: 'builder' },
    ],
  },
  {
    id: 'checking',
    prompt: 'How often do you actually check your balance?',
    answers: [
      { id: 'checking-rare', label: 'Rarely — I’d rather not know', leans: 'drifter' },
      { id: 'checking-obsess', label: 'Constantly, especially before spending', leans: 'keeper' },
      { id: 'checking-vibe', label: 'When I want something, to see if I can', leans: 'spontaneous' },
      { id: 'checking-review', label: 'On a rhythm — I like to stay oriented', leans: 'builder' },
    ],
  },
  {
    id: 'weekend',
    prompt: 'A good weekend usually means…',
    answers: [
      { id: 'weekend-people', label: 'Rounds, dinners, picking up the tab', leans: 'giver' },
      { id: 'weekend-spont', label: 'Saying yes to whatever comes up', leans: 'spontaneous' },
      { id: 'weekend-quiet', label: 'Something low-key that keeps money quiet', leans: 'keeper' },
      { id: 'weekend-drift', label: 'Not thinking about any of it', leans: 'drifter' },
    ],
  },
  {
    id: 'future',
    prompt: 'When you picture next year, money-wise…',
    answers: [
      { id: 'future-build', label: 'I want more built up than I have now', leans: 'builder' },
      { id: 'future-same', label: 'I just want it to feel less stressful', leans: 'drifter' },
      { id: 'future-secure', label: 'I want a cushion I never have to touch', leans: 'keeper' },
      { id: 'future-share', label: 'I want room to be generous without worry', leans: 'giver' },
    ],
  },
];

export const ARCHETYPE_DISPLAY_NAMES: Record<Archetype, string> = {
  drifter: 'The Drifter',
  spontaneous: 'The Spontaneous',
  keeper: 'The Keeper',
  giver: 'The Giver',
  builder: 'The Builder',
};

/**
 * Tallies leans and returns the top two archetypes as [primary, secondary].
 * Ties break by the fixed archetype order for determinism. Pure and
 * testable — no engine involvement.
 */
export function scoreQuiz(answers: readonly QuizAnswer[]): {
  primary: Archetype;
  secondary: Archetype;
} {
  const order: readonly Archetype[] = ['drifter', 'spontaneous', 'keeper', 'giver', 'builder'];
  const tally: Record<Archetype, number> = {
    drifter: 0,
    spontaneous: 0,
    keeper: 0,
    giver: 0,
    builder: 0,
  };
  for (const answer of answers) tally[answer.leans] += 1;

  const ranked = [...order].sort((a, b) => {
    if (tally[b] !== tally[a]) return tally[b] - tally[a];
    return order.indexOf(a) - order.indexOf(b);
  });

  return { primary: ranked[0] as Archetype, secondary: ranked[1] as Archetype };
}
