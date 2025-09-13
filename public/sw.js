// GradApp Service Worker - Enhanced PWA Implementation
// Version 2.0.0 - Production Ready

const CACHE_NAME = 'gradapp-v2.0.0';
const OFFLINE_URL = '/offline.html';
const NOTIFICATION_ICON = '/icons/icon-192x192.png';
const NOTIFICATION_BADGE = '/icons/badge-72x72.png';

// Assets to cache on install
const STATIC_CACHE_URLS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/favicon.svg',
  '/favicon-16x16.svg',
  '/favicon-32x32.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Core routes
  '/dashboard',
  '/auth',
  '/gradnet',
  '/university-matching-chat'
];

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Service Worker: Caching static assets...');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('✅ Service Worker: Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Service Worker: Installation failed', error);
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activation complete');
        return self.clients.claim();
      })
  );
});

// Push event - Handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push event received', event);
  
  let notificationData = {
    title: 'GradApp Notification',
    body: 'You have a new notification',
    icon: NOTIFICATION_ICON,
    badge: NOTIFICATION_BADGE,
    tag: 'gradapp-notification',
    requireInteraction: false,
    silent: false,
    renotify: true,
    data: {
      url: '/',
      type: 'general'
    },
    actions: []
  };
  
  try {
    if (event.data) {
      const pushData = event.data.json();
      console.log('Service Worker: Push data received', pushData);
      
      // Merge with default notification data
      notificationData = {
        ...notificationData,
        ...pushData,
        icon: pushData.icon || NOTIFICATION_ICON,
        badge: pushData.badge || NOTIFICATION_BADGE
      };
      
      // Add default actions based on notification type
      if (pushData.type === 'session_reminder') {
        notificationData.actions = [
          {
            action: 'join',
            title: 'Join Session',
            icon: '/icons/video.svg'
          },
          {
            action: 'dismiss',
            title: 'Dismiss'
          }
        ];
        notificationData.requireInteraction = true;
      } else if (pushData.type === 'connection_request') {
        notificationData.actions = [
          {
            action: 'view',
            title: 'View Request',
            icon: '/icons/user.svg'
          },
          {
            action: 'dismiss',
            title: 'Dismiss'
          }
        ];
      } else if (pushData.type === 'message') {
        notificationData.actions = [
          {
            action: 'reply',
            title: 'Reply',
            icon: '/icons/message.png'
          },
          {
            action: 'view',
            title: 'View',
            icon: '/icons/eye.png'
          }
        ];
      }
    }
  } catch (error) {
    console.error('Service Worker: Error parsing push data', error);
  }
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
      .then(() => {
        console.log('Service Worker: Notification displayed');
      })
      .catch((error) => {
        console.error('Service Worker: Failed to show notification', error);
      })
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event);
  
  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};
  
  notification.close();
  
  let targetUrl = data.url || '/';
  
  // Handle different actions
  switch (action) {
    case 'join':
      if (data.meetingLink) {
        targetUrl = data.meetingLink;
      } else if (data.sessionId) {
        targetUrl = `/mentor/students/session/${data.sessionId}`;
      }
      break;
      
    case 'view':
      if (data.requestId) {
        targetUrl = `/mentor/students?tab=requests&request=${data.requestId}`;
      } else if (data.studentId) {
        targetUrl = `/mentor/students/${data.studentId}`;
      } else if (data.messageId) {
        targetUrl = `/gradnet?tab=messages&message=${data.messageId}`;
      }
      break;
      
    case 'reply':
      if (data.studentId) {
        targetUrl = `/gradnet?tab=messages&student=${data.studentId}&reply=true`;
      }
      break;
      
    case 'dismiss':
      // Just close the notification, don't open anything
      return;
      
    default:
      // No action or default click - use the URL from data
      targetUrl = data.url || '/';
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window/tab open with the target URL
        for (const client of clientList) {
          if (client.url === targetUrl && 'focus' in client) {
            console.log('Service Worker: Focusing existing tab');
            return client.focus();
          }
        }
        
        // If no matching tab is found, open a new one
        if (clients.openWindow) {
          console.log('Service Worker: Opening new window', targetUrl);
          return clients.openWindow(targetUrl);
        }
      })
      .catch((error) => {
        console.error('Service Worker: Error handling notification click', error);
      })
  );
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('Service Worker: Notification closed', event);
  
  // Track notification dismissal for analytics
  const data = event.notification.data || {};
  if (data.analyticsUrl) {
    fetch(data.analyticsUrl, {
      method: 'POST',
      body: JSON.stringify({
        action: 'notification_dismissed',
        notificationId: data.id,
        type: data.type,
        timestamp: Date.now()
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    }).catch((error) => {
      console.error('Service Worker: Failed to track notification dismissal', error);
    });
  }
});

// Background sync for offline functionality
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync event', event.tag);
  
  if (event.tag === 'notification-sync') {
    event.waitUntil(
      // Sync any pending notifications when back online
      syncPendingNotifications()
    );
  }
});

// Fetch event - Handle network requests
self.addEventListener('fetch', (event) => {
  // Only handle GET requests for static assets
  if (event.request.method === 'GET') {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // Return cached version or fetch from network
          return response || fetch(event.request);
        })
        .catch((error) => {
          console.error('Service Worker: Fetch failed', error);
          // Fallback for offline scenarios
          if (event.request.destination === 'document') {
            return caches.match('/');
          }
        })
    );
  }
});

// Helper function to sync pending notifications
async function syncPendingNotifications() {
  try {
    console.log('Service Worker: Syncing pending notifications...');
    
    // Get any pending notifications from IndexedDB or localStorage
    const pendingNotifications = await getPendingNotifications();
    
    for (const notification of pendingNotifications) {
      await self.registration.showNotification(notification.title, notification.options);
    }
    
    // Clear pending notifications after successful sync
    await clearPendingNotifications();
    
    console.log('Service Worker: Notification sync completed');
  } catch (error) {
    console.error('Service Worker: Notification sync failed', error);
  }
}

// Helper function to get pending notifications (implement based on your storage choice)
async function getPendingNotifications() {
  // Implement this based on your offline storage strategy
  return [];
}

// Helper function to clear pending notifications
async function clearPendingNotifications() {
  // Implement this based on your offline storage strategy
}

// Message event - Handle messages from the main application
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});