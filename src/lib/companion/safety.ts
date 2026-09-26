import type { RiskLevel } from './types';

/**
 * Lightweight, transparent risk classifier shared by the browser and the
 * worker. It never blocks a conversation; it only decides how prominently
 * to surface crisis resources and what guidance the model receives.
 *
 * This is intentionally conservative: false positives cost a visible 988
 * card, false negatives cost far more.
 */

const IMMINENT_PATTERNS: readonly RegExp[] = [
  /\b(i('| a)?m|i am)\s+(going|about|gonna)\s+to\s+(kill|end|hurt)\s+(myself|my life|it)\b/i,
  /\b(kill|end)(ing)?\s+(myself|my life)\s+(tonight|today|now|right now|soon|this (morning|afternoon|evening|weekend))\b/i,
  /\b(tonight|today|right now|this is it)\b.*\b(kill myself|end (it|my life)|die)\b/i,
  /\b(i (just )?took|i('| ha)?ve taken|i swallowed)\b.*\b(pills|everything|all of (them|it)|the bottle)\b/i,
  /\b(this is|i('| a)?m (writing|leaving))\s+(my|a)\s+(goodbye|suicide|final)\s+(note|letter|message)\b/i,
  /\bgoodbye\b.*\b(everyone|world|all|forever)\b/i,
  /\bi have (a|the) (gun|rope|pills|means|plan)\b.*\b(myself|die|end|tonight|now)\b/i,
  /\b(i('| a)?m|i am) (standing|sitting) (on|at) (the|a) (edge|ledge|bridge|roof|tracks)\b/i,
  /\bnobody can stop me\b/i,
];

const ELEVATED_PATTERNS: readonly RegExp[] = [
  /\bsuicid(e|al)\b/i,
  /\bkill(ing)? myself\b/i,
  /\bend (it all|my life|everything)\b/i,
  /\b(want|wish|ready) to (die|be dead|disappear|not exist|not be here)\b/i,
  /\bdon'?t want to (be here|live|wake up|exist|go on) (anymore|any more)?\b/i,
  /\bbetter off (dead|without me|if i (was|were) gone)\b/i,
  /\bno (reason|point) (to|in) (living|going on|being here)\b/i,
  /\b(can'?t|cannot) (do this|go on|take (it|this)) (anymore|any more)\b/i,
  /\b(hurt|harm|cut|cutting) myself\b/i,
  /\bself[- ]?harm\b/i,
  /\beveryone would be better off\b/i,
  /\b(i('| a)?m|i am|feel like|i('| ha)?ve become) (such |just )?a burden\b/i,
  /\bno one would (miss|care|notice)\b/i,
  /\bwish i (was|were) (dead|never born)\b/i,
  /\bnot safe (right now|tonight|with myself)\b/i,
];

const RISK_ORDER: Record<RiskLevel, number> = { none: 0, elevated: 1, imminent: 2 };

export function assessRisk(text: string): RiskLevel {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return 'none';
  if (IMMINENT_PATTERNS.some((pattern) => pattern.test(normalized))) return 'imminent';
  if (ELEVATED_PATTERNS.some((pattern) => pattern.test(normalized))) return 'elevated';
  return 'none';
}

export function maxRisk(...levels: RiskLevel[]): RiskLevel {
  return levels.reduce<RiskLevel>(
    (highest, level) => (RISK_ORDER[level] > RISK_ORDER[highest] ? level : highest),
    'none'
  );
}

/** Highest risk across a conversation, weighting recent user messages only. */
export function assessConversationRisk(
  userMessages: readonly string[],
  window = 6
): RiskLevel {
  return maxRisk(...userMessages.slice(-window).map(assessRisk));
}
