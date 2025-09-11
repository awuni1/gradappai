/**
 * Monitoring and analytics utility for mentor platform
 * Helps track errors, performance, and user interactions
 */

export interface MentorEvent {
  type: 'error' | 'performance' | 'user_action' | 'database_health';
  component: string;
  action: string;
  data?: any;
  timestamp: number;
  userId?: string;
  sessionId: string;
}

export interface MentorMetrics {
  onboardingStarted: number;
  onboardingCompleted: number;
  institutionLoadErrors: number;
  databaseHealthChecks: number;
  fallbackDataUsed: number;
}

class MentorMonitoring {
  private sessionId: string;
  private events: MentorEvent[] = [];
  private metrics: MentorMetrics = {
    onboardingStarted: 0,
    onboardingCompleted: 0,
    institutionLoadErrors: 0,
    databaseHealthChecks: 0,
    fallbackDataUsed: 0
  };

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Log an event for monitoring
   */
  logEvent(
    type: MentorEvent['type'],
    component: string,
    action: string,
    data?: any,
    userId?: string
  ): void {
    const event: MentorEvent = {
      type,
      component,
      action,
      data,
      timestamp: Date.now(),
      userId,
      sessionId: this.sessionId
    };

    this.events.push(event);

    // Update metrics
    this.updateMetrics(event);

    // Log to console for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Mentor Monitoring] ${type.toUpperCase()}: ${component}.${action}`, data);
    }

    // In production, you might want to send to an analytics service
    // Example: analytics.track(event);
  }

  private updateMetrics(event: MentorEvent): void {
    switch (event.action) {
      case 'onboarding_started':
        this.metrics.onboardingStarted++;
        break;
      case 'onboarding_completed':
        this.metrics.onboardingCompleted++;
        break;
      case 'institution_load_error':
        this.metrics.institutionLoadErrors++;
        break;
      case 'database_health_check':
        this.metrics.databaseHealthChecks++;
        break;
      case 'fallback_data_used':
        this.metrics.fallbackDataUsed++;
        break;
    }
  }

  /**
   * Log an error with context
   */
  logError(
    component: string,
    error: Error,
    context?: any,
    userId?: string
  ): void {
    this.logEvent('error', component, 'error_occurred', {
      message: error.message,
      stack: error.stack,
      context
    }, userId);
  }

  /**
   * Log performance metrics
   */
  logPerformance(
    component: string,
    operation: string,
    duration: number,
    success: boolean,
    userId?: string
  ): void {
    this.logEvent('performance', component, operation, {
      duration,
      success
    }, userId);
  }

  /**
   * Log user actions
   */
  logUserAction(
    component: string,
    action: string,
    data?: any,
    userId?: string
  ): void {
    this.logEvent('user_action', component, action, data, userId);
  }

  /**
   * Log database health status
   */
  logDatabaseHealth(
    component: string,
    healthStatus: any,
    userId?: string
  ): void {
    this.logEvent('database_health', component, 'health_check', healthStatus, userId);
  }

  /**
   * Get current metrics
   */
  getMetrics(): MentorMetrics {
    return { ...this.metrics };
  }

  /**
   * Get recent events
   */
  getRecentEvents(limit = 100): MentorEvent[] {
    return this.events.slice(-limit);
  }

  /**
   * Get events by type
   */
  getEventsByType(type: MentorEvent['type']): MentorEvent[] {
    return this.events.filter(event => event.type === type);
  }

  /**
   * Get error summary
   */
  getErrorSummary(): Record<string, number> {
    const errors = this.getEventsByType('error');
    const summary: Record<string, number> = {};

    errors.forEach(error => {
      const key = `${error.component}.${error.action}`;
      summary[key] = (summary[key] || 0) + 1;
    });

    return summary;
  }

  /**
   * Clear old events to prevent memory leaks
   */
  cleanup(maxAge: number = 24 * 60 * 60 * 1000): void { // 24 hours
    const cutoffTime = Date.now() - maxAge;
    this.events = this.events.filter(event => event.timestamp > cutoffTime);
  }

  /**
   * Export data for analysis
   */
  exportData(): {
    sessionId: string;
    metrics: MentorMetrics;
    events: MentorEvent[];
    summary: {
      totalEvents: number;
      errorCount: number;
      performanceIssues: number;
    };
  } {
    const errors = this.getEventsByType('error');
    const performanceEvents = this.getEventsByType('performance');
    const performanceIssues = performanceEvents.filter(
      event => event.data?.duration > 5000 || !event.data?.success
    );

    return {
      sessionId: this.sessionId,
      metrics: this.getMetrics(),
      events: this.events,
      summary: {
        totalEvents: this.events.length,
        errorCount: errors.length,
        performanceIssues: performanceIssues.length
      }
    };
  }
}

// Create global instance
export const mentorMonitoring = new MentorMonitoring();

// Utility functions for common monitoring tasks
export const trackMentorOnboardingStart = (userId?: string) => {
  mentorMonitoring.logUserAction('MentorOnboardingWizard', 'onboarding_started', {}, userId);
};

export const trackMentorOnboardingComplete = (userId?: string, profileData?: any) => {
  mentorMonitoring.logUserAction('MentorOnboardingWizard', 'onboarding_completed', profileData, userId);
};

export const trackInstitutionLoadError = (error: Error, userId?: string) => {
  mentorMonitoring.logError('MentorInstitutionForm', error, { action: 'institution_load_error' }, userId);
};

export const trackDatabaseHealthCheck = (healthStatus: any, userId?: string) => {
  mentorMonitoring.logDatabaseHealth('MentorInstitutionForm', healthStatus, userId);
};

export const trackFallbackDataUsed = (component: string, reason: string, userId?: string) => {
  mentorMonitoring.logUserAction(component, 'fallback_data_used', { reason }, userId);
};

// Performance tracking utilities
export const withPerformanceTracking = async <T>(
  component: string,
  operation: string,
  fn: () => Promise<T>,
  userId?: string
): Promise<T> => {
  const startTime = Date.now();
  let success = false;
  
  try {
    const result = await fn();
    success = true;
    return result;
  } catch (error) {
    mentorMonitoring.logError(component, error as Error, { operation }, userId);
    throw error;
  } finally {
    const duration = Date.now() - startTime;
    mentorMonitoring.logPerformance(component, operation, duration, success, userId);
  }
};

// Auto cleanup - run every hour
if (typeof window !== 'undefined') {
  setInterval(() => {
    mentorMonitoring.cleanup();
  }, 60 * 60 * 1000); // 1 hour
}