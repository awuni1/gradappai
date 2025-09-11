import { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import pushNotificationService, { PushNotificationOptions } from '@/services/pushNotificationService';
import { toast } from 'sonner';

interface UsePushNotificationsReturn {
  // State
  isSupported: boolean;
  isInitialized: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  initialize: () => Promise<boolean>;
  requestPermission: () => Promise<NotificationPermission>;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  sendTestNotification: () => Promise<void>;
  
  // Specialized notification methods
  sendSessionReminder: (sessionData: any) => Promise<void>;
  sendConnectionRequest: (requestData: any) => Promise<void>;
  sendNewMessage: (messageData: any) => Promise<void>;
}

export const usePushNotifications = (user?: User): UsePushNotificationsReturn => {
  const [isSupported, setIsSupported] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check browser support and initialize
  useEffect(() => {
    const checkSupport = () => {
      const supported = 
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window;
      
      setIsSupported(supported);
      setPermission(supported ? Notification.permission : 'denied');
      
      return supported;
    };

    if (checkSupport()) {
      // Auto-initialize if user is available and notifications are supported
      if (user) {
        initialize();
      }
    }
  }, [user]);

  // Initialize push notification service
  const initialize = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Push notifications are not supported in this browser');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const success = await pushNotificationService.initialize();
      
      if (success) {
        setIsInitialized(true);
        setIsSubscribed(pushNotificationService.isSubscribed());
        setPermission(pushNotificationService.getPermissionStatus());
        
        console.log('Push notifications initialized successfully');
      } else {
        setError('Failed to initialize push notifications');
      }
      
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize push notifications';
      setError(errorMessage);
      console.error('Push notification initialization error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      setError('Notifications not supported');
      return 'denied';
    }

    setIsLoading(true);
    setError(null);

    try {
      const newPermission = await pushNotificationService.requestPermission();
      setPermission(newPermission);
      
      if (newPermission === 'granted') {
        setIsSubscribed(pushNotificationService.isSubscribed());
        toast.success('Notifications enabled!', {
          description: 'You\'ll now receive push notifications for important updates.'
        });
      } else if (newPermission === 'denied') {
        setError('Notification permission denied');
        toast.error('Notifications blocked', {
          description: 'You can enable notifications in your browser settings.'
        });
      }
      
      return newPermission;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to request permission';
      setError(errorMessage);
      console.error('Permission request error:', err);
      return 'denied';
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isInitialized) {
      const initialized = await initialize();
      if (!initialized) {return false;}
    }

    if (permission !== 'granted') {
      const newPermission = await requestPermission();
      if (newPermission !== 'granted') {return false;}
    }

    setIsLoading(true);
    setError(null);

    try {
      const subscription = await pushNotificationService.subscribe();
      const success = subscription !== null;
      
      if (success) {
        setIsSubscribed(true);
        toast.success('Push notifications activated!', {
          description: 'You\'ll receive notifications for mentorship updates.'
        });
      } else {
        setError('Failed to subscribe to push notifications');
        toast.error('Subscription failed', {
          description: 'Unable to set up push notifications. Please try again.'
        });
      }
      
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to subscribe';
      setError(errorMessage);
      console.error('Subscription error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, permission, initialize, requestPermission]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const success = await pushNotificationService.unsubscribe();
      
      if (success) {
        setIsSubscribed(false);
        toast.success('Push notifications disabled', {
          description: 'You will no longer receive push notifications.'
        });
      } else {
        setError('Failed to unsubscribe from push notifications');
      }
      
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to unsubscribe';
      setError(errorMessage);
      console.error('Unsubscribe error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Send test notification
  const sendTestNotification = useCallback(async (): Promise<void> => {
    if (permission !== 'granted') {
      toast.error('Notifications not permitted', {
        description: 'Please enable notifications first.'
      });
      return;
    }

    try {
      await pushNotificationService.testPushNotification();
      toast.success('Test notification sent!', {
        description: 'Check if you received the test notification.'
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send test notification';
      setError(errorMessage);
      toast.error('Test failed', {
        description: errorMessage
      });
    }
  }, [permission]);

  // Send session reminder notification
  const sendSessionReminder = useCallback(async (sessionData: any): Promise<void> => {
    if (permission !== 'granted' || !isSubscribed) {
      console.warn('Cannot send session reminder: notifications not enabled');
      return;
    }

    try {
      await pushNotificationService.sendSessionReminder(sessionData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send session reminder';
      console.error('Session reminder error:', err);
      setError(errorMessage);
    }
  }, [permission, isSubscribed]);

  // Send connection request notification
  const sendConnectionRequest = useCallback(async (requestData: any): Promise<void> => {
    if (permission !== 'granted' || !isSubscribed) {
      console.warn('Cannot send connection request: notifications not enabled');
      return;
    }

    try {
      await pushNotificationService.sendConnectionRequest(requestData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send connection request';
      console.error('Connection request error:', err);
      setError(errorMessage);
    }
  }, [permission, isSubscribed]);

  // Send new message notification
  const sendNewMessage = useCallback(async (messageData: any): Promise<void> => {
    if (permission !== 'granted' || !isSubscribed) {
      console.warn('Cannot send message notification: notifications not enabled');
      return;
    }

    try {
      await pushNotificationService.sendNewMessage(messageData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message notification';
      console.error('Message notification error:', err);
      setError(errorMessage);
    }
  }, [permission, isSubscribed]);

  return {
    // State
    isSupported,
    isInitialized,
    isSubscribed,
    permission,
    isLoading,
    error,
    
    // Actions
    initialize,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification,
    
    // Specialized notification methods
    sendSessionReminder,
    sendConnectionRequest,
    sendNewMessage
  };
};

export default usePushNotifications;