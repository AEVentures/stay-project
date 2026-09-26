export const siteConfig = {
  repoUrl: 'https://github.com/AEVentures/stay-project',
  docsUrl: 'https://github.com/AEVentures/stay-project/tree/main/docs',
  resourcesUrl:
    'https://github.com/AEVentures/stay-project/blob/main/docs/RESOURCES.md',
  /** Ember companion backend (see worker/). Empty string = offline mode only. */
  companionApiUrl: (import.meta.env.VITE_COMPANION_API_URL ?? '').replace(/\/$/, ''),
  /**
   * Zero mints short-lived Realtime client secrets so Ember can speak with
   * Zero's voice (no key in the browser). Empty string = browser speech only.
   */
  voiceSessionUrl: (
    import.meta.env.VITE_VOICE_SESSION_URL ?? 'https://zero.vims.com/api/public/ember/voice-session'
  ).replace(/\/$/, ''),
};

/**
 * Crisis resources shown throughout the site. Numbers are verified,
 * public, toll-free lines. Keep this list accurate — see
 * docs/RESOURCES.md for sourcing notes and international lines.
 */
export const crisisLines = [
  {
    name: '988 Suicide & Crisis Lifeline',
    detail: 'Call or text 988',
    href: 'tel:988',
    region: 'United States · 24/7',
  },
  {
    name: 'Crisis Text Line',
    detail: 'Text HOME to 741741',
    href: 'sms:741741&body=HOME',
    region: 'US & Canada · 24/7',
  },
  {
    name: 'The Trevor Project',
    detail: 'Call 1-866-488-7386 or text START to 678678',
    href: 'tel:18664887386',
    region: 'LGBTQ+ youth · 24/7',
  },
  {
    name: 'Veterans Crisis Line',
    detail: 'Call 988, then press 1, or text 838255',
    href: 'tel:988',
    region: 'US Veterans · 24/7',
  },
  {
    name: 'Findahelpline.com',
    detail: 'Search crisis lines by country',
    href: 'https://findahelpline.com',
    region: 'International',
  },
];
