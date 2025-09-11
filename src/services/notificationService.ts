import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'application' | 'deadline' | 'social' | 'system';
  category: 'general' | 'application' | 'deadline' | 'message' | 'achievement' | 'system';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  read: boolean;
  archived: boolean;
  action_url?: string;
  action_label?: string;
  metadata?: any;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  email_notifications: boolean;
  push_notifications: boolean;
  deadline_reminders: boolean;
  application_updates: boolean;
  social_notifications: boolean;
  weekly_digest: boolean;
  immediate_alerts: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationStats {
  total_notifications: number;
  unread_count: number;
  today_count: number;
  this_week_count: number;
  by_type: Record<string, number>;
  by_priority: Record<string, number>;
}

class NotificationService {
  private subscriptions = new Map<string, any>();

  /**
   * Get user notifications with pagination and filtering
   */
  async getUserNotifications(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      unread_only?: boolean;
      type?: string;
      category?: string;
      priority?: string;
    } = {}
  ) {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        // Remove archived filter as column doesn't exist in schema;

      // Apply filters
      if (options.unread_only) {
        query = query.eq('read', false);
      }

      if (options.type) {
        query = query.eq('type', options.type);
      }

      if (options.category) {
        query = query.eq('category', options.category);
      }

      if (options.priority) {
        query = query.eq('priority', options.priority);
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, (options.offset + (options.limit || 10)) - 1);
      }

      // Order by created_at descending, priority
      query = query.order('priority', { ascending: false })
                  .order('created_at', { ascending: false });

      const { data: notifications, error } = await query;

      if (error) {throw error;}

      return { data: notifications || [], error: null };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return { 
        data: [], 
        error: error instanceof Error ? error.message : 'Failed to fetch notifications' 
      };
    }
  }

  /**
   * Create a new notification
   */
  async createNotification(
    userId: string,
    notificationData: {
      title: string;
      message: string;
      type: Notification['type'];
      category: Notification['category'];
      priority?: Notification['priority'];
      action_url?: string;
      action_label?: string;
      metadata?: any;
      expires_at?: string;
    }
  ) {
    try {
      const { data: notification, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title: notificationData.title,
          message: notificationData.message,
          type: notificationData.type,
          category: notificationData.category,
          priority: notificationData.priority || 'normal',
          action_url: notificationData.action_url,
          action_label: notificationData.action_label,
          metadata: notificationData.metadata,
          expires_at: notificationData.expires_at,
          read: false,
          archived: false
        })
        .select()
        .single();

      if (error) {throw error;}

      // Show toast notification for high priority items
      if (notificationData.priority === 'high' || notificationData.priority === 'urgent') {
        this.showToastNotification(notification);
      }

      return { data: notification, error: null };
    } catch (error) {
      console.error('Error creating notification:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to create notification' 
      };
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          read: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) {throw error;}

      return { error: null };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return { error: error instanceof Error ? error.message : 'Failed to mark as read' };
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          read: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) {throw error;}

      return { error: null };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return { error: error instanceof Error ? error.message : 'Failed to mark all as read' };
    }
  }

  /**
   * Archive notification
   */
  async archiveNotification(notificationId: string, userId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          archived: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) {throw error;}

      return { error: null };
    } catch (error) {
      console.error('Error archiving notification:', error);
      return { error: error instanceof Error ? error.message : 'Failed to archive notification' };
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) {throw error;}

      return { error: null };
    } catch (error) {
      console.error('Error deleting notification:', error);
      return { error: error instanceof Error ? error.message : 'Failed to delete notification' };
    }
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(userId: string): Promise<NotificationStats> {
    try {
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('notification_type, priority, is_read, created_at')
        .eq('user_id', userId)
        // Remove archived filter as column doesn't exist in schema;

      if (error) {throw error;}

      if (!notifications || notifications.length === 0) {
        return {
          total_notifications: 0,
          unread_count: 0,
          today_count: 0,
          this_week_count: 0,
          by_type: {},
          by_priority: {}
        };
      }

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const stats = notifications.reduce((acc, notification) => {
        const createdAt = new Date(notification.created_at);
        
        // Count totals
        acc.total_notifications++;
        
        if (!notification.read) {
          acc.unread_count++;
        }
        
        if (createdAt >= today) {
          acc.today_count++;
        }
        
        if (createdAt >= weekAgo) {
          acc.this_week_count++;
        }
        
        // Count by type
        acc.by_type[notification.type] = (acc.by_type[notification.type] || 0) + 1;
        
        // Count by priority
        acc.by_priority[notification.priority] = (acc.by_priority[notification.priority] || 0) + 1;
        
        return acc;
      }, {
        total_notifications: 0,
        unread_count: 0,
        today_count: 0,
        this_week_count: 0,
        by_type: {} as Record<string, number>,
        by_priority: {} as Record<string, number>
      });

      return stats;
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      return {
        total_notifications: 0,
        unread_count: 0,
        today_count: 0,
        this_week_count: 0,
        by_type: {},
        by_priority: {}
      };
    }
  }

  /**
   * Get user notification preferences
   */
  async getNotificationPreferences(userId: string) {
    try {
      const { data: preferences, error } = await supabase
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // No preferences found, create default ones
        return this.createDefaultPreferences(userId);
      }

      if (error) {throw error;}

      return { data: preferences, error: null };
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to fetch preferences' 
      };
    }
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(
    userId: string, 
    preferences: Partial<NotificationPreferences>
  ) {
    try {
      const { data: updatedPreferences, error } = await supabase
        .from('user_notification_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {throw error;}

      return { data: updatedPreferences, error: null };
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to update preferences' 
      };
    }
  }

  /**
   * Subscribe to real-time notifications
   */
  subscribeToNotifications(
    userId: string,
    onNewNotification: (notification: Notification) => void,
    onNotificationUpdate: (notification: Notification) => void
  ) {
    const subscriptionKey = `notifications_${userId}`;
    
    // Unsubscribe existing subscription
    this.unsubscribeFromNotifications(userId);

    const subscription = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          onNewNotification(payload.new as Notification);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          onNotificationUpdate(payload.new as Notification);
        }
      )
      .subscribe();

    this.subscriptions.set(subscriptionKey, subscription);

    return subscription;
  }

  /**
   * Unsubscribe from notifications
   */
  unsubscribeFromNotifications(userId: string) {
    const subscriptionKey = `notifications_${userId}`;
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
   * Send system notification to user
   */
  async sendSystemNotification(
    userId: string,
    title: string,
    message: string,
    type: Notification['type'] = 'system',
    actionUrl?: string,
    actionLabel?: string
  ) {
    return this.createNotification(userId, {
      title,
      message,
      type,
      category: 'system',
      priority: 'normal',
      action_url: actionUrl,
      action_label: actionLabel
    });
  }

  /**
   * Send deadline reminder
   */
  async sendDeadlineReminder(
    userId: string,
    deadlineTitle: string,
    daysUntilDeadline: number,
    actionUrl?: string
  ) {
    const priority = daysUntilDeadline <= 3 ? 'urgent' : daysUntilDeadline <= 7 ? 'high' : 'normal';
    const message = daysUntilDeadline === 0 
      ? `${deadlineTitle} is due today!`
      : `${deadlineTitle} is due in ${daysUntilDeadline} day${daysUntilDeadline > 1 ? 's' : ''}`;

    return this.createNotification(userId, {
      title: 'Deadline Reminder',
      message,
      type: 'deadline',
      category: 'deadline',
      priority,
      action_url: actionUrl,
      action_label: 'View Application'
    });
  }

  /**
   * Send application status update
   */
  async sendApplicationUpdate(
    userId: string,
    universityName: string,
    status: string,
    actionUrl?: string
  ) {
    const statusMessages = {
      'submitted': `Your application to ${universityName} has been submitted successfully`,
      'under_review': `Your application to ${universityName} is now under review`,
      'interview': `You have been invited for an interview with ${universityName}`,
      'accepted': `Congratulations! You've been accepted to ${universityName}`,
      'rejected': `Your application to ${universityName} was not successful`,
      'waitlisted': `You've been placed on the waitlist for ${universityName}`
    };

    const priority = ['accepted', 'interview'].includes(status) ? 'high' : 'normal';
    const type = status === 'accepted' ? 'success' : status === 'rejected' ? 'error' : 'info';

    return this.createNotification(userId, {
      title: 'Application Update',
      message: statusMessages[status as keyof typeof statusMessages] || `Application status updated for ${universityName}`,
      type: type as Notification['type'],
      category: 'application',
      priority,
      action_url: actionUrl,
      action_label: 'View Application'
    });
  }

  /**
   * Private helper methods
   */
  private async createDefaultPreferences(userId: string) {
    try {
      const defaultPreferences = {
        user_id: userId,
        email_notifications: true,
        push_notifications: true,
        deadline_reminders: true,
        application_updates: true,
        social_notifications: true,
        weekly_digest: true,
        immediate_alerts: false,
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00'
      };

      const { data: preferences, error } = await supabase
        .from('user_notification_preferences')
        .insert(defaultPreferences)
        .select()
        .single();

      if (error) {throw error;}

      return { data: preferences, error: null };
    } catch (error) {
      console.error('Error creating default preferences:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to create default preferences' 
      };
    }
  }

  private showToastNotification(notification: Notification) {
    const toastOptions = {
      description: notification.message,
      duration: notification.priority === 'urgent' ? 10000 : 5000,
      action: notification.action_url ? {
        label: notification.action_label || 'View',
        onClick: () => window.location.href = notification.action_url!
      } : undefined
    };

    switch (notification.type) {
      case 'success':
        toast.success(notification.title, toastOptions);
        break;
      case 'error':
        toast.error(notification.title, toastOptions);
        break;
      case 'warning':
        toast.warning(notification.title, toastOptions);
        break;
      default:
        toast.info(notification.title, toastOptions);
        break;
    }
  }

  /**
   * Batch operations
   */
  async bulkMarkAsRead(notificationIds: string[], userId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          read: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .in('id', notificationIds);

      if (error) {throw error;}

      return { error: null };
    } catch (error) {
      console.error('Error bulk marking as read:', error);
      return { error: error instanceof Error ? error.message : 'Failed to mark notifications as read' };
    }
  }

  async bulkArchive(notificationIds: string[], userId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          archived: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .in('id', notificationIds);

      if (error) {throw error;}

      return { error: null };
    } catch (error) {
      console.error('Error bulk archiving:', error);
      return { error: error instanceof Error ? error.message : 'Failed to archive notifications' };
    }
  }

  async bulkDelete(notificationIds: string[], userId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId)
        .in('id', notificationIds);

      if (error) {throw error;}

      return { error: null };
    } catch (error) {
      console.error('Error bulk deleting:', error);
      return { error: error instanceof Error ? error.message : 'Failed to delete notifications' };
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;