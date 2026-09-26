import { Mic, MicOff, PhoneOff, Square } from 'lucide-react';
import type { ChatMessage } from '@/lib/companion';
import type { VoicePhase, VoiceSupport } from '@/lib/voice';
import { cn } from '@/lib/utils';
import { EmberAvatar, type EmberMood } from './ember-avatar';

export interface EmberStageProps {
  phase: VoicePhase;
  energy: number;
  interim: string;
  error: string | null;
  support: VoiceSupport;
  lastReply: ChatMessage | null;
  onStart: () => void;
  onStop: () => void;
  onInterrupt: () => void;
}

const PHASE_LABEL: Record<VoicePhase, string> = {
  off: 'Tap to talk with Ember',
  starting: 'Waiting for microphone access…',
  listening: 'Listening…',
  thinking: 'Ember is thinking',
  speaking: 'Ember is speaking',
  error: 'Voice unavailable',
};

const PHASE_MOOD: Record<VoicePhase, EmberMood> = {
  off: 'calm',
  starting: 'calm',
  listening: 'listening',
  thinking: 'thinking',
  speaking: 'calm',
  error: 'calm',
};

/**
 * The audiovisual Ember: a large, live-animated flame that hears you and
 * speaks back, with captions for everything said so the conversation stays
 * accessible without sound.
 */
export function EmberStage(props: EmberStageProps) {
  const { phase, energy, interim, error, support, lastReply, onStart, onStop, onInterrupt } = props;
  const live = phase !== 'off' && phase !== 'error';
  const canVoice = support.recognition && support.synthesis;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col items-center justify-between overflow-y-auto bg-ink-900 px-5 py-5 text-white sm:py-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-opacity duration-500"
        style={{
          opacity: live ? 0.55 + energy * 0.45 : 0.35,
          background:
            'radial-gradient(ellipse at 50% 42%, rgba(255,164,36,0.35) 0%, rgba(249,134,11,0.12) 35%, rgba(18,24,46,0) 70%)',
        }}
      />

      <p className="relative text-xs font-semibold uppercase tracking-[0.2em] text-ember-300" aria-live="polite">
        {PHASE_LABEL[phase]}
      </p>

      <button
        type="button"
        onClick={live ? undefined : onStart}
        disabled={live || !canVoice}
        aria-label={live ? PHASE_LABEL[phase] : 'Start talking with Ember'}
        className={cn(
          'relative my-4 rounded-full outline-none transition-transform focus-visible:ring-4 focus-visible:ring-ember-300/60',
          !live && canVoice && 'hover:scale-[1.03] active:scale-[0.98]'
        )}
      >
        <EmberAvatar size={160} className="sm:h-[240px] sm:w-[200px]" mood={PHASE_MOOD[phase]} energy={live ? energy : 0} />
        {phase === 'listening' && (
          <span
            aria-hidden
            className="absolute inset-0 -m-3 rounded-full border-2 border-calm-300/50"
            style={{ transform: `scale(${1 + energy * 0.12})`, transition: 'transform 80ms linear' }}
          />
        )}
      </button>

      <div className="relative w-full max-w-md space-y-3 text-center" aria-live="polite">
        {lastReply && lastReply.content && (
          <p className="text-[15px] leading-relaxed text-ink-100">{lastReply.content}</p>
        )}
        {interim && phase !== 'speaking' && (
          <p className="text-sm italic text-calm-200">“{interim}”</p>
        )}
        {error && (
          <p role="alert" className="rounded-xl border border-ember-300/40 bg-ember-700/20 px-4 py-2 text-sm text-ember-100">
            {error}
          </p>
        )}
        {!canVoice && !error && (
          <p className="text-sm text-ink-300">
            Voice needs Chrome, Edge, or Safari. Text with Ember works everywhere.
          </p>
        )}
      </div>

      <div className="relative mt-5 flex items-center gap-3">
        {live ? (
          <>
            {phase === 'speaking' || phase === 'thinking' ? (
              <button
                type="button"
                onClick={onInterrupt}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/25 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                <Square className="h-4 w-4" aria-hidden /> Interrupt
              </button>
            ) : (
              <span className="inline-flex min-h-11 items-center gap-2 rounded-full border border-calm-300/40 px-5 py-2.5 text-sm font-semibold text-calm-200">
                <Mic className="h-4 w-4" aria-hidden /> Go ahead, I'm listening
              </span>
            )}
            <button
              type="button"
              onClick={onStop}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-ink-900 transition-transform hover:-translate-y-0.5"
            >
              <PhoneOff className="h-4 w-4" aria-hidden /> End
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onStart}
            disabled={!canVoice}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ember-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-ember-500/30 transition-all hover:-translate-y-0.5 hover:bg-ember-600 disabled:opacity-40 disabled:shadow-none"
          >
            {canVoice ? <Mic className="h-4 w-4" aria-hidden /> : <MicOff className="h-4 w-4" aria-hidden />}
            Talk with Ember
          </button>
        )}
      </div>

      <p className="relative mt-4 max-w-md text-center text-[11px] leading-relaxed text-ink-400">
        Your browser turns speech into text and reads Ember's words aloud. Nothing is recorded by The Stay
        Project.
      </p>
    </div>
  );
}
