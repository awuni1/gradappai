import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Notification {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  related_id?: string;
  read: boolean;
  created_at: string;
}

interface NotificationStats {
  unreadCount: number;
  totalCount: number;
}

export const useNotifications = (user: User | null) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats>({
    unreadCount: 0,
    totalCount: 0
  });
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    if (!user) {return;}

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // Use real notifications from database, empty array if none available

      const notificationData = data || [];
      setNotifications(notificationData);

      // Calculate stats
      const unreadCount = notificationData.filter(n => !n.read).length;
      setStats({
        unreadCount,
        totalCount: notificationData.length
      });

    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', user?.id);

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // Update local state
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );

      // Update stats
      setStats(prev => ({
        ...prev,
        unreadCount: Math.max(0, prev.unreadCount - 1)
      }));

    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user?.id)
        .eq('read', false);

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // Update local state
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, read: true }))
      );

      // Update stats
      setStats(prev => ({
        ...prev,
        unreadCount: 0
      }));

    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user?.id);

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // Update local state
      const notificationToDelete = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));

      // Update stats
      setStats(prev => ({
        totalCount: prev.totalCount - 1,
        unreadCount: notificationToDelete && !notificationToDelete.read
          ? prev.unreadCount - 1
          : prev.unreadCount
      }));

    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const createNotification = async (
    title: string,
    message: string,
    type: string,
    relatedId?: string
  ) => {
    if (!user) {return;}

    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          title,
          message,
          notification_type: type,
          related_id: relatedId,
          read: false
        })
        .select()
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        // Add to local state
        setNotifications(prev => [data, ...prev]);
        setStats(prev => ({
          totalCount: prev.totalCount + 1,
          unreadCount: prev.unreadCount + 1
        }));
      }

    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'connection_request': return 'user-plus';
      case 'session_reminder': return 'clock';
      case 'session_completed': return 'check-circle';
      case 'document_shared': return 'file-text';
      case 'new_message': return 'message-circle';
      case 'system': return 'info';
      default: return 'bell';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'connection_request': return 'text-blue-600 bg-blue-100';
      case 'session_reminder': return 'text-orange-600 bg-orange-100';
      case 'session_completed': return 'text-green-600 bg-green-100';
      case 'document_shared': return 'text-purple-600 bg-purple-100';
      case 'new_message': return 'text-indigo-600 bg-indigo-100';
      case 'system': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) {return 'Just now';}
    if (diffMinutes < 60) {return `${diffMinutes}m ago`;}
    if (diffHours < 24) {return `${diffHours}h ago`;}
    if (diffDays < 7) {return `${diffDays}d ago`;}
    return date.toLocaleDateString();
  };

  useEffect(() => {
    loadNotifications();
  }, [user]);

  return {
    notifications,
    stats,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    refreshNotifications: loadNotifications,
    getNotificationIcon,
    getNotificationColor,
    formatTimeAgo
  };
};