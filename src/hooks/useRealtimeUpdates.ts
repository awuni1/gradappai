import { useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { toast } from 'sonner';

interface UseRealtimeUpdatesProps {
  user: User;
  onMentorshipUpdate?: () => void;
  onSessionUpdate?: () => void;
  onConnectionRequest?: () => void;
  onNewMessage?: () => void;
  onNotification?: () => void;
}

export const useRealtimeUpdates = ({
  user,
  onMentorshipUpdate,
  onSessionUpdate,
  onConnectionRequest,
  onNewMessage,
  onNotification
}: UseRealtimeUpdatesProps) => {
  const channelsRef = useRef<RealtimeChannel[]>([]);

  useEffect(() => {
    if (!user) {return;}

    try {

    // Clean up existing channels
    channelsRef.current.forEach(channel => {
      supabase.removeChannel(channel);
    });
    channelsRef.current = [];

    // Subscribe to mentorship changes
    const mentorshipChannel = supabase
      .channel('mentorship_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mentorship_relationships',
          filter: `mentor_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Mentorship change detected:', payload);
          
          switch (payload.eventType) {
            case 'INSERT':
              toast.success('New student added to your mentorship!', {
                description: 'A student has joined your mentorship program.',
                duration: 5000
              });
              break;
            case 'UPDATE':
              if (payload.new.status !== payload.old?.status) {
                toast.info('Mentorship status updated', {
                  description: `Status changed to ${payload.new.status}`,
                  duration: 4000
                });
              }
              break;
            case 'DELETE':
              toast.info('Mentorship ended', {
                description: 'A mentorship has been concluded.',
                duration: 4000
              });
              break;
          }
          
          onMentorshipUpdate?.();
        }
      )
      .subscribe();

    // Subscribe to session changes
    const sessionChannel = supabase
      .channel('session_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mentorship_sessions',
          filter: `mentorship_id=in.(SELECT id FROM mentorship_relationships WHERE mentor_id = '${user.id}')`
        },
        (payload) => {
          console.log('Session change detected:', payload);
          
          switch (payload.eventType) {
            case 'INSERT':
              toast.success('New session scheduled!', {
                description: `Session "${payload.new.title}" has been created.`,
                duration: 5000
              });
              break;
            case 'UPDATE':
              if (payload.new.status !== payload.old?.status) {
                const statusMessages = {
                  'in_progress': 'Session started',
                  'completed': 'Session completed',
                  'cancelled': 'Session cancelled',
                  'no_show': 'Student did not attend'
                };
                
                toast.info(statusMessages[payload.new.status] || 'Session updated', {
                  description: `"${payload.new.title}" status changed.`,
                  duration: 4000
                });
              }
              break;
            case 'DELETE':
              toast.info('Session removed', {
                description: 'A scheduled session has been deleted.',
                duration: 4000
              });
              break;
          }
          
          onSessionUpdate?.();
        }
      )
      .subscribe();

    // Subscribe to connection requests
    const connectionChannel = supabase
      .channel('connection_requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mentorship_requests',
          filter: `mentor_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Connection request change detected:', payload);
          
          switch (payload.eventType) {
            case 'INSERT':
              toast.success('New mentorship request!', {
                description: 'A student has requested mentorship from you.',
                duration: 6000,
                action: {
                  label: 'View Requests',
                  onClick: () => {
                    // This could navigate to the requests page
                    console.log('Navigate to requests');
                  }
                }
              });
              break;
            case 'UPDATE':
              if (payload.new.status === 'accepted') {
                toast.success('Request accepted!', {
                  description: 'You have accepted a mentorship request.',
                  duration: 4000
                });
              }
              break;
          }
          
          onConnectionRequest?.();
        }
      )
      .subscribe();

    // Subscribe to new messages
    const messageChannel = supabase
      .channel('new_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=in.(SELECT id FROM conversations WHERE '${user.id}' = ANY(participants))`
        },
        (payload) => {
          console.log('New message detected:', payload);
          
          // Only show notification if the message is not from the current user
          if (payload.new.sender_id !== user.id) {
            toast.info('New message received', {
              description: 'You have a new message.',
              duration: 5000,
              action: {
                label: 'View',
                onClick: () => {
                  // Navigate to messages
                  window.location.href = '/gradnet?tab=messages';
                }
              }
            });
            
            onNewMessage?.();
          }
        }
      )
      .subscribe();

    // Subscribe to notifications
    const notificationChannel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('New notification detected:', payload);
          
          const notification = payload.new;
          
          // Show toast notification based on type
          switch (notification.type) {
            case 'connection_request':
              toast.success(notification.title, {
                description: notification.message,
                duration: 6000,
                action: {
                  label: 'View Request',
                  onClick: () => {
                    if (notification.action_url) {
                      window.location.href = notification.action_url;
                    }
                  }
                }
              });
              break;
            case 'connection_accepted':
              toast.success(notification.title, {
                description: notification.message,
                duration: 5000
              });
              break;
            case 'new_message':
              // Don't show toast for messages as they're handled above
              break;
            default:
              toast.info(notification.title, {
                description: notification.message,
                duration: 4000
              });
          }
          
          onNotification?.();
        }
      )
      .subscribe();

    // Store channels for cleanup
    channelsRef.current = [
      mentorshipChannel,
      sessionChannel,
      connectionChannel,
      messageChannel,
      notificationChannel
    ];

    } catch (error) {
      console.error('Error setting up real-time updates:', error);
      // Continue without real-time updates if there's an error
    }

    // Cleanup function
    return () => {
      try {
        channelsRef.current.forEach(channel => {
          supabase.removeChannel(channel);
        });
        channelsRef.current = [];
      } catch (error) {
        console.error('Error cleaning up real-time channels:', error);
      }
    };
  }, [user, onMentorshipUpdate, onSessionUpdate, onConnectionRequest, onNewMessage, onNotification]);

  // Return cleanup function for manual cleanup if needed
  return {
    cleanup: () => {
      channelsRef.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
      channelsRef.current = [];
    }
  };
};