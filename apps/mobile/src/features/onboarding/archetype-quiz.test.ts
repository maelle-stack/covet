import type { Archetype } from '@covet/shared-types';

import { buildArchetypeReveal } from './archetype-profiles';
import { ARCHETYPE_QUIZ, scoreQuiz, type QuizAnswer } from './archetype-quiz';

/** Build an answer set that leans a given number of times toward `archetype`. */
function leaning(archetype: Archetype, count: number): QuizAnswer[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `synthetic-${archetype}-${i}`,
    label: 'x',
    leans: archetype,
  }));
}

describe('archetype quiz', () => {
  it('has six questions, each with four leaning answers', () => {
    expect(ARCHETYPE_QUIZ).toHaveLength(6);
    for (const question of ARCHETYPE_QUIZ) {
      expect(question.answers).toHaveLength(4);
      for (const answer of question.answers) {
        expect(['drifter', 'spontaneous', 'keeper', 'giver', 'builder']).toContain(answer.leans);
      }
    }
  });

  it('scores the most-leaned archetype as primary and the next as secondary', () => {
    const answers = [...leaning('builder', 3), ...leaning('giver', 2), ...leaning('keeper', 1)];
    expect(scoreQuiz(answers)).toEqual({ primary: 'builder', secondary: 'giver' });
  });

  it('breaks ties by the fixed archetype order for determinism', () => {
    // drifter and spontaneous tie at 2; drifter precedes spontaneous in order.
    const answers = [...leaning('drifter', 2), ...leaning('spontaneous', 2)];
    expect(scoreQuiz(answers)).toEqual({ primary: 'drifter', secondary: 'spontaneous' });
  });

  it('composes a reveal that names both archetypes and never shames the user', () => {
    const reveal = buildArchetypeReveal('spontaneous', 'keeper');
    expect(reveal.headline).toBe("You're The Spontaneous, with a little Keeper.");
    // Flattering-but-honest: mentions Covet's help, avoids shaming language.
    expect(reveal.body).toMatch(/Covet/);
    for (const shaming of [/lazy/i, /bad with money/i, /irresponsible/i, /reckless/i]) {
      expect(reveal.body).not.toMatch(shaming);
    }
  });
});
