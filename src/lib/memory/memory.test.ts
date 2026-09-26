import { describe, expect, it } from 'vitest';
import { applyDelta, describeAgo, hasAnything, mergeList, mergePlan, recordVisit, toModelContext } from './merge';
import { buildGreeting, replyDelayMs, silenceLine, timeOfDay } from './presence';
import { emptyMemory, emptyPlan, planIsEmpty } from './types';

describe('mergeList', () => {
  it('unions case-insensitively, trims, and caps to the newest 12', () => {
    expect(mergeList(['Sister Ana'], ['sister ana', '  Coach Dee  ', ''])).toEqual(['Sister Ana', 'Coach Dee']);
    const many = Array.from({ length: 15 }, (_, i) => `item ${i}`);
    expect(mergeList([], many)).toHaveLength(12);
    expect(mergeList([], many)[0]).toBe('item 3');
  });

  it('truncates long items', () => {
    expect(mergeList([], ['x'.repeat(500)])[0]).toHaveLength(160);
  });
});

describe('applyDelta', () => {
  it('merges lists, replaces follow-ups, and keeps the name unless a new one arrives', () => {
    const base = applyDelta(emptyMemory(), { name: 'Sam', people: ['sister Ana'], followUps: ['job interview Tuesday'] });
    expect(base.name).toBe('Sam');
    const next = applyDelta(base, { name: null, people: ['friend Luis'], followUps: ['how the interview went'] });
    expect(next.name).toBe('Sam');
    expect(next.people).toEqual(['sister Ana', 'friend Luis']);
    expect(next.followUps).toEqual(['how the interview went']);
  });

  it('merges partial plans into a full plan', () => {
    const plan = mergePlan(emptyPlan(), { reasons: ['my dog'], warningSigns: ['Sunday nights'] });
    expect(plan.reasons).toEqual(['my dog']);
    expect(plan.copingSteps).toEqual([]);
    expect(planIsEmpty(plan)).toBe(false);
    expect(planIsEmpty(emptyPlan())).toBe(true);
  });
});

describe('visits and context', () => {
  it('records visits and reports whether anything is remembered', () => {
    const m = recordVisit(emptyMemory(), 1000);
    expect(m).toMatchObject({ visits: 1, firstVisit: 1000, lastVisit: 1000 });
    expect(hasAnything(m)).toBe(false);
    expect(toModelContext(m, 2000)).toBeNull();
  });

  it('builds a compact context that includes the last visit and follow-ups', () => {
    let m = recordVisit(recordVisit(emptyMemory(), 0), 60 * 60 * 1000);
    m = applyDelta(m, { name: 'Sam', followUps: ['the call with mom'], plan: { reasons: ['Everly'] } });
    const context = toModelContext(m, 3 * 60 * 60 * 1000)!;
    expect(context).toContain('Name they go by: Sam');
    expect(context).toContain('Last talked: 2 hours ago (visit 2)');
    expect(context).toContain('the call with mom');
    expect(context).toContain('Everly');
  });

  it('describes elapsed time in human terms', () => {
    expect(describeAgo(30_000)).toBe('a minute ago');
    expect(describeAgo(5 * 60_000)).toBe('5 minutes ago');
    expect(describeAgo(60 * 60_000)).toBe('an hour ago');
    expect(describeAgo(26 * 60 * 60_000)).toBe('yesterday');
    expect(describeAgo(3 * 24 * 60 * 60_000)).toBe('3 days ago');
    expect(describeAgo(21 * 24 * 60 * 60_000)).toBe('3 weeks ago');
    expect(describeAgo(90 * 24 * 60 * 60_000)).toBe('3 months ago');
  });
});

describe('presence', () => {
  it('maps hours to time of day', () => {
    expect(timeOfDay(2)).toBe('late-night');
    expect(timeOfDay(5)).toBe('early-morning');
    expect(timeOfDay(9)).toBe('morning');
    expect(timeOfDay(14)).toBe('afternoon');
    expect(timeOfDay(19)).toBe('evening');
    expect(timeOfDay(23)).toBe('night');
  });

  it('greets a first-time visitor with the introduction, time-aware', () => {
    const late = buildGreeting(null, new Date(2026, 0, 1, 2, 40));
    expect(late).toMatch(/^It's late, and you're here\./);
    expect(late).toContain("I'm Ember");
    const afternoon = buildGreeting(emptyMemory(), new Date(2026, 0, 1, 15));
    expect(afternoon).toMatch(/^Hi\. I'm Ember/);
  });

  it('welcomes a returning visitor by name and picks up the thread', () => {
    const now = new Date(2026, 0, 2, 15);
    let m = recordVisit(emptyMemory(), now.getTime() - 24 * 60 * 60_000);
    m = recordVisit(m, now.getTime());
    m = applyDelta(m, { name: 'Sam', followUps: ['The conversation with your sister.'] });
    const greeting = buildGreeting(m, now);
    expect(greeting).toContain('You came back, Sam. Last time was a minute ago.');
    expect(greeting).toContain('the conversation with your sister. How is that sitting now?');
    expect(greeting).not.toContain("I'm Ember");
  });

  it('rotates silence lines and paces replies by weight', () => {
    expect(silenceLine(0)).not.toBe(silenceLine(1));
    expect(silenceLine(4)).toBe(silenceLine(0));
    expect(replyDelayMs('ok', 'none')).toBe(435);
    expect(replyDelayMs('word '.repeat(100), 'none')).toBe(1400);
    expect(replyDelayMs('I am going to kill myself tonight', 'imminent')).toBe(150);
  });
});
