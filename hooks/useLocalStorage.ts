
import { useState, useCallback, useRef } from "react";
import { readItem, writeItem } from "../utils/vault";

/** Fired on window when a value couldn't be saved (usually because storage is full). */
export const STORAGE_ERROR_EVENT = "pedipulse:storage-error";

/**
 * A safe wrapper for localStorage with error handling and type safety.
 * A value is only shown as saved once it has actually been written, so a
 * full storage quota can't make changes silently disappear on reload.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  // Get from local storage then parse stored json or return initialValue
  const readValue = useCallback((): T => {
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      const item = readItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key “${key}”:`, error);
      return initialValue;
    }
  }, [initialValue, key]);

  const [storedValue, setStoredValue] = useState<T>(readValue);
  // Latest value, so updater functions called in quick succession build on each other.
  const latest = useRef(storedValue);

  // Persist first, then update state. If the write fails, keep the last
  // saved value and announce the failure instead of pretending it saved.
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    const valueToStore = value instanceof Function ? value(latest.current) : value;
    const reportFailure = (error: unknown) => {
      console.warn(`Error setting localStorage key “${key}”:`, error);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(STORAGE_ERROR_EVENT, { detail: { key } }));
      }
    };
    try {
      if (typeof window !== "undefined") {
        // With the passcode lock on, records are encrypted asynchronously; a
        // failed write is still reported, though the screen has already updated.
        const pending = writeItem(key, JSON.stringify(valueToStore));
        if (pending) pending.catch(reportFailure);
      }
    } catch (error) {
      reportFailure(error);
      return;
    }
    latest.current = valueToStore;
    setStoredValue(valueToStore);
  }, [key]);

  return [storedValue, setValue] as const;
}
