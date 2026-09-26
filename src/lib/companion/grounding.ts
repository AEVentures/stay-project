import type { RiskLevel } from './types';

/**
 * Scripted support Ember can offer when the model backend is unreachable.
 * These are labeled as offline in the UI so no one mistakes them for a
 * live conversation. They stay useful on their own: slow the moment down,
 * and point to a human.
 */

export type GroundingExercise = {
  id: string;
  title: string;
  steps: readonly string[];
};

export const GROUNDING_EXERCISES: readonly GroundingExercise[] = [
  {
    id: 'breath-4-6',
    title: 'Slow the breath',
    steps: [
      'Breathe in through your nose for a slow count of 4.',
      'Let it out through your mouth for a count of 6, like fogging a window.',
      'Do that four more times. Longer out than in tells your body the danger is passing.',
    ],
  },
  {
    id: 'five-senses',
    title: 'Come back to the room',
    steps: [
      'Name 5 things you can see right now. Small things count.',
      'Name 4 things you can feel — the chair, your feet on the floor, the air.',
      'Name 3 things you can hear, 2 you can smell, and 1 you can taste.',
    ],
  },
  {
    id: 'cold-water',
    title: 'Cold water reset',
    steps: [
      'Run cold water over your wrists for 30 seconds, or hold something cold.',
      'Notice the temperature. Let it pull your attention out of your head for a moment.',
    ],
  },
  {
    id: 'next-hour',
    title: 'Only the next hour',
    steps: [
      'You do not have to solve tonight. Pick one small thing for the next hour: a glass of water, a shower, a text to one person.',
      'When the hour passes, pick the next one. Minutes are how people get through.',
    ],
  },
];

export function pickGroundingExercise(seed: number): GroundingExercise {
  const index = Math.abs(Math.trunc(seed)) % GROUNDING_EXERCISES.length;
  return GROUNDING_EXERCISES[index];
}

export function offlineReply(risk: RiskLevel, seed: number): string {
  const exercise = pickGroundingExercise(seed);
  const steps = exercise.steps.map((step) => `• ${step}`).join('\n');

  if (risk === 'imminent') {
    return [
      "I can't reach my full voice right now, but I'm still here, and this matters too much to wait on me.",
      'Please call or text 988 right now, or your local emergency number. A real person will pick up, any hour.',
      'If you can, move away from anything you could use to hurt yourself and stay near someone.',
      `While you reach out — ${exercise.title.toLowerCase()}:\n${steps}`,
    ].join('\n\n');
  }

  if (risk === 'elevated') {
    return [
      "My connection is down, so I'm working from what I have. I'm still glad you're here.",
      'What you are carrying sounds heavy. You do not have to hold it alone: 988 (call or text) connects you to a trained person, and they want to hear from you.',
      `In the meantime, try this with me — ${exercise.title.toLowerCase()}:\n${steps}`,
    ].join('\n\n');
  }

  return [
    "I'm having trouble connecting right now, so this is a shorter version of me.",
    `Something we can do together anyway — ${exercise.title.toLowerCase()}:\n${steps}`,
    "If you'd rather talk to a person, 988 is open around the clock.",
  ].join('\n\n');
}
