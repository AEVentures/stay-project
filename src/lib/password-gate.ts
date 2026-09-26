const ACCESS_KEY = 'stay-project-unlocked';
const EXPECTED_DIGEST =
  '75b1382174757dc6315b6fb560d89ce4bcdff6dad7a4202f9bac1e682d23f235';

export function isSiteUnlocked(): boolean {
  return sessionStorage.getItem(ACCESS_KEY) === 'true';
}

export async function unlockSite(password: string): Promise<boolean> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(password)
  );
  const hex = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

  if (hex !== EXPECTED_DIGEST) return false;
  sessionStorage.setItem(ACCESS_KEY, 'true');
  return true;
}
