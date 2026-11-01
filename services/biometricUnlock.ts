import { isNativeApp } from '../config/platform';
import { importRawKey } from '../utils/crypto';
import { exportKeyForBiometrics, unlockWithKey, registerSecureKey } from '../utils/vault';
import { nativeSecureStore, setThisDeviceOnly } from './secureStore';

/**
 * Optional Face ID / fingerprint unlock in the apps. When the parent turns it
 * on (with their passcode), the records' encryption key is kept in the
 * Keychain/Keystore on this device only (not in backups or on a new phone)
 * and is used only after the phone confirms their face or fingerprint.
 * Strong biometrics only on Android; the device PIN is not accepted instead.
 * The passcode always works too.
 */
const BIO_KEY = 'biometric-unlock-key';
registerSecureKey(BIO_KEY);

const plugin = async () => import('@aparajita/capacitor-biometric-auth');

export async function biometricsAvailable(): Promise<boolean> {
  if (!isNativeApp()) return false;
  try {
    const { BiometricAuth } = await plugin();
    const result = await BiometricAuth.checkBiometry();
    return result.isAvailable && result.strongBiometryIsAvailable;
  } catch {
    return false;
  }
}

export async function biometricUnlockEnabled(): Promise<boolean> {
  if (!isNativeApp()) return false;
  return (await (await nativeSecureStore()).get(BIO_KEY)) !== null;
}

async function confirmWithBiometrics(reason: string): Promise<boolean> {
  const { BiometricAuth, AndroidBiometryStrength } = await plugin();
  try {
    await BiometricAuth.authenticate({
      reason,
      cancelTitle: 'Use passcode',
      iosFallbackTitle: '',
      allowDeviceCredential: false,
      androidTitle: 'Unlock Paeds Pouch',
      androidBiometryStrength: AndroidBiometryStrength.strong,
    });
    return true;
  } catch {
    return false;
  }
}

/** Turns biometric unlock on. Needs the current passcode and a successful face or fingerprint check. */
export async function enableBiometricUnlock(passcode: string): Promise<'enabled' | 'wrong-passcode' | 'cancelled'> {
  const raw = await exportKeyForBiometrics(passcode);
  if (!raw) return 'wrong-passcode';
  if (!(await confirmWithBiometrics('Turn on Face ID or fingerprint unlock for Paeds Pouch'))) return 'cancelled';
  await setThisDeviceOnly(BIO_KEY, raw);
  return 'enabled';
}

export async function disableBiometricUnlock(): Promise<void> {
  if (!isNativeApp()) return;
  await (await nativeSecureStore()).remove(BIO_KEY);
}

/** Unlocks the records with Face ID or fingerprint. False if cancelled, failed or no longer valid. */
export async function unlockWithBiometrics(): Promise<boolean> {
  const store = await nativeSecureStore();
  const raw = await store.get(BIO_KEY);
  if (!raw) return false;
  if (!(await confirmWithBiometrics('Unlock your records'))) return false;
  const ok = await unlockWithKey(await importRawKey(raw));
  if (!ok) await store.remove(BIO_KEY); // the passcode was changed; ask for it once to turn this back on
  return ok;
}
