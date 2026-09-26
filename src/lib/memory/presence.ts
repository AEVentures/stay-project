import { describeAgo } from './merge';
import type { Memory } from './types';

export type TimeOfDay = 'late-night' | 'early-morning' | 'morning' | 'afternoon' | 'evening' | 'night';

export function timeOfDay(hour: number): TimeOfDay {
  if (hour < 4) return 'late-night';
  if (hour < 7) return 'early-morning';
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 21) return 'evening';
  return 'night';
}

const TIME_LINE: Record<TimeOfDay, string> = {
  'late-night': "It's late, and you're here. That took something.",
  'early-morning': "It's early. Whether you never slept or just woke, I'm glad you're here.",
  morning: 'Morning.',
  afternoon: '',
  evening: '',
  night: "It's getting late.",
};

/**
 * Ember's opening line. Written to feel like someone who noticed you came
 * in, not a splash screen: time-aware, and when memory is on, picking up
 * the thread from last time.
 */
export function buildGreeting(memory: Memory | null, now = new Date()): string {
  const time = TIME_LINE[timeOfDay(now.getHours())];
  const name = memory?.name ? `, ${memory.name}` : '';

  if (memory && memory.visits > 1) {
    const ago = memory.lastVisit ? describeAgo(now.getTime() - memory.lastVisit) : null;
    const back = ago ? `You came back${name}. Last time was ${ago}.` : `You came back${name}.`;
    const thread = memory.followUps[0];
    const ask = thread
      ? `I've been holding onto something you said: ${lowerFirst(thread)} How is that sitting now?`
      : "What's the heaviest part of right now?";
    return [time, back, ask].filter(Boolean).join(' ');
  }

  const intro = "Hi. I'm Ember. I'm a small light that stays on, and I'm glad you're here.";
  const ease = "You don't have to explain everything, or anything.";
  return [time, intro, ease, "What's the heaviest part of right now?"].filter(Boolean).join(' ');
}

function lowerFirst(text: string): string {
  const trimmed = text.trim().replace(/[.!?]+$/, '');
  return trimmed ? trimmed[0].toLowerCase() + trimmed.slice(1) + '.' : '';
}

/** Lines Ember uses when someone goes quiet. Rotates so it never feels canned. */
export const SILENCE_LINES = [
  "Still here. No rush.",
  "Take whatever time you need. I'm not going anywhere.",
  "You went quiet. That's okay. I'm right here when you want to say something, or nothing.",
  "No pressure to fill the silence. Just letting you know the light's still on.",
] as const;

export function silenceLine(index: number): string {
  return SILENCE_LINES[Math.abs(index) % SILENCE_LINES.length];
}

/**
 * A human pace: a small pause before Ember answers, longer for heavier
 * messages, never long enough to feel like she left.
 */
export function replyDelayMs(userText: string, risk: 'none' | 'elevated' | 'imminent'): number {
  if (risk === 'imminent') return 150;
  const words = userText.trim().split(/\s+/).filter(Boolean).length;
  return Math.min(1400, 400 + words * 35);
}
