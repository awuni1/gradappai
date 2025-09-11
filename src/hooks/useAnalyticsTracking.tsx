import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { analyticsService } from '@/services/analyticsService';
import { User } from '@supabase/supabase-js';

interface UseAnalyticsTrackingProps {
  user: User | null;
  enabled?: boolean;
}

export default function useAnalyticsTracking({ user, enabled = true }: UseAnalyticsTrackingProps) {
  const location = useLocation();

  // Initialize analytics when user is available
  useEffect(() => {
    if (user && enabled) {
      analyticsService.initializeAnalytics(user.id);
      
      // Cleanup on unmount
      return () => {
        analyticsService.cleanup(user.id);
      };
    }
  }, [user, enabled]);

  // Track page views on route changes
  useEffect(() => {
    if (user && enabled) {
      const pageTitle = document.title;
      analyticsService.trackPageView(user.id, location.pathname, pageTitle);
    }
  }, [location.pathname, user, enabled]);

  // Track user interactions
  const trackInteraction = useCallback((elementType: string, elementId?: string, additionalData?: any) => {
    if (user && enabled) {
      analyticsService.trackInteraction(user.id, elementType, elementId, additionalData);
    }
  }, [user, enabled]);

  // Track application-specific events
  const trackApplicationEvent = useCallback((action: string, data?: any) => {
    if (user && enabled) {
      analyticsService.trackApplicationEvent(user.id, action, data);
    }
  }, [user, enabled]);

  // Track social interactions
  const trackSocialEvent = useCallback((action: string, data?: any) => {
    if (user && enabled) {
      analyticsService.trackSocialEvent(user.id, action, data);
    }
  }, [user, enabled]);

  // Track conversions
  const trackConversion = useCallback((conversionType: string, value?: number, metadata?: any) => {
    if (user && enabled) {
      analyticsService.trackConversion(user.id, conversionType, value, metadata);
    }
  }, [user, enabled]);

  // Create achievement
  const createAchievement = useCallback((title: string, description: string, category: string, metadata?: any) => {
    if (user && enabled) {
      return analyticsService.createAchievement(user.id, title, description, category, metadata);
    }
    return Promise.resolve({ data: null, error: 'User not available' });
  }, [user, enabled]);

  // Track feature usage
  const trackFeatureUsage = useCallback((featureName: string, action: string, metadata?: any) => {
    if (user && enabled) {
      analyticsService.trackApplicationEvent(user.id, `feature_${action}`, {
        feature_name: featureName,
        ...metadata
      });
    }
  }, [user, enabled]);

  // Track time spent on page
  const trackTimeSpent = useCallback((pagePath: string, timeSpent: number) => {
    if (user && enabled) {
      analyticsService.trackApplicationEvent(user.id, 'time_spent', {
        page_path: pagePath,
        time_spent_seconds: timeSpent
      });
    }
  }, [user, enabled]);

  // Track form interactions
  const trackFormEvent = useCallback((formName: string, event: 'start' | 'complete' | 'abandon', metadata?: any) => {
    if (user && enabled) {
      analyticsService.trackInteraction(user.id, 'form', formName, {
        form_event: event,
        ...metadata
      });
    }
  }, [user, enabled]);

  // Track search events
  const trackSearch = useCallback((query: string, resultsCount: number, context?: string) => {
    if (user && enabled) {
      analyticsService.trackApplicationEvent(user.id, 'search', {
        search_query: query,
        results_count: resultsCount,
        search_context: context
      });
    }
  }, [user, enabled]);

  // Track download events
  const trackDownload = useCallback((fileName: string, fileType: string, fileSize?: number) => {
    if (user && enabled) {
      analyticsService.trackApplicationEvent(user.id, 'download', {
        file_name: fileName,
        file_type: fileType,
        file_size: fileSize
      });
    }
  }, [user, enabled]);

  // Track error events
  const trackError = useCallback((errorType: string, errorMessage: string, context?: string) => {
    if (user && enabled) {
      analyticsService.trackApplicationEvent(user.id, 'error', {
        error_type: errorType,
        error_message: errorMessage,
        error_context: context
      });
    }
  }, [user, enabled]);

  return {
    trackInteraction,
    trackApplicationEvent,
    trackSocialEvent,
    trackConversion,
    createAchievement,
    trackFeatureUsage,
    trackTimeSpent,
    trackFormEvent,
    trackSearch,
    trackDownload,
    trackError
  };
}

// Higher-order component for automatic analytics tracking
export function withAnalyticsTracking<T extends object>(
  WrappedComponent: React.ComponentType<T>,
  componentName: string
) {
  return function AnalyticsTrackedComponent(props: T & { user?: User }) {
    const analytics = useAnalyticsTracking({ user: props.user || null });

    useEffect(() => {
      if (props.user) {
        analytics.trackFeatureUsage(componentName, 'view');
      }
    }, [props.user, analytics]);

    return <WrappedComponent {...props} analytics={analytics} />;
  };
}

// Utility hook for tracking page time
export function usePageTimeTracking(pageName: string, user: User | null) {
  const analytics = useAnalyticsTracking({ user });

  useEffect(() => {
    const startTime = Date.now();

    return () => {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      analytics.trackTimeSpent(pageName, timeSpent);
    };
  }, [pageName, analytics]);
}

// Utility hook for form tracking
export function useFormTracking(formName: string, user: User | null) {
  const analytics = useAnalyticsTracking({ user });

  const startForm = useCallback(() => {
    analytics.trackFormEvent(formName, 'start');
  }, [formName, analytics]);

  const completeForm = useCallback((metadata?: any) => {
    analytics.trackFormEvent(formName, 'complete', metadata);
  }, [formName, analytics]);

  const abandonForm = useCallback((metadata?: any) => {
    analytics.trackFormEvent(formName, 'abandon', metadata);
  }, [formName, analytics]);

  return {
    startForm,
    completeForm,
    abandonForm
  };
}