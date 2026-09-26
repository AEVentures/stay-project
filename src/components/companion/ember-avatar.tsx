import { useId } from 'react';
import { cn } from '@/lib/utils';

export type EmberMood = 'calm' | 'listening' | 'thinking';

export interface EmberAvatarProps {
  mood?: EmberMood;
  size?: number;
  className?: string;
  /** Decorative by default; pass a label when the avatar stands alone. */
  label?: string;
}

/**
 * Ember: a small flame resting in a lantern ring. The face is two soft eyes
 * and a faint smile — enough to feel present, never enough to be mistaken
 * for a human. Motion is CSS-only so `prefers-reduced-motion` in index.css
 * stills it automatically.
 */
export function EmberAvatar({ mood = 'calm', size = 96, className, label }: EmberAvatarProps) {
  const id = useId();
  const gradFlame = `${id}-flame`;
  const gradCore = `${id}-core`;
  const gradGlow = `${id}-glow`;
  const gradRing = `${id}-ring`;

  const eyeRy = mood === 'listening' ? 3.4 : 2.6;
  const eyeCy = mood === 'thinking' ? 46 : 48;
  const mouthPath = mood === 'thinking' ? 'M44 58 q6 2 12 0' : 'M43 57 q7 5 14 0';

  return (
    <svg
      viewBox="0 0 100 120"
      width={size}
      height={(size * 120) / 100}
      role={label ? 'img' : 'presentation'}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn('select-none', className)}
    >
      <defs>
        <radialGradient id={gradGlow} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffc04d" stopOpacity="0.9" />
          <stop offset="55%" stopColor="#f9860b" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#f9860b" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={gradFlame} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffd98a" />
          <stop offset="55%" stopColor="#ffa424" />
          <stop offset="100%" stopColor="#dd6306" />
        </linearGradient>
        <linearGradient id={gradCore} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff8ec" />
          <stop offset="100%" stopColor="#ffd98a" />
        </linearGradient>
        <linearGradient id={gradRing} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#1c2745" />
          <stop offset="50%" stopColor="#455a91" />
          <stop offset="100%" stopColor="#1c2745" />
        </linearGradient>
      </defs>

      {/* Ambient glow — breathes slowly, like someone calming down. */}
      <circle
        cx="50"
        cy="52"
        r="44"
        fill={`url(#${gradGlow})`}
        className="origin-[50px_52px] animate-breathe"
      />

      {/* Lantern dish + ring. */}
      <ellipse cx="50" cy="96" rx="26" ry="6" fill="#0d1224" opacity="0.6" />
      <path
        d="M24 90 q26 14 52 0 v6 q-26 14 -52 0z"
        fill={`url(#${gradRing})`}
        stroke="#98a7cf"
        strokeWidth="0.8"
      />
      <path d="M24 90 q26 14 52 0" fill="none" stroke="#c6cfe6" strokeWidth="1.2" />

      {/* Flame body — the whole character sways gently and stretches like breath. */}
      <g className="origin-[50px_88px] animate-sway">
        <g className="origin-[50px_88px] animate-flame">
          <path
            d="M50 14 C 62 30, 78 44, 74 66 C 71 82, 60 88, 50 88 C 40 88, 29 82, 26 66 C 22 44, 38 30, 50 14 Z"
            fill={`url(#${gradFlame})`}
          />
          <path
            d="M50 38 C 56 48, 64 56, 62 68 C 60 78, 55 82, 50 82 C 45 82, 40 78, 38 68 C 36 56, 44 48, 50 38 Z"
            fill={`url(#${gradCore})`}
            opacity="0.95"
          />

          {/* Face: soft eyes and a faint smile. Clearly a character, not a person. */}
          <ellipse cx="44" cy={eyeCy} rx="2.4" ry={eyeRy} fill="#7a2d10" />
          <ellipse cx="56" cy={eyeCy} rx="2.4" ry={eyeRy} fill="#7a2d10" />
          <circle cx="44.8" cy={eyeCy - 1} r="0.7" fill="#fff8ec" />
          <circle cx="56.8" cy={eyeCy - 1} r="0.7" fill="#fff8ec" />
          <path
            d={mouthPath}
            fill="none"
            stroke="#7a2d10"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </g>
      </g>
    </svg>
  );
}
