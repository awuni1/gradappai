import { performanceCache, QueryOptimizer, requestDeduplicator } from '@/utils/performanceOptimizer';
import { supabase } from '@/integrations/supabase/client';

/**
 * Specialized caching service for mentor platform operations
 */
export class MentorCacheService {
  private static instance: MentorCacheService;
  private cachePrefix = 'mentor_';

  public static getInstance(): MentorCacheService {
    if (!MentorCacheService.instance) {
      MentorCacheService.instance = new MentorCacheService();
    }
    return MentorCacheService.instance;
  }

  /**
   * Cache mentor dashboard data
   */
  async getCachedDashboardData(mentorId: string) {
    const cacheKey = `${this.cachePrefix}dashboard_${mentorId}`;
    
    return requestDeduplicator.deduplicate(cacheKey, async () => {
      const cached = performanceCache.get(cacheKey);
      if (cached) {return cached;}

      // Load dashboard data in parallel
      const [
        mentorshipsResult,
        sessionsResult,
        reviewsResult,
        analyticsResult
      ] = await Promise.allSettled([
        this.loadMentorships(mentorId),
        this.loadUpcomingSessions(mentorId),
        this.loadPendingReviews(mentorId),
        this.loadAnalytics(mentorId)
      ]);

      const dashboardData = {
        mentorships: mentorshipsResult.status === 'fulfilled' ? mentorshipsResult.value : [],
        sessions: sessionsResult.status === 'fulfilled' ? sessionsResult.value : [],
        reviews: reviewsResult.status === 'fulfilled' ? reviewsResult.value : [],
        analytics: analyticsResult.status === 'fulfilled' ? analyticsResult.value : null,
        lastUpdated: new Date().toISOString()
      };

      // Cache for 5 minutes
      performanceCache.set(cacheKey, dashboardData, 300);
      return dashboardData;
    });
  }

  /**
   * Cache mentorship relationships
   */
  private async loadMentorships(mentorId: string) {
    const cacheKey = `${this.cachePrefix}mentorships_${mentorId}`;
    
    const cached = performanceCache.get(cacheKey);
    if (cached) {return cached;}

    const { data, error } = await supabase
      .from('mentorship_relationships')
      .select(`
        *,
        mentee_profile:user_profiles!mentee_id(
          display_name,
          profile_image_url,
          field_of_study,
          academic_level
        )
      `)
      .eq('mentor_id', mentorId)
      .eq('status', 'active')
      .limit(10);

    if (error) {throw error;}

    // Cache for 10 minutes
    performanceCache.set(cacheKey, data || [], 600);
    return data || [];
  }

  /**
   * Cache upcoming sessions
   */
  private async loadUpcomingSessions(mentorId: string) {
    const cacheKey = `${this.cachePrefix}sessions_${mentorId}`;
    
    const cached = performanceCache.get(cacheKey);
    if (cached) {return cached;}

    const { data, error } = await supabase
      .from('mentor_sessions')
      .select(`
        *,
        mentorship:mentorship_relationships(
          mentee_profile:user_profiles!mentee_id(
            display_name,
            profile_image_url
          )
        )
      `)
      .eq('mentor_id', mentorId)
      .eq('status', 'scheduled')
      .gte('scheduled_start', new Date().toISOString())
      .order('scheduled_start', { ascending: true })
      .limit(5);

    if (error) {throw error;}

    // Cache for 5 minutes (sessions are time-sensitive)
    performanceCache.set(cacheKey, data || [], 300);
    return data || [];
  }

  /**
   * Cache pending reviews
   */
  private async loadPendingReviews(mentorId: string) {
    const cacheKey = `${this.cachePrefix}reviews_${mentorId}`;
    
    const cached = performanceCache.get(cacheKey);
    if (cached) {return cached;}

    const { data, error } = await supabase
      .from('document_reviews')
      .select(`
        *,
        document:mentor_documents(title, document_type),
        mentee_profile:user_profiles!mentee_id(
          display_name,
          profile_image_url
        )
      `)
      .eq('mentor_id', mentorId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {throw error;}

    // Cache for 3 minutes (reviews need quick updates)
    performanceCache.set(cacheKey, data || [], 180);
    return data || [];
  }

  /**
   * Cache analytics data
   */
  private async loadAnalytics(mentorId: string) {
    const cacheKey = `${this.cachePrefix}analytics_${mentorId}`;
    
    const cached = performanceCache.get(cacheKey);
    if (cached) {return cached;}

    // Get analytics from mentor_analytics table if it exists
    const { data, error } = await supabase
      .from('mentor_analytics')
      .select('*')
      .eq('mentor_id', mentorId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error loading analytics:', error);
      return null;
    }

    // Cache for 15 minutes (analytics don't change frequently)
    performanceCache.set(cacheKey, data, 900);
    return data;
  }

  /**
   * Cache mentor documents with filtering
   */
  async getCachedDocuments(
    mentorId: string,
    filters: {
      category?: string;
      document_type?: string;
      limit?: number;
    } = {}
  ) {
    const filterKey = JSON.stringify(filters);
    const cacheKey = `${this.cachePrefix}documents_${mentorId}_${btoa(filterKey)}`;
    
    return requestDeduplicator.deduplicate(cacheKey, async () => {
      const cached = performanceCache.get(cacheKey);
      if (cached) {return cached;}

      let query = supabase
        .from('mentor_documents')
        .select('*')
        .eq('mentor_id', mentorId);

      // Apply filters
      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.document_type) {
        query = query.eq('document_type', filters.document_type);
      }

      // Apply limit and ordering
      query = QueryOptimizer.optimizeQuery(query, {
        limit: filters.limit || 20,
        orderBy: { column: 'updated_at', ascending: false }
      });

      const { data, error } = await query;

      if (error) {throw error;}

      // Cache for 10 minutes
      performanceCache.set(cacheKey, data || [], 600);
      return data || [];
    });
  }

  /**
   * Cache session statistics
   */
  async getCachedSessionStats(mentorId: string, dateRange?: { start: string; end: string }) {
    const rangeKey = dateRange ? `${dateRange.start}_${dateRange.end}` : 'all';
    const cacheKey = `${this.cachePrefix}session_stats_${mentorId}_${rangeKey}`;
    
    return requestDeduplicator.deduplicate(cacheKey, async () => {
      const cached = performanceCache.get(cacheKey);
      if (cached) {return cached;}

      let query = supabase
        .from('mentor_sessions')
        .select('status, duration_minutes, rating, scheduled_start')
        .eq('mentor_id', mentorId);

      if (dateRange) {
        query = query
          .gte('scheduled_start', dateRange.start)
          .lte('scheduled_start', dateRange.end);
      }

      const { data, error } = await query;

      if (error) {throw error;}

      // Calculate statistics
      const stats = this.calculateSessionStats(data || []);

      // Cache for 30 minutes
      performanceCache.set(cacheKey, stats, 1800);
      return stats;
    });
  }

  /**
   * Calculate session statistics
   */
  private calculateSessionStats(sessions: any[]) {
    if (sessions.length === 0) {
      return {
        total_sessions: 0,
        completed_sessions: 0,
        cancelled_sessions: 0,
        no_show_sessions: 0,
        average_duration: 0,
        average_rating: 0,
        total_hours: 0,
        completion_rate: 0,
        satisfaction_rate: 0
      };
    }

    const stats = sessions.reduce((acc, session) => {
      acc.total_sessions++;
      
      switch (session.status) {
        case 'completed':
          acc.completed_sessions++;
          if (session.duration_minutes) {
            acc.total_duration += session.duration_minutes;
          }
          if (session.rating) {
            acc.rating_sum += session.rating;
            acc.rating_count++;
          }
          break;
        case 'cancelled':
          acc.cancelled_sessions++;
          break;
        case 'no_show':
          acc.no_show_sessions++;
          break;
      }

      return acc;
    }, {
      total_sessions: 0,
      completed_sessions: 0,
      cancelled_sessions: 0,
      no_show_sessions: 0,
      total_duration: 0,
      rating_sum: 0,
      rating_count: 0
    });

    return {
      total_sessions: stats.total_sessions,
      completed_sessions: stats.completed_sessions,
      cancelled_sessions: stats.cancelled_sessions,
      no_show_sessions: stats.no_show_sessions,
      average_duration: stats.completed_sessions > 0 ? stats.total_duration / stats.completed_sessions : 0,
      average_rating: stats.rating_count > 0 ? stats.rating_sum / stats.rating_count : 0,
      total_hours: stats.total_duration / 60,
      completion_rate: stats.total_sessions > 0 ? (stats.completed_sessions / stats.total_sessions) * 100 : 0,
      satisfaction_rate: stats.rating_count > 0 ? (stats.rating_sum / (stats.rating_count * 5)) * 100 : 0
    };
  }

  /**
   * Batch load multiple mentor resources
   */
  async batchLoadMentorData(mentorId: string) {
    const batchKey = `${this.cachePrefix}batch_${mentorId}`;
    
    return requestDeduplicator.deduplicate(batchKey, async () => {
      // Load all critical data in parallel
      const [
        dashboardData,
        documents,
        sessionStats
      ] = await Promise.allSettled([
        this.getCachedDashboardData(mentorId),
        this.getCachedDocuments(mentorId, { limit: 10 }),
        this.getCachedSessionStats(mentorId)
      ]);

      return {
        dashboard: dashboardData.status === 'fulfilled' ? dashboardData.value : null,
        documents: documents.status === 'fulfilled' ? documents.value : [],
        sessionStats: sessionStats.status === 'fulfilled' ? sessionStats.value : null,
        batchLoadedAt: new Date().toISOString()
      };
    });
  }

  /**
   * Invalidate mentor-specific cache entries
   */
  invalidateMentorCache(mentorId: string) {
    const keysToDelete = [
      `${this.cachePrefix}dashboard_${mentorId}`,
      `${this.cachePrefix}mentorships_${mentorId}`,
      `${this.cachePrefix}sessions_${mentorId}`,
      `${this.cachePrefix}reviews_${mentorId}`,
      `${this.cachePrefix}analytics_${mentorId}`,
      `${this.cachePrefix}batch_${mentorId}`
    ];

    keysToDelete.forEach(key => {
      performanceCache.delete(key);
    });

    // Also clear document cache patterns
    // Note: This is a simplified approach - in production, you'd want more sophisticated cache invalidation
    console.log(`Invalidated cache for mentor ${mentorId}`);
  }

  /**
   * Warm up cache for a mentor
   */
  async warmUpCache(mentorId: string) {
    try {
      console.log(`Warming up cache for mentor ${mentorId}`);
      
      // Preload critical data
      await Promise.allSettled([
        this.getCachedDashboardData(mentorId),
        this.getCachedDocuments(mentorId),
        this.getCachedSessionStats(mentorId)
      ]);

      console.log(`Cache warmed up for mentor ${mentorId}`);
    } catch (error) {
      console.error('Error warming up cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      ...performanceCache.getStats(),
      mentorCacheEntries: this.countMentorCacheEntries()
    };
  }

  /**
   * Count mentor-specific cache entries
   */
  private countMentorCacheEntries(): number {
    // This is a simplified implementation
    // In a real implementation, you'd have better cache key tracking
    return Object.keys(localStorage)
      .filter(key => key.startsWith(this.cachePrefix))
      .length;
  }

  /**
   * Clear all mentor cache entries
   */
  clearAllMentorCache() {
    // Clear memory cache
    performanceCache.clear();
    
    // Clear request deduplicator
    requestDeduplicator.clear();
    
    console.log('All mentor cache cleared');
  }
}

// Export singleton instance
export const mentorCacheService = MentorCacheService.getInstance();
export default mentorCacheService;