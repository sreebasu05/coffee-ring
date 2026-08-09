import { supabase } from '../db/supabaseClient.js';

/**
 * Converts a base64 string to a Uint8Array.
 * Needed for web push subscription.
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const NotificationService = {
  isSupported() {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  },

  async requestPermission() {
    if (!this.isSupported()) return false;
    
    let permission = Notification.permission;
    if (permission !== 'granted') {
      permission = await Notification.requestPermission();
    }
    return permission === 'granted';
  },

  async registerServiceWorker() {
    if (!this.isSupported()) return null;
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered with scope:', registration.scope);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  },

  async subscribeUser() {
    const registration = await this.registerServiceWorker();
    if (!registration) return null;

    // VAPID public key from env variables
    const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    
    if (!publicVapidKey) {
      console.warn('VITE_VAPID_PUBLIC_KEY is not set in environment variables.');
      return null;
    }

    try {
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
      });
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push service:', error);
      return null;
    }
  },

  async isSubscribed() {
    if (!this.isSupported()) return false;
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return false;
      const subscription = await registration.pushManager.getSubscription();
      return !!subscription;
    } catch (e) {
      return false;
    }
  },

  async saveSubscription(userId) {
    if (!this.isSupported()) {
      return { success: false, error: 'Push notifications are not supported by this browser.' };
    }

    let finalUserId = userId;
    if (!finalUserId && supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) finalUserId = user.id;
      } catch (e) {
        console.warn('Could not fetch supabase user:', e);
      }
    }

    if (!finalUserId) {
      return { success: false, error: 'User is not logged in.' };
    }
    
    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      return { success: false, error: 'Notification permission was denied or blocked.' };
    }

    const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!publicVapidKey) {
      return { success: false, error: 'VAPID public key missing. If you just added it to .env, restart your dev server.' };
    }

    let subscription;
    try {
      subscription = await this.subscribeUser();
    } catch (e) {
      return { success: false, error: `Subscription failed: ${e.message}` };
    }

    if (!subscription) {
      return { success: false, error: 'Could not register push subscription with your browser.' };
    }

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

    try {
      const { error } = await supabase.from('cr_push_subscriptions').upsert({
        user_id: finalUserId,
        subscription_json: subscription.toJSON(),
        timezone: timezone
      }, { onConflict: 'user_id,subscription_json' });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error saving push subscription:', error);
      return { success: false, error: `Database save error: ${error.message || error}` };
    }
  }
};
