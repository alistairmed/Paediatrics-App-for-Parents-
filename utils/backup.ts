import { deriveKey, encryptString, decryptString, randomSalt, PBKDF2_ITERATIONS } from './crypto';
import { readItem, writeItem, LOCK_META_KEY } from './vault';
import { AI_CONSENT_KEY, AI_USAGE_KEY, PREMIUM_CODE_KEY } from '../services/aiGuard';

/**
 * Password-protected backup of every Paeds Pouch record on this device.
 * The file holds only ciphertext plus the salt needed to derive the key.
 */
// The app was renamed from PediPulse to Paeds Pouch. These internal values keep
// the old name on purpose: existing backup files carry this format marker, and
// every saved record uses this key prefix. Changing them would make older
// backups unreadable and hide existing users' records.
export const BACKUP_FORMAT = 'pedipulse-backup';
export const MIN_BACKUP_PASSWORD = 8;
const RECORD_PREFIX = 'pedipulse_';
/**
 * Settings that belong to this device and this person's choices: the
 * passcode lock, AI consent and usage, and the premium access code. They are
 * never backed up, and never restored, so a backup file can't lock a parent
 * out or switch on AI sharing.
 */
const DEVICE_ONLY = [LOCK_META_KEY, AI_CONSENT_KEY, AI_USAGE_KEY, PREMIUM_CODE_KEY];
/** Largest backup file accepted (a year of busy records is well under 1 MB). */
export const MAX_BACKUP_BYTES = 25 * 1024 * 1024;
/** Key-derivation rounds accepted from a file: enough headroom, but a crafted file can't freeze the browser. */
const MAX_ITERATIONS = 5_000_000;

interface BackupFile {
  format: typeof BACKUP_FORMAT;
  version: 1;
  createdAt: string;
  salt: string;
  iterations: number;
  data: string;
}

/** All Paeds Pouch records, decrypted if the passcode lock is on and unlocked. */
export function collectRecords(): Record<string, string> {
  const records: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(RECORD_PREFIX) || DEVICE_ONLY.includes(key)) continue;
    const value = readItem(key);
    if (value !== null) records[key] = value;
  }
  return records;
}

export async function createBackup(password: string, records = collectRecords(), iterations = PBKDF2_ITERATIONS): Promise<string> {
  if (password.length < MIN_BACKUP_PASSWORD) throw new Error(`Use a password of at least ${MIN_BACKUP_PASSWORD} characters.`);
  const salt = randomSalt();
  const key = await deriveKey(password, salt, iterations);
  const file: BackupFile = {
    format: BACKUP_FORMAT,
    version: 1,
    createdAt: new Date().toISOString(),
    salt,
    iterations,
    data: await encryptString(key, JSON.stringify(records)),
  };
  return JSON.stringify(file);
}

export class BackupError extends Error {}

/** Decrypts a backup file. Throws BackupError with a message safe to show. */
export async function readBackup(text: string, password: string): Promise<{ records: Record<string, string>; createdAt: string }> {
  if (text.length > MAX_BACKUP_BYTES) throw new BackupError('This file is too large to be a Paeds Pouch backup.');
  let file: BackupFile;
  try {
    file = JSON.parse(text);
  } catch {
    throw new BackupError("This isn't a Paeds Pouch backup file.");
  }
  if (file?.format !== BACKUP_FORMAT || file.version !== 1 || typeof file.salt !== 'string' || typeof file.data !== 'string') {
    throw new BackupError("This isn't a Paeds Pouch backup file, or it was made by a newer version.");
  }
  if (!Number.isInteger(file.iterations) || file.iterations < 1 || file.iterations > MAX_ITERATIONS || !/^[A-Za-z0-9+/=]{16,64}$/.test(file.salt)) {
    throw new BackupError('This backup file is damaged.');
  }
  let json: string;
  try {
    json = await decryptString(await deriveKey(password, file.salt, file.iterations), file.data);
  } catch {
    throw new BackupError("That password doesn't open this backup.");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new BackupError('This backup file is damaged.');
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new BackupError('This backup file is damaged.');
  const entries = Object.entries(parsed as Record<string, unknown>);
  if (!entries.every(([k, v]) => k.startsWith(RECORD_PREFIX) && typeof v === 'string')) {
    throw new BackupError('This backup file is damaged.');
  }
  // Older backups may include device-only settings; they are left out.
  const records = Object.fromEntries(entries.filter(([k]) => !DEVICE_ONLY.includes(k))) as Record<string, string>;
  return { records, createdAt: typeof file.createdAt === 'string' ? file.createdAt : '' };
}

/** Replaces this device's records with the backup's (encrypted again if the passcode lock is on). */
export async function restoreRecords(records: Record<string, string>): Promise<void> {
  const incoming = Object.entries(records).filter(([key]) => key.startsWith(RECORD_PREFIX) && !DEVICE_ONLY.includes(key));
  const keep = new Set(incoming.map(([key]) => key));
  for (const key of Object.keys(collectRecords())) if (!keep.has(key)) localStorage.removeItem(key);
  for (const [key, value] of incoming) await writeItem(key, value);
}

export const backupFileName = (date = new Date()) => `paeds-pouch-backup-${date.toISOString().slice(0, 10)}.json`;
