export const siteConfig = {
  repoUrl: 'https://github.com/AEVentures/stay-project',
  docsUrl: 'https://github.com/AEVentures/stay-project/tree/main/docs',
  resourcesUrl:
    'https://github.com/AEVentures/stay-project/blob/main/docs/RESOURCES.md',
  virtualPreventionAgentUrl: 'https://aeye.engajer.com/ai-people/1',
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
