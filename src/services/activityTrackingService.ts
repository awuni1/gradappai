import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ActivityLog {
  id: string;
  user_id: string;
  activity_type: 'session_scheduled' | 'session_completed' | 'session_cancelled' | 'document_uploaded' | 'document_reviewed' | 'mentorship_created' | 'mentorship_ended' | 'message_sent' | 'profile_updated' | 'login' | 'logout';
  entity_type: 'session' | 'document' | 'mentorship' | 'message' | 'profile' | 'user';
  entity_id?: string;
  metadata: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface MentorAnalytics {
  mentor_id: string;
  total_mentees: number;
  active_mentorships: number;
  completed_mentorships: number;
  total_sessions: number;
  completed_sessions: number;
  session_completion_rate: number;
  average_session_rating: number;
  total_hours_mentored: number;
  documents_shared: number;
  document_downloads: number;
  response_time_hours: number;
  engagement_score: number;
  satisfaction_score: number;
  last_active: string;
  streak_days: number;
  created_at: string;
  updated_at: string;
}

export interface MenteeProgress {
  mentorship_id: string;
  mentee_id: string;
  mentor_id: string;
  progress_percentage: number;
  sessions_attended: number;
  sessions_missed: number;
  documents_reviewed: number;
  goals_completed: number;
  total_goals: number;
  average_session_rating: number;
  last_session_date: string;
  next_session_date?: string;
  engagement_level: 'low' | 'medium' | 'high';
  status: 'active' | 'at_risk' | 'successful' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface PerformanceMetrics {
  period: 'week' | 'month' | 'quarter' | 'year';
  start_date: string;
  end_date: string;
  mentor_id: string;
  sessions_conducted: number;
  sessions_cancelled: number;
  session_attendance_rate: number;
  average_session_duration: number;
  mentees_helped: number;
  documents_created: number;
  documents_downloaded: number;
  average_rating: number;
  response_time: number;
  engagement_hours: number;
  goals_achieved: number;
  completion_rate: number;
}

export interface ActivityInsight {
  type: 'trend' | 'milestone' | 'alert' | 'recommendation';
  title: string;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  action_required: boolean;
  suggested_actions?: string[];
  created_at: string;
}

export interface DashboardSummary {
  mentor_id: string;
  current_mentees: number;
  mentoring_capacity: number;
  pending_reviews: number;
  upcoming_sessions: number;
  average_rating: number;
  response_rate: number;
  weekly_hours: number;
  monthly_goals: number;
  goals_completed: number;
  recent_activities: ActivityLog[];
  performance_trend: 'improving' | 'stable' | 'declining';
  last_updated: string;
}

class ActivityTrackingService {
  /**
   * Log a new activity
   */
  async logActivity(
    userId: string,
    activityType: string,
    entityType: string,
    entityId?: string,
    metadata: Record<string, any> = {},
    ipAddress?: string,
    userAgent?: string
  ) {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .insert({
          user_id: userId,
          activity_type: activityType,
          entity_type: entityType,
          entity_id: entityId,
          metadata: metadata,
          ip_address: ipAddress,
          user_agent: userAgent
        })
        .select()
        .single();

      if (error) {throw error;}

      // Update real-time analytics
      await this.updateMentorAnalytics(userId);

      return { data, error: null };
    } catch (error) {
      console.error('Error logging activity:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to log activity' 
      };
    }
  }

  /**
   * Get mentor's activity history
   */
  async getMentorActivities(
    mentorId: string,
    options: {
      activity_type?: string;
      entity_type?: string;
      start_date?: string;
      end_date?: string;
      limit?: number;
      offset?: number;
    } = {}
  ) {
    try {
      let query = supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', mentorId);

      // Apply filters
      if (options.activity_type) {
        query = query.eq('activity_type', options.activity_type);
      }

      if (options.entity_type) {
        query = query.eq('entity_type', options.entity_type);
      }

      if (options.start_date) {
        query = query.gte('created_at', options.start_date);
      }

      if (options.end_date) {
        query = query.lte('created_at', options.end_date);
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, (options.offset + (options.limit || 10)) - 1);
      }

      // Order by created_at
      query = query.order('created_at', { ascending: false });

      const { data: activities, error } = await query;

      if (error) {throw error;}

      return { data: activities || [], error: null };
    } catch (error) {
      console.error('Error fetching mentor activities:', error);
      return { 
        data: [], 
        error: error instanceof Error ? error.message : 'Failed to fetch activities' 
      };
    }
  }

  /**
   * Get comprehensive mentor analytics
   */
  async getMentorAnalytics(mentorId: string): Promise<MentorAnalytics> {
    try {
      // Try to get existing analytics
      const { data: existingAnalytics, error: fetchError } = await supabase
        .from('mentor_analytics')
        .select('*')
        .eq('mentor_id', mentorId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching analytics:', fetchError);
      }

      // If analytics exist and are recent (less than 1 hour old), return them
      if (existingAnalytics && 
          new Date().getTime() - new Date(existingAnalytics.updated_at).getTime() < 3600000) {
        return existingAnalytics;
      }

      // Calculate fresh analytics
      const analytics = await this.calculateMentorAnalytics(mentorId);

      // Update or insert analytics
      const { data: updatedAnalytics, error: upsertError } = await supabase
        .from('mentor_analytics')
        .upsert({
          mentor_id: mentorId,
          ...analytics,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (upsertError) {throw upsertError;}

      return updatedAnalytics;
    } catch (error) {
      console.error('Error getting mentor analytics:', error);
      // Return default analytics if error
      return {
        mentor_id: mentorId,
        total_mentees: 0,
        active_mentorships: 0,
        completed_mentorships: 0,
        total_sessions: 0,
        completed_sessions: 0,
        session_completion_rate: 0,
        average_session_rating: 0,
        total_hours_mentored: 0,
        documents_shared: 0,
        document_downloads: 0,
        response_time_hours: 0,
        engagement_score: 0,
        satisfaction_score: 0,
        last_active: new Date().toISOString(),
        streak_days: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }
  }

  /**
   * Calculate mentor analytics from raw data
   */
  private async calculateMentorAnalytics(mentorId: string) {
    try {
      // Get mentorship data
      const { data: mentorships } = await supabase
        .from('mentorship_relationships')
        .select('id, status, created_at')
        .eq('mentor_id', mentorId);

      // Get session data
      const { data: sessions } = await supabase
        .from('mentor_sessions')
        .select('status, duration_minutes, rating, scheduled_start, actual_start, actual_end')
        .eq('mentor_id', mentorId);

      // Get document data
      const { data: documents } = await supabase
        .from('mentor_documents')
        .select('download_count, view_count, created_at')
        .eq('mentor_id', mentorId);

      // Get recent activity for last active
      const { data: recentActivity } = await supabase
        .from('activity_logs')
        .select('created_at')
        .eq('user_id', mentorId)
        .order('created_at', { ascending: false })
        .limit(1);

      // Calculate metrics
      const totalMentees = mentorships?.length || 0;
      const activeMentorships = mentorships?.filter(m => m.status === 'active').length || 0;
      const completedMentorships = mentorships?.filter(m => m.status === 'completed').length || 0;
      
      const totalSessions = sessions?.length || 0;
      const completedSessions = sessions?.filter(s => s.status === 'completed').length || 0;
      const sessionCompletionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;
      
      const ratingsSum = sessions?.reduce((sum, s) => sum + (s.rating || 0), 0) || 0;
      const ratedSessions = sessions?.filter(s => s.rating && s.rating > 0).length || 0;
      const averageSessionRating = ratedSessions > 0 ? ratingsSum / ratedSessions : 0;
      
      const totalMinutes = sessions?.filter(s => s.status === 'completed')
        .reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 0;
      const totalHours = totalMinutes / 60;
      
      const documentsShared = documents?.length || 0;
      const documentDownloads = documents?.reduce((sum, d) => sum + (d.download_count || 0), 0) || 0;
      
      // Calculate engagement score (0-100)
      let engagementScore = 0;
      engagementScore += Math.min(activeMentorships * 10, 30); // Max 30 points for active mentorships
      engagementScore += Math.min(sessionCompletionRate * 0.3, 30); // Max 30 points for completion rate
      engagementScore += Math.min(averageSessionRating * 8, 40); // Max 40 points for rating
      
      // Calculate satisfaction score
      const satisfactionScore = averageSessionRating > 0 ? (averageSessionRating / 5) * 100 : 0;
      
      // Calculate response time (placeholder - would need message data)
      const responseTimeHours = 2; // Default 2 hours
      
      // Calculate streak days (placeholder - would need daily activity data)
      const streakDays = 0;
      
      const lastActive = recentActivity?.[0]?.created_at || new Date().toISOString();

      return {
        total_mentees: totalMentees,
        active_mentorships: activeMentorships,
        completed_mentorships: completedMentorships,
        total_sessions: totalSessions,
        completed_sessions: completedSessions,
        session_completion_rate: sessionCompletionRate,
        average_session_rating: averageSessionRating,
        total_hours_mentored: totalHours,
        documents_shared: documentsShared,
        document_downloads: documentDownloads,
        response_time_hours: responseTimeHours,
        engagement_score: engagementScore,
        satisfaction_score: satisfactionScore,
        last_active: lastActive,
        streak_days: streakDays,
        created_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error calculating mentor analytics:', error);
      throw error;
    }
  }

  /**
   * Update mentor analytics (called after activities)
   */
  async updateMentorAnalytics(mentorId: string) {
    try {
      // Use debouncing to avoid too frequent updates
      const key = `analytics_update_${mentorId}`;
      const lastUpdate = localStorage.getItem(key);
      const now = Date.now();
      
      if (lastUpdate && (now - parseInt(lastUpdate)) < 300000) { // 5 minutes
        return;
      }
      
      localStorage.setItem(key, now.toString());
      
      // Recalculate analytics
      await this.getMentorAnalytics(mentorId);
    } catch (error) {
      console.error('Error updating mentor analytics:', error);
    }
  }

  /**
   * Get mentee progress for all mentees of a mentor
   */
  async getMenteeProgress(mentorId: string) {
    try {
      const { data: progress, error } = await supabase
        .from('mentee_progress')
        .select(`
          *,
          mentee_profile:user_profiles!mentee_id(
            display_name,
            profile_image_url,
            field_of_study
          )
        `)
        .eq('mentor_id', mentorId)
        .order('progress_percentage', { ascending: false });

      if (error) {throw error;}

      return { data: progress || [], error: null };
    } catch (error) {
      console.error('Error fetching mentee progress:', error);
      return { 
        data: [], 
        error: error instanceof Error ? error.message : 'Failed to fetch mentee progress' 
      };
    }
  }

  /**
   * Get performance metrics for a specific period
   */
  async getPerformanceMetrics(
    mentorId: string,
    period: 'week' | 'month' | 'quarter' | 'year',
    startDate?: string,
    endDate?: string
  ): Promise<PerformanceMetrics> {
    try {
      // Calculate date range if not provided
      if (!startDate || !endDate) {
        const now = new Date();
        switch (period) {
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
            endDate = now.toISOString();
            break;
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            endDate = now.toISOString();
            break;
          case 'quarter': {
            const quarter = Math.floor(now.getMonth() / 3);
            startDate = new Date(now.getFullYear(), quarter * 3, 1).toISOString();
            endDate = now.toISOString();
            break;
          }
          case 'year':
            startDate = new Date(now.getFullYear(), 0, 1).toISOString();
            endDate = now.toISOString();
            break;
        }
      }

      // Get sessions in period
      const { data: sessions } = await supabase
        .from('mentor_sessions')
        .select('status, duration_minutes, rating, scheduled_start')
        .eq('mentor_id', mentorId)
        .gte('scheduled_start', startDate)
        .lte('scheduled_start', endDate);

      // Get documents in period
      const { data: documents } = await supabase
        .from('mentor_documents')
        .select('download_count, created_at')
        .eq('mentor_id', mentorId)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      // Get mentorships in period
      const { data: mentorships } = await supabase
        .from('mentorship_relationships')
        .select('id, mentee_id')
        .eq('mentor_id', mentorId)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      // Calculate metrics
      const sessionsData = sessions || [];
      const sessionsConducted = sessionsData.filter(s => s.status === 'completed').length;
      const sessionsCancelled = sessionsData.filter(s => s.status === 'cancelled').length;
      const totalScheduled = sessionsData.length;
      const attendanceRate = totalScheduled > 0 ? ((sessionsConducted / totalScheduled) * 100) : 0;
      
      const totalDuration = sessionsData
        .filter(s => s.status === 'completed' && s.duration_minutes)
        .reduce((sum, s) => sum + s.duration_minutes, 0);
      const avgDuration = sessionsConducted > 0 ? totalDuration / sessionsConducted : 0;
      
      const ratingsSum = sessionsData.reduce((sum, s) => sum + (s.rating || 0), 0);
      const ratedSessions = sessionsData.filter(s => s.rating && s.rating > 0).length;
      const avgRating = ratedSessions > 0 ? ratingsSum / ratedSessions : 0;
      
      const menteesHelped = new Set(mentorships?.map(m => m.mentee_id) || []).size;
      const documentsCreated = documents?.length || 0;
      const documentsDownloaded = documents?.reduce((sum, d) => sum + (d.download_count || 0), 0) || 0;
      
      const engagementHours = totalDuration / 60;

      return {
        period,
        start_date: startDate,
        end_date: endDate,
        mentor_id: mentorId,
        sessions_conducted: sessionsConducted,
        sessions_cancelled: sessionsCancelled,
        session_attendance_rate: attendanceRate,
        average_session_duration: avgDuration,
        mentees_helped: menteesHelped,
        documents_created: documentsCreated,
        documents_downloaded: documentsDownloaded,
        average_rating: avgRating,
        response_time: 2, // Placeholder
        engagement_hours: engagementHours,
        goals_achieved: 0, // Placeholder
        completion_rate: attendanceRate
      };
    } catch (error) {
      console.error('Error calculating performance metrics:', error);
      return {
        period,
        start_date: startDate || '',
        end_date: endDate || '',
        mentor_id: mentorId,
        sessions_conducted: 0,
        sessions_cancelled: 0,
        session_attendance_rate: 0,
        average_session_duration: 0,
        mentees_helped: 0,
        documents_created: 0,
        documents_downloaded: 0,
        average_rating: 0,
        response_time: 0,
        engagement_hours: 0,
        goals_achieved: 0,
        completion_rate: 0
      };
    }
  }

  /**
   * Generate activity insights and recommendations
   */
  async generateInsights(mentorId: string): Promise<ActivityInsight[]> {
    try {
      const insights: ActivityInsight[] = [];
      
      // Get recent analytics
      const analytics = await this.getMentorAnalytics(mentorId);
      const weeklyMetrics = await this.getPerformanceMetrics(mentorId, 'week');
      const monthlyMetrics = await this.getPerformanceMetrics(mentorId, 'month');

      // Insight: Low session completion rate
      if (analytics.session_completion_rate < 70) {
        insights.push({
          type: 'alert',
          title: 'Low Session Completion Rate',
          description: `Your session completion rate is ${analytics.session_completion_rate.toFixed(1)}%. Consider reviewing your scheduling practices.`,
          impact: 'negative',
          action_required: true,
          suggested_actions: [
            'Send reminder notifications 24 hours before sessions',
            'Confirm availability with mentees before scheduling',
            'Review your cancellation policy'
          ],
          created_at: new Date().toISOString()
        });
      }

      // Insight: High rating trend
      if (analytics.average_session_rating >= 4.5) {
        insights.push({
          type: 'milestone',
          title: 'Excellent Session Ratings',
          description: `Your average session rating is ${analytics.average_session_rating.toFixed(1)}/5. Mentees love working with you!`,
          impact: 'positive',
          action_required: false,
          created_at: new Date().toISOString()
        });
      }

      // Insight: Capacity utilization
      const capacityUtilization = (analytics.active_mentorships / 5) * 100; // Assuming capacity of 5
      if (capacityUtilization < 50) {
        insights.push({
          type: 'recommendation',
          title: 'Mentoring Capacity Available',
          description: `You're mentoring ${analytics.active_mentorships} students with capacity for more. Consider taking on new mentees.`,
          impact: 'neutral',
          action_required: false,
          suggested_actions: [
            'Update your mentor profile visibility',
            'Reach out to prospective mentees',
            'Create more resources to attract students'
          ],
          created_at: new Date().toISOString()
        });
      }

      // Insight: Document engagement
      if (analytics.documents_shared > 0 && analytics.document_downloads / analytics.documents_shared < 2) {
        insights.push({
          type: 'recommendation',
          title: 'Improve Document Engagement',
          description: 'Your documents have low download rates. Consider improving titles and descriptions.',
          impact: 'neutral',
          action_required: false,
          suggested_actions: [
            'Add clearer document descriptions',
            'Create more practical templates',
            'Share documents directly with mentees'
          ],
          created_at: new Date().toISOString()
        });
      }

      // Insight: Weekly activity trend
      if (weeklyMetrics.sessions_conducted > monthlyMetrics.sessions_conducted / 4) {
        insights.push({
          type: 'trend',
          title: 'Increased Activity This Week',
          description: 'Your mentoring activity has increased this week compared to your monthly average.',
          impact: 'positive',
          action_required: false,
          created_at: new Date().toISOString()
        });
      }

      return insights;
    } catch (error) {
      console.error('Error generating insights:', error);
      return [];
    }
  }

  /**
   * Get dashboard summary with key metrics
   */
  async getDashboardSummary(mentorId: string): Promise<DashboardSummary> {
    try {
      // Get current data
      const analytics = await this.getMentorAnalytics(mentorId);
      const recentActivities = await this.getMentorActivities(mentorId, { limit: 10 });
      
      // Get pending reviews count
      const { data: pendingReviews } = await supabase
        .from('document_reviews')
        .select('id')
        .eq('mentor_id', mentorId)
        .eq('status', 'pending');

      // Get upcoming sessions count
      const { data: upcomingSessions } = await supabase
        .from('mentor_sessions')
        .select('id')
        .eq('mentor_id', mentorId)
        .eq('status', 'scheduled')
        .gte('scheduled_start', new Date().toISOString());

      // Calculate weekly hours
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const { data: weekSessions } = await supabase
        .from('mentor_sessions')
        .select('duration_minutes')
        .eq('mentor_id', mentorId)
        .eq('status', 'completed')
        .gte('scheduled_start', weekStart.toISOString());

      const weeklyMinutes = weekSessions?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 0;
      const weeklyHours = weeklyMinutes / 60;

      // Determine performance trend (simplified)
      const weeklyMetrics = await this.getPerformanceMetrics(mentorId, 'week');
      const monthlyMetrics = await this.getPerformanceMetrics(mentorId, 'month');
      
      let performanceTrend: 'improving' | 'stable' | 'declining' = 'stable';
      const weeklyRate = weeklyMetrics.session_attendance_rate;
      const monthlyRate = monthlyMetrics.session_attendance_rate;
      
      if (weeklyRate > monthlyRate + 10) {
        performanceTrend = 'improving';
      } else if (weeklyRate < monthlyRate - 10) {
        performanceTrend = 'declining';
      }

      return {
        mentor_id: mentorId,
        current_mentees: analytics.active_mentorships,
        mentoring_capacity: 5, // Default capacity
        pending_reviews: pendingReviews?.length || 0,
        upcoming_sessions: upcomingSessions?.length || 0,
        average_rating: analytics.average_session_rating,
        response_rate: 95, // Placeholder
        weekly_hours: weeklyHours,
        monthly_goals: 20, // Placeholder
        goals_completed: 15, // Placeholder
        recent_activities: recentActivities.data || [],
        performance_trend: performanceTrend,
        last_updated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting dashboard summary:', error);
      return {
        mentor_id: mentorId,
        current_mentees: 0,
        mentoring_capacity: 5,
        pending_reviews: 0,
        upcoming_sessions: 0,
        average_rating: 0,
        response_rate: 0,
        weekly_hours: 0,
        monthly_goals: 0,
        goals_completed: 0,
        recent_activities: [],
        performance_trend: 'stable',
        last_updated: new Date().toISOString()
      };
    }
  }

  /**
   * Track session attendance and update analytics
   */
  async trackSessionAttendance(sessionId: string, mentorId: string, attended: boolean) {
    try {
      // Log the attendance activity
      await this.logActivity(
        mentorId,
        attended ? 'session_completed' : 'session_missed',
        'session',
        sessionId,
        { attended }
      );

      // Update mentee progress if session was attended
      if (attended) {
        const { data: session } = await supabase
          .from('mentor_sessions')
          .select('mentorship_id')
          .eq('id', sessionId)
          .single();

        if (session) {
          await this.updateMenteeProgress(session.mentorship_id);
        }
      }

      return { error: null };
    } catch (error) {
      console.error('Error tracking session attendance:', error);
      return { error: error instanceof Error ? error.message : 'Failed to track attendance' };
    }
  }

  /**
   * Update mentee progress based on session completion
   */
  private async updateMenteeProgress(mentorshipId: string) {
    try {
      // Get mentorship details
      const { data: mentorship } = await supabase
        .from('mentorship_relationships')
        .select('mentee_id, mentor_id')
        .eq('id', mentorshipId)
        .single();

      if (!mentorship) {return;}

      // Calculate progress metrics
      const { data: sessions } = await supabase
        .from('mentor_sessions')
        .select('status, rating')
        .eq('mentorship_id', mentorshipId);

      const totalSessions = sessions?.length || 0;
      const attendedSessions = sessions?.filter(s => s.status === 'completed').length || 0;
      const missedSessions = totalSessions - attendedSessions;
      
      const avgRating = sessions?.length > 0 
        ? sessions.reduce((sum, s) => sum + (s.rating || 0), 0) / sessions.length 
        : 0;

      // Get document reviews
      const { data: reviews } = await supabase
        .from('document_reviews')
        .select('id')
        .eq('mentorship_id', mentorshipId)
        .eq('status', 'completed');

      // Calculate engagement level
      let engagementLevel: 'low' | 'medium' | 'high' = 'medium';
      const attendanceRate = totalSessions > 0 ? (attendedSessions / totalSessions) * 100 : 0;
      
      if (attendanceRate >= 80 && avgRating >= 4) {
        engagementLevel = 'high';
      } else if (attendanceRate < 60 || avgRating < 3) {
        engagementLevel = 'low';
      }

      // Determine status
      let status: 'active' | 'at_risk' | 'successful' | 'inactive' = 'active';
      if (engagementLevel === 'low' && missedSessions >= 3) {
        status = 'at_risk';
      } else if (attendanceRate >= 90 && avgRating >= 4.5) {
        status = 'successful';
      }

      // Update or insert progress
      await supabase
        .from('mentee_progress')
        .upsert({
          mentorship_id: mentorshipId,
          mentee_id: mentorship.mentee_id,
          mentor_id: mentorship.mentor_id,
          progress_percentage: Math.min(attendanceRate, 100),
          sessions_attended: attendedSessions,
          sessions_missed: missedSessions,
          documents_reviewed: reviews?.length || 0,
          goals_completed: 0, // Placeholder
          total_goals: 5, // Placeholder
          average_session_rating: avgRating,
          last_session_date: new Date().toISOString(),
          engagement_level: engagementLevel,
          status: status,
          updated_at: new Date().toISOString()
        });

    } catch (error) {
      console.error('Error updating mentee progress:', error);
    }
  }

  /**
   * Export analytics data
   */
  async exportAnalytics(mentorId: string, format: 'json' | 'csv' = 'json') {
    try {
      const analytics = await this.getMentorAnalytics(mentorId);
      const weeklyMetrics = await this.getPerformanceMetrics(mentorId, 'week');
      const monthlyMetrics = await this.getPerformanceMetrics(mentorId, 'month');
      const activities = await this.getMentorActivities(mentorId, { limit: 100 });
      
      const exportData = {
        analytics,
        weekly_metrics: weeklyMetrics,
        monthly_metrics: monthlyMetrics,
        recent_activities: activities.data,
        exported_at: new Date().toISOString()
      };

      if (format === 'json') {
        return { data: JSON.stringify(exportData, null, 2), error: null };
      } 
        // Convert to CSV (simplified)
        const csvData = Object.entries(analytics)
          .map(([key, value]) => `${key},${value}`)
          .join('\n');
        
        return { data: csvData, error: null };
      
    } catch (error) {
      console.error('Error exporting analytics:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to export analytics' 
      };
    }
  }
}

// Export singleton instance
export const activityTrackingService = new ActivityTrackingService();
export default activityTrackingService;