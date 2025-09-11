import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SessionReminder {
  id: string;
  title: string;
  scheduled_at: string;
  duration_minutes: number;
  student_name: string;
  meeting_link?: string;
}

class SessionReminderService {
  private reminderIntervals = new Map<string, NodeJS.Timeout>();
  private isActive = false;

  start(userId: string) {
    if (this.isActive) {return;}
    
    this.isActive = true;
    console.log('Session reminder service started');
    
    // Check for upcoming sessions every minute
    const checkInterval = setInterval(() => {
      this.checkUpcomingSessions(userId);
    }, 60000); // 1 minute

    // Initial check
    this.checkUpcomingSessions(userId);

    // Store the main interval
    this.reminderIntervals.set('main', checkInterval);
  }

  stop() {
    this.isActive = false;
    
    // Clear all intervals
    this.reminderIntervals.forEach((interval) => {
      clearInterval(interval);
    });
    this.reminderIntervals.clear();
    
    console.log('Session reminder service stopped');
  }

  private async checkUpcomingSessions(userId: string) {
    try {
      const now = new Date();
      const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000);
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

      // Query upcoming sessions
      const { data: sessions, error } = await supabase
        .from('mentorship_sessions')
        .select(`
          id,
          title,
          scheduled_at,
          duration_minutes,
          meeting_link,
          mentorship:mentorship_id (
            student_profile:student_id (
              display_name
            )
          )
        `)
        .eq('mentorship_id', 'IN', `(SELECT id FROM mentorships WHERE mentor_id = '${userId}')`)
        .eq('status', 'scheduled')
        .gte('scheduled_at', now.toISOString())
        .lte('scheduled_at', oneHourFromNow.toISOString())
        .order('scheduled_at', { ascending: true });

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!sessions || sessions.length === 0) {return;}

      // Check each session for reminder timing
      sessions.forEach((session) => {
        const sessionTime = new Date(session.scheduled_at);
        const timeDiffMs = sessionTime.getTime() - now.getTime();
        const timeDiffMinutes = Math.floor(timeDiffMs / (1000 * 60));

        // Show reminders at specific intervals
        if (timeDiffMinutes === 15) {
          this.showSessionReminder(session, '15 minutes');
        } else if (timeDiffMinutes === 5) {
          this.showSessionReminder(session, '5 minutes');
        } else if (timeDiffMinutes === 1) {
          this.showSessionReminder(session, '1 minute');
        } else if (timeDiffMinutes <= 0 && timeDiffMinutes >= -5) {
          // Session is starting now or just started
          this.showSessionStartedNotification(session);
        }
      });

    } catch (error) {
      console.error('Error checking upcoming sessions:', error);
    }
  }

  private showSessionReminder(session: any, timeUntil: string) {
    const studentName = session.mentorship?.student_profile?.display_name || 'Unknown Student';
    
    toast.info(`Session starting in ${timeUntil}`, {
      description: `"${session.title}" with ${studentName}`,
      duration: 8000,
      action: session.meeting_link ? {
        label: 'Join Now',
        onClick: () => {
          window.open(session.meeting_link, '_blank');
        }
      } : undefined
    });
  }

  private showSessionStartedNotification(session: any) {
    const studentName = session.mentorship?.student_profile?.display_name || 'Unknown Student';
    
    toast.success('Session starting now!', {
      description: `"${session.title}" with ${studentName}`,
      duration: 10000,
      action: session.meeting_link ? {
        label: 'Join Session',
        onClick: () => {
          window.open(session.meeting_link, '_blank');
        }
      } : {
        label: 'View Details',
        onClick: () => {
          // Could navigate to session details
          console.log('Navigate to session details');
        }
      }
    });
  }

  // Method to manually trigger a session reminder check
  async checkNow(userId: string) {
    await this.checkUpcomingSessions(userId);
  }

  // Method to show a custom reminder
  showCustomReminder(title: string, message: string, action?: { label: string; onClick: () => void }) {
    toast.info(title, {
      description: message,
      duration: 6000,
      action
    });
  }

  // Method to get upcoming sessions for display
  async getUpcomingSessions(userId: string, hoursAhead = 24): Promise<SessionReminder[]> {
    try {
      const now = new Date();
      const futureTime = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

      const { data: sessions, error } = await supabase
        .from('mentorship_sessions')
        .select(`
          id,
          title,
          scheduled_at,
          duration_minutes,
          meeting_link,
          mentorship:mentorship_id (
            student_profile:student_id (
              display_name
            )
          )
        `)
        .eq('mentorship_id', 'IN', `(SELECT id FROM mentorships WHERE mentor_id = '${userId}')`)
        .eq('status', 'scheduled')
        .gte('scheduled_at', now.toISOString())
        .lte('scheduled_at', futureTime.toISOString())
        .order('scheduled_at', { ascending: true });

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return (sessions || []).map(session => ({
        id: session.id,
        title: session.title,
        scheduled_at: session.scheduled_at,
        duration_minutes: session.duration_minutes,
        student_name: session.mentorship?.student_profile?.display_name || 'Unknown Student',
        meeting_link: session.meeting_link
      }));

    } catch (error) {
      console.error('Error getting upcoming sessions:', error);
      return [];
    }
  }
}

// Create singleton instance
const sessionReminderService = new SessionReminderService();

export default sessionReminderService;