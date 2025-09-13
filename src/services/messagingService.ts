import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { userProfileService } from '@/services/userProfileService';

export interface Conversation {
  id: string;
  title?: string;
  conversation_type?: string;
  is_group: boolean;
  max_participants?: number;
  admin_user_id?: string;
  is_active?: boolean;
  is_archived?: boolean;
  is_muted?: boolean;
  is_encrypted?: boolean;
  visibility?: string;
  participant_count?: number;
  message_count?: number;
  last_message_at?: string;
  last_activity?: string;
  created_at: string;
  updated_at?: string;
  archived_at?: string;
  is_pinned?: boolean;
  is_starred?: boolean;
  deleted_at?: string;
  deleted_by?: string;
  // Additional fields for UI
  participants?: any[];
  otherParticipants?: any[];
  participantCount?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'file' | 'image' | 'voice' | 'video' | 'system';
  attachments?: any;
  read_by?: string[];
  edited_at?: string;
  reply_to_id?: string;
  created_at: string;
  sender?: {
    id: string;
    display_name: string;
    profile_image_url?: string;
  };
}

export interface MessageInput {
  conversation_id: string;
  content: string;
  message_type?: 'text' | 'file' | 'image' | 'voice' | 'video' | 'system';
  attachments?: any;
  reply_to_id?: string;
}

class MessagingService {
  private subscriptions = new Map<string, any>();
  private genId(): string {
    // Safe UUID v4 generator with crypto fallback
    try {
      if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        // @ts-ignore
        return crypto.randomUUID();
      }
    } catch {}
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Get all conversations for the current user
   */
  async getConversations() {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Get conversations with minimal columns to avoid schema issues
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          title,
          is_group,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
        throw new Error(`Failed to fetch conversations: ${error.message}`);
      }

      if (!data) {
        return [];
      }

      // Process each conversation to get participants
      const conversationsWithParticipants = await Promise.all(
        data.map(async (conv) => {
          try {
            // Get participants for this conversation - use only basic columns
            const { data: participants, error: participantError } = await supabase
              .from('conversation_participants')
              .select('user_id, joined_at')
              .eq('conversation_id', conv.id);

            if (participantError) {
              console.warn('Error fetching participants for conversation:', conv.id, participantError);
              return {
                ...conv,
                participants: [],
                participantCount: 0,
                otherParticipants: []
              };
            }

            return {
              ...conv,
              participants: participants || [],
              participantCount: participants?.length || 0,
              otherParticipants: participants || []
            };
          } catch (convError) {
            console.warn('Error processing conversation:', conv.id, convError);
            return {
              ...conv,
              participants: [],
              participantCount: 0,
              otherParticipants: []
            };
          }
        })
      );

      return conversationsWithParticipants;
    } catch (error) {
      console.error('Error in getConversations:', error);
      throw new Error(`Failed to load conversations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }  /**
   * Get messages for a specific conversation
   */
  async getMessages(conversationId: string, limit = 50): Promise<Message[]> {
    try {
      console.log('Loading messages for conversation:', conversationId);
      
      // First, get the messages without complex joins
      const { data: messages, error: messagesError } = await supabase
    .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (messagesError) {throw messagesError;}

      if (!messages || messages.length === 0) {
        console.log('No messages found for conversation');
        return [];
      }

      // Get unique sender IDs
      const senderIds = [...new Set(messages.map(msg => msg.sender_id))];
      console.log('Fetching profiles for senders:', senderIds);

      // Fetch user profiles separately
      const { data: profiles, error: profilesError } = await (supabase as any)
    .from('user_profiles')
        .select('user_id, display_name, profile_picture_url')
        .in('user_id', senderIds);

      if (profilesError) {
        console.warn('Error fetching user profiles, proceeding without profile data:', profilesError);
      }

      // Create a map of user profiles
      const profileMap = new Map();
      if (profiles) {
    (profiles as any[] | null | undefined)?.forEach((profile: any) => {
          profileMap.set(profile.user_id, profile);
        });
      }

      // Process messages with profile data
      const processedMessages: Message[] = messages.map((message: any) => {
    const senderProfile: any = profileMap.get(message.sender_id);
    const avatar = senderProfile?.profile_picture_url;
        return {
          ...message,
          message_type: (message.message_type ?? 'text') as Message['message_type'],
          read_by: (message.read_by || []) as string[],
          sender: {
            id: message.sender_id,
            display_name: senderProfile?.display_name || 'Unknown User',
      profile_image_url: avatar
          }
        } as Message;
      });

      console.log('Successfully loaded', processedMessages.length, 'messages');
      return processedMessages;
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      
      // More specific error handling
      if (error.code === '42P01') {
        toast.error('Database tables not found. Please deploy the messaging schema first.');
        console.error('Missing database tables. Please run the GRADNET_DATABASE_SCHEMA.sql script.');
      } else if (error.code === 'PGRST116') {
        // No messages found - this is normal, not an error
        console.log('No messages found for conversation');
        return [];
      } else if (error.message?.includes('permission')) {
        toast.error('Permission denied. Please check your account access.');
      } else {
        toast.error('Failed to load messages. Please try again.');
        console.error('Unexpected error:', error);
      }
      return [];
    }
  }

  /**
   * Send a new message
   */
  async sendMessage(messageData: MessageInput, senderId: string): Promise<Message | null> {
    try {
      console.log('Sending message:', messageData);
      
      // First ensure user profile exists (same pattern as social feed)
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) {
        toast.error('Authentication required');
        return null;
      }

      // Check if user profile exists, create basic one if needed
      let userProfile = await userProfileService.getUserProfile(senderId);
      if (!userProfile) {
        console.log('User profile not found, creating basic profile for messaging...');
        userProfile = await userProfileService.createBasicUserProfile(currentUser.data.user);
        if (!userProfile) {
          toast.error('Failed to initialize user profile. Please try again.');
          return null;
        }
      }

      // Create the message with fields aligned to DB schema
    const { data: messageResult, error: messageError } = await supabase
  .from('messages')
        .insert({
          conversation_id: messageData.conversation_id,
          content: messageData.content,
          message_type: messageData.message_type || 'text',
          attachments: messageData.attachments ?? undefined,
          reply_to_id: messageData.reply_to_id ?? undefined,
          sender_id: senderId
        })
        .select('*')
        .single();

      if (messageError) {throw messageError;}

      // Update conversation's last_message_at
    await ((supabase as any)
        .from('conversations')
        .update({ 
          last_message_at: new Date().toISOString()
        })
        .eq('id', messageData.conversation_id));

      // Build the complete message object with profile data
      const processedMessage: Message = {
        ...(messageResult as any),
        message_type: ((messageResult as any).message_type ?? 'text') as Message['message_type'],
        read_by: [],
        sender: {
          id: senderId,
          display_name: userProfile.display_name || 'Unknown User',
            profile_image_url: (userProfile as any).profile_picture_url
        }
      };

      console.log('Message sent successfully');
      toast.success('Message sent!');
      return processedMessage;
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // More specific error handling
      if (error.code === '42P01') {
        toast.error('Database tables not found. Please deploy the messaging schema first.');
        console.error('Missing database tables. Please run the GRADNET_DATABASE_SCHEMA.sql script.');
      } else if (error.code === '23503') {
        toast.error('Database relationship error. Please try again or contact support.');
        console.error('Foreign key constraint error:', error.message);
      } else if (error.message?.includes('permission')) {
        toast.error('Permission denied. Please check your account access.');
      } else {
        toast.error('Failed to send message. Please try again.');
        console.error('Unexpected error:', error);
      }
      return null;
    }
  }

  /**
   * Create a new conversation
   */
  async createConversation(
    participants: string[],
    conversationType = 'direct',
    title?: string,
    createdBy?: string
  ): Promise<Conversation | null> {
    try {
      console.log('Creating conversation with participants:', participants);
      
      // Create conversation with only the columns that exist in your schema
      const conversationData = {
        title: title || (conversationType === 'group' ? 'New Group Chat' : null),
        is_group: conversationType === 'group',
        max_participants: conversationType === 'group' ? 50 : 2
      };

      const { data: conversation, error: conversationError } = await supabase
        .from('conversations')
        .insert(conversationData)
        .select()
        .single();

      if (conversationError) {
        console.error('Failed to create conversation:', conversationError);
        throw conversationError;
      }

      console.log('Created conversation:', conversation.id);

      // Add participants
      const participantData = participants.map(userId => ({
        conversation_id: conversation.id,
        user_id: userId
      }));

      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert(participantData);

      if (participantsError) {
        console.error('Failed to add participants:', participantsError);
        // Try to clean up the conversation
        await supabase
          .from('conversations')
          .delete()
          .eq('id', conversation.id);
        throw participantsError;
      }

      console.log('Added participants to conversation:', conversation.id);
      return conversation;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  }

  /**
   * Find or create a direct conversation between two users
   */
  async getOrCreateDirectConversation(user1Id: string, user2Id: string): Promise<string | null> {
    try {
      console.log('Looking for existing conversation between:', user1Id, 'and', user2Id);
      
      // Get conversations where current user is a participant
      const { data: myParticipations, error: participationError } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          conversation:conversations(
            id,
            is_group
          )
        `)
        .eq('user_id', user1Id);

      if (participationError) {
        throw participationError;
      }

      // Check each conversation to see if it's a direct conversation with target user
      for (const participation of (myParticipations || [])) {
        const conv = participation.conversation;
        if (!conv || conv.is_group) continue;

        // Get all participants of this conversation
        const { data: allParticipants, error: allPartsError } = await supabase
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', conv.id);

        if (allPartsError) continue;

        const participantIds = (allParticipants || []).map((p: any) => p.user_id);
        
        // Check if this is a direct conversation with exactly these two users
        if (participantIds.length === 2 &&
            participantIds.includes(user1Id) &&
            participantIds.includes(user2Id)) {
          console.log('Found existing conversation:', conv.id);
          return conv.id;
        }
      }

      console.log('No existing conversation found, creating new one');
      
      // Create new conversation
      const participantIds = [user1Id, user2Id];
      const newConv = await this.createConversation(
        participantIds,
        'direct', // conversation type as string
        undefined, // no title needed for direct conversation
        user1Id
      );

      console.log('Created new conversation:', newConv?.id);
      return newConv?.id || null;
    } catch (error) {
      console.error('Error getting/creating direct conversation:', error);
      return null;
    }
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
  // No-op for now: read receipts stored in read_receipts JSON and may require extra RLS; skipping
  return;
  }

  /**
   * Upload file for message attachment
   */
  async uploadMessageFile(file: File, conversationId: string, userId: string): Promise<string | null> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${conversationId}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('messages')
        .upload(fileName, file);

      if (error) {throw error;}

      const { data: { publicUrl } } = supabase.storage
        .from('messages')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
      return null;
    }
  }

  /**
   * Subscribe to real-time message updates for a conversation
   */
  subscribeToConversation(
    conversationId: string,
    onNewMessage: (message: Message) => void,
    onMessageUpdate: (message: Message) => void
  ): void {
    // Unsubscribe from existing subscription for this conversation
    this.unsubscribeFromConversation(conversationId);

    const subscription = supabase
      .channel(`conversation-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          // Fetch message, then profile separately for type-safe shape
          const { data: msg } = await supabase
            .from('messages')
            .select('*')
            .eq('id', payload.new.id)
            .single();

          if (msg) {
            let displayName = 'Unknown User';
            let avatar: string | undefined;

            const { data: profile } = await supabase
          .from('user_profiles')
              .select('user_id, display_name, profile_picture_url')
              .eq('user_id', msg.sender_id)
              .single();

            if (profile) {
              displayName = (profile as any).display_name || displayName;
        avatar = (profile as any).profile_picture_url || undefined;
            } else {
              try {
                const up = await userProfileService.getUserProfile(msg.sender_id);
                if (up) {
                  displayName = (up as any).display_name || displayName;
          avatar = (up as any).profile_picture_url || undefined;
                }
              } catch {}
            }

            const processedMessage: Message = {
              ...msg,
              message_type: ((msg as any).message_type ?? 'text') as Message['message_type'],
              read_by: ((msg as any).read_by || []) as string[],
              sender: {
                id: msg.sender_id,
                display_name: displayName,
                profile_image_url: avatar
              }
            };
            onNewMessage(processedMessage);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          // Fetch updated message and profile separately
          const { data: msg } = await supabase
            .from('messages')
            .select('*')
            .eq('id', payload.new.id)
            .single();

          if (msg) {
            let displayName = 'Unknown User';
            let avatar: string | undefined;

            const { data: profile } = await supabase
              .from('user_profiles')
              .select('user_id, display_name, profile_picture_url')
              .eq('user_id', msg.sender_id)
              .single();

            if (profile) {
              displayName = (profile as any).display_name || displayName;
              avatar = (profile as any).profile_picture_url || (profile as any).profile_image_url || undefined;
            } else {
              try {
                const up = await userProfileService.getUserProfile(msg.sender_id);
                if (up) {
                  displayName = (up as any).display_name || displayName;
                  avatar = (up as any).profile_picture_url || (up as any).profile_image_url || undefined;
                }
              } catch {}
            }

            const processedMessage: Message = {
              ...msg,
              message_type: ((msg as any).message_type ?? 'text') as Message['message_type'],
              read_by: ((msg as any).read_by || []) as string[],
              sender: {
                id: msg.sender_id,
                display_name: displayName,
                profile_image_url: avatar
              }
            };
            onMessageUpdate(processedMessage);
          }
        }
      )
      .subscribe();

    this.subscriptions.set(conversationId, subscription);
  }

  /**
   * Subscribe to conversation list updates
   */
  subscribeToConversations(userId: string, onUpdate: (conversations: Conversation[]) => void): void {
    const subscription = supabase
      .channel('conversations-list')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations'
        },
        async () => {
          // Refresh conversations list
          const conversations = await this.getConversations();
          onUpdate(conversations);
        }
      )
      .subscribe();

    this.subscriptions.set('conversations-list', subscription);
  }

  /**
   * Unsubscribe from conversation updates
   */
  unsubscribeFromConversation(conversationId: string): void {
    const subscription = this.subscriptions.get(conversationId);
    if (subscription) {
      supabase.removeChannel(subscription);
      this.subscriptions.delete(conversationId);
    }
  }

  /**
   * Unsubscribe from all active subscriptions
   */
  unsubscribeAll(): void {
    this.subscriptions.forEach((subscription) => {
      supabase.removeChannel(subscription);
    });
    this.subscriptions.clear();
  }

  /**
   * Search messages across conversations
   */
  async searchMessages(userId: string, query: string, limit = 20): Promise<Message[]> {
    try {
      // Get user's conversations first
      const conversations = await this.getConversations();
      const conversationIds = conversations.map(c => c.id);

      if (conversationIds.length === 0) {return [];}

      const { data: dataMsgs, error } = await supabase
        .from('messages')
        .select('*')
        .in('conversation_id', conversationIds)
        .ilike('content', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {throw error;}

      if (!dataMsgs || dataMsgs.length === 0) {return [];} 

      const senderIds = [...new Set(dataMsgs.map(m => m.sender_id))];
      const { data: profiles } = await (supabase as any)
        .from('user_profiles')
        .select('user_id, display_name, profile_picture_url')
        .in('user_id', senderIds);

  const pmap = new Map<string, any>();
  (profiles as any[] | null | undefined)?.forEach((p: any) => pmap.set(p.user_id, p));

    const processedMessages: Message[] = dataMsgs.map((msg: any) => {
        const p = pmap.get(msg.sender_id);
        const avatar = p?.profile_picture_url || p?.profile_image_url;
        return {
          ...msg,
      message_type: ((msg as any).message_type ?? 'text') as Message['message_type'],
      read_by: ((msg as any).read_by || []) as string[],
          sender: {
            id: msg.sender_id,
            display_name: p?.display_name || 'Unknown User',
            profile_image_url: avatar
          }
        } as Message;
      });

      return processedMessages;
    } catch (error) {
      console.error('Error searching messages:', error);
      return [];
    }
  }

  /**
   * Delete a message (soft delete by updating content)
   */
  async deleteMessage(messageId: string, userId: string): Promise<boolean> {
    try {
    const { error } = await (supabase as any)
        .from('messages')
        .update({ 
      content: '[Message deleted]',
      is_deleted: true,
      updated_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .eq('sender_id', userId);

      if (error) {throw error;}
      
      toast.success('Message deleted');
      return true;
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
      return false;
    }
  }

  /**
   * Edit a message
   */
  async editMessage(messageId: string, newContent: string, userId: string): Promise<boolean> {
    try {
    const { error } = await (supabase as any)
        .from('messages')
        .update({ 
          content: newContent,
      is_edited: true,
      updated_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .eq('sender_id', userId);

      if (error) {throw error;}
      
      toast.success('Message updated');
      return true;
    } catch (error) {
      console.error('Error editing message:', error);
      toast.error('Failed to update message');
      return false;
    }
  }

  /**
   * Start a conversation with a specific user
   */
  async startConversationWithUser(currentUserId: string, targetUserId: string): Promise<string | null> {
    try {
      console.log('Starting conversation between:', currentUserId, 'and', targetUserId);
      
      // Find or create a direct conversation
      const conversationId = await this.getOrCreateDirectConversation(currentUserId, targetUserId);
      
      if (!conversationId) {
        throw new Error('Failed to create conversation');
      }

      console.log('Conversation ready:', conversationId);
      return conversationId;
    } catch (error) {
  console.error('Error starting conversation with user:', error);
  const msg = (error as any)?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
  toast.error(`Failed to start conversation: ${msg}`);
      return null;
    }
  }

  /**
   * Search for users to start conversations with
   */
  async searchUsers(query: string, currentUserId: string): Promise<any[]> {
    try {
      if (!query.trim()) {
        return [];
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, full_name, profile_picture_url, bio')
        .or(`display_name.ilike.%${query}%,full_name.ilike.%${query}%,bio.ilike.%${query}%`)
        .neq('user_id', currentUserId) // Don't include current user
        .limit(10);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Failed to search users');
      return [];
    }
  }

  /**
   * Get conversation status/preferences for a user
   */
  async getConversationStatus(conversationId: string, userId: string): Promise<any> {
    try {
      // For now, return default status - this can be extended with a conversation_user_settings table later
      return {
        isPinned: false,
        isStarred: false,
        isArchived: false,
        isMuted: false,
        customTitle: null
      };
    } catch (error) {
      console.error('Error getting conversation status:', error);
      return {
        isPinned: false,
        isStarred: false,
        isArchived: false,
        isMuted: false,
        customTitle: null
      };
    }
  }

  /**
   * Pin/unpin a conversation for a user
   */
  async pinConversation(conversationId: string, userId: string, pinned: boolean): Promise<boolean> {
    try {
      // This would require a conversation_user_settings table
      // For now, just return success - implement when needed
      console.log(`${pinned ? 'Pinning' : 'Unpinning'} conversation ${conversationId} for user ${userId}`);
      return true;
    } catch (error) {
      console.error('Error pinning conversation:', error);
      return false;
    }
  }

  /**
   * Star/unstar a conversation for a user
   */
  async starConversation(conversationId: string, userId: string, starred: boolean): Promise<boolean> {
    try {
      // This would require a conversation_user_settings table
      // For now, just return success - implement when needed
      console.log(`${starred ? 'Starring' : 'Unstarring'} conversation ${conversationId} for user ${userId}`);
      return true;
    } catch (error) {
      console.error('Error starring conversation:', error);
      return false;
    }
  }

  /**
   * Archive/unarchive a conversation for a user
   */
  async archiveConversation(conversationId: string, userId: string, archived: boolean): Promise<boolean> {
    try {
      // This would require a conversation_user_settings table
      // For now, just return success - implement when needed
      console.log(`${archived ? 'Archiving' : 'Unarchiving'} conversation ${conversationId} for user ${userId}`);
      return true;
    } catch (error) {
      console.error('Error archiving conversation:', error);
      return false;
    }
  }
}

// Export singleton instance
export const messagingService = new MessagingService();