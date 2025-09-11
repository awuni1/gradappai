// Advanced Error Tracking and Analytics System
// Production-ready error handling and monitoring

interface ErrorContext {
  userId?: string;
  userEmail?: string;
  userRole?: string;
  page?: string;
  action?: string;
  component?: string;
  timestamp?: number;
  userAgent?: string;
  url?: string;
  referrer?: string;
  sessionId?: string;
  buildVersion?: string;
}

interface ErrorReport {
  id: string;
  message: string;
  stack?: string;
  type: 'javascript' | 'network' | 'api' | 'user' | 'performance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  context: ErrorContext;
  fingerprint: string;
  count: number;
  resolved: boolean;
  tags: string[];
  breadcrumbs: Breadcrumb[];
}

interface Breadcrumb {
  timestamp: number;
  type: 'navigation' | 'user' | 'api' | 'error' | 'info';
  category: string;
  message: string;
  data?: Record<string, any>;
  level: 'debug' | 'info' | 'warning' | 'error';
}

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  tags?: Record<string, string>;
}

class ErrorTrackingService {
  private isInitialized = false;
  private breadcrumbs: Breadcrumb[] = [];
  private maxBreadcrumbs = 50;
  private sessionId: string;
  private userId?: string;
  private userContext: ErrorContext = {};
  private errorBuffer: ErrorReport[] = [];
  private flushInterval: number | null = null;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeErrorTracking();
  }

  // Initialize error tracking
  private initializeErrorTracking(): void {
    if (this.isInitialized) {return;}

    // Global error handler
    window.addEventListener('error', (event) => {
      this.handleJavaScriptError(event.error || new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // Promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.handleJavaScriptError(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        { type: 'unhandledRejection' }
      );
    });

    // Network error tracking
    this.setupNetworkErrorTracking();

    // Performance monitoring
    this.setupPerformanceMonitoring();

    // User interaction tracking
    this.setupUserInteractionTracking();

    // Set up periodic error buffer flush
    this.flushInterval = window.setInterval(() => {
      this.flushErrorBuffer();
    }, 30000); // Flush every 30 seconds

    this.isInitialized = true;
    console.log('🔍 Error tracking initialized');
  }

  // Set user context
  setUserContext(context: Partial<ErrorContext>): void {
    this.userContext = { ...this.userContext, ...context };
    this.userId = context.userId;

    // Add breadcrumb for user context change
    this.addBreadcrumb({
      type: 'info',
      category: 'auth',
      message: 'User context updated',
      data: { userId: context.userId, userRole: context.userRole }
    });
  }

  // Add breadcrumb
  addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void {
    const fullBreadcrumb: Breadcrumb = {
      ...breadcrumb,
      timestamp: Date.now(),
      level: breadcrumb.level || 'info'
    };

    this.breadcrumbs.push(fullBreadcrumb);

    // Keep only recent breadcrumbs
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.maxBreadcrumbs);
    }
  }

  // Handle JavaScript errors
  private handleJavaScriptError(error: Error, additionalContext?: Record<string, any>): void {
    const errorReport: ErrorReport = {
      id: this.generateErrorId(),
      message: error.message,
      stack: error.stack,
      type: 'javascript',
      severity: this.determineSeverity(error),
      context: {
        ...this.userContext,
        ...additionalContext,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        sessionId: this.sessionId
      },
      fingerprint: this.generateFingerprint(error),
      count: 1,
      resolved: false,
      tags: this.generateTags(error),
      breadcrumbs: [...this.breadcrumbs]
    };

    this.processError(errorReport);
  }

  // Handle API errors
  handleApiError(
    error: Error, 
    endpoint: string, 
    method: string, 
    statusCode?: number,
    response?: any
  ): void {
    const errorReport: ErrorReport = {
      id: this.generateErrorId(),
      message: `API Error: ${error.message}`,
      stack: error.stack,
      type: 'api',
      severity: statusCode && statusCode >= 500 ? 'high' : 'medium',
      context: {
        ...this.userContext,
        endpoint,
        method,
        statusCode,
        response: this.sanitizeResponse(response),
        timestamp: Date.now(),
        sessionId: this.sessionId
      },
      fingerprint: this.generateApiFingerprint(endpoint, method, statusCode),
      count: 1,
      resolved: false,
      tags: ['api', method.toLowerCase(), `status-${statusCode}`],
      breadcrumbs: [...this.breadcrumbs]
    };

    this.processError(errorReport);

    // Add API error breadcrumb
    this.addBreadcrumb({
      type: 'api',
      category: 'http',
      message: `${method} ${endpoint} failed`,
      data: { statusCode, error: error.message },
      level: 'error'
    });
  }

  // Handle network errors
  handleNetworkError(error: Error, requestUrl?: string): void {
    const errorReport: ErrorReport = {
      id: this.generateErrorId(),
      message: `Network Error: ${error.message}`,
      type: 'network',
      severity: 'medium',
      context: {
        ...this.userContext,
        requestUrl,
        timestamp: Date.now(),
        sessionId: this.sessionId,
        connectionType: (navigator as any).connection?.effectiveType,
        downlink: (navigator as any).connection?.downlink
      },
      fingerprint: this.generateNetworkFingerprint(error, requestUrl),
      count: 1,
      resolved: false,
      tags: ['network', 'connectivity'],
      breadcrumbs: [...this.breadcrumbs]
    };

    this.processError(errorReport);
  }

  // Handle user errors (validation, form errors, etc.)
  handleUserError(
    message: string, 
    component: string, 
    action: string, 
    additionalData?: Record<string, any>
  ): void {
    const errorReport: ErrorReport = {
      id: this.generateErrorId(),
      message: `User Error: ${message}`,
      type: 'user',
      severity: 'low',
      context: {
        ...this.userContext,
        component,
        action,
        ...additionalData,
        timestamp: Date.now(),
        sessionId: this.sessionId
      },
      fingerprint: this.generateUserFingerprint(message, component, action),
      count: 1,
      resolved: false,
      tags: ['user-error', component, action],
      breadcrumbs: [...this.breadcrumbs]
    };

    this.processError(errorReport);
  }

  // Track performance metrics
  trackPerformance(metric: Omit<PerformanceMetric, 'timestamp'>): void {
    const performanceData: PerformanceMetric = {
      ...metric,
      timestamp: Date.now()
    };

    // Send to analytics
    this.sendToAnalytics('performance', performanceData);

    // Add performance breadcrumb
    this.addBreadcrumb({
      type: 'info',
      category: 'performance',
      message: `${metric.name}: ${metric.value}${metric.unit}`,
      data: performanceData
    });
  }

  // Process error report
  private processError(errorReport: ErrorReport): void {
    // Check if this error was already reported recently
    if (this.isDuplicateError(errorReport)) {
      return;
    }

    // Add to buffer
    this.errorBuffer.push(errorReport);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('🐛 Error tracked:', errorReport);
    }

    // Send critical errors immediately
    if (errorReport.severity === 'critical') {
      this.sendErrorImmediately(errorReport);
    }
  }

  // Check for duplicate errors
  private isDuplicateError(errorReport: ErrorReport): boolean {
    const recentErrors = this.errorBuffer.filter(
      err => Date.now() - (err.context.timestamp || 0) < 60000 // Last minute
    );

    return recentErrors.some(err => err.fingerprint === errorReport.fingerprint);
  }

  // Flush error buffer
  private flushErrorBuffer(): void {
    if (this.errorBuffer.length === 0) {return;}

    const errorsToSend = [...this.errorBuffer];
    this.errorBuffer = [];

    this.sendErrorsBatch(errorsToSend);
  }

  // Send errors batch
  private async sendErrorsBatch(errors: ErrorReport[]): Promise<void> {
    try {
      // Send to Sentry if configured
      if (this.isSentryAvailable()) {
        errors.forEach(error => this.sendToSentry(error));
      }

      // Send to custom analytics endpoint
      if (this.isAnalyticsAvailable()) {
        await this.sendToAnalytics('errors', errors);
      }

      // Store in local storage as backup
      this.storeErrorsLocally(errors);

    } catch (error) {
      console.error('Failed to send error reports:', error);
      // Re-add to buffer for retry
      this.errorBuffer.unshift(...errors);
    }
  }

  // Send critical error immediately
  private async sendErrorImmediately(errorReport: ErrorReport): Promise<void> {
    try {
      if (this.isSentryAvailable()) {
        this.sendToSentry(errorReport);
      }

      if (this.isAnalyticsAvailable()) {
        await this.sendToAnalytics('critical-error', errorReport);
      }

      // Show user notification for critical errors
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('GradApp - Critical Error', {
          body: 'A critical error occurred. Our team has been notified.',
          icon: '/icons/icon-192x192.png'
        });
      }

    } catch (error) {
      console.error('Failed to send critical error:', error);
    }
  }

  // Setup network error tracking
  private setupNetworkErrorTracking(): void {
    const originalFetch = window.fetch;
    
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = typeof input === 'string' ? input : input.toString();
      const method = init?.method || 'GET';
      
      try {
        const response = await originalFetch(input, init);
        
        // Track successful requests
        if (response.ok) {
          this.addBreadcrumb({
            type: 'api',
            category: 'http',
            message: `${method} ${url}`,
            data: { status: response.status },
            level: 'debug'
          });
        } else {
          // Track HTTP errors
          const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
          this.handleApiError(error, url, method, response.status);
        }
        
        return response;
      } catch (error) {
        // Track network failures
        this.handleNetworkError(error as Error, url);
        throw error;
      }
    };
  }

  // Setup performance monitoring
  private setupPerformanceMonitoring(): void {
    // Core Web Vitals
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        // Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.trackPerformance({
            name: 'LCP',
            value: lastEntry.startTime,
            unit: 'ms'
          });
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay
        const fidObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          entries.forEach((entry) => {
            this.trackPerformance({
              name: 'FID',
              value: entry.processingStart - entry.startTime,
              unit: 'ms'
            });
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
          this.trackPerformance({
            name: 'CLS',
            value: clsValue,
            unit: 'score'
          });
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

      } catch (error) {
        console.warn('Performance monitoring setup failed:', error);
      }
    }

    // Page load metrics
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        this.trackPerformance({
          name: 'Page Load Time',
          value: navigation.loadEventEnd - navigation.fetchStart,
          unit: 'ms'
        });

        this.trackPerformance({
          name: 'DOM Content Loaded',
          value: navigation.domContentLoadedEventEnd - navigation.fetchStart,
          unit: 'ms'
        });
      }, 0);
    });
  }

  // Setup user interaction tracking
  private setupUserInteractionTracking(): void {
    // Track page navigation
    const addNavigationBreadcrumb = () => {
      this.addBreadcrumb({
        type: 'navigation',
        category: 'navigation',
        message: `Navigated to ${window.location.pathname}`,
        data: { 
          url: window.location.href,
          referrer: document.referrer 
        }
      });
    };

    // Initial page load
    addNavigationBreadcrumb();

    // Listen for navigation changes (for SPAs)
    let currentPath = window.location.pathname;
    setInterval(() => {
      if (window.location.pathname !== currentPath) {
        currentPath = window.location.pathname;
        addNavigationBreadcrumb();
      }
    }, 1000);

    // Track clicks on important elements
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      
      if (target.matches('button, a[href], [role="button"]')) {
        this.addBreadcrumb({
          type: 'user',
          category: 'interaction',
          message: `Clicked: ${target.tagName.toLowerCase()}`,
          data: {
            text: target.textContent?.trim().substring(0, 50),
            className: target.className,
            id: target.id
          },
          level: 'debug'
        });
      }
    });
  }

  // Utility functions
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateFingerprint(error: Error): string {
    const message = error.message || '';
    const stack = error.stack || '';
    const firstStackLine = stack.split('\n')[1] || '';
    
    return btoa(`${message}:${firstStackLine}`).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
  }

  private generateApiFingerprint(endpoint: string, method: string, statusCode?: number): string {
    return btoa(`api:${method}:${endpoint}:${statusCode}`).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
  }

  private generateNetworkFingerprint(error: Error, url?: string): string {
    return btoa(`network:${error.message}:${url}`).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
  }

  private generateUserFingerprint(message: string, component: string, action: string): string {
    return btoa(`user:${component}:${action}:${message}`).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
  }

  private determineSeverity(error: Error): 'low' | 'medium' | 'high' | 'critical' {
    const message = error.message.toLowerCase();
    const stack = (error.stack || '').toLowerCase();
    
    // Critical errors
    if (
      message.includes('network error') ||
      message.includes('failed to fetch') ||
      message.includes('authentication') ||
      message.includes('unauthorized') ||
      stack.includes('supabase')
    ) {
      return 'critical';
    }
    
    // High severity errors
    if (
      message.includes('cannot read property') ||
      message.includes('is not a function') ||
      message.includes('undefined') ||
      stack.includes('react')
    ) {
      return 'high';
    }
    
    // Medium severity
    if (
      message.includes('validation') ||
      message.includes('invalid')
    ) {
      return 'medium';
    }
    
    return 'low';
  }

  private generateTags(error: Error): string[] {
    const tags = ['javascript'];
    const message = error.message.toLowerCase();
    const stack = (error.stack || '').toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {tags.push('network');}
    if (stack.includes('react')) {tags.push('react');}
    if (stack.includes('supabase')) {tags.push('supabase');}
    if (message.includes('validation')) {tags.push('validation');}
    
    return tags;
  }

  private sanitizeResponse(response: any): any {
    if (!response) {return null;}
    
    // Remove sensitive data
    const sanitized = { ...response };
    const sensitiveKeys = ['password', 'token', 'key', 'secret', 'authorization'];
    
    const removeSensitive = (obj: any) => {
      if (typeof obj !== 'object' || obj === null) {return obj;}
      
      Object.keys(obj).forEach(key => {
        if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object') {
          removeSensitive(obj[key]);
        }
      });
    };
    
    removeSensitive(sanitized);
    return sanitized;
  }

  private isSentryAvailable(): boolean {
    return typeof window !== 'undefined' && 'Sentry' in window;
  }

  private isAnalyticsAvailable(): boolean {
    return typeof window !== 'undefined' && 'gtag' in window;
  }

  private sendToSentry(errorReport: ErrorReport): void {
    if (!this.isSentryAvailable()) {return;}

    try {
      (window as any).Sentry.withScope((scope: any) => {
        scope.setTag('errorType', errorReport.type);
        scope.setTag('severity', errorReport.severity);
        scope.setLevel(errorReport.severity === 'critical' ? 'fatal' : 'error');
        scope.setContext('errorContext', errorReport.context);
        scope.setFingerprint([errorReport.fingerprint]);
        
        errorReport.tags.forEach(tag => scope.setTag(tag, true));
        errorReport.breadcrumbs.forEach(breadcrumb => {
          scope.addBreadcrumb({
            message: breadcrumb.message,
            category: breadcrumb.category,
            level: breadcrumb.level as any,
            data: breadcrumb.data,
            timestamp: breadcrumb.timestamp / 1000
          });
        });

        (window as any).Sentry.captureException(new Error(errorReport.message));
      });
    } catch (error) {
      console.error('Failed to send to Sentry:', error);
    }
  }

  private async sendToAnalytics(eventType: string, data: any): Promise<void> {
    try {
      // Google Analytics
      if (this.isAnalyticsAvailable()) {
        (window as any).gtag('event', 'exception', {
          description: eventType,
          fatal: data.severity === 'critical',
          custom_map: data
        });
      }

      // Custom analytics endpoint
      if (process.env.VITE_ANALYTICS_ENDPOINT) {
        await fetch(process.env.VITE_ANALYTICS_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventType, data, timestamp: Date.now() })
        });
      }
    } catch (error) {
      console.error('Failed to send to analytics:', error);
    }
  }

  private storeErrorsLocally(errors: ErrorReport[]): void {
    try {
      const stored = localStorage.getItem('gradapp_error_reports');
      const existingErrors = stored ? JSON.parse(stored) : [];
      const allErrors = [...existingErrors, ...errors];
      
      // Keep only recent errors (last 24 hours)
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      const recentErrors = allErrors.filter(
        error => (error.context.timestamp || 0) > oneDayAgo
      );
      
      localStorage.setItem('gradapp_error_reports', JSON.stringify(recentErrors));
    } catch (error) {
      console.warn('Failed to store errors locally:', error);
    }
  }

  // Public methods for manual error reporting
  public reportError(error: Error, context?: Partial<ErrorContext>): void {
    this.handleJavaScriptError(error, context);
  }

  public reportApiError(
    error: Error,
    endpoint: string,
    method: string,
    statusCode?: number,
    response?: any
  ): void {
    this.handleApiError(error, endpoint, method, statusCode, response);
  }

  public reportUserError(
    message: string,
    component: string,
    action: string,
    data?: Record<string, any>
  ): void {
    this.handleUserError(message, component, action, data);
  }

  // Cleanup
  public destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    
    // Flush remaining errors
    this.flushErrorBuffer();
    
    this.isInitialized = false;
  }
}

// Export singleton instance
export const errorTracker = new ErrorTrackingService();

// Export utility functions for React components
export const useErrorTracking = () => {
  return {
    reportError: errorTracker.reportError.bind(errorTracker),
    reportApiError: errorTracker.reportApiError.bind(errorTracker),
    reportUserError: errorTracker.reportUserError.bind(errorTracker),
    addBreadcrumb: errorTracker.addBreadcrumb.bind(errorTracker),
    setUserContext: errorTracker.setUserContext.bind(errorTracker),
    trackPerformance: errorTracker.trackPerformance.bind(errorTracker)
  };
};