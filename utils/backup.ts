import { deriveKey, encryptString, decryptString, randomSalt, PBKDF2_ITERATIONS } from './crypto';
import { readItem, writeItem, LOCK_META_KEY } from './vault';

/**
 * Password-protected backup of every PediPulse record on this device.
 * The file holds only ciphertext plus the salt needed to derive the key.
 */
export const BACKUP_FORMAT = 'pedipulse-backup';
export const MIN_BACKUP_PASSWORD = 8;
const RECORD_PREFIX = 'pedipulse_';
const NOT_BACKED_UP = [LOCK_META_KEY];

interface BackupFile {
  format: typeof BACKUP_FORMAT;
  version: 1;
  createdAt: string;
  salt: string;
  iterations: number;
  data: string;
}

/** All PediPulse records, decrypted if the passcode lock is on and unlocked. */
export function collectRecords(): Record<string, string> {
  const records: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(RECORD_PREFIX) || NOT_BACKED_UP.includes(key)) continue;
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
  let file: BackupFile;
  try {
    file = JSON.parse(text);
  } catch {
    throw new BackupError("This isn't a PediPulse backup file.");
  }
  if (file?.format !== BACKUP_FORMAT || file.version !== 1 || !file.salt || !file.data) {
    throw new BackupError("This isn't a PediPulse backup file, or it was made by a newer version.");
  }
  let json: string;
  try {
    json = await decryptString(await deriveKey(password, file.salt, file.iterations), file.data);
  } catch {
    throw new BackupError("That password doesn't open this backup.");
  }
  const records = JSON.parse(json) as Record<string, string>;
  const valid = Object.entries(records).every(([k, v]) => k.startsWith(RECORD_PREFIX) && typeof v === 'string');
  if (!valid) throw new BackupError('This backup file is damaged.');
  return { records, createdAt: file.createdAt };
}

/** Replaces this device's records with the backup's (encrypted again if the passcode lock is on). */
export async function restoreRecords(records: Record<string, string>): Promise<void> {
  const existing = Object.keys(collectRecords());
  for (const key of existing) if (!(key in records)) localStorage.removeItem(key);
  for (const [key, value] of Object.entries(records)) await writeItem(key, value);
}

export const backupFileName = (date = new Date()) => `pedipulse-backup-${date.toISOString().slice(0, 10)}.json`;
