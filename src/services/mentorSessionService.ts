import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MentorSession {
  id: string;
  mentorship_id: string;
  mentor_id: string;
  mentee_id: string;
  title: string;
  description?: string;
  session_type: 'initial_consultation' | 'document_review' | 'interview_prep' | 'general_guidance' | 'progress_check' | 'career_planning';
  scheduled_start: string;
  scheduled_end: string;
  duration_minutes: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled';
  meeting_link?: string;
  meeting_room_id?: string;
  agenda?: string;
  notes?: string;
  feedback?: string;
  rating?: number;
  recording_url?: string;
  materials?: string[];
  timezone: string;
  reminder_sent: boolean;
  follow_up_required: boolean;
  created_at: string;
  updated_at: string;
}

export interface SessionAvailability {
  date: string;
  time_slots: {
    start: string;
    end: string;
    available: boolean;
    reason?: string;
  }[];
}

export interface SessionStats {
  total_sessions: number;
  completed_sessions: number;
  cancelled_sessions: number;
  no_show_sessions: number;
  average_duration: number;
  average_rating: number;
  total_hours: number;
  completion_rate: number;
  satisfaction_rate: number;
}

export interface CreateSessionRequest {
  mentorship_id: string;
  title: string;
  description?: string;
  session_type: string;
  scheduled_start: string;
  duration_minutes: number;
  agenda?: string;
  timezone: string;
}

export interface UpdateSessionRequest {
  title?: string;
  description?: string;
  scheduled_start?: string;
  duration_minutes?: number;
  agenda?: string;
  notes?: string;
  status?: string;
}

class MentorSessionService {
  /**
   * Create a new mentoring session
   */
  async createSession(mentorId: string, sessionData: CreateSessionRequest) {
    try {
      // Validate mentorship relationship
      const { data: mentorship, error: mentorshipError } = await supabase
        .from('mentorship_relationships')
        .select('id, mentee_id, status')
        .eq('id', sessionData.mentorship_id)
        .eq('mentor_id', mentorId)
        .single();

      if (mentorshipError || !mentorship) {
        throw new Error('Invalid mentorship relationship');
      }

      if (mentorship.status !== 'active') {
        throw new Error('Cannot schedule sessions for inactive mentorships');
      }

      // Check for scheduling conflicts
      const hasConflict = await this.checkSchedulingConflict(
        mentorId,
        sessionData.scheduled_start,
        sessionData.duration_minutes
      );

      if (hasConflict) {
        throw new Error('Schedule conflict detected. Please choose a different time.');
      }

      // Calculate scheduled_end
      const scheduled_end = new Date(
        new Date(sessionData.scheduled_start).getTime() + 
        sessionData.duration_minutes * 60 * 1000
      ).toISOString();

      // Create meeting room (Daily.co integration would go here)
      const meeting_room_id = `mentor-session-${Date.now()}`;
      const meeting_link = `https://gradapp.daily.co/${meeting_room_id}`;

      // Insert session
      const { data: session, error } = await supabase
        .from('mentor_sessions')
        .insert({
          mentorship_id: sessionData.mentorship_id,
          mentor_id: mentorId,
          mentee_id: mentorship.mentee_id,
          title: sessionData.title,
          description: sessionData.description,
          session_type: sessionData.session_type,
          scheduled_start: sessionData.scheduled_start,
          scheduled_end: scheduled_end,
          duration_minutes: sessionData.duration_minutes,
          status: 'scheduled',
          meeting_link: meeting_link,
          meeting_room_id: meeting_room_id,
          agenda: sessionData.agenda,
          timezone: sessionData.timezone,
          reminder_sent: false,
          follow_up_required: false
        })
        .select()
        .single();

      if (error) {throw error;}

      // Send notifications (would integrate with notification service)
      await this.sendSessionNotification(session.id, 'session_scheduled');

      // Schedule reminder (would integrate with reminder service)
      await this.scheduleSessionReminder(session.id);

      return { data: session, error: null };
    } catch (error) {
      console.error('Error creating session:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to create session' 
      };
    }
  }

  /**
   * Update an existing session
   */
  async updateSession(sessionId: string, mentorId: string, updates: UpdateSessionRequest) {
    try {
      // Verify mentor owns this session
      const { data: existingSession, error: fetchError } = await supabase
        .from('mentor_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('mentor_id', mentorId)
        .single();

      if (fetchError || !existingSession) {
        throw new Error('Session not found or access denied');
      }

      // If rescheduling, check for conflicts
      if (updates.scheduled_start && updates.scheduled_start !== existingSession.scheduled_start) {
        const hasConflict = await this.checkSchedulingConflict(
          mentorId,
          updates.scheduled_start,
          updates.duration_minutes || existingSession.duration_minutes,
          sessionId
        );

        if (hasConflict) {
          throw new Error('Schedule conflict detected. Please choose a different time.');
        }

        // Calculate new end time if start time changed
        if (updates.scheduled_start) {
          const duration = updates.duration_minutes || existingSession.duration_minutes;
          updates.scheduled_end = new Date(
            new Date(updates.scheduled_start).getTime() + duration * 60 * 1000
          ).toISOString();
        }
      }

      // Update session
      const { data: session, error } = await supabase
        .from('mentor_sessions')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) {throw error;}

      // Send update notifications if rescheduled
      if (updates.scheduled_start) {
        await this.sendSessionNotification(sessionId, 'session_rescheduled');
      }

      return { data: session, error: null };
    } catch (error) {
      console.error('Error updating session:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to update session' 
      };
    }
  }

  /**
   * Cancel a session
   */
  async cancelSession(sessionId: string, mentorId: string, reason?: string) {
    try {
      const { data: session, error } = await supabase
        .from('mentor_sessions')
        .update({
          status: 'cancelled',
          notes: reason ? `Cancelled: ${reason}` : 'Cancelled by mentor',
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .eq('mentor_id', mentorId)
        .select()
        .single();

      if (error) {throw error;}

      // Send cancellation notification
      await this.sendSessionNotification(sessionId, 'session_cancelled');

      return { data: session, error: null };
    } catch (error) {
      console.error('Error cancelling session:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to cancel session' 
      };
    }
  }

  /**
   * Start a session (mark as in progress)
   */
  async startSession(sessionId: string, mentorId: string) {
    try {
      const { data: session, error } = await supabase
        .from('mentor_sessions')
        .update({
          status: 'in_progress',
          actual_start: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .eq('mentor_id', mentorId)
        .select()
        .single();

      if (error) {throw error;}

      return { data: session, error: null };
    } catch (error) {
      console.error('Error starting session:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to start session' 
      };
    }
  }

  /**
   * Complete a session with feedback
   */
  async completeSession(
    sessionId: string, 
    mentorId: string, 
    notes?: string, 
    feedback?: string,
    rating?: number,
    followUpRequired = false
  ) {
    try {
      const { data: session, error } = await supabase
        .from('mentor_sessions')
        .update({
          status: 'completed',
          actual_end: new Date().toISOString(),
          notes: notes,
          feedback: feedback,
          rating: rating,
          follow_up_required: followUpRequired,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .eq('mentor_id', mentorId)
        .select()
        .single();

      if (error) {throw error;}

      // Update mentorship progress
      await this.updateMentorshipProgress(session.mentorship_id);

      // Create activity log entry
      await this.logSessionActivity(sessionId, 'session_completed');

      return { data: session, error: null };
    } catch (error) {
      console.error('Error completing session:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to complete session' 
      };
    }
  }

  /**
   * Get mentor's sessions with filtering and pagination
   */
  async getMentorSessions(
    mentorId: string,
    options: {
      status?: string;
      startDate?: string;
      endDate?: string;
      menteeId?: string;
      limit?: number;
      offset?: number;
    } = {}
  ) {
    try {
      let query = supabase
        .from('mentor_sessions')
        .select(`
          *,
          mentorship:mentorship_relationships(
            id,
            mentee_id,
            mentee_profile:user_profiles!mentee_id(
              display_name,
              profile_image_url,
              field_of_study
            )
          )
        `)
        .eq('mentor_id', mentorId);

      // Apply filters
      if (options.status) {
        query = query.eq('status', options.status);
      }

      if (options.startDate) {
        query = query.gte('scheduled_start', options.startDate);
      }

      if (options.endDate) {
        query = query.lte('scheduled_start', options.endDate);
      }

      if (options.menteeId) {
        query = query.eq('mentee_id', options.menteeId);
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, (options.offset + (options.limit || 10)) - 1);
      }

      // Order by scheduled start time
      query = query.order('scheduled_start', { ascending: true });

      const { data: sessions, error } = await query;

      if (error) {throw error;}

      return { data: sessions || [], error: null };
    } catch (error) {
      console.error('Error fetching mentor sessions:', error);
      return { 
        data: [], 
        error: error instanceof Error ? error.message : 'Failed to fetch sessions' 
      };
    }
  }

  /**
   * Get session statistics for a mentor
   */
  async getSessionStats(mentorId: string, dateRange?: { start: string; end: string }): Promise<SessionStats> {
    try {
      let query = supabase
        .from('mentor_sessions')
        .select('status, duration_minutes, rating, scheduled_start')
        .eq('mentor_id', mentorId);

      if (dateRange) {
        query = query
          .gte('scheduled_start', dateRange.start)
          .lte('scheduled_start', dateRange.end);
      }

      const { data: sessions, error } = await query;

      if (error) {throw error;}

      if (!sessions || sessions.length === 0) {
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
    } catch (error) {
      console.error('Error fetching session stats:', error);
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
  }

  /**
   * Get mentor's availability for a specific date range
   */
  async getMentorAvailability(mentorId: string, startDate: string, endDate: string): Promise<SessionAvailability[]> {
    try {
      // Get mentor's availability settings
      const { data: availability, error: availabilityError } = await supabase
        .from('mentor_availability')
        .select('*')
        .eq('mentor_id', mentorId);

      if (availabilityError) {
        console.error('Error fetching availability:', availabilityError);
        return [];
      }

      // Get existing sessions in the date range
      const { data: existingSessions, error: sessionsError } = await supabase
        .from('mentor_sessions')
        .select('scheduled_start, scheduled_end, status')
        .eq('mentor_id', mentorId)
        .gte('scheduled_start', startDate)
        .lte('scheduled_start', endDate)
        .in('status', ['scheduled', 'in_progress']);

      if (sessionsError) {
        console.error('Error fetching existing sessions:', sessionsError);
        return [];
      }

      // Generate availability slots (implementation would depend on availability rules)
      // This is a simplified version - would need more complex logic for real implementation
      const availabilitySlots: SessionAvailability[] = [];
      
      const current = new Date(startDate);
      const end = new Date(endDate);

      while (current <= end) {
        const dateStr = current.toISOString().split('T')[0];
        
        // Generate time slots for the day (9 AM to 5 PM in 1-hour intervals)
        const timeSlots = [];
        for (let hour = 9; hour < 17; hour++) {
          const slotStart = new Date(current);
          slotStart.setHours(hour, 0, 0, 0);
          const slotEnd = new Date(slotStart);
          slotEnd.setHours(hour + 1, 0, 0, 0);

          // Check if slot conflicts with existing sessions
          const hasConflict = existingSessions?.some(session => {
            const sessionStart = new Date(session.scheduled_start);
            const sessionEnd = new Date(session.scheduled_end);
            return (slotStart >= sessionStart && slotStart < sessionEnd) ||
                   (slotEnd > sessionStart && slotEnd <= sessionEnd);
          });

          timeSlots.push({
            start: slotStart.toISOString(),
            end: slotEnd.toISOString(),
            available: !hasConflict,
            reason: hasConflict ? 'Conflicting session' : undefined
          });
        }

        availabilitySlots.push({
          date: dateStr,
          time_slots: timeSlots
        });

        current.setDate(current.getDate() + 1);
      }

      return availabilitySlots;
    } catch (error) {
      console.error('Error getting mentor availability:', error);
      return [];
    }
  }

  /**
   * Check for scheduling conflicts
   */
  private async checkSchedulingConflict(
    mentorId: string,
    scheduledStart: string,
    durationMinutes: number,
    excludeSessionId?: string
  ): Promise<boolean> {
    try {
      const scheduledEnd = new Date(
        new Date(scheduledStart).getTime() + durationMinutes * 60 * 1000
      ).toISOString();

      let query = supabase
        .from('mentor_sessions')
        .select('id')
        .eq('mentor_id', mentorId)
        .in('status', ['scheduled', 'in_progress'])
        .or(`and(scheduled_start.lte.${scheduledStart},scheduled_end.gt.${scheduledStart}),and(scheduled_start.lt.${scheduledEnd},scheduled_end.gte.${scheduledEnd}),and(scheduled_start.gte.${scheduledStart},scheduled_end.lte.${scheduledEnd})`);

      if (excludeSessionId) {
        query = query.neq('id', excludeSessionId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error checking scheduling conflict:', error);
        return false; // Assume no conflict if we can't check
      }

      return (data && data.length > 0);
    } catch (error) {
      console.error('Error checking scheduling conflict:', error);
      return false;
    }
  }

  /**
   * Send session notification (placeholder for notification service integration)
   */
  private async sendSessionNotification(sessionId: string, type: string) {
    // This would integrate with the notification service
    console.log(`Sending ${type} notification for session ${sessionId}`);
  }

  /**
   * Schedule session reminder (placeholder for reminder service integration)
   */
  private async scheduleSessionReminder(sessionId: string) {
    // This would integrate with the reminder service
    console.log(`Scheduling reminder for session ${sessionId}`);
  }

  /**
   * Update mentorship progress based on completed session
   */
  private async updateMentorshipProgress(mentorshipId: string) {
    try {
      // Get completed sessions count
      const { data: sessions, error } = await supabase
        .from('mentor_sessions')
        .select('id, status')
        .eq('mentorship_id', mentorshipId);

      if (error || !sessions) {return;}

      const totalSessions = sessions.length;
      const completedSessions = sessions.filter(s => s.status === 'completed').length;
      const progressPercentage = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

      // Update mentorship progress
      await supabase
        .from('mentorship_relationships')
        .update({
          progress_percentage: progressPercentage,
          updated_at: new Date().toISOString()
        })
        .eq('id', mentorshipId);
    } catch (error) {
      console.error('Error updating mentorship progress:', error);
    }
  }

  /**
   * Log session activity (placeholder for activity service integration)
   */
  private async logSessionActivity(sessionId: string, activityType: string) {
    // This would integrate with the activity tracking service
    console.log(`Logging ${activityType} for session ${sessionId}`);
  }

  /**
   * Get upcoming sessions with reminders
   */
  async getUpcomingSessions(mentorId: string, hoursAhead = 24) {
    try {
      const now = new Date();
      const futureTime = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

      const { data: sessions, error } = await supabase
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
        .gte('scheduled_start', now.toISOString())
        .lte('scheduled_start', futureTime.toISOString())
        .order('scheduled_start', { ascending: true });

      if (error) {throw error;}

      return { data: sessions || [], error: null };
    } catch (error) {
      console.error('Error fetching upcoming sessions:', error);
      return { 
        data: [], 
        error: error instanceof Error ? error.message : 'Failed to fetch upcoming sessions' 
      };
    }
  }
}

// Export singleton instance
export const mentorSessionService = new MentorSessionService();
export default mentorSessionService;