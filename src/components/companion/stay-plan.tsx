import { type FormEvent, useState } from 'react';
import { Plus, Printer, X } from 'lucide-react';
import { emptyPlan, planIsEmpty, STAY_PLAN_SECTIONS, type StayPlan as StayPlanData } from '@/lib/memory';
import type { MemoryState } from '@/hooks';

export interface StayPlanProps {
  plan: StayPlanData;
  memoryState: MemoryState;
  onChange: (plan: StayPlanData) => void;
  onEnableMemory: () => void;
}

/**
 * The stay plan (after Stanley & Brown's Safety Planning Intervention),
 * in the person's own words. Ember suggests entries from conversation;
 * the person owns every line. Lives only on this device.
 */
export function StayPlan({ plan, memoryState, onChange, onEnableMemory }: StayPlanProps) {
  const [drafts, setDrafts] = useState<Partial<Record<keyof StayPlanData, string>>>({});
  const full = { ...emptyPlan(), ...plan };

  function add(key: keyof StayPlanData, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = (drafts[key] ?? '').trim();
    if (!value) return;
    onChange({ ...full, [key]: [...full[key], value].slice(-12) });
    setDrafts((prev) => ({ ...prev, [key]: '' }));
  }

  function remove(key: keyof StayPlanData, index: number) {
    onChange({ ...full, [key]: full[key].filter((_, i) => i !== index) });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-ink-50 px-4 py-5 text-ink-800 sm:px-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-2xl font-semibold text-ink-900">My stay plan</h3>
          <p className="mt-1 text-sm leading-relaxed text-ink-600">
            A plan you make on a steadier day for the harder ones. Ember will suggest lines from what you tell her;
            every word is yours to keep or cut.
          </p>
        </div>
        {!planIsEmpty(full) && (
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex min-h-11 flex-none items-center gap-2 rounded-full border border-ink-200 bg-white px-4 py-2 text-sm font-semibold text-ink-700 hover:border-ember-400"
          >
            <Printer className="h-4 w-4" aria-hidden /> Print
          </button>
        )}
      </div>

      {memoryState !== 'on' && (
        <div className="mb-4 rounded-2xl border border-ember-200 bg-ember-50 p-4 text-sm text-ember-900">
          <p className="font-semibold">This plan is only saved if Ember's memory is on.</p>
          <p className="mt-1 leading-relaxed">
            Memory is encrypted and stays on this device. Nothing is sent anywhere unless you talk with Ember.
          </p>
          {memoryState === 'off' && (
            <button
              type="button"
              onClick={onEnableMemory}
              className="mt-3 inline-flex min-h-11 items-center rounded-full bg-ember-600 px-4 py-2 text-sm font-semibold text-white hover:bg-ember-700"
            >
              Turn memory on
            </button>
          )}
        </div>
      )}

      <ol className="space-y-4 print:space-y-3">
        {STAY_PLAN_SECTIONS.map(({ key, title, hint }, sectionIndex) => (
          <li key={key} className="rounded-2xl border border-ink-100 bg-white p-4">
            <h4 className="flex items-baseline gap-2 font-semibold text-ink-900">
              <span className="font-display text-ember-600">{sectionIndex + 1}</span> {title}
            </h4>
            {full[key].length > 0 ? (
              <ul className="mt-2 space-y-1.5">
                {full[key].map((item, index) => (
                  <li key={`${item}-${index}`} className="flex items-start justify-between gap-2 text-[15px] leading-relaxed">
                    <span>{item}</span>
                    <button
                      type="button"
                      onClick={() => remove(key, index)}
                      aria-label={`Remove "${item}"`}
                      className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-full text-ink-400 hover:bg-ink-100 hover:text-ink-700 print:hidden"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm italic text-ink-400">{hint}</p>
            )}
            {key === 'professionals' && (
              <p className="mt-2 text-xs text-ink-500">Always on the list: 988, call or text, any hour (US).</p>
            )}
            <form onSubmit={(event) => add(key, event)} className="mt-3 flex gap-2 print:hidden">
              <label htmlFor={`plan-${key}`} className="sr-only">
                Add to {title}
              </label>
              <input
                id={`plan-${key}`}
                value={drafts[key] ?? ''}
                onChange={(event) => setDrafts((prev) => ({ ...prev, [key]: event.target.value }))}
                maxLength={160}
                placeholder="Add a line…"
                className="min-h-11 flex-1 rounded-xl border border-ink-200 bg-ink-50 px-3 text-sm focus:border-ember-400 focus:outline-none focus:ring-2 focus:ring-ember-200"
              />
              <button
                type="submit"
                disabled={!(drafts[key] ?? '').trim()}
                aria-label={`Add to ${title}`}
                className="inline-flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-ink-900 text-white disabled:opacity-30"
              >
                <Plus className="h-4 w-4" aria-hidden />
              </button>
            </form>
          </li>
        ))}
      </ol>
    </div>
  );
}
