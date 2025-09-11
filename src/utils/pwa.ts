// PWA Utilities for GradApp
// Progressive Web App functionality

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface NavigatorWithServiceWorker extends Navigator {
  serviceWorker: ServiceWorkerContainer;
}

export class PWAManager {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private isInstalled = false;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

  constructor() {
    this.init();
  }

  private async init() {
    await this.registerServiceWorker();
    this.setupInstallPrompt();
    this.checkInstallStatus();
    this.setupPushNotifications();
  }

  // Register service worker
  async registerServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported');
      return;
    }

    try {
      const registration = await (navigator as NavigatorWithServiceWorker)
        .serviceWorker.register('/sw.js', {
          scope: '/'
        });

      this.serviceWorkerRegistration = registration;

      console.log('✅ Service Worker registered successfully');

      // Handle service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.showUpdateAvailable();
            }
          });
        }
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('Message from service worker:', event.data);
      });

    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
    }
  }

  // Setup install prompt handling
  private setupInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('📱 Install prompt available');
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      this.showInstallBanner();
    });

    // Handle successful installation
    window.addEventListener('appinstalled', () => {
      console.log('🎉 PWA installed successfully');
      this.isInstalled = true;
      this.hideInstallBanner();
      this.trackInstallation();
    });
  }

  // Check if app is already installed
  private checkInstallStatus(): void {
    // Check if running in standalone mode (installed)
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
      console.log('📱 App is running in installed mode');
    }

    // Check if running as TWA (Trusted Web Activity)
    if (document.referrer.includes('android-app://')) {
      this.isInstalled = true;
      console.log('📱 App is running as TWA');
    }
  }

  // Show install banner
  private showInstallBanner(): void {
    const existingBanner = document.getElementById('pwa-install-banner');
    if (existingBanner || this.isInstalled) {return;}

    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.className = `
      fixed bottom-4 left-4 right-4 z-50 bg-gradient-to-r from-blue-600 to-purple-600
      text-white p-4 rounded-lg shadow-lg border border-blue-500/20 backdrop-blur-sm
      transform transition-transform duration-300 ease-in-out translate-y-full
      md:left-auto md:right-4 md:max-w-sm
    `;

    banner.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="flex-shrink-0 text-2xl">📱</div>
        <div class="flex-1 min-w-0">
          <h3 class="font-semibold text-sm">Install GradApp</h3>
          <p class="text-xs opacity-90 mt-1">Get the full experience with offline access and notifications</p>
        </div>
        <div class="flex gap-2">
          <button id="pwa-install-btn" class="bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-xs font-medium transition-colors">
            Install
          </button>
          <button id="pwa-dismiss-btn" class="text-white/80 hover:text-white text-lg leading-none p-1">
            ×
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(banner);

    // Animate in
    setTimeout(() => {
      banner.style.transform = 'translateY(0)';
    }, 100);

    // Add event listeners
    const installBtn = banner.querySelector('#pwa-install-btn');
    const dismissBtn = banner.querySelector('#pwa-dismiss-btn');

    installBtn?.addEventListener('click', () => {
      this.promptInstall();
    });

    dismissBtn?.addEventListener('click', () => {
      this.hideInstallBanner();
      this.trackBannerDismissal();
    });

    // Auto-dismiss after 15 seconds
    setTimeout(() => {
      this.hideInstallBanner();
    }, 15000);
  }

  // Hide install banner
  private hideInstallBanner(): void {
    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
      banner.style.transform = 'translateY(100%)';
      setTimeout(() => {
        banner.remove();
      }, 300);
    }
  }

  // Prompt user to install
  async promptInstall(): Promise<void> {
    if (!this.deferredPrompt) {
      console.log('No install prompt available');
      return;
    }

    try {
      await this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      
      console.log(`Install prompt outcome: ${outcome}`);
      
      if (outcome === 'accepted') {
        this.trackInstallAccepted();
      } else {
        this.trackInstallDismissed();
      }
      
      this.deferredPrompt = null;
      this.hideInstallBanner();
    } catch (error) {
      console.error('Install prompt error:', error);
    }
  }

  // Setup push notifications
  private async setupPushNotifications(): Promise<void> {
    if (!('Notification' in window) || !this.serviceWorkerRegistration) {
      console.log('Push notifications not supported');
      return;
    }

    // Check current permission
    if (Notification.permission === 'granted') {
      console.log('✅ Push notifications already enabled');
      return;
    }

    if (Notification.permission !== 'denied') {
      // Don't prompt immediately - wait for user action
      console.log('📫 Push notifications available but not enabled');
    }
  }

  // Request notification permission
  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  // Subscribe to push notifications
  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.serviceWorkerRegistration) {
      console.error('Service worker not registered');
      return null;
    }

    try {
      const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          // Replace with your VAPID public key
          'YOUR_VAPID_PUBLIC_KEY'
        )
      });

      console.log('✅ Push subscription successful');
      return subscription;
    } catch (error) {
      console.error('❌ Push subscription failed:', error);
      return null;
    }
  }

  // Show update available notification
  private showUpdateAvailable(): void {
    const notification = document.createElement('div');
    notification.className = `
      fixed top-4 right-4 z-50 bg-green-600 text-white p-4 rounded-lg shadow-lg
      transform transition-transform duration-300 ease-in-out -translate-x-full
      max-w-sm
    `;

    notification.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="flex-shrink-0 text-xl">🔄</div>
        <div class="flex-1">
          <h3 class="font-semibold text-sm">Update Available</h3>
          <p class="text-xs opacity-90 mt-1">A new version of GradApp is ready</p>
        </div>
        <button id="update-btn" class="bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-xs font-medium transition-colors">
          Update
        </button>
      </div>
    `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);

    // Add click handler
    notification.querySelector('#update-btn')?.addEventListener('click', () => {
      this.updateServiceWorker();
      notification.remove();
    });

    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
      }
    }, 10000);
  }

  // Update service worker
  private updateServiceWorker(): void {
    if (!this.serviceWorkerRegistration) {return;}

    const newWorker = this.serviceWorkerRegistration.waiting;
    if (newWorker) {
      newWorker.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }

  // Utility functions
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

  // Analytics tracking
  private trackInstallation(): void {
    // Track PWA installation
    if (typeof gtag !== 'undefined') {
      gtag('event', 'pwa_installed', {
        event_category: 'PWA',
        event_label: 'App Installation'
      });
    }
  }

  private trackInstallAccepted(): void {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'pwa_install_accepted', {
        event_category: 'PWA',
        event_label: 'Install Prompt Accepted'
      });
    }
  }

  private trackInstallDismissed(): void {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'pwa_install_dismissed', {
        event_category: 'PWA',
        event_label: 'Install Prompt Dismissed'
      });
    }
  }

  private trackBannerDismissal(): void {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'pwa_banner_dismissed', {
        event_category: 'PWA',
        event_label: 'Install Banner Dismissed'
      });
    }
  }

  // Public methods
  public getInstallStatus(): boolean {
    return this.isInstalled;
  }

  public canInstall(): boolean {
    return this.deferredPrompt !== null;
  }

  public async getServiceWorkerVersion(): Promise<string> {
    if (!this.serviceWorkerRegistration) {return 'Not registered';}
    
    return new Promise((resolve) => {
      const channel = new MessageChannel();
      channel.port1.onmessage = (event) => {
        resolve(event.data.version || 'Unknown');
      };
      
      this.serviceWorkerRegistration?.active?.postMessage(
        { type: 'GET_VERSION' },
        [channel.port2]
      );
      
      // Timeout after 1 second
      setTimeout(() => resolve('Timeout'), 1000);
    });
  }
}

// Global PWA manager instance
export const pwaManager = new PWAManager();

// Utility functions for React components
export const usePWA = () => {
  return {
    isInstalled: pwaManager.getInstallStatus(),
    canInstall: pwaManager.canInstall(),
    promptInstall: () => pwaManager.promptInstall(),
    requestNotifications: () => pwaManager.requestNotificationPermission(),
    subscribeToPush: () => pwaManager.subscribeToPush()
  };
};