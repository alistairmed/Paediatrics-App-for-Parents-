import { deriveKey, deriveRawKey, encryptString, decryptString, isEncrypted, randomSalt, PBKDF2_ITERATIONS } from './crypto';

/**
 * Optional passcode lock for health records in browser storage.
 *
 * When the lock is on, the keys below are stored encrypted. After unlocking,
 * their decrypted values are held in memory and the key lives only in this
 * module (never in storage), so a reload or auto-lock requires the passcode.
 */
// Record keys (and per-child variants such as pedipulse_history:<childId>) that hold health information.
export const SENSITIVE_PREFIXES = ['pedipulse_profile', 'pedipulse_history', 'pedipulse_governance_log', 'pedipulse_children', 'pedipulse_medicine_log'];
export const isSensitiveKey = (k: string): boolean => SENSITIVE_PREFIXES.some(p => k === p || k.startsWith(p + ':'));

/** Every sensitive key currently in storage. */
const storedSensitiveKeys = (): string[] => {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && isSensitiveKey(k)) keys.push(k);
  }
  return keys;
};
// Kept from the app's old name (PediPulse): existing passcode locks are stored
// under this key and verified against this text, so renaming them would lock
// existing users out of their records.
export const LOCK_META_KEY = 'pedipulse_lock';
const CHECK_TEXT = 'pedipulse-lock-check';

interface LockMeta {
  v: 1;
  salt: string;
  iterations: number;
  check: string;
}

/**
 * Where the lock settings (salt, iteration count, check value) live. On the
 * web: localStorage, as before. In the iOS and Android apps: the Keychain or
 * Keystore, set by initVault() at start-up. The encryption key itself is never
 * stored: it is derived from the passcode each time.
 */
export interface LockMetaStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}
let metaStore: LockMetaStore | null = null;
/** In-memory copy of the lock settings when a secure store is used (reads stay synchronous). */
let metaRaw: string | null = null;

/**
 * Uses a secure store for the lock settings. Existing users' settings are moved
 * out of localStorage into it (copied first, then removed), so their records
 * stay unlockable with the same passcode. Without a store, nothing changes.
 */
export async function initVault(store?: LockMetaStore): Promise<void> {
  if (!store) { metaStore = null; metaRaw = null; return; }
  let value = await store.get(LOCK_META_KEY);
  const legacy = localStorage.getItem(LOCK_META_KEY);
  if (legacy !== null) {
    if (value === null) {
      await store.set(LOCK_META_KEY, legacy);
      value = await store.get(LOCK_META_KEY);
    }
    if (value !== null) localStorage.removeItem(LOCK_META_KEY);
  }
  metaStore = store;
  metaRaw = value;
}

const writeMeta = async (value: string) => {
  if (metaStore) { await metaStore.set(LOCK_META_KEY, value); metaRaw = value; }
  else localStorage.setItem(LOCK_META_KEY, value);
};
const removeMeta = async () => {
  if (metaStore) { await metaStore.remove(LOCK_META_KEY); metaRaw = null; }
  else localStorage.removeItem(LOCK_META_KEY);
};

let key: CryptoKey | null = null;
const cache = new Map<string, string | null>();
let writeChain: Promise<void> = Promise.resolve();

const readMeta = (): LockMeta | null => {
  try {
    const raw = metaStore ? metaRaw : localStorage.getItem(LOCK_META_KEY);
    return raw ? (JSON.parse(raw) as LockMeta) : null;
  } catch {
    return null;
  }
};

export const isLockEnabled = (): boolean => readMeta() !== null;
export const isUnlocked = (): boolean => key !== null;
const isProtected = (k: string) => isSensitiveKey(k) && isLockEnabled();

export function readItem(k: string): string | null {
  if (isProtected(k)) return cache.get(k) ?? null;
  return localStorage.getItem(k);
}

/**
 * Writes a value. Protected values are encrypted asynchronously (writes stay
 * in order); the returned promise rejects if storage is full.
 */
export function writeItem(k: string, value: string): Promise<void> | void {
  if (!isProtected(k)) {
    localStorage.setItem(k, value);
    return;
  }
  if (!key) throw new Error('Locked');
  cache.set(k, value);
  const activeKey = key;
  const write = writeChain.then(async () => {
    localStorage.setItem(k, await encryptString(activeKey, value));
  });
  writeChain = write.catch(() => {});
  return write;
}

/** Deletes a record (and its in-memory copy when the passcode lock is on). */
export function removeItem(k: string): void {
  cache.delete(k);
  localStorage.removeItem(k);
}

async function checkPasscode(passcode: string, meta: LockMeta): Promise<CryptoKey | null> {
  const candidate = await deriveKey(passcode, meta.salt, meta.iterations);
  try {
    return (await decryptString(candidate, meta.check)) === CHECK_TEXT ? candidate : null;
  } catch {
    return null;
  }
}

const openWith = async (candidate: CryptoKey) => {
  for (const k of storedSensitiveKeys()) {
    const raw = localStorage.getItem(k);
    cache.set(k, raw === null ? null : isEncrypted(raw) ? await decryptString(candidate, raw) : raw);
  }
  key = candidate;
};

export async function unlock(passcode: string): Promise<boolean> {
  const meta = readMeta();
  if (!meta) return true;
  const candidate = await checkPasscode(passcode, meta);
  if (!candidate) return false;
  await openWith(candidate);
  return true;
}

/** Unlocks with a key from biometric unlock. False if it no longer matches (the passcode changed). */
export async function unlockWithKey(candidate: CryptoKey): Promise<boolean> {
  const meta = readMeta();
  if (!meta) return true;
  try {
    if ((await decryptString(candidate, meta.check)) !== CHECK_TEXT) return false;
  } catch {
    return false;
  }
  await openWith(candidate);
  return true;
}

/** The encryption key, exported for biometric unlock, after checking the passcode. Null if it's wrong. */
export async function exportKeyForBiometrics(passcode: string): Promise<string | null> {
  const meta = readMeta();
  if (!meta || !(await checkPasscode(passcode, meta))) return null;
  return deriveRawKey(passcode, meta.salt, meta.iterations);
}

export async function verifyPasscode(passcode: string): Promise<boolean> {
  const meta = readMeta();
  return !!meta && (await checkPasscode(passcode, meta)) !== null;
}

/** Encrypts the records under a new passcode. Rolls back if storage is too full. */
export async function enableLock(passcode: string, iterations = PBKDF2_ITERATIONS): Promise<void> {
  const salt = randomSalt();
  const newKey = await deriveKey(passcode, salt, iterations);
  const plain = storedSensitiveKeys().map(k => [k, localStorage.getItem(k)] as const);
  const encrypted = await Promise.all(plain.map(async ([k, v]) => [k, v === null ? null : await encryptString(newKey, v)] as const));
  const meta: LockMeta = { v: 1, salt, iterations, check: await encryptString(newKey, CHECK_TEXT) };

  try {
    for (const [k, v] of encrypted) if (v !== null) localStorage.setItem(k, v);
    await writeMeta(JSON.stringify(meta));
  } catch {
    for (const [k, v] of plain) v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v);
    await removeMeta().catch(() => {});
    throw new Error('Not enough storage to encrypt your records. Remove some photos and try again.');
  }
  for (const [k, v] of plain) cache.set(k, v);
  key = newKey;
}

/** Turns the lock off and stores the records unencrypted again. */
export async function disableLock(passcode: string): Promise<boolean> {
  if (!(await verifyPasscode(passcode))) return false;
  await writeChain;
  for (const [k, v] of cache) {
    if (v === null || v === undefined) localStorage.removeItem(k);
    else localStorage.setItem(k, v);
  }
  await removeMeta();
  key = null;
  cache.clear();
  return true;
}

/** Forgets the key and reloads, so the passcode is needed again. */
export function lockNow(): void {
  key = null;
  cache.clear();
  window.location.reload();
}

/** For a forgotten passcode: the records can't be decrypted, so start again. */
/** Secure-store items other features keep (such as the biometric unlock key); erased with everything else. */
const extraSecureKeys = new Set<string>();
export const registerSecureKey = (k: string) => { extraSecureKeys.add(k); };

/**
 * Factory reset: deletes every record and the lock settings, including the
 * Keychain/Keystore items in the apps, then reloads.
 */
export async function eraseAllData(): Promise<void> {
  await writeChain.catch(() => {});
  if (metaStore) {
    await metaStore.remove(LOCK_META_KEY).catch(() => {});
    for (const k of extraSecureKeys) await metaStore.remove(k).catch(() => {});
    metaRaw = null;
  }
  localStorage.clear();
  key = null;
  cache.clear();
  if (typeof window !== 'undefined' && typeof window.location?.reload === 'function') window.location.reload();
}
