import { useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { useRealtimeUpdates } from './useRealtimeUpdates';
import { toast } from 'sonner';

interface UseMentorRealtimeUpdatesProps {
  user: User;
  onStudentListUpdate?: () => void;
  onConnectionRequestUpdate?: () => void;
  onNotificationUpdate?: () => void;
}

export const useMentorRealtimeUpdates = ({
  user,
  onStudentListUpdate,
  onConnectionRequestUpdate,
  onNotificationUpdate
}: UseMentorRealtimeUpdatesProps) => {

  // Handle mentorship relationship updates
  const handleMentorshipUpdate = useCallback(() => {
    console.log('Mentorship relationship updated');
    onStudentListUpdate?.();
  }, [onStudentListUpdate]);

  // Handle connection request updates
  const handleConnectionRequest = useCallback(() => {
    console.log('Connection request updated');
    onConnectionRequestUpdate?.();
    onStudentListUpdate?.(); // Also refresh student list to update connection status
  }, [onConnectionRequestUpdate, onStudentListUpdate]);

  // Handle new message notifications
  const handleNewMessage = useCallback(() => {
    console.log('New message received');
    // Could add specific message handling here
  }, []);

  // Handle general notifications
  const handleNotification = useCallback(() => {
    console.log('New notification received');
    onNotificationUpdate?.();
  }, [onNotificationUpdate]);

  // Use the enhanced real-time updates hook
  const realtimeUpdates = useRealtimeUpdates({
    user,
    onMentorshipUpdate: handleMentorshipUpdate,
    onConnectionRequest: handleConnectionRequest,
    onNewMessage: handleNewMessage,
    onNotification: handleNotification
  });

  return {
    ...realtimeUpdates,
    // Additional mentor-specific methods if needed
    refreshStudentList: onStudentListUpdate,
    refreshConnectionRequests: onConnectionRequestUpdate
  };
};

export default useMentorRealtimeUpdates;