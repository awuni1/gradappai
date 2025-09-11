import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type ConnectionRequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';
export type InitiatorType = 'mentor' | 'applicant';

export interface ConnectionRequest {
  id: string;
  initiator_id: string;
  recipient_id: string;
  initiator_type: InitiatorType;
  status: ConnectionRequestStatus;
  message?: string;
  response_message?: string;
  mentor_note?: string;
  requested_at: string;
  responded_at?: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
  
  // Legacy fields for backward compatibility
  mentor_id?: string;
  student_id?: string;
  
  // Related user data (populated via joins)
  initiator_profile?: any;
  recipient_profile?: any;
}

export interface CreateConnectionRequestParams {
  recipientId: string;
  initiatorType: InitiatorType;
  message?: string;
}

export interface RespondToRequestParams {
  requestId: string;
  status: 'accepted' | 'declined';
  responseMessage?: string;
}

export class ConnectionRequestService {
  private static instance: ConnectionRequestService;
  
  public static getInstance(): ConnectionRequestService {
    if (!ConnectionRequestService.instance) {
      ConnectionRequestService.instance = new ConnectionRequestService();
    }
    return ConnectionRequestService.instance;
  }

  /**
   * Send a connection request from current user to another user
   */
  async sendConnectionRequest(
    userId: string,
    params: CreateConnectionRequestParams
  ): Promise<{ success: boolean; data?: ConnectionRequest; error?: string }> {
    try {
      // Sending connection request

      // Check if a request already exists between these users (in either direction)
      const { data: existingRequest, error: checkError } = await supabase
        .from('mentorship_requests')
        .select('*')
        .or(`and(initiator_id.eq.${userId},recipient_id.eq.${params.recipientId}),and(initiator_id.eq.${params.recipientId},recipient_id.eq.${userId})`)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // Keep console.error for database access failures
        return { success: false, error: checkError.message };
      }

      if (existingRequest) {
        // Keep console.warn for business logic warnings
        return { 
          success: false, 
          error: existingRequest.status === 'pending' 
            ? 'A connection request already exists between you and this user'
            : `You already have a ${existingRequest.status} connection with this user`
        };
      }

      // Create the connection request
      const requestData = {
        initiator_id: userId,
        recipient_id: params.recipientId,
        initiator_type: params.initiatorType,
        message: params.message || '',
        status: 'pending' as ConnectionRequestStatus,
        
        // Legacy fields for backward compatibility
        ...(params.initiatorType === 'mentor' ? {
          mentor_id: userId,
          student_id: params.recipientId
        } : {
          mentor_id: params.recipientId,
          student_id: userId
        })
      };

      const { data: newRequest, error: insertError } = await supabase
        .from('mentorship_requests')
        .insert(requestData)
        .select()
        .single();

      if (insertError) {
        // Keep console.error for database insert failures
        return { success: false, error: insertError.message };
      }

      // Fetch the user profiles separately for a more reliable approach
      const { data: initiatorProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', newRequest.initiator_id)
        .single();

      const { data: recipientProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', newRequest.recipient_id)
        .single();

      // Attach profiles to the request data
      const requestWithProfiles = {
        ...newRequest,
        initiator_profile: initiatorProfile,
        recipient_profile: recipientProfile
      };

      // Connection request sent successfully
      
      toast.success('Connection request sent!', {
        description: 'Your request has been sent and they will be notified.'
      });

      return { success: true, data: requestWithProfiles };

    } catch (error: any) {
      // Keep console.error for unexpected errors
      return { success: false, error: error.message };
    }
  }

  /**
   * Respond to a connection request (accept or decline)
   */
  async respondToConnectionRequest(
    userId: string,
    params: RespondToRequestParams
  ): Promise<{ success: boolean; data?: ConnectionRequest; error?: string }> {
    try {
      // Responding to connection request

      // First, verify the user is the recipient of this request
      const { data: request, error: fetchError } = await supabase
        .from('mentorship_requests')
        .select('*')
        .eq('id', params.requestId)
        .eq('recipient_id', userId)
        .eq('status', 'pending')
        .single();

      if (fetchError) {
        // Keep console.error for database access failures
        return { success: false, error: 'Request not found or you are not authorized to respond to it' };
      }

      if (!request) {
        return { success: false, error: 'Request not found or already responded to' };
      }

      // Update the request status
      const { data: updatedRequest, error: updateError } = await supabase
        .from('mentorship_requests')
        .update({
          status: params.status,
          response_message: params.responseMessage,
          responded_at: new Date().toISOString()
        })
        .eq('id', params.requestId)
        .select()
        .single();

      if (updateError) {
        // Keep console.error for database update failures
        return { success: false, error: updateError.message };
      }

      // Fetch the user profiles separately
      const { data: initiatorProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', updatedRequest.initiator_id)
        .single();

      const { data: recipientProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', updatedRequest.recipient_id)
        .single();

      // If the request was accepted, create the mentorship relationship
      if (params.status === 'accepted') {
        const mentorId = updatedRequest.initiator_type === 'mentor' 
          ? updatedRequest.initiator_id 
          : updatedRequest.recipient_id;
        const menteeId = updatedRequest.initiator_type === 'mentor' 
          ? updatedRequest.recipient_id 
          : updatedRequest.initiator_id;

        const { error: relationshipError } = await supabase
          .from('mentorship_relationships')
          .insert({
            mentor_id: mentorId,
            mentee_id: menteeId,
            status: 'active',
            relationship_type: 'general',
            start_date: new Date().toISOString()
          });

        if (relationshipError) {
          // Keep console.error for relationship creation failures
          // Don't fail the whole operation if relationship creation fails
          // The request was still successfully accepted
        } else {
          // Mentorship relationship created successfully
        }
      }

      // Attach profiles to the request data
      const requestWithProfiles = {
        ...updatedRequest,
        initiator_profile: initiatorProfile,
        recipient_profile: recipientProfile
      };

      // Connection request response recorded

      const statusText = params.status === 'accepted' ? 'accepted' : 'declined';
      toast.success(`Connection request ${statusText}!`, {
        description: params.status === 'accepted' 
          ? 'You are now connected and can start messaging.'
          : 'The request has been declined.'
      });

      return { success: true, data: requestWithProfiles };

    } catch (error: any) {
      // Keep console.error for unexpected errors
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all connection requests for a user (both incoming and outgoing)
   */
  async getConnectionRequests(
    userId: string
  ): Promise<{ success: boolean; data?: { incoming: ConnectionRequest[]; outgoing: ConnectionRequest[] }; error?: string }> {
    try {
      // Fetching connection requests for user

      // Get incoming requests (where user is recipient)
      const { data: incomingRequests, error: incomingError } = await supabase
        .from('mentorship_requests')
        .select('*')
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false });

      if (incomingError) {
        // Keep console.error for database access failures
        return { success: false, error: incomingError.message };
      }

      // Get outgoing requests (where user is initiator)
      const { data: outgoingRequests, error: outgoingError } = await supabase
        .from('mentorship_requests')
        .select('*')
        .eq('initiator_id', userId)
        .order('created_at', { ascending: false });

      if (outgoingError) {
        // Keep console.error for database access failures
        return { success: false, error: outgoingError.message };
      }

      // Fetch user profiles for all requests
      const allUserIds = new Set<string>();
      [...(incomingRequests || []), ...(outgoingRequests || [])].forEach(request => {
        allUserIds.add(request.initiator_id);
        allUserIds.add(request.recipient_id);
      });

      const { data: userProfiles } = await supabase
        .from('user_profiles')
        .select('*')
        .in('user_id', Array.from(allUserIds));

      const profilesMap = new Map(userProfiles?.map(profile => [profile.user_id, profile]) || []);

      // Attach profiles to incoming requests
      const incomingWithProfiles = (incomingRequests || []).map(request => ({
        ...request,
        initiator_profile: profilesMap.get(request.initiator_id),
        recipient_profile: profilesMap.get(request.recipient_id)
      }));

      // Attach profiles to outgoing requests
      const outgoingWithProfiles = (outgoingRequests || []).map(request => ({
        ...request,
        initiator_profile: profilesMap.get(request.initiator_id),
        recipient_profile: profilesMap.get(request.recipient_id)
      }));

      // Connection requests fetched successfully

      return {
        success: true,
        data: {
          incoming: incomingWithProfiles || [],
          outgoing: outgoingWithProfiles || []
        }
      };

    } catch (error: any) {
      // Keep console.error for unexpected errors
      return { success: false, error: error.message };
    }
  }

  /**
   * Cancel a connection request (only by the initiator)
   */
  async cancelConnectionRequest(
    userId: string,
    requestId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Cancelling connection request

      const { error: updateError } = await supabase
        .from('mentorship_requests')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .eq('initiator_id', userId)
        .eq('status', 'pending');

      if (updateError) {
        // Keep console.error for database update failures
        return { success: false, error: updateError.message };
      }

      // Connection request cancelled successfully
      
      toast.success('Connection request cancelled');

      return { success: true };

    } catch (error: any) {
      // Keep console.error for unexpected errors
      return { success: false, error: error.message };
    }
  }

  /**
   * Get connection status between two users
   */
  async getConnectionStatus(
    userId: string,
    otherUserId: string
  ): Promise<{ 
    status: 'none' | 'pending_sent' | 'pending_received' | 'connected' | 'declined'; 
    requestId?: string; 
    relationshipId?: string;
  }> {
    try {
      // Check for existing request
      const { data: request } = await supabase
        .from('mentorship_requests')
        .select('*')
        .or(`and(initiator_id.eq.${userId},recipient_id.eq.${otherUserId}),and(initiator_id.eq.${otherUserId},recipient_id.eq.${userId})`)
        .single();

      if (request) {
        if (request.status === 'pending') {
          return {
            status: request.initiator_id === userId ? 'pending_sent' : 'pending_received',
            requestId: request.id
          };
        } else if (request.status === 'declined') {
          return { status: 'declined', requestId: request.id };
        }
      }

      // Check for existing relationship
      const { data: relationship } = await supabase
        .from('mentorship_relationships')
        .select('*')
        .or(`and(mentor_id.eq.${userId},mentee_id.eq.${otherUserId}),and(mentor_id.eq.${otherUserId},mentee_id.eq.${userId})`)
        .eq('status', 'active')
        .single();

      if (relationship) {
        return { status: 'connected', relationshipId: relationship.id };
      }

      return { status: 'none' };

    } catch (error) {
      // Keep console.warn for connection status check failures as it's critical for debugging
      return { status: 'none' };
    }
  }
}

// Export singleton instance
export const connectionRequestService = ConnectionRequestService.getInstance();