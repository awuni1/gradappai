import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  file_url?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
  is_edited: boolean;
  is_read: boolean;
  read_by: string[];
  reply_to_message_id?: string;
  created_at: string;
  updated_at: string;
  sender?: {
    id: string;
    display_name: string;
    profile_image_url?: string;
  };
}

export interface Conversation {
  id: string;
  participants: string[];
  conversation_type: 'direct' | 'group' | 'support';
  title?: string;
  description?: string;
  avatar_url?: string;
  last_message?: Message;
  last_activity: string;
  is_archived: boolean;
  is_muted: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  unread_count?: number;
  participants_info?: {
    id: string;
    display_name: string;
    profile_image_url?: string;
    is_online?: boolean;
    last_seen?: string;
  }[];
}

export interface MessageDraft {
  conversation_id: string;
  content: string;
  reply_to_message_id?: string;
  saved_at: string;
}

class CommunicationService {
  private subscriptions = new Map<string, any>();

  /**
   * Get user conversations with pagination
   */
  async getUserConversations(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      type?: 'direct' | 'group' | 'support';
      archived?: boolean;
    } = {}
  ) {
    try {
      let query = supabase
        .from('gradnet_conversations')
        .select(`
          *,
          messages!left (
            id, content, sender_id, message_type, created_at,
            sender:user_profiles!sender_id (
              display_name, profile_image_url
            )
          )
        `)
        .contains('participants', [userId])
        .eq('is_archived', options.archived || false);

      if (options.type) {
        query = query.eq('conversation_type', options.type);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, (options.offset + (options.limit || 10)) - 1);
      }

      query = query.order('last_activity', { ascending: false });

      const { data: conversations, error } = await query;

      if (error) {throw error;}

      // Process conversations to get last message and unread count
      const processedConversations = await Promise.all(
        (conversations || []).map(async (conversation) => {
          // Get last message
          const sortedMessages = conversation.messages
            .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          
          const lastMessage = sortedMessages[0] || null;

          // Get unread count
          const unreadCount = await this.getUnreadMessageCount(conversation.id, userId);

          // Get participants info
          const participantsInfo = await this.getParticipantsInfo(conversation.participants.filter((p: string) => p !== userId));

          return {
            ...conversation,
            last_message: lastMessage,
            unread_count: unreadCount,
            participants_info: participantsInfo,
            messages: undefined // Remove messages array from response
          };
        })
      );

      return { data: processedConversations, error: null };
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return { 
        data: [], 
        error: error instanceof Error ? error.message : 'Failed to fetch conversations' 
      };
    }
  }

  /**
   * Get conversation messages with pagination
   */
  async getConversationMessages(
    conversationId: string,
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      before_message_id?: string;
      after_message_id?: string;
    } = {}
  ) {
    try {
      let query = supabase
        .from('messages')
        .select(`
          *,
          sender:user_profiles!sender_id (
            display_name, profile_image_url
          ),
          reply_to:messages!reply_to_message_id (
            id, content, sender_id,
            sender:user_profiles!sender_id (display_name)
          )
        `)
        .eq('conversation_id', conversationId);

      if (options.before_message_id) {
        // Get messages before a specific message (for loading older messages)
        const { data: beforeMessage } = await supabase
          .from('messages')
          .select('created_at')
          .eq('id', options.before_message_id)
          .single();
        
        if (beforeMessage) {
          query = query.lt('created_at', beforeMessage.created_at);
        }
      }

      if (options.after_message_id) {
        // Get messages after a specific message (for loading newer messages)
        const { data: afterMessage } = await supabase
          .from('messages')
          .select('created_at')
          .eq('id', options.after_message_id)
          .single();
        
        if (afterMessage) {
          query = query.gt('created_at', afterMessage.created_at);
        }
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      query = query.order('created_at', { ascending: false });

      const { data: messages, error } = await query;

      if (error) {throw error;}

      // Mark messages as read
      await this.markMessagesAsRead(conversationId, userId);

      return { data: (messages || []).reverse(), error: null };
    } catch (error) {
      console.error('Error fetching messages:', error);
      return { 
        data: [], 
        error: error instanceof Error ? error.message : 'Failed to fetch messages' 
      };
    }
  }

  /**
   * Send a message
   */
  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    messageType: 'text' | 'image' | 'file' = 'text',
    fileData?: {
      file_url: string;
      file_name: string;
      file_type: string;
      file_size: number;
    },
    replyToMessageId?: string
  ) {
    try {
      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          content: content,
          message_type: messageType,
          file_url: fileData?.file_url,
          file_name: fileData?.file_name,
          file_type: fileData?.file_type,
          file_size: fileData?.file_size,
          reply_to_message_id: replyToMessageId,
          is_edited: false,
          is_read: false,
          read_by: [senderId]
        })
        .select(`
          *,
          sender:user_profiles!sender_id (
            display_name, profile_image_url
          )
        `)
        .single();

      if (error) {throw error;}

      // Update conversation last activity
      await supabase
        .from('gradnet_conversations')
        .update({ 
          last_activity: new Date().toISOString() 
        })
        .eq('id', conversationId);

      // Send notification to other participants
      await this.notifyParticipants(conversationId, senderId, message);

      return { data: message, error: null };
    } catch (error) {
      console.error('Error sending message:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to send message' 
      };
    }
  }

  /**
   * Create or get conversation
   */
  async createOrGetConversation(
    participants: string[],
    conversationType: 'direct' | 'group' | 'support' = 'direct',
    title?: string,
    description?: string
  ) {
    try {
      // For direct conversations, check if one already exists
      if (conversationType === 'direct' && participants.length === 2) {
        const { data: existingConversation } = await supabase
          .from('gradnet_conversations')
          .select('*')
          .eq('conversation_type', 'direct')
          .contains('participants', participants)
          .containedBy('participants', participants)
          .single();

        if (existingConversation) {
          return { data: existingConversation, error: null };
        }
      }

      // Create new conversation
      const { data: conversation, error } = await supabase
        .from('gradnet_conversations')
        .insert({
          participants,
          conversation_type: conversationType,
          title,
          description,
          last_activity: new Date().toISOString(),
          is_archived: false,
          is_muted: false,
          created_by: participants[0]
        })
        .select()
        .single();

      if (error) {throw error;}

      return { data: conversation, error: null };
    } catch (error) {
      console.error('Error creating conversation:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to create conversation' 
      };
    }
  }

  /**
   * Edit a message
   */
  async editMessage(messageId: string, senderId: string, newContent: string) {
    try {
      const { data: message, error } = await supabase
        .from('messages')
        .update({
          content: newContent,
          is_edited: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .eq('sender_id', senderId)
        .select()
        .single();

      if (error) {throw error;}

      return { data: message, error: null };
    } catch (error) {
      console.error('Error editing message:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to edit message' 
      };
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string, senderId: string) {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)
        .eq('sender_id', senderId);

      if (error) {throw error;}

      return { error: null };
    } catch (error) {
      console.error('Error deleting message:', error);
      return { error: error instanceof Error ? error.message : 'Failed to delete message' };
    }
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(conversationId: string, userId: string) {
    try {
      const { error } = await supabase
        .from('messages')
        .update({
          is_read: true,
          read_by: supabase.raw(`array_append(read_by, '${userId}')`)
        })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId)
        .eq('is_read', false);

      if (error) {throw error;}

      return { error: null };
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return { error: error instanceof Error ? error.message : 'Failed to mark messages as read' };
    }
  }

  /**
   * Archive/unarchive conversation
   */
  async toggleConversationArchive(conversationId: string, userId: string, archived: boolean) {
    try {
      const { error } = await supabase
        .from('gradnet_conversations')
        .update({ is_archived: archived })
        .eq('id', conversationId)
        .contains('participants', [userId]);

      if (error) {throw error;}

      return { error: null };
    } catch (error) {
      console.error('Error toggling conversation archive:', error);
      return { error: error instanceof Error ? error.message : 'Failed to archive conversation' };
    }
  }

  /**
   * Mute/unmute conversation
   */
  async toggleConversationMute(conversationId: string, userId: string, muted: boolean) {
    try {
      const { error } = await supabase
        .from('gradnet_conversations')
        .update({ is_muted: muted })
        .eq('id', conversationId)
        .contains('participants', [userId]);

      if (error) {throw error;}

      return { error: null };
    } catch (error) {
      console.error('Error toggling conversation mute:', error);
      return { error: error instanceof Error ? error.message : 'Failed to mute conversation' };
    }
  }

  /**
   * Save message draft
   */
  async saveMessageDraft(conversationId: string, userId: string, content: string, replyToMessageId?: string) {
    try {
      const { error } = await supabase
        .from('message_drafts')
        .upsert({
          conversation_id: conversationId,
          user_id: userId,
          content,
          reply_to_message_id: replyToMessageId,
          saved_at: new Date().toISOString()
        });

      if (error) {throw error;}

      return { error: null };
    } catch (error) {
      console.error('Error saving draft:', error);
      return { error: error instanceof Error ? error.message : 'Failed to save draft' };
    }
  }

  /**
   * Get message draft
   */
  async getMessageDraft(conversationId: string, userId: string) {
    try {
      const { data: draft, error } = await supabase
        .from('message_drafts')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {throw error;}

      return { data: draft, error: null };
    } catch (error) {
      console.error('Error fetching draft:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to fetch draft' 
      };
    }
  }

  /**
   * Subscribe to conversation updates
   */
  subscribeToConversation(
    conversationId: string,
    onNewMessage: (message: Message) => void,
    onMessageUpdate: (message: Message) => void,
    onMessageDelete: (messageId: string) => void
  ) {
    const subscriptionKey = `conversation_${conversationId}`;
    
    // Unsubscribe existing subscription
    this.unsubscribeFromConversation(conversationId);

    const subscription = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          // Fetch complete message with sender info
          const { data: message } = await supabase
            .from('messages')
            .select(`
              *,
              sender:user_profiles!sender_id (
                display_name, profile_image_url
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (message) {
            onNewMessage(message);
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
          const { data: message } = await supabase
            .from('messages')
            .select(`
              *,
              sender:user_profiles!sender_id (
                display_name, profile_image_url
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (message) {
            onMessageUpdate(message);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          onMessageDelete(payload.old.id);
        }
      )
      .subscribe();

    this.subscriptions.set(subscriptionKey, subscription);

    return subscription;
  }

  /**
   * Unsubscribe from conversation
   */
  unsubscribeFromConversation(conversationId: string) {
    const subscriptionKey = `conversation_${conversationId}`;
    const subscription = this.subscriptions.get(subscriptionKey);
    
    if (subscription) {
      supabase.removeChannel(subscription);
      this.subscriptions.delete(subscriptionKey);
    }
  }

  /**
   * Subscribe to conversations list updates
   */
  subscribeToConversations(
    userId: string,
    onConversationUpdate: (conversation: Conversation) => void
  ) {
    const subscriptionKey = `conversations_${userId}`;
    
    // Unsubscribe existing subscription
    this.unsubscribeFromConversations(userId);

    const subscription = supabase
      .channel(`conversations:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations'
        },
        async (payload) => {
          // Check if user is participant
          if (payload.new && payload.new.participants?.includes(userId)) {
            onConversationUpdate(payload.new as Conversation);
          }
        }
      )
      .subscribe();

    this.subscriptions.set(subscriptionKey, subscription);

    return subscription;
  }

  /**
   * Unsubscribe from conversations
   */
  unsubscribeFromConversations(userId: string) {
    const subscriptionKey = `conversations_${userId}`;
    const subscription = this.subscriptions.get(subscriptionKey);
    
    if (subscription) {
      supabase.removeChannel(subscription);
      this.subscriptions.delete(subscriptionKey);
    }
  }

  /**
   * Clean up all subscriptions
   */
  unsubscribeAll() {
    for (const [key, subscription] of this.subscriptions) {
      supabase.removeChannel(subscription);
    }
    this.subscriptions.clear();
  }

  /**
   * Private helper methods
   */
  private async getUnreadMessageCount(conversationId: string, userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id', { count: 'exact' })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId)
        .eq('is_read', false);

      if (error) {throw error;}

      return data?.length || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  private async getParticipantsInfo(participantIds: string[]) {
    try {
      const { data: participants, error } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, profile_image_url')
        .in('user_id', participantIds);

      if (error) {throw error;}

      return participants?.map(p => ({
        id: p.user_id,
        display_name: p.display_name,
        profile_image_url: p.profile_image_url,
        is_online: false, // TODO: Implement presence system
        last_seen: undefined
      })) || [];
    } catch (error) {
      console.error('Error getting participants info:', error);
      return [];
    }
  }

  private async notifyParticipants(conversationId: string, senderId: string, message: Message) {
    try {
      // Get conversation participants
      const { data: conversation } = await supabase
        .from('gradnet_conversations')
        .select('participants')
        .eq('id', conversationId)
        .single();

      if (!conversation) {return;}

      // Get sender info
      const { data: sender } = await supabase
        .from('user_profiles')
        .select('display_name')
        .eq('user_id', senderId)
        .single();

      // Send notifications to other participants
      const otherParticipants = conversation.participants.filter((id: string) => id !== senderId);
      
      for (const participantId of otherParticipants) {
        // This would integrate with the notification service
        // await notificationService.createNotification(participantId, {
        //   title: `New message from ${sender?.display_name || 'Someone'}`,
        //   message: message.content.substring(0, 100) + (message.content.length > 100 ? '...' : ''),
        //   type: 'info',
        //   category: 'message',
        //   action_url: `/messages/${conversationId}`,
        //   action_label: 'View Message'
        // });
      }
    } catch (error) {
      console.error('Error notifying participants:', error);
    }
  }
}

// Export singleton instance
export const communicationService = new CommunicationService();
export default communicationService;