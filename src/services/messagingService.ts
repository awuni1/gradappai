import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { userProfileService } from '@/services/userProfileService';

export interface Conversation {
  id: string;
  participants: string[];
  conversation_type: string;
  title?: string;
  description?: string;
  is_archived: boolean;
  created_by: string;
  created_at: string;
  last_message_at: string;
  last_message_id?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'file' | 'image' | 'voice' | 'system' | 'meeting_link';
  attachments?: any;
  read_by: string[];
  edited_at?: string;
  parent_message_id?: string;
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
  message_type?: 'text' | 'file' | 'image' | 'voice' | 'system' | 'meeting_link';
  attachments?: any;
  parent_message_id?: string;
}

class MessagingService {
  private subscriptions = new Map<string, any>();

  /**
   * Get all conversations for the current user
   */
  async getConversations(userId: string): Promise<Conversation[]> {
    try {
      console.log('Loading conversations for user:', userId);
      
      const { data, error } = await supabase
        .from('gradnet_conversations')
        .select('*')
        .contains('participants', [userId])
        .order('last_message_at', { ascending: false });

      if (error) {throw error;}
      
      console.log('Found', data?.length || 0, 'conversations');
      return data || [];
    } catch (error: any) {
      console.error('Error fetching conversations:', error);
      
      // More specific error handling
      if (error.code === '42P01') {
        toast.error('Database tables not found. Please deploy the messaging schema first.');
        console.error('Missing database tables. Please run the GRADNET_DATABASE_SCHEMA.sql script.');
      } else if (error.code === 'PGRST116') {
        // No conversations found - this is normal, not an error
        console.log('No conversations found for user');
        return [];
      } else if (error.message?.includes('permission')) {
        toast.error('Permission denied. Please check your account access.');
      } else {
        toast.error('Failed to load conversations. Please try again.');
        console.error('Unexpected error:', error);
      }
      return [];
    }
  }

  /**
   * Get messages for a specific conversation
   */
  async getMessages(conversationId: string, limit = 50): Promise<Message[]> {
    try {
      console.log('Loading messages for conversation:', conversationId);
      
      // First, get the messages without complex joins
      const { data: messages, error: messagesError } = await supabase
        .from('gradnet_messages')
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
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, profile_image_url')
        .in('user_id', senderIds);

      if (profilesError) {
        console.warn('Error fetching user profiles, proceeding without profile data:', profilesError);
      }

      // Create a map of user profiles
      const profileMap = new Map();
      if (profiles) {
        profiles.forEach(profile => {
          profileMap.set(profile.user_id, profile);
        });
      }

      // Process messages with profile data
      const processedMessages = messages.map(message => {
        const senderProfile = profileMap.get(message.sender_id);
        
        return {
          ...message,
          sender: {
            id: message.sender_id,
            display_name: senderProfile?.display_name || 'Unknown User',
            profile_image_url: senderProfile?.profile_image_url
          }
        };
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

      // Create the message without complex joins
      const { data: messageResult, error: messageError } = await supabase
        .from('gradnet_messages')
        .insert({
          ...messageData,
          sender_id: senderId,
          read_by: [senderId] // Mark as read by sender
        })
        .select('*')
        .single();

      if (messageError) {throw messageError;}

      // Update conversation's last_message_at
      await supabase
        .from('gradnet_conversations')
        .update({ 
          last_message_at: new Date().toISOString(),
          last_message_id: messageResult.id
        })
        .eq('id', messageData.conversation_id);

      // Build the complete message object with profile data
      const processedMessage: Message = {
        ...messageResult,
        sender: {
          id: senderId,
          display_name: userProfile.display_name || 'Unknown User',
          profile_image_url: userProfile.profile_image_url
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
      const { data, error } = await supabase
        .from('gradnet_conversations')
        .insert({
          participants,
          conversation_type: conversationType,
          title,
          created_by: createdBy
        })
        .select()
        .single();

      if (error) {throw error;}
      return data;
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error('Failed to create conversation');
      return null;
    }
  }

  /**
   * Find or create a direct conversation between two users
   */
  async getOrCreateDirectConversation(user1Id: string, user2Id: string): Promise<string | null> {
    try {
      // First, try to find existing conversation
      const { data: existingConv, error: searchError } = await supabase
        .from('gradnet_conversations')
        .select('id')
        .eq('conversation_type', 'direct')
        .or(`participants.cs.{${user1Id},${user2Id}},participants.cs.{${user2Id},${user1Id}}`)
        .single();

      if (!searchError && existingConv) {
        return existingConv.id;
      }

      // Create new conversation if none exists
      const newConv = await this.createConversation(
        [user1Id, user2Id],
        'direct',
        undefined,
        user1Id
      );

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
    try {
      // Get unread messages in the conversation
      const { data: unreadMessages, error: fetchError } = await supabase
        .from('gradnet_messages')
        .select('id, read_by')
        .eq('conversation_id', conversationId)
        .not('read_by', 'cs', `{${userId}}`);

      if (fetchError) {throw fetchError;}

      if (unreadMessages && unreadMessages.length > 0) {
        // Update each message to include the user in read_by array
        const updates = unreadMessages.map(message => {
          const updatedReadBy = [...(message.read_by || []), userId];
          return supabase
            .from('gradnet_messages')
            .update({ read_by: updatedReadBy })
            .eq('id', message.id);
        });

        await Promise.all(updates);
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  /**
   * Upload file for message attachment
   */
  async uploadMessageFile(file: File, conversationId: string, userId: string): Promise<string | null> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${conversationId}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('gradnet_messages')
        .upload(fileName, file);

      if (error) {throw error;}

      const { data: { publicUrl } } = supabase.storage
        .from('gradnet_messages')
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
          // Fetch the complete message with sender info
          const { data } = await supabase
            .from('gradnet_messages')
            .select(`
              *,
              sender:sender_id (
                id,
                display_name:user_profiles(display_name),
                profile_image_url:user_profiles(profile_image_url)
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            const processedMessage = {
              ...data,
              sender: {
                id: data.sender.id,
                display_name: data.sender.display_name?.[0]?.display_name || 'Unknown User',
                profile_image_url: data.sender.profile_image_url?.[0]?.profile_image_url
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
          // Fetch the complete updated message
          const { data } = await supabase
            .from('gradnet_messages')
            .select(`
              *,
              sender:sender_id (
                id,
                display_name:user_profiles(display_name),
                profile_image_url:user_profiles(profile_image_url)
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            const processedMessage = {
              ...data,
              sender: {
                id: data.sender.id,
                display_name: data.sender.display_name?.[0]?.display_name || 'Unknown User',
                profile_image_url: data.sender.profile_image_url?.[0]?.profile_image_url
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
          const conversations = await this.getConversations(userId);
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
      const conversations = await this.getConversations(userId);
      const conversationIds = conversations.map(c => c.id);

      if (conversationIds.length === 0) {return [];}

      const { data, error } = await supabase
        .from('gradnet_messages')
        .select(`
          *,
          sender:sender_id (
            id,
            display_name:user_profiles(display_name),
            profile_image_url:user_profiles(profile_image_url)
          )
        `)
        .in('conversation_id', conversationIds)
        .ilike('content', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {throw error;}

      const processedMessages = data?.map(message => ({
        ...message,
        sender: {
          id: message.sender.id,
          display_name: message.sender.display_name?.[0]?.display_name || 'Unknown User',
          profile_image_url: message.sender.profile_image_url?.[0]?.profile_image_url
        }
      })) || [];

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
      const { error } = await supabase
        .from('gradnet_messages')
        .update({ 
          content: '[Message deleted]',
          edited_at: new Date().toISOString()
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
      const { error } = await supabase
        .from('gradnet_messages')
        .update({ 
          content: newContent,
          edited_at: new Date().toISOString()
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
}

// Export singleton instance
export const messagingService = new MessagingService();