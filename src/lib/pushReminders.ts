import { apiRequest } from './selfHostedApi';

let background = false;
export function hasBackgroundReminders() { return background; }

export async function restoreBackgroundReminderState(): Promise<void> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  try {
    const registration = await navigator.serviceWorker.getRegistration('/');
    background = !!(await registration?.pushManager.getSubscription());
  } catch { /* The foreground scheduler can still handle legacy settings. */ }
}

function reminderRequest(subscription: PushSubscription, time: string | null) {
  return apiRequest('/api/push/reminder', {
    method: 'POST',
    body: JSON.stringify({ ...subscription.toJSON(), time, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
  });
}

export async function configureBackgroundReminder(time: string): Promise<void> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) throw new Error('Push unavailable');
  const [{ publicKey }, registration] = await Promise.all([
    apiRequest<{ publicKey: string }>('/api/push/config'),
    navigator.serviceWorker.register('/sw.js'),
  ]);
  if (!publicKey) throw new Error('Push unavailable');
  await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: publicKey });
  await reminderRequest(subscription, time);
  background = true;
}

export async function disableBackgroundReminder(): Promise<void> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  const registration = await navigator.serviceWorker.getRegistration('/');
  const subscription = await registration?.pushManager.getSubscription();
  if (subscription) {
    await subscription.unsubscribe();
    try { await reminderRequest(subscription, null); } catch { /* Provider will expire the subscription. */ }
  }
  background = false;
}
