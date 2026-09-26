import { useEffect, useRef, useState } from 'react';
import { Brain, BrainCircuit, Trash2 } from 'lucide-react';
import type { MemoryState } from '@/hooks';
import type { Memory } from '@/lib/memory';
import { cn } from '@/lib/utils';

export interface MemoryMenuProps {
  state: MemoryState;
  memory: Memory;
  onEnable: () => void;
  onDisable: () => void;
  onForget: () => void;
  onRename: (name: string | null) => void;
}

/** "Ember remembers you" — the one control that turns a tool into someone who knows you. */
export function MemoryMenu({ state, memory, onEnable, onDisable, onForget, onRename }: MemoryMenuProps) {
  const [open, setOpen] = useState(false);
  const [confirmForget, setConfirmForget] = useState(false);
  const [name, setName] = useState(memory.name ?? '');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setName(memory.name ?? ''), [memory.name]);

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (state === 'unsupported' || state === 'loading') return null;
  const on = state === 'on';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={on ? 'Ember remembers you. Memory settings' : 'Memory is off. Memory settings'}
        title={on ? 'Ember remembers you' : 'Memory off'}
        className={cn(
          'inline-flex min-h-11 min-w-11 items-center justify-center rounded-full transition-colors hover:bg-white/10',
          on ? 'text-ember-300' : 'text-ink-300 hover:text-white'
        )}
      >
        {on ? <BrainCircuit className="h-4 w-4" aria-hidden /> : <Brain className="h-4 w-4" aria-hidden />}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Memory settings"
          className="absolute right-0 top-12 z-20 w-80 rounded-2xl border border-ink-100 bg-white p-4 text-ink-800 shadow-2xl"
        >
          <p className="font-semibold text-ink-900">{on ? 'Ember remembers you' : 'Should Ember remember you?'}</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-600">
            {on
              ? 'Your name, the people you mention, what helps, and your stay plan — encrypted and stored only in this browser. Never on our servers.'
              : 'With memory on, Ember picks up the thread next time instead of starting over. Everything stays encrypted on this device.'}
          </p>

          {on && (
            <label className="mt-3 block text-xs font-semibold text-ink-700">
              What should Ember call you?
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                onBlur={() => onRename(name || null)}
                maxLength={40}
                placeholder="A first name or nickname"
                className="mt-1 min-h-11 w-full rounded-xl border border-ink-200 bg-ink-50 px-3 text-sm font-normal focus:border-ember-400 focus:outline-none focus:ring-2 focus:ring-ember-200"
              />
            </label>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {on ? (
              <>
                <button
                  type="button"
                  onClick={onDisable}
                  className="inline-flex min-h-11 items-center rounded-full border border-ink-200 px-4 text-sm font-semibold text-ink-700 hover:border-ink-400"
                >
                  Pause memory
                </button>
                {confirmForget ? (
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmForget(false);
                      setOpen(false);
                      onForget();
                    }}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ember-700 px-4 text-sm font-semibold text-white"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden /> Yes, forget everything
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmForget(true)}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold text-ember-700 hover:bg-ember-50"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden /> Forget everything
                  </button>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onEnable();
                  setOpen(false);
                }}
                className="inline-flex min-h-11 items-center rounded-full bg-ember-500 px-4 text-sm font-semibold text-white hover:bg-ember-600"
              >
                Turn memory on
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
