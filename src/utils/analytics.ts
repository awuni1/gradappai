// Advanced Analytics and Monitoring System
// Production-ready user behavior tracking and insights

interface UserProperties {
  userId?: string;
  email?: string;
  role?: 'applicant' | 'mentor' | 'admin';
  signupDate?: string;
  lastLogin?: string;
  planType?: 'free' | 'premium' | 'enterprise';
  universityTarget?: string;
  fieldOfStudy?: string;
  profileCompletion?: number;
}

interface EventProperties {
  category: string;
  action: string;
  label?: string;
  value?: number;
  timestamp?: number;
  sessionId?: string;
  page?: string;
  component?: string;
  metadata?: Record<string, any>;
}

interface ConversionFunnel {
  stage: 'awareness' | 'interest' | 'consideration' | 'intent' | 'evaluation' | 'purchase';
  action: string;
  value?: number;
  properties?: Record<string, any>;
}

interface UserJourney {
  step: string;
  timestamp: number;
  duration?: number;
  success?: boolean;
  dropOffReason?: string;
  metadata?: Record<string, any>;
}

class AnalyticsService {
  private isInitialized = false;
  private userId?: string;
  private userProperties: UserProperties = {};
  private sessionId: string;
  private sessionStart: number;
  private eventQueue: EventProperties[] = [];
  private conversionFunnel: ConversionFunnel[] = [];
  private userJourney: UserJourney[] = [];
  private flushInterval: number | null = null;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStart = Date.now();
    this.initializeAnalytics();
  }

  // Initialize analytics
  private initializeAnalytics(): void {
    if (this.isInitialized) {return;}

    // Initialize Google Analytics
    this.initializeGoogleAnalytics();

    // Initialize Facebook Pixel (if configured)
    this.initializeFacebookPixel();

    // Set up periodic event flush
    this.flushInterval = window.setInterval(() => {
      this.flushEventQueue();
    }, 30000); // Flush every 30 seconds

    // Track page views
    this.setupPageViewTracking();

    // Track user interactions
    this.setupInteractionTracking();

    // Track performance metrics
    this.setupPerformanceTracking();

    this.isInitialized = true;
    
    // Track analytics initialization
    this.trackEvent({
      category: 'Analytics',
      action: 'Initialized',
      label: 'Service Started'
    });

    console.log('📊 Analytics service initialized');
  }

  // Initialize Google Analytics
  private initializeGoogleAnalytics(): void {
    const trackingId = process.env.VITE_GA_TRACKING_ID;
    
    if (!trackingId) {
      console.warn('Google Analytics tracking ID not configured');
      return;
    }

    try {
      // Load Google Analytics script
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`;
      document.head.appendChild(script);

      // Initialize gtag
      (window as any).dataLayer = (window as any).dataLayer || [];
      function gtag(...args: any[]) {
        (window as any).dataLayer.push(args);
      }
      (window as any).gtag = gtag;

      gtag('js', new Date());
      gtag('config', trackingId, {
        page_title: document.title,
        page_location: window.location.href,
        custom_map: {
          custom_parameter_1: 'user_role',
          custom_parameter_2: 'university_target'
        }
      });

      console.log('✅ Google Analytics initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Google Analytics:', error);
    }
  }

  // Initialize Facebook Pixel
  private initializeFacebookPixel(): void {
    const pixelId = process.env.VITE_FACEBOOK_PIXEL_ID;
    
    if (!pixelId) {return;}

    try {
      (function(f: any, b, e, v, n, t, s) {
        if (f.fbq) {return;}
        n = f.fbq = function(...args: any[]) {
          if (n.callMethod) {
            n.callMethod(...args);
          } else {
            n.queue.push(args);
          }
        };
        if (!f._fbq) {f._fbq = n;}
        n.push = n;
        n.loaded = !0;
        n.version = '2.0';
        n.queue = [];
        t = b.createElement(e);
        t.async = !0;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
      })(
        window,
        document,
        'script',
        'https://connect.facebook.net/en_US/fbevents.js'
      );

      (window as any).fbq('init', pixelId);
      (window as any).fbq('track', 'PageView');

      console.log('✅ Facebook Pixel initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Facebook Pixel:', error);
    }
  }

  // Set user properties
  setUser(userId: string, properties: UserProperties = {}): void {
    this.userId = userId;
    this.userProperties = { ...this.userProperties, userId, ...properties };

    // Update Google Analytics
    if (this.isGoogleAnalyticsAvailable()) {
      (window as any).gtag('config', process.env.VITE_GA_TRACKING_ID, {
        user_id: userId,
        custom_map: {
          user_role: properties.role,
          university_target: properties.universityTarget,
          field_of_study: properties.fieldOfStudy
        }
      });
    }

    // Track user identification
    this.trackEvent({
      category: 'User',
      action: 'Identified',
      label: properties.role,
      metadata: { userId, role: properties.role }
    });

    console.log('👤 User identified for analytics:', userId);
  }

  // Update user properties
  updateUserProperties(properties: Partial<UserProperties>): void {
    this.userProperties = { ...this.userProperties, ...properties };

    // Send updated properties to Google Analytics
    if (this.isGoogleAnalyticsAvailable()) {
      (window as any).gtag('set', 'user_properties', properties);
    }

    this.trackEvent({
      category: 'User',
      action: 'Properties Updated',
      metadata: properties
    });
  }

  // Track events
  trackEvent(event: Omit<EventProperties, 'timestamp' | 'sessionId'>): void {
    const fullEvent: EventProperties = {
      ...event,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      page: window.location.pathname,
      metadata: {
        ...event.metadata,
        userAgent: navigator.userAgent,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        referrer: document.referrer
      }
    };

    // Add to queue
    this.eventQueue.push(fullEvent);

    // Send to Google Analytics immediately
    if (this.isGoogleAnalyticsAvailable()) {
      (window as any).gtag('event', event.action, {
        event_category: event.category,
        event_label: event.label,
        value: event.value,
        custom_parameters: event.metadata
      });
    }

    // Send to Facebook Pixel
    if (this.isFacebookPixelAvailable()) {
      (window as any).fbq('trackCustom', `${event.category}_${event.action}`, {
        label: event.label,
        value: event.value,
        ...event.metadata
      });
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Event tracked:', fullEvent);
    }
  }

  // Track page views
  trackPageView(page?: string, title?: string): void {
    const currentPage = page || window.location.pathname;
    const pageTitle = title || document.title;

    this.trackEvent({
      category: 'Navigation',
      action: 'Page View',
      label: currentPage,
      metadata: { 
        title: pageTitle,
        url: window.location.href,
        referrer: document.referrer
      }
    });

    // Google Analytics page view
    if (this.isGoogleAnalyticsAvailable()) {
      (window as any).gtag('config', process.env.VITE_GA_TRACKING_ID, {
        page_path: currentPage,
        page_title: pageTitle
      });
    }

    // Facebook Pixel page view
    if (this.isFacebookPixelAvailable()) {
      (window as any).fbq('track', 'PageView');
    }
  }

  // Track conversions
  trackConversion(funnel: ConversionFunnel): void {
    this.conversionFunnel.push({
      ...funnel,
      properties: {
        ...funnel.properties,
        timestamp: Date.now(),
        sessionId: this.sessionId,
        userId: this.userId
      }
    });

    this.trackEvent({
      category: 'Conversion',
      action: funnel.stage,
      label: funnel.action,
      value: funnel.value,
      metadata: funnel.properties
    });

    // Facebook Pixel conversion tracking
    if (this.isFacebookPixelAvailable()) {
      const pixelEvent = this.mapConversionToPixelEvent(funnel.stage);
      if (pixelEvent) {
        (window as any).fbq('track', pixelEvent, {
          value: funnel.value,
          currency: 'USD',
          content_category: funnel.action
        });
      }
    }
  }

  // Track user journey
  trackUserJourney(step: Omit<UserJourney, 'timestamp'>): void {
    const journeyStep: UserJourney = {
      ...step,
      timestamp: Date.now()
    };

    this.userJourney.push(journeyStep);

    this.trackEvent({
      category: 'User Journey',
      action: step.step,
      label: step.success ? 'Success' : 'Failed',
      value: step.duration,
      metadata: {
        dropOffReason: step.dropOffReason,
        ...step.metadata
      }
    });
  }

  // Track feature usage
  trackFeatureUsage(feature: string, action: string, metadata?: Record<string, any>): void {
    this.trackEvent({
      category: 'Feature Usage',
      action: `${feature}_${action}`,
      label: feature,
      metadata: {
        feature,
        action,
        ...metadata
      }
    });
  }

  // Track errors (integration with error tracking)
  trackError(
    error: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    component?: string,
    metadata?: Record<string, any>
  ): void {
    this.trackEvent({
      category: 'Error',
      action: severity,
      label: error,
      metadata: {
        component,
        stack: metadata?.stack,
        ...metadata
      }
    });

    // Google Analytics exception tracking
    if (this.isGoogleAnalyticsAvailable()) {
      (window as any).gtag('event', 'exception', {
        description: error,
        fatal: severity === 'critical'
      });
    }
  }

  // Track performance metrics
  trackPerformance(metric: string, value: number, unit: string): void {
    this.trackEvent({
      category: 'Performance',
      action: metric,
      label: unit,
      value: Math.round(value),
      metadata: { unit }
    });

    // Google Analytics timing
    if (this.isGoogleAnalyticsAvailable()) {
      (window as any).gtag('event', 'timing_complete', {
        name: metric,
        value: Math.round(value),
        event_category: 'Performance'
      });
    }
  }

  // Track engagement
  trackEngagement(action: string, duration?: number, metadata?: Record<string, any>): void {
    this.trackEvent({
      category: 'Engagement',
      action,
      value: duration,
      metadata
    });
  }

  // Setup page view tracking
  private setupPageViewTracking(): void {
    // Initial page view
    this.trackPageView();

    // Track navigation in SPAs
    let currentPath = window.location.pathname;
    const checkNavigation = () => {
      if (window.location.pathname !== currentPath) {
        currentPath = window.location.pathname;
        this.trackPageView();
      }
    };

    // Check for navigation changes
    setInterval(checkNavigation, 1000);

    // Also listen for popstate events
    window.addEventListener('popstate', () => {
      setTimeout(checkNavigation, 100);
    });
  }

  // Setup interaction tracking
  private setupInteractionTracking(): void {
    // Click tracking
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      
      if (target.matches('button, a[href], [role="button"]')) {
        const text = target.textContent?.trim().substring(0, 50) || '';
        const href = target.getAttribute('href');
        
        this.trackEvent({
          category: 'Interaction',
          action: 'Click',
          label: text,
          metadata: {
            element: target.tagName.toLowerCase(),
            className: target.className,
            id: target.id,
            href: href,
            text: text
          }
        });
      }
    });

    // Form submission tracking
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      const formId = form.id || form.className || 'unnamed-form';
      
      this.trackEvent({
        category: 'Form',
        action: 'Submit',
        label: formId,
        metadata: {
          formId,
          method: form.method,
          action: form.action
        }
      });
    });

    // Scroll tracking
    let scrollDepth = 0;
    let maxScroll = 0;
    
    window.addEventListener('scroll', () => {
      const scrollTop = window.pageYOffset;
      const documentHeight = document.documentElement.scrollHeight;
      const windowHeight = window.innerHeight;
      const scrollPercent = Math.round((scrollTop / (documentHeight - windowHeight)) * 100);
      
      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent;
        
        // Track milestones
        if (maxScroll >= 25 && scrollDepth < 25) {
          scrollDepth = 25;
          this.trackEvent({
            category: 'Engagement',
            action: 'Scroll Depth',
            label: '25%',
            value: 25
          });
        } else if (maxScroll >= 50 && scrollDepth < 50) {
          scrollDepth = 50;
          this.trackEvent({
            category: 'Engagement',
            action: 'Scroll Depth',
            label: '50%',
            value: 50
          });
        } else if (maxScroll >= 75 && scrollDepth < 75) {
          scrollDepth = 75;
          this.trackEvent({
            category: 'Engagement',
            action: 'Scroll Depth',
            label: '75%',
            value: 75
          });
        } else if (maxScroll >= 90 && scrollDepth < 90) {
          scrollDepth = 90;
          this.trackEvent({
            category: 'Engagement',
            action: 'Scroll Depth',
            label: '90%',
            value: 90
          });
        }
      }
    });

    // Time on page tracking
    let timeOnPage = 0;
    const pageStartTime = Date.now();
    
    const trackTimeOnPage = () => {
      timeOnPage = Date.now() - pageStartTime;
      
      // Track time milestones
      const minutes = Math.floor(timeOnPage / 60000);
      if (minutes > 0 && minutes % 1 === 0) { // Every minute
        this.trackEvent({
          category: 'Engagement',
          action: 'Time on Page',
          label: `${minutes} minutes`,
          value: minutes
        });
      }
    };

    // Track time on page every 30 seconds
    setInterval(trackTimeOnPage, 30000);

    // Track when user leaves page
    window.addEventListener('beforeunload', () => {
      this.trackEvent({
        category: 'Engagement',
        action: 'Page Exit',
        value: Math.round((Date.now() - pageStartTime) / 1000),
        metadata: { 
          timeSpent: Math.round((Date.now() - pageStartTime) / 1000),
          maxScrollDepth: maxScroll
        }
      });
      
      this.flushEventQueue();
    });
  }

  // Setup performance tracking
  private setupPerformanceTracking(): void {
    // Page load performance
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        this.trackPerformance('Page Load Time', navigation.loadEventEnd - navigation.fetchStart, 'ms');
        this.trackPerformance('DOM Content Loaded', navigation.domContentLoadedEventEnd - navigation.fetchStart, 'ms');
        this.trackPerformance('First Byte', navigation.responseStart - navigation.fetchStart, 'ms');
        this.trackPerformance('DNS Lookup', navigation.domainLookupEnd - navigation.domainLookupStart, 'ms');
      }, 0);
    });

    // Core Web Vitals
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        // Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.trackPerformance('LCP', lastEntry.startTime, 'ms');
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay
        const fidObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          entries.forEach((entry) => {
            this.trackPerformance('FID', entry.processingStart - entry.startTime, 'ms');
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // Cumulative Layout Shift
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          this.trackPerformance('CLS', clsValue, 'score');
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

      } catch (error) {
        console.warn('Performance tracking setup failed:', error);
      }
    }
  }

  // Flush event queue
  private flushEventQueue(): void {
    if (this.eventQueue.length === 0) {return;}

    const eventsToSend = [...this.eventQueue];
    this.eventQueue = [];

    this.sendEventsToCustomEndpoint(eventsToSend);
  }

  // Send events to custom analytics endpoint
  private async sendEventsToCustomEndpoint(events: EventProperties[]): Promise<void> {
    const analyticsEndpoint = process.env.VITE_CUSTOM_ANALYTICS_ENDPOINT;
    
    if (!analyticsEndpoint) {return;}

    try {
      await fetch(analyticsEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': this.sessionId
        },
        body: JSON.stringify({
          events,
          user: this.userProperties,
          session: {
            id: this.sessionId,
            startTime: this.sessionStart,
            duration: Date.now() - this.sessionStart
          },
          conversionFunnel: this.conversionFunnel,
          userJourney: this.userJourney
        })
      });
    } catch (error) {
      console.error('Failed to send events to custom endpoint:', error);
      // Re-add to queue for retry
      this.eventQueue.unshift(...events);
    }
  }

  // Utility functions
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private isGoogleAnalyticsAvailable(): boolean {
    return typeof window !== 'undefined' && 'gtag' in window && Boolean(process.env.VITE_GA_TRACKING_ID);
  }

  private isFacebookPixelAvailable(): boolean {
    return typeof window !== 'undefined' && 'fbq' in window && Boolean(process.env.VITE_FACEBOOK_PIXEL_ID);
  }

  private mapConversionToPixelEvent(stage: ConversionFunnel['stage']): string | null {
    const mapping = {
      awareness: 'ViewContent',
      interest: 'AddToWishlist',
      consideration: 'InitiateCheckout',
      intent: 'AddPaymentInfo',
      evaluation: 'Purchase',
      purchase: 'Purchase'
    };
    
    return mapping[stage] || null;
  }

  // Public methods for A/B testing
  trackExperiment(experimentName: string, variant: string, metadata?: Record<string, any>): void {
    this.trackEvent({
      category: 'Experiment',
      action: experimentName,
      label: variant,
      metadata
    });

    // Set as user property
    this.updateUserProperties({
      [`experiment_${experimentName}`]: variant
    } as any);
  }

  // Public methods for cohort analysis
  trackCohort(cohortName: string, properties?: Record<string, any>): void {
    this.trackEvent({
      category: 'Cohort',
      action: 'Assignment',
      label: cohortName,
      metadata: properties
    });

    this.updateUserProperties({
      cohort: cohortName
    } as any);
  }

  // Get session metrics
  getSessionMetrics(): { 
    sessionId: string; 
    duration: number; 
    eventCount: number;
    conversionEvents: number;
    journeySteps: number;
  } {
    return {
      sessionId: this.sessionId,
      duration: Date.now() - this.sessionStart,
      eventCount: this.eventQueue.length,
      conversionEvents: this.conversionFunnel.length,
      journeySteps: this.userJourney.length
    };
  }

  // Cleanup
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    
    // Final flush
    this.flushEventQueue();
    
    this.isInitialized = false;
  }
}

// Export singleton instance
export const analytics = new AnalyticsService();

// Export utility functions for React components
export const useAnalytics = () => {
  return {
    trackEvent: analytics.trackEvent.bind(analytics),
    trackPageView: analytics.trackPageView.bind(analytics),
    trackConversion: analytics.trackConversion.bind(analytics),
    trackUserJourney: analytics.trackUserJourney.bind(analytics),
    trackFeatureUsage: analytics.trackFeatureUsage.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
    trackPerformance: analytics.trackPerformance.bind(analytics),
    trackEngagement: analytics.trackEngagement.bind(analytics),
    trackExperiment: analytics.trackExperiment.bind(analytics),
    setUser: analytics.setUser.bind(analytics),
    updateUserProperties: analytics.updateUserProperties.bind(analytics),
    getSessionMetrics: analytics.getSessionMetrics.bind(analytics)
  };
};