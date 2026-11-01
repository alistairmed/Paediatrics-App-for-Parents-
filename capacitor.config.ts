import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Native wrappers for iOS and Android. The app ID can't change once the app
 * is in a store.
 */
const config: CapacitorConfig = {
  appId: 'au.com.paedspouch.app',
  appName: 'Paeds Pouch',
  webDir: 'dist',
  // Android serves the app from https://localhost and iOS from capacitor://localhost
  // (Capacitor's defaults); api/ai.ts allows both origins.
  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
      backgroundColor: '#fff3e3',
      showSpinner: false,
    },
    StatusBar: {
      backgroundColor: '#fff3e3',
      style: 'LIGHT',
    },
    Keyboard: {
      resize: 'body',
    },
    LocalNotifications: {
      iconColor: '#c8693a',
    },
  },
};

export default config;
