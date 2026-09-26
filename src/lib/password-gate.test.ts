import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isSiteUnlocked, unlockSite } from './password-gate';

const storage = new Map<string, string>();
vi.stubGlobal('sessionStorage', {
  clear: () => storage.clear(),
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
});

describe('password gate', () => {
  beforeEach(() => {
    storage.clear();
  });

  it('rejects an incorrect password', async () => {
    await expect(unlockSite('wrong-password')).resolves.toBe(false);
    expect(isSiteUnlocked()).toBe(false);
  });

  it('unlocks for the configured password', async () => {
    await expect(unlockSite('PleaseStay')).resolves.toBe(true);
    expect(isSiteUnlocked()).toBe(true);
  });
});
