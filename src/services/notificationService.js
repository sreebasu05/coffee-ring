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
    if (!userId) return false;
    
    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      console.warn('Notification permission not granted.');
      return false;
    }

    const subscription = await this.subscribeUser();
    if (!subscription) return false;

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    try {
      const { error } = await supabase.from('cr_push_subscriptions').upsert({
        user_id: userId,
        subscription_json: subscription.toJSON(),
        timezone: timezone
      }, { onConflict: 'user_id,subscription_json' });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving push subscription:', error);
      return false;
    }
  }
};
