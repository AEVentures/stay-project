import { emptyMemory, type Memory } from './types';

/**
 * Memory at rest is AES-256-GCM encrypted with a non-extractable key that
 * never leaves this browser's IndexedDB. Clearing wipes both the key and
 * the ciphertext.
 */

const DB_NAME = 'stay-ember';
const DB_VERSION = 1;
const STORE = 'kv';
const KEY_ID = 'memory-key';
const DATA_ID = 'memory';
const CONSENT_ID = 'memory-consent';

type Envelope = { iv: number[]; data: number[] };

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'));
  });
}

async function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const request = run(tx.objectStore(STORE));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
    });
  } finally {
    db.close();
  }
}

async function getKey(create: boolean): Promise<CryptoKey | null> {
  const existing = await withStore<CryptoKey | undefined>('readonly', (store) => store.get(KEY_ID));
  if (existing) return existing;
  if (!create) return null;
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  await withStore('readwrite', (store) => store.put(key, KEY_ID));
  return key;
}

export function isMemorySupported(): boolean {
  return typeof indexedDB !== 'undefined' && typeof crypto !== 'undefined' && Boolean(crypto.subtle);
}

export async function getMemoryConsent(): Promise<boolean> {
  if (!isMemorySupported()) return false;
  try {
    return (await withStore<boolean | undefined>('readonly', (store) => store.get(CONSENT_ID))) === true;
  } catch {
    return false;
  }
}

export async function setMemoryConsent(value: boolean): Promise<void> {
  await withStore('readwrite', (store) => store.put(value, CONSENT_ID));
}

export async function loadMemory(): Promise<Memory> {
  if (!isMemorySupported()) return emptyMemory();
  try {
    const key = await getKey(false);
    const envelope = await withStore<Envelope | undefined>('readonly', (store) => store.get(DATA_ID));
    if (!key || !envelope) return emptyMemory();
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(envelope.iv) },
      key,
      new Uint8Array(envelope.data)
    );
    const parsed = JSON.parse(new TextDecoder().decode(plain)) as Partial<Memory>;
    return { ...emptyMemory(), ...parsed, plan: { ...emptyMemory().plan, ...(parsed.plan ?? {}) } };
  } catch {
    return emptyMemory();
  }
}

export async function saveMemory(memory: Memory): Promise<void> {
  const key = await getKey(true);
  if (!key) throw new Error('Could not create a memory key.');
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(memory)));
  const envelope: Envelope = { iv: Array.from(iv), data: Array.from(new Uint8Array(data)) };
  await withStore('readwrite', (store) => store.put(envelope, DATA_ID));
}

/** Forget everything: ciphertext, key, and consent. */
export async function clearMemory(): Promise<void> {
  if (!isMemorySupported()) return;
  await withStore('readwrite', (store) => {
    store.delete(DATA_ID);
    store.delete(KEY_ID);
    return store.delete(CONSENT_ID);
  });
}
