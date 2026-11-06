import { Capacitor } from '@capacitor/core';

/** True inside the iOS or Android app, false in a browser (including the installed PWA). */
export const isNativeApp = (): boolean => Capacitor.isNativePlatform();

/**
 * Builds an API URL. On the web, VITE_API_BASE_URL is empty and calls stay
 * same-origin (/api/ai). The native apps load from the device, so their
 * builds set VITE_API_BASE_URL to the deployed site, e.g. https://paedspouch.com.au.
 */
export function apiUrl(path: string, base: string = import.meta.env.VITE_API_BASE_URL || ''): string {
  const trimmed = base.trim().replace(/\/+$/, '');
  if (trimmed && !/^https:\/\//.test(trimmed) && !/^http:\/\/localhost(:\d+)?$/.test(trimmed)) {
    throw new Error('VITE_API_BASE_URL must be an https:// address.');
  }
  return `${trimmed}${path.startsWith('/') ? path : `/${path}`}`;
}
