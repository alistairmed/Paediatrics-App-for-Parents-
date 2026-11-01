import { isNativeApp } from '../config/platform';
import { PlannedReminder } from '../clinical/vaccineReminders';

/**
 * Opt-in vaccine reminders, scheduled as local notifications on the phone
 * (@capacitor/local-notifications). Nothing is sent anywhere: the phone shows
 * them at the scheduled time. Web browsers don't offer this.
 */
export const VACCINE_REMINDERS_KEY = 'pedipulse_vaccine_reminders';

export const remindersSupported = (): boolean => isNativeApp();
export const remindersEnabled = (): boolean => {
  try { return localStorage.getItem(VACCINE_REMINDERS_KEY) === 'on'; } catch { return false; }
};

const plugin = async () => (await import('@capacitor/local-notifications')).LocalNotifications;

/** Replaces this child's scheduled vaccine reminders with the given plan. */
export async function syncVaccineReminders(childId: string, plan: PlannedReminder[]): Promise<void> {
  if (!remindersSupported() || !remindersEnabled()) return;
  const LocalNotifications = await plugin();
  const { notifications } = await LocalNotifications.getPending();
  const old = notifications.filter(n => n.extra?.kind === 'vaccine' && n.extra?.childId === childId);
  if (old.length) await LocalNotifications.cancel({ notifications: old.map(n => ({ id: n.id })) });
  if (!plan.length) return;
  await LocalNotifications.schedule({
    notifications: plan.map(r => ({
      id: r.id,
      title: r.title,
      body: r.body,
      schedule: { at: r.at, allowWhileIdle: true },
      extra: { kind: 'vaccine', childId },
    })),
  });
}

/** Asks for permission and turns reminders on. Resolves false if the parent declines. */
export async function enableVaccineReminders(): Promise<boolean> {
  if (!remindersSupported()) return false;
  const LocalNotifications = await plugin();
  const status = await LocalNotifications.requestPermissions();
  if (status.display !== 'granted') return false;
  localStorage.setItem(VACCINE_REMINDERS_KEY, 'on');
  return true;
}

/** Turns reminders off and cancels every scheduled vaccine reminder. */
export async function disableVaccineReminders(): Promise<void> {
  localStorage.removeItem(VACCINE_REMINDERS_KEY);
  if (!remindersSupported()) return;
  const LocalNotifications = await plugin();
  const { notifications } = await LocalNotifications.getPending();
  const vaccine = notifications.filter(n => n.extra?.kind === 'vaccine');
  if (vaccine.length) await LocalNotifications.cancel({ notifications: vaccine.map(n => ({ id: n.id })) });
}
