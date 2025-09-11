import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';

export interface UserConnection {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'blocked' | 'declined';
  connection_type: 'mentor' | 'mentee' | 'peer' | 'colleague';
  message?: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    display_name: string;
    profile_image_url?: string;
    field_of_study?: string;
    academic_level?: string;
    verified_status: boolean;
  };
}

export interface ConnectionRequest {
  receiver_id: string;
  connection_type: 'mentor' | 'mentee' | 'peer' | 'colleague';
  message?: string;
}

class ConnectionService {
  /**
   * Get user's connections
   */
  async getUserConnections(userId: string): Promise<UserConnection[]> {
    try {
      const { data, error } = await supabase
        .from('gradnet_connections')
        .select(`
          *,
          requester:requester_id (
            id,
            user_profiles!inner (
              display_name,
              profile_image_url,
              field_of_study,
              academic_level,
              verified_status
            )
          ),
          receiver:receiver_id (
            id,
            user_profiles!inner (
              display_name,
              profile_image_url,
              field_of_study,
              academic_level,
              verified_status
            )
          )
        `)
        .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false });

      if (error) {throw error;}

      // Process the data to get the other user's info
      const processedConnections = (data || []).map(connection => {
        const isRequester = connection.requester_id === userId;
        const otherUser = isRequester ? connection.receiver : connection.requester;
        const otherUserProfile = otherUser?.user_profiles?.[0];

        return {
          ...connection,
          user: {
            id: otherUser?.id || '',
            display_name: otherUserProfile?.display_name || 'Unknown User',
            profile_image_url: otherUserProfile?.profile_image_url,
            field_of_study: otherUserProfile?.field_of_study,
            academic_level: otherUserProfile?.academic_level,
            verified_status: otherUserProfile?.verified_status || false,
          }
        };
      });

      return processedConnections;
    } catch (error: any) {
      console.error('Error fetching connections:', error);
      if (error.code === '42P01') {
        console.warn('user_connections table does not exist yet. Please deploy the database schema first.');
        return [];
      }
      toast.error('Failed to load connections');
      return [];
    }
  }

  /**
   * Send connection request
   */
  async sendConnectionRequest(request: ConnectionRequest, requesterId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('gradnet_connections')
        .insert({
          requester_id: requesterId,
          receiver_id: request.receiver_id,
          connection_type: request.connection_type,
          message: request.message,
          status: 'pending'
        });

      if (error) {throw error;}

      // Create notification for receiver
      await supabase
        .from('notifications')
        .insert({
          user_id: request.receiver_id,
          title: 'New Connection Request',
          message: `Someone wants to connect with you as a ${request.connection_type}`,
          notification_type: 'connection',
          related_id: requesterId
        });

      toast.success('Connection request sent!');
      return true;
    } catch (error: any) {
      console.error('Error sending connection request:', error);
      if (error.code === '42P01') {
        toast.error('Database tables not found. Please deploy the database schema first.');
      } else {
        toast.error('Failed to send connection request');
      }
      return false;
    }
  }

  /**
   * Accept connection request
   */
  async acceptConnectionRequest(connectionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('gradnet_connections')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', connectionId);

      if (error) {throw error;}

      toast.success('Connection request accepted!');
      return true;
    } catch (error) {
      console.error('Error accepting connection request:', error);
      toast.error('Failed to accept connection request');
      return false;
    }
  }

  /**
   * Decline connection request
   */
  async declineConnectionRequest(connectionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('gradnet_connections')
        .update({ status: 'declined', updated_at: new Date().toISOString() })
        .eq('id', connectionId);

      if (error) {throw error;}

      toast.success('Connection request declined');
      return true;
    } catch (error) {
      console.error('Error declining connection request:', error);
      toast.error('Failed to decline connection request');
      return false;
    }
  }

  /**
   * Get pending connection requests for user
   */
  async getPendingRequests(userId: string): Promise<UserConnection[]> {
    try {
      const { data, error } = await supabase
        .from('gradnet_connections')
        .select(`
          *,
          requester:requester_id (
            id,
            user_profiles!inner (
              display_name,
              profile_image_url,
              field_of_study,
              academic_level,
              verified_status
            )
          )
        `)
        .eq('receiver_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {throw error;}

      const processedRequests = (data || []).map(request => {
        const requesterProfile = request.requester?.user_profiles?.[0];
        return {
          ...request,
          user: {
            id: request.requester?.id || '',
            display_name: requesterProfile?.display_name || 'Unknown User',
            profile_image_url: requesterProfile?.profile_image_url,
            field_of_study: requesterProfile?.field_of_study,
            academic_level: requesterProfile?.academic_level,
            verified_status: requesterProfile?.verified_status || false,
          }
        };
      });

      return processedRequests;
    } catch (error: any) {
      console.error('Error fetching pending requests:', error);
      if (error.code === '42P01') {
        return [];
      }
      return [];
    }
  }

  /**
   * Search for potential connections
   */
  async searchPotentialConnections(
    userId: string, 
    query = '', 
    connectionType?: string,
    limit = 20
  ): Promise<any[]> {
    try {
      let supabaseQuery = supabase
        .from('user_profiles')
        .select('*')
        .neq('user_id', userId) // Exclude current user
        .limit(limit);

      if (query) {
        supabaseQuery = supabaseQuery.or(`display_name.ilike.%${query}%,field_of_study.ilike.%${query}%`);
      }

      const { data, error } = await supabaseQuery;

      if (error) {throw error;}

      return data || [];
    } catch (error: any) {
      console.error('Error searching potential connections:', error);
      if (error.code === '42P01') {
        return [];
      }
      return [];
    }
  }

  /**
   * Check connection status between two users
   */
  async getConnectionStatus(userId1: string, userId2: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('gradnet_connections')
        .select('status')
        .or(`and(requester_id.eq.${userId1},receiver_id.eq.${userId2}),and(requester_id.eq.${userId2},receiver_id.eq.${userId1})`)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data?.status || null;
    } catch (error) {
      console.error('Error checking connection status:', error);
      return null;
    }
  }
}

// Export singleton instance
export const connectionService = new ConnectionService();