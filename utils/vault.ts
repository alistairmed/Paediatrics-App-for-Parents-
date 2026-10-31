import { deriveKey, encryptString, decryptString, isEncrypted, randomSalt, PBKDF2_ITERATIONS } from './crypto';

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
export const LOCK_META_KEY = 'pedipulse_lock';
const CHECK_TEXT = 'pedipulse-lock-check';

interface LockMeta {
  v: 1;
  salt: string;
  iterations: number;
  check: string;
}

let key: CryptoKey | null = null;
const cache = new Map<string, string | null>();
let writeChain: Promise<void> = Promise.resolve();

const readMeta = (): LockMeta | null => {
  try {
    const raw = localStorage.getItem(LOCK_META_KEY);
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

export async function unlock(passcode: string): Promise<boolean> {
  const meta = readMeta();
  if (!meta) return true;
  const candidate = await checkPasscode(passcode, meta);
  if (!candidate) return false;
  for (const k of storedSensitiveKeys()) {
    const raw = localStorage.getItem(k);
    cache.set(k, raw === null ? null : isEncrypted(raw) ? await decryptString(candidate, raw) : raw);
  }
  key = candidate;
  return true;
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
    localStorage.setItem(LOCK_META_KEY, JSON.stringify(meta));
  } catch {
    for (const [k, v] of plain) v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v);
    localStorage.removeItem(LOCK_META_KEY);
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
  localStorage.removeItem(LOCK_META_KEY);
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
export function eraseAllData(): void {
  localStorage.clear();
  window.location.reload();
}
