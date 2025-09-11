import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UserActivityEvent {
  id: string;
  user_id: string;
  event_type: string;
  event_category: 'navigation' | 'interaction' | 'application' | 'social' | 'system';
  event_data: any;
  page_url: string;
  user_agent: string;
  session_id: string;
  timestamp: string;
  created_at: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  session_start: string;
  session_end?: string;
  duration_minutes?: number;
  pages_visited: number;
  interactions_count: number;
  device_type: string;
  browser: string;
  ip_address: string;
  location?: string;
  created_at: string;
}

export interface AnalyticsMetrics {
  total_users: number;
  active_users_today: number;
  active_users_week: number;
  active_users_month: number;
  total_sessions: number;
  avg_session_duration: number;
  bounce_rate: number;
  page_views: number;
  most_visited_pages: { page: string; visits: number }[];
  user_engagement: {
    cv_uploads: number;
    university_searches: number;
    applications_created: number;
    social_posts: number;
    document_generations: number;
  };
  conversion_funnel: {
    visitors: number;
    signups: number;
    profile_completions: number;
    first_application: number;
    application_submissions: number;
  };
}

export interface UserJourneyStep {
  step_name: string;
  step_order: number;
  users_reached: number;
  users_completed: number;
  completion_rate: number;
  avg_time_spent: number;
  drop_off_rate: number;
}

export interface PersonalAnalytics {
  profile_completion: number;
  total_logins: number;
  time_spent_total: number;
  pages_visited: number;
  features_used: string[];
  achievements: {
    title: string;
    description: string;
    date_earned: string;
    category: string;
  }[];
  progress_over_time: {
    date: string;
    metric: string;
    value: number;
  }[];
  weekly_activity: {
    week: string;
    sessions: number;
    duration: number;
    interactions: number;
  }[];
}

class AnalyticsService {
  private currentSession: UserSession | null = null;
  private sessionEvents: UserActivityEvent[] = [];
  private sessionId: string = this.generateSessionId();

  /**
   * Track user event
   */
  async trackEvent(
    userId: string,
    eventType: string,
    eventCategory: UserActivityEvent['event_category'],
    eventData: any = {},
    pageUrl?: string
  ) {
    try {
      const event = {
        user_id: userId,
        event_type: eventType,
        event_category: eventCategory,
        event_data: eventData,
        page_url: pageUrl || window.location.pathname,
        user_agent: navigator.userAgent,
        session_id: this.sessionId,
        timestamp: new Date().toISOString()
      };

      // Store in memory for batch upload
      this.sessionEvents.push(event as UserActivityEvent);

      // Upload to database (in production, consider batching for performance)
      const { error } = await supabase
        .from('user_activity_events')
        .insert(event);

      if (error && error.code !== '42P01') {
        // Ignore missing table errors in development
        console.warn('Analytics tracking error:', error);
      }

      return { error: null };
    } catch (error) {
      console.warn('Failed to track event:', error);
      return { error: error instanceof Error ? error.message : 'Failed to track event' };
    }
  }

  /**
   * Start user session
   */
  async startSession(userId: string) {
    try {
      const deviceInfo = this.getDeviceInfo();
      
      const session = {
        user_id: userId,
        session_start: new Date().toISOString(),
        pages_visited: 1,
        interactions_count: 0,
        device_type: deviceInfo.deviceType,
        browser: deviceInfo.browser,
        ip_address: await this.getIPAddress(),
        location: await this.getLocation()
      };

      const { data, error } = await supabase
        .from('user_sessions')
        .insert(session)
        .select()
        .single();

      if (error && error.code !== '42P01') {
        console.warn('Session tracking error:', error);
        return { error: null }; // Don't fail silently in development
      }

      this.currentSession = data;
      this.sessionId = data?.id || this.sessionId;

      // Track session start event
      await this.trackEvent(userId, 'session_start', 'system');

      return { data, error: null };
    } catch (error) {
      console.warn('Failed to start session:', error);
      return { error: error instanceof Error ? error.message : 'Failed to start session' };
    }
  }

  /**
   * End user session
   */
  async endSession(userId: string) {
    if (!this.currentSession) {return { error: null };}

    try {
      const sessionEnd = new Date().toISOString();
      const sessionStart = new Date(this.currentSession.session_start);
      const durationMinutes = Math.round((new Date().getTime() - sessionStart.getTime()) / (1000 * 60));

      const { error } = await supabase
        .from('user_sessions')
        .update({
          session_end: sessionEnd,
          duration_minutes: durationMinutes,
          interactions_count: this.sessionEvents.length
        })
        .eq('id', this.currentSession.id);

      if (error && error.code !== '42P01') {
        console.warn('Session end tracking error:', error);
      }

      // Track session end event
      await this.trackEvent(userId, 'session_end', 'system', {
        duration_minutes: durationMinutes,
        total_events: this.sessionEvents.length
      });

      // Reset session
      this.currentSession = null;
      this.sessionEvents = [];
      this.sessionId = this.generateSessionId();

      return { error: null };
    } catch (error) {
      console.warn('Failed to end session:', error);
      return { error: error instanceof Error ? error.message : 'Failed to end session' };
    }
  }

  /**
   * Track page view
   */
  async trackPageView(userId: string, pagePath: string, pageTitle?: string) {
    return this.trackEvent(userId, 'page_view', 'navigation', {
      page_path: pagePath,
      page_title: pageTitle || document.title,
      referrer: document.referrer
    }, pagePath);
  }

  /**
   * Track user interaction
   */
  async trackInteraction(userId: string, elementType: string, elementId?: string, additionalData?: any) {
    return this.trackEvent(userId, 'user_interaction', 'interaction', {
      element_type: elementType,
      element_id: elementId,
      ...additionalData
    });
  }

  /**
   * Track application-specific events
   */
  async trackApplicationEvent(userId: string, action: string, data?: any) {
    return this.trackEvent(userId, action, 'application', data);
  }

  /**
   * Track social interactions
   */
  async trackSocialEvent(userId: string, action: string, data?: any) {
    return this.trackEvent(userId, action, 'social', data);
  }

  /**
   * Get platform analytics metrics
   */
  async getPlatformMetrics(): Promise<AnalyticsMetrics> {
    try {
      const defaultMetrics: AnalyticsMetrics = {
        total_users: 0,
        active_users_today: 0,
        active_users_week: 0,
        active_users_month: 0,
        total_sessions: 0,
        avg_session_duration: 0,
        bounce_rate: 0,
        page_views: 0,
        most_visited_pages: [],
        user_engagement: {
          cv_uploads: 0,
          university_searches: 0,
          applications_created: 0,
          social_posts: 0,
          document_generations: 0
        },
        conversion_funnel: {
          visitors: 0,
          signups: 0,
          profile_completions: 0,
          first_application: 0,
          application_submissions: 0
        }
      };

      // In a real implementation, these would be actual database queries
      // For now, return mock data with some realistic numbers
      const mockMetrics: AnalyticsMetrics = {
        total_users: 1247,
        active_users_today: 89,
        active_users_week: 423,
        active_users_month: 1054,
        total_sessions: 3521,
        avg_session_duration: 18.5,
        bounce_rate: 24.3,
        page_views: 15678,
        most_visited_pages: [
          { page: '/dashboard', visits: 3456 },
          { page: '/university-matching', visits: 2145 },
          { page: '/cv-analysis', visits: 1876 },
          { page: '/application-tracking', visits: 1654 },
          { page: '/gradnet', visits: 1234 }
        ],
        user_engagement: {
          cv_uploads: 456,
          university_searches: 2341,
          applications_created: 789,
          social_posts: 234,
          document_generations: 567
        },
        conversion_funnel: {
          visitors: 2500,
          signups: 1247,
          profile_completions: 892,
          first_application: 567,
          application_submissions: 234
        }
      };

      return mockMetrics;
    } catch (error) {
      console.error('Error fetching platform metrics:', error);
      return {
        total_users: 0,
        active_users_today: 0,
        active_users_week: 0,
        active_users_month: 0,
        total_sessions: 0,
        avg_session_duration: 0,
        bounce_rate: 0,
        page_views: 0,
        most_visited_pages: [],
        user_engagement: {
          cv_uploads: 0,
          university_searches: 0,
          applications_created: 0,
          social_posts: 0,
          document_generations: 0
        },
        conversion_funnel: {
          visitors: 0,
          signups: 0,
          profile_completions: 0,
          first_application: 0,
          application_submissions: 0
        }
      };
    }
  }

  /**
   * Get user journey analytics
   */
  async getUserJourney(): Promise<UserJourneyStep[]> {
    try {
      // Mock user journey data
      const journeySteps: UserJourneyStep[] = [
        {
          step_name: 'Landing Page Visit',
          step_order: 1,
          users_reached: 2500,
          users_completed: 1500,
          completion_rate: 60.0,
          avg_time_spent: 45,
          drop_off_rate: 40.0
        },
        {
          step_name: 'Sign Up',
          step_order: 2,
          users_reached: 1500,
          users_completed: 1247,
          completion_rate: 83.1,
          avg_time_spent: 120,
          drop_off_rate: 16.9
        },
        {
          step_name: 'Profile Setup',
          step_order: 3,
          users_reached: 1247,
          users_completed: 892,
          completion_rate: 71.5,
          avg_time_spent: 300,
          drop_off_rate: 28.5
        },
        {
          step_name: 'CV Upload',
          step_order: 4,
          users_reached: 892,
          users_completed: 567,
          completion_rate: 63.6,
          avg_time_spent: 180,
          drop_off_rate: 36.4
        },
        {
          step_name: 'University Search',
          step_order: 5,
          users_reached: 567,
          users_completed: 456,
          completion_rate: 80.4,
          avg_time_spent: 420,
          drop_off_rate: 19.6
        },
        {
          step_name: 'First Application',
          step_order: 6,
          users_reached: 456,
          users_completed: 234,
          completion_rate: 51.3,
          avg_time_spent: 900,
          drop_off_rate: 48.7
        }
      ];

      return journeySteps;
    } catch (error) {
      console.error('Error fetching user journey:', error);
      return [];
    }
  }

  /**
   * Get personal analytics for a user
   */
  async getPersonalAnalytics(userId: string): Promise<PersonalAnalytics> {
    try {
      // Mock personal analytics data
      const personalAnalytics: PersonalAnalytics = {
        profile_completion: 85,
        total_logins: 23,
        time_spent_total: 347, // minutes
        pages_visited: 156,
        features_used: [
          'CV Analysis',
          'University Matching',
          'Application Tracking',
          'GradNet Social',
          'Document Generator'
        ],
        achievements: [
          {
            title: 'Profile Complete',
            description: 'Completed your full academic profile',
            date_earned: '2024-01-15T10:30:00Z',
            category: 'profile'
          },
          {
            title: 'First CV Upload',
            description: 'Successfully uploaded and analyzed your first CV',
            date_earned: '2024-01-16T14:20:00Z',
            category: 'documents'
          },
          {
            title: 'University Explorer',
            description: 'Matched with 10+ universities',
            date_earned: '2024-01-18T09:15:00Z',
            category: 'matching'
          },
          {
            title: 'Social Butterfly',
            description: 'Made 5 connections on GradNet',
            date_earned: '2024-01-20T16:45:00Z',
            category: 'social'
          }
        ],
        progress_over_time: [
          { date: '2024-01-15', metric: 'profile_completion', value: 25 },
          { date: '2024-01-16', metric: 'profile_completion', value: 45 },
          { date: '2024-01-17', metric: 'profile_completion', value: 65 },
          { date: '2024-01-18', metric: 'profile_completion', value: 75 },
          { date: '2024-01-19', metric: 'profile_completion', value: 80 },
          { date: '2024-01-20', metric: 'profile_completion', value: 85 }
        ],
        weekly_activity: [
          { week: '2024-W01', sessions: 3, duration: 45, interactions: 12 },
          { week: '2024-W02', sessions: 5, duration: 78, interactions: 23 },
          { week: '2024-W03', sessions: 4, duration: 62, interactions: 18 },
          { week: '2024-W04', sessions: 6, duration: 89, interactions: 31 }
        ]
      };

      return personalAnalytics;
    } catch (error) {
      console.error('Error fetching personal analytics:', error);
      return {
        profile_completion: 0,
        total_logins: 0,
        time_spent_total: 0,
        pages_visited: 0,
        features_used: [],
        achievements: [],
        progress_over_time: [],
        weekly_activity: []
      };
    }
  }

  /**
   * Create achievement for user
   */
  async createAchievement(
    userId: string,
    title: string,
    description: string,
    category: string,
    metadata?: any
  ) {
    try {
      const achievement = {
        user_id: userId,
        title,
        description,
        category,
        metadata,
        earned_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('user_achievements')
        .insert(achievement)
        .select()
        .single();

      if (error && error.code !== '42P01') {
        throw error;
      }

      // Track achievement event
      await this.trackEvent(userId, 'achievement_earned', 'system', {
        achievement_title: title,
        achievement_category: category
      });

      return { data, error: null };
    } catch (error) {
      console.error('Error creating achievement:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to create achievement' 
      };
    }
  }

  /**
   * Track conversion event
   */
  async trackConversion(userId: string, conversionType: string, value?: number, metadata?: any) {
    return this.trackEvent(userId, 'conversion', 'application', {
      conversion_type: conversionType,
      value,
      metadata
    });
  }

  /**
   * Generate heatmap data for page interactions
   */
  async getHeatmapData(pageUrl: string, timeRange?: { start: string; end: string }) {
    try {
      // Mock heatmap data
      const heatmapData = {
        page_url: pageUrl,
        interactions: [
          { x: 250, y: 150, intensity: 85, element: 'cv-upload-button' },
          { x: 400, y: 300, intensity: 67, element: 'university-search' },
          { x: 600, y: 200, intensity: 45, element: 'profile-completion' },
          { x: 350, y: 450, intensity: 92, element: 'application-tracking' },
          { x: 500, y: 100, intensity: 38, element: 'navigation-menu' }
        ],
        total_views: 1234,
        avg_time_on_page: 185, // seconds
        bounce_rate: 32.5
      };

      return { data: heatmapData, error: null };
    } catch (error) {
      console.error('Error generating heatmap data:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to generate heatmap data' 
      };
    }
  }

  /**
   * Private helper methods
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private getDeviceInfo() {
    const userAgent = navigator.userAgent;
    
    let deviceType = 'desktop';
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
      deviceType = 'tablet';
    } else if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
      deviceType = 'mobile';
    }

    let browser = 'unknown';
    if (userAgent.includes('Chrome')) {browser = 'chrome';}
    else if (userAgent.includes('Firefox')) {browser = 'firefox';}
    else if (userAgent.includes('Safari')) {browser = 'safari';}
    else if (userAgent.includes('Edge')) {browser = 'edge';}

    return { deviceType, browser };
  }

  private async getIPAddress(): Promise<string> {
    try {
      // In production, you'd use a service to get the real IP
      return 'mock_ip_address';
    } catch {
      return 'unknown';
    }
  }

  private async getLocation(): Promise<string> {
    try {
      // In production, you'd use geolocation API
      return 'San Francisco, CA';
    } catch {
      return 'unknown';
    }
  }

  /**
   * Batch upload events (for performance)
   */
  async uploadBatchEvents() {
    if (this.sessionEvents.length === 0) {return;}

    try {
      const { error } = await supabase
        .from('user_activity_events')
        .insert(this.sessionEvents);

      if (!error) {
        this.sessionEvents = [];
      }

      return { error };
    } catch (error) {
      console.warn('Failed to upload batch events:', error);
      return { error: error instanceof Error ? error.message : 'Failed to upload events' };
    }
  }

  /**
   * Initialize analytics for user
   */
  async initializeAnalytics(userId: string) {
    // Start session tracking
    await this.startSession(userId);

    // Set up periodic batch uploads
    setInterval(() => {
      this.uploadBatchEvents();
    }, 30000); // Upload every 30 seconds

    // Set up session heartbeat
    setInterval(() => {
      this.trackEvent(userId, 'session_heartbeat', 'system');
    }, 60000); // Heartbeat every minute

    // Track initial page view
    await this.trackPageView(userId, window.location.pathname);
  }

  /**
   * Clean up analytics
   */
  async cleanup(userId: string) {
    await this.uploadBatchEvents();
    await this.endSession(userId);
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
export default analyticsService;