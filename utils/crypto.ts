/**
 * Passcode-based encryption for records kept in browser storage.
 * The AES-GCM key is derived from the passcode with PBKDF2 and never stored.
 */

export const PBKDF2_ITERATIONS = 600_000;
const ENCRYPTED_PREFIX = 'pp-enc:v1:';

const toBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
};

const fromBase64 = (b64: string): Uint8Array => Uint8Array.from(atob(b64), c => c.charCodeAt(0));

export const randomSalt = (): string => toBase64(crypto.getRandomValues(new Uint8Array(16)));

export async function deriveKey(passcode: string, saltB64: string, iterations = PBKDF2_ITERATIONS): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(passcode), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: fromBase64(saltB64), iterations, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export const isEncrypted = (value: string): boolean => value.startsWith(ENCRYPTED_PREFIX);

export async function encryptString(key: CryptoKey, plaintext: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plaintext)));
  return `${ENCRYPTED_PREFIX}${toBase64(iv)}:${toBase64(ciphertext)}`;
}

/** Throws if the key is wrong or the data was altered (AES-GCM authentication). */
export async function decryptString(key: CryptoKey, value: string): Promise<string> {
  const [ivB64, ctB64] = value.slice(ENCRYPTED_PREFIX.length).split(':');
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(ivB64) }, key, fromBase64(ctB64));
  return new TextDecoder().decode(plaintext);
}
