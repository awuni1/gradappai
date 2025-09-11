import ZoomVideo, { VideoClient } from '@zoom/videosdk';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MeetingSession {
  id: string;
  mentor_id: string;
  mentee_id: string;
  session_type: string;
  scheduled_at: string;
  duration_minutes: number;
  meeting_link?: string;
  zoom_meeting_id?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  session_notes?: string;
  mentor_feedback?: string;
  mentee_feedback?: string;
  rating?: number;
  amount_paid?: number;
  created_at: string;
  updated_at: string;
}

export interface VideoCallConfig {
  topic: string;
  userName: string;
  signature: string;
  sessionKey: string;
  userIdentity?: string;
  password?: string;
}

class VideoCallService {
  private client: VideoClient | null = null;
  private currentSession: MeetingSession | null = null;

  /**
   * Initialize Zoom Video SDK
   */
  async initializeZoomSDK(): Promise<boolean> {
    try {
      this.client = ZoomVideo.createClient();
      
      // Initialize the client
      await this.client.init({
        debug: process.env.NODE_ENV === 'development',
        devicePixelRatio: window.devicePixelRatio || 1,
        supportVirtualBackground: true,
        supportMultipleVideos: true,
      });

      console.log('Zoom SDK initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize Zoom SDK:', error);
      toast.error('Failed to initialize video calling');
      return false;
    }
  }

  /**
   * Join a video call session
   */
  async joinSession(config: VideoCallConfig): Promise<boolean> {
    try {
      if (!this.client) {
        await this.initializeZoomSDK();
      }

      if (!this.client) {
        throw new Error('Failed to initialize Zoom client');
      }

      await this.client.join({
        topic: config.topic,
        signature: config.signature,
        sessionKey: config.sessionKey,
        userName: config.userName,
        userIdentity: config.userIdentity,
        password: config.password,
      });

      console.log('Joined video session successfully');
      toast.success('Joined video call');
      return true;
    } catch (error) {
      console.error('Failed to join video session:', error);
      toast.error('Failed to join video call');
      return false;
    }
  }

  /**
   * Leave the current video session
   */
  async leaveSession(): Promise<boolean> {
    try {
      if (this.client) {
        await this.client.leave();
        console.log('Left video session');
        toast.info('Left video call');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to leave video session:', error);
      return false;
    }
  }

  /**
   * Start camera
   */
  async startVideo(): Promise<boolean> {
    try {
      if (this.client) {
        const stream = this.client.getMediaStream();
        await stream.startVideo();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to start video:', error);
      toast.error('Failed to start camera');
      return false;
    }
  }

  /**
   * Stop camera
   */
  async stopVideo(): Promise<boolean> {
    try {
      if (this.client) {
        const stream = this.client.getMediaStream();
        await stream.stopVideo();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to stop video:', error);
      return false;
    }
  }

  /**
   * Start audio
   */
  async startAudio(): Promise<boolean> {
    try {
      if (this.client) {
        const stream = this.client.getMediaStream();
        await stream.startAudio();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to start audio:', error);
      toast.error('Failed to start microphone');
      return false;
    }
  }

  /**
   * Stop audio
   */
  async stopAudio(): Promise<boolean> {
    try {
      if (this.client) {
        const stream = this.client.getMediaStream();
        await stream.stopAudio();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to stop audio:', error);
      return false;
    }
  }

  /**
   * Create a new mentoring session
   */
  async createMentoringSession(
    mentorId: string,
    menteeId: string,
    scheduledAt: string,
    sessionType = 'general',
    durationMinutes = 60
  ): Promise<MeetingSession | null> {
    try {
      // Generate a unique meeting ID
      const meetingId = `gradnet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const sessionData = {
        mentor_id: mentorId,
        mentee_id: menteeId,
        session_type: sessionType,
        scheduled_at: scheduledAt,
        duration_minutes: durationMinutes,
        zoom_meeting_id: meetingId,
        meeting_link: `${window.location.origin}/video-call/${meetingId}`,
        status: 'scheduled' as const
      };

      const { data, error } = await supabase
        .from('mentor_sessions')
        .insert(sessionData)
        .select()
        .single();

      if (error) {
        if (error.code === '42P01') {
          console.warn('mentor_sessions table does not exist yet. Please deploy the database schema first.');
          toast.warning('Database setup required for video calling');
          return null;
        }
        throw error;
      }

      this.currentSession = data;
      return data;
    } catch (error) {
      console.error('Error creating mentoring session:', error);
      toast.error('Failed to create video session');
      return null;
    }
  }

  /**
   * Get session by ID
   */
  async getMentoringSession(sessionId: string): Promise<MeetingSession | null> {
    try {
      const { data, error } = await supabase
        .from('mentor_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Session not found
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching mentoring session:', error);
      return null;
    }
  }

  /**
   * Update session status
   */
  async updateSessionStatus(
    sessionId: string, 
    status: MeetingSession['status'],
    additionalData?: Partial<MeetingSession>
  ): Promise<boolean> {
    try {
      const updateData = {
        status,
        ...additionalData,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('mentor_sessions')
        .update(updateData)
        .eq('id', sessionId);

      if (error) {throw error;}

      return true;
    } catch (error) {
      console.error('Error updating session status:', error);
      return false;
    }
  }

  /**
   * Get user's upcoming sessions
   */
  async getUserSessions(userId: string, userType: 'mentor' | 'mentee' = 'mentee'): Promise<MeetingSession[]> {
    try {
      const column = userType === 'mentor' ? 'mentor_id' : 'mentee_id';
      
      const { data, error } = await supabase
        .from('mentor_sessions')
        .select('*')
        .eq(column, userId)
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true });

      if (error) {
        if (error.code === '42P01') {
          console.warn('mentor_sessions table does not exist yet.');
          return [];
        }
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching user sessions:', error);
      return [];
    }
  }

  /**
   * Generate Zoom signature for session - SECURE SERVER-SIDE IMPLEMENTATION
   */
  async generateZoomSignature(
    sessionName: string,
    sessionKey: string, 
    userIdentity: string,
    roleType: 'host' | 'participant' = 'participant'
  ): Promise<string | null> {
    try {
      // Call secure server endpoint instead of client-side generation
      const response = await fetch('/api/generate-zoom-signature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
          sessionName,
          sessionKey,
          userIdentity,
          roleType
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Zoom signature generation failed:', errorData);
        
        if (response.status === 429) {
          toast.error('Too many requests. Please wait a moment and try again.');
        } else if (response.status === 500) {
          toast.error('Server configuration error. Please contact support.');
        } else {
          toast.error('Failed to generate video session signature');
        }
        
        return null;
      }

      const data = await response.json();
      
      if (!data.success || !data.signature) {
        console.error('Invalid signature response:', data);
        toast.error('Invalid signature received from server');
        return null;
      }

      console.log('✅ Zoom signature generated securely via server');
      return data.signature;
      
    } catch (error) {
      console.error('❌ Failed to generate Zoom signature:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        toast.error('Network error. Please check your connection and try again.');
      } else {
        toast.error('Failed to connect to video service');
      }
      
      return null;
    }
  }

  /**
   * Start screen sharing
   */
  async startScreenShare(): Promise<boolean> {
    try {
      if (this.client) {
        const stream = this.client.getMediaStream();
        await stream.startShareScreen();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to start screen share:', error);
      toast.error('Failed to start screen sharing');
      return false;
    }
  }

  /**
   * Stop screen sharing
   */
  async stopScreenShare(): Promise<boolean> {
    try {
      if (this.client) {
        const stream = this.client.getMediaStream();
        await stream.stopShareScreen();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to stop screen share:', error);
      return false;
    }
  }

  /**
   * Get current client instance
   */
  getClient(): VideoClient | null {
    return this.client;
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    if (this.client) {
      try {
        this.client.leave();
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
      this.client = null;
    }
    this.currentSession = null;
  }

  /**
   * Check if user can join session
   */
  async canUserJoinSession(sessionId: string, userId: string): Promise<boolean> {
    try {
      const session = await this.getMentoringSession(sessionId);
      if (!session) {return false;}

      // Check if user is either mentor or mentee
      return session.mentor_id === userId || session.mentee_id === userId;
    } catch (error) {
      console.error('Error checking session access:', error);
      return false;
    }
  }

  /**
   * Send session invitation
   */
  async sendSessionInvitation(sessionId: string): Promise<boolean> {
    try {
      const session = await this.getMentoringSession(sessionId);
      if (!session) {return false;}

      // Create notification for mentee
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: session.mentee_id,
          title: 'Video Session Scheduled',
          message: `Your mentoring session is scheduled for ${new Date(session.scheduled_at).toLocaleString()}`,
          notification_type: 'session',
          related_id: sessionId
        });

      if (error && error.code !== '42P01') {
        console.error('Error sending notification:', error);
        return false;
      }

      toast.success('Session invitation sent');
      return true;
    } catch (error) {
      console.error('Error sending session invitation:', error);
      return false;
    }
  }
}

// Export singleton instance
export const videoCallService = new VideoCallService();