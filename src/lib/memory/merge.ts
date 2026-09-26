import { emptyPlan, type Memory, type MemoryDelta, type StayPlan } from './types';

const MAX_ITEMS = 12;
const MAX_ITEM_CHARS = 160;

function clean(items: readonly string[] | undefined): string[] {
  if (!items) return [];
  return items.map((item) => item.replace(/\s+/g, ' ').trim().slice(0, MAX_ITEM_CHARS)).filter(Boolean);
}

/** Case-insensitive union that keeps the newest items when over the cap. */
export function mergeList(existing: readonly string[], incoming: readonly string[] | undefined): string[] {
  const seen = new Set(existing.map((item) => item.toLowerCase()));
  const merged = [...existing];
  for (const item of clean(incoming)) {
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }
  return merged.slice(-MAX_ITEMS);
}

export function mergePlan(existing: StayPlan, delta: Partial<StayPlan> | undefined): StayPlan {
  const base = { ...emptyPlan(), ...existing };
  if (!delta) return base;
  return (Object.keys(base) as Array<keyof StayPlan>).reduce<StayPlan>(
    (plan, key) => ({ ...plan, [key]: mergeList(base[key], delta[key]) }),
    base
  );
}

export function applyDelta(memory: Memory, delta: MemoryDelta): Memory {
  const name =
    delta.name === undefined ? memory.name : delta.name === null ? memory.name : delta.name.trim().slice(0, 40) || memory.name;
  return {
    ...memory,
    name,
    people: mergeList(memory.people, delta.people),
    carrying: mergeList(memory.carrying, delta.carrying),
    helps: mergeList(memory.helps, delta.helps),
    // Follow-ups are replaced, not accumulated: the model decides what is still live.
    followUps: delta.followUps ? clean(delta.followUps).slice(0, 5) : memory.followUps,
    plan: mergePlan(memory.plan, delta.plan),
  };
}

export function recordVisit(memory: Memory, now = Date.now()): Memory {
  return {
    ...memory,
    visits: memory.visits + 1,
    firstVisit: memory.firstVisit ?? now,
    lastVisit: now,
  };
}

export function hasAnything(memory: Memory): boolean {
  return Boolean(
    memory.name ||
      memory.people.length ||
      memory.carrying.length ||
      memory.helps.length ||
      memory.followUps.length ||
      Object.values(memory.plan).some((items) => items.length)
  );
}

/** Compact, model-facing summary. Never includes timestamps or counts beyond what helps the conversation. */
export function toModelContext(memory: Memory, now = Date.now()): string | null {
  if (!hasAnything(memory) && memory.visits < 2) return null;
  const lines: string[] = [];
  if (memory.name) lines.push(`Name they go by: ${memory.name}`);
  if (memory.lastVisit && memory.visits > 1) lines.push(`Last talked: ${describeAgo(now - memory.lastVisit)} (visit ${memory.visits})`);
  if (memory.people.length) lines.push(`People in their life: ${memory.people.join('; ')}`);
  if (memory.carrying.length) lines.push(`What they have been carrying: ${memory.carrying.join('; ')}`);
  if (memory.helps.length) lines.push(`What has helped before: ${memory.helps.join('; ')}`);
  if (memory.followUps.length) lines.push(`Threads to gently follow up on: ${memory.followUps.join('; ')}`);
  if (memory.plan.reasons.length) lines.push(`Their reasons to stay (their words): ${memory.plan.reasons.join('; ')}`);
  if (memory.plan.supporters.length) lines.push(`People they said they could ask for help: ${memory.plan.supporters.join('; ')}`);
  return lines.join('\n');
}

export function describeAgo(ms: number): string {
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) return minutes <= 1 ? 'a minute ago' : `${minutes} minutes ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return hours === 1 ? 'an hour ago' : `${hours} hours ago`;
  const days = Math.round(hours / 24);
  if (days < 14) return days === 1 ? 'yesterday' : `${days} days ago`;
  const weeks = Math.round(days / 7);
  if (weeks < 9) return `${weeks} weeks ago`;
  return `${Math.round(days / 30)} months ago`;
}
