import { supabase } from '@/integrations/supabase/client';

export interface PushNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actions?: {
    action: string;
    title: string;
    icon?: string;
  }[];
  requireInteraction?: boolean;
  silent?: boolean;
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;
  private isSupported = false;
  private vapidPublicKey = process.env.VITE_VAPID_PUBLIC_KEY || '';

  constructor() {
    this.checkSupport();
  }

  // Check if push notifications are supported
  private checkSupport(): boolean {
    this.isSupported = 
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;
    
    return this.isSupported;
  }

  // Initialize the service worker and push notifications
  async initialize(): Promise<boolean> {
    if (!this.checkSupport()) {
      console.warn('Push notifications are not supported in this browser');
      return false;
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('Service Worker registered successfully:', this.registration);

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;

      // Check if we already have a subscription
      this.subscription = await this.registration.pushManager.getSubscription();

      return true;
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      return false;
    }
  }

  // Request notification permission
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      console.warn('Notifications not supported');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

    // Request permission
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('Notification permission granted');
      
      // Initialize push subscription after permission is granted
      await this.subscribe();
    }

    return permission;
  }

  // Subscribe to push notifications
  async subscribe(): Promise<PushSubscription | null> {
    if (!this.registration || !this.vapidPublicKey) {
      console.error('Service worker not registered or VAPID key missing');
      return null;
    }

    try {
      // Convert VAPID key to Uint8Array
      const applicationServerKey = this.urlBase64ToUint8Array(this.vapidPublicKey);

      // Subscribe to push notifications
      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      });

      console.log('Push subscription created:', this.subscription);

      // Save subscription to database
      await this.saveSubscriptionToDatabase(this.subscription);

      return this.subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe(): Promise<boolean> {
    if (!this.subscription) {
      return true;
    }

    try {
      const success = await this.subscription.unsubscribe();
      
      if (success) {
        console.log('Successfully unsubscribed from push notifications');
        
        // Remove subscription from database
        await this.removeSubscriptionFromDatabase();
        
        this.subscription = null;
      }

      return success;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  // Save push subscription to Supabase
  private async saveSubscriptionToDatabase(subscription: PushSubscription): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No authenticated user found');
        return;
      }

      const subscriptionData: PushSubscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
        }
      };

      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: subscriptionData.endpoint,
          p256dh_key: subscriptionData.keys.p256dh,
          auth_key: subscriptionData.keys.auth,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      console.log('Push subscription saved to database');
    } catch (error) {
      console.error('Failed to save push subscription to database:', error);
    }
  }

  // Remove push subscription from database
  private async removeSubscriptionFromDatabase(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return;
      }

      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id);

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      console.log('Push subscription removed from database');
    } catch (error) {
      console.error('Failed to remove push subscription from database:', error);
    }
  }

  // Send a local notification (for testing)
  async sendLocalNotification(options: PushNotificationOptions): Promise<void> {
    if (Notification.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/favicon.svg',
        badge: options.badge || '/favicon.svg',
        tag: options.tag || 'gradapp-notification',
        data: options.data,
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false
      });

      // Handle notification click
      notification.onclick = (event) => {
        event.preventDefault();
        
        // Focus or open the app window
        if (options.data?.url) {
          window.focus();
          window.location.href = options.data.url;
        }
        
        notification.close();
      };

      // Auto-close after 5 seconds if not requiring interaction
      if (!options.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 5000);
      }

    } catch (error) {
      console.error('Failed to send local notification:', error);
    }
  }

  // Check current permission status
  getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }

  // Check if currently subscribed
  isSubscribed(): boolean {
    return this.subscription !== null;
  }

  // Get current subscription
  getSubscription(): PushSubscription | null {
    return this.subscription;
  }

  // Helper function to convert VAPID key
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Helper function to convert ArrayBuffer to base64
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  // Test push notification functionality
  async testPushNotification(): Promise<void> {
    await this.sendLocalNotification({
      title: 'GradApp Test Notification',
      body: 'Push notifications are working correctly!',
      icon: '/favicon.svg',
      tag: 'test-notification',
      data: {
        url: '/mentor/students',
        type: 'test'
      }
    });
  }

  // Batch notification methods for different types
  async sendSessionReminder(sessionData: any): Promise<void> {
    await this.sendLocalNotification({
      title: 'Session Reminder',
      body: `Your session "${sessionData.title}" starts in ${sessionData.timeUntil}`,
      icon: '/favicon.svg',
      tag: `session-${sessionData.id}`,
      requireInteraction: true,
      data: {
        url: sessionData.meetingLink || `/mentor/students/session/${sessionData.id}`,
        type: 'session_reminder',
        sessionId: sessionData.id
      },
      actions: [
        {
          action: 'join',
          title: 'Join Session'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    });
  }

  async sendConnectionRequest(requestData: any): Promise<void> {
    await this.sendLocalNotification({
      title: 'New Mentorship Request',
      body: `${requestData.studentName} has requested mentorship from you`,
      icon: '/favicon.svg',
      tag: `request-${requestData.id}`,
      data: {
        url: `/mentor/students?tab=requests&request=${requestData.id}`,
        type: 'connection_request',
        requestId: requestData.id
      },
      actions: [
        {
          action: 'view',
          title: 'View Request'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    });
  }

  async sendNewMessage(messageData: any): Promise<void> {
    await this.sendLocalNotification({
      title: 'New Message',
      body: `${messageData.senderName}: ${messageData.preview}`,
      icon: '/favicon.svg',
      tag: `message-${messageData.id}`,
      data: {
        url: `/gradnet?tab=messages&student=${messageData.senderId}`,
        type: 'message',
        messageId: messageData.id
      },
      actions: [
        {
          action: 'reply',
          title: 'Reply'
        },
        {
          action: 'view',
          title: 'View'
        }
      ]
    });
  }
}

// Create singleton instance
const pushNotificationService = new PushNotificationService();

export default pushNotificationService;