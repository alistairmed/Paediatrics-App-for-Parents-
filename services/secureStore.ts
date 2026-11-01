import { isNativeApp } from '../config/platform';

/** A small key-value store for secrets: the iOS Keychain or Android Keystore in the apps. */
export interface KeyValueStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

let nativeStore: Promise<KeyValueStore> | null = null;

/**
 * Keychain (iOS) / Keystore-backed storage (Android), via
 * @aparajita/capacitor-secure-storage. Never synced to iCloud Keychain.
 * `thisDeviceOnly` items don't move to a new phone in a backup.
 */
export function nativeSecureStore(): Promise<KeyValueStore> {
  nativeStore ??= (async () => {
    const { SecureStorage, KeychainAccess } = await import('@aparajita/capacitor-secure-storage');
    await SecureStorage.setKeyPrefix('paeds-pouch_');
    await SecureStorage.setSynchronize(false);
    return {
      get: async key => {
        const value = await SecureStorage.get(key, false, false);
        return typeof value === 'string' ? value : null;
      },
      set: (key, value) => SecureStorage.set(key, value, false, false, KeychainAccess.whenUnlocked),
      remove: async key => { await SecureStorage.remove(key, false); },
    };
  })();
  return nativeStore;
}

/** Same as nativeSecureStore, but items stay on this device (not restored to a new phone). */
export async function setThisDeviceOnly(key: string, value: string): Promise<void> {
  const { SecureStorage, KeychainAccess } = await import('@aparajita/capacitor-secure-storage');
  await nativeSecureStore();
  await SecureStorage.set(key, value, false, false, KeychainAccess.whenUnlockedThisDeviceOnly);
}

/** The store the passcode lock uses: secure storage in the apps, none on the web (localStorage stays). */
export const lockStoreForPlatform = async (): Promise<KeyValueStore | undefined> =>
  isNativeApp() ? nativeSecureStore() : undefined;
