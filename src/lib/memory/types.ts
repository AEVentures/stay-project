/**
 * What Ember is allowed to remember. Everything here is written by the
 * person (or extracted from what they explicitly said), lives only in their
 * browser, encrypted, and can be erased with one tap.
 */

export type StayPlan = {
  /** How I know a hard moment is starting. */
  warningSigns: string[];
  /** Things I can do on my own to steady myself. */
  copingSteps: string[];
  /** People and places that take my mind off it. */
  distractions: string[];
  /** People I can ask for help, with how to reach them. */
  supporters: string[];
  /** Professionals and lines (988 is always implied). */
  professionals: string[];
  /** How I make my space safer. Never method details. */
  saferSpace: string[];
  /** My reasons to stay, in my own words. */
  reasons: string[];
};

export type Memory = {
  version: 1;
  /** First name or nickname the person chose to share. */
  name: string | null;
  /** People in their life, e.g. "sister Ana, calls on Sundays". */
  people: string[];
  /** What they have been carrying. */
  carrying: string[];
  /** What has helped them before. */
  helps: string[];
  /** Threads Ember should follow up on next time. */
  followUps: string[];
  plan: StayPlan;
  visits: number;
  firstVisit: number | null;
  lastVisit: number | null;
};

/** Delta the model returns from a reflection. Every field optional. */
export type MemoryDelta = {
  name?: string | null;
  people?: string[];
  carrying?: string[];
  helps?: string[];
  followUps?: string[];
  plan?: Partial<StayPlan>;
};

export const STAY_PLAN_SECTIONS: ReadonlyArray<{ key: keyof StayPlan; title: string; hint: string }> = [
  { key: 'warningSigns', title: 'How I know a hard moment is starting', hint: 'Thoughts, feelings, situations. "Sunday nights." "When I stop answering texts."' },
  { key: 'copingSteps', title: 'What I can do on my own', hint: 'Small and concrete. A walk, cold water, one song, the shower.' },
  { key: 'distractions', title: 'People and places that pull me out', hint: 'Not for deep talk — just company. A coffee shop, a group chat, a sibling.' },
  { key: 'supporters', title: 'People I can ask for help', hint: 'Name and how to reach them.' },
  { key: 'professionals', title: 'Professionals and lines', hint: '988 (call or text), a therapist, a doctor, a crisis text line.' },
  { key: 'saferSpace', title: 'Making my space safer', hint: 'Who holds what for me, what I keep out of reach, where I go instead.' },
  { key: 'reasons', title: 'My reasons to stay', hint: 'In my own words. They can be small.' },
];

export function emptyPlan(): StayPlan {
  return {
    warningSigns: [],
    copingSteps: [],
    distractions: [],
    supporters: [],
    professionals: [],
    saferSpace: [],
    reasons: [],
  };
}

export function emptyMemory(): Memory {
  return {
    version: 1,
    name: null,
    people: [],
    carrying: [],
    helps: [],
    followUps: [],
    plan: emptyPlan(),
    visits: 0,
    firstVisit: null,
    lastVisit: null,
  };
}

export function planIsEmpty(plan: StayPlan): boolean {
  return Object.values(plan).every((items) => items.length === 0);
}
