import { notificationService } from '../services/notificationService';

/**
 * Utility functions to create test notifications for demonstration
 */

export const createTestNotifications = async (userId: string) => {
  const notifications = [
    {
      title: 'Application Deadline Reminder',
      message: 'Your application to Stanford University is due in 3 days. Make sure all documents are submitted.',
      type: 'deadline' as const,
      category: 'deadline' as const,
      priority: 'high' as const,
      action_url: '/application-tracking',
      action_label: 'View Application'
    },
    {
      title: 'New Message from Sarah Chen',
      message: 'Hi! I saw your post about machine learning research. Would love to connect and discuss opportunities.',
      type: 'social' as const,
      category: 'message' as const,
      priority: 'normal' as const,
      action_url: '/gradnet?tab=messages',
      action_label: 'Reply'
    },
    {
      title: 'CV Analysis Complete',
      message: 'Your CV has been analyzed. We found several areas for improvement and suggestions for strengthening your profile.',
      type: 'success' as const,
      category: 'general' as const,
      priority: 'normal' as const,
      action_url: '/cv-analysis',
      action_label: 'View Results'
    },
    {
      title: 'University Match Found',
      message: 'We found 5 new universities that match your research interests in artificial intelligence and machine learning.',
      type: 'info' as const,
      category: 'general' as const,
      priority: 'normal' as const,
      action_url: '/university-matching',
      action_label: 'View Matches'
    },
    {
      title: 'Weekly Progress Update',
      message: 'Great job this week! You completed 3 application requirements and connected with 2 new mentors.',
      type: 'achievement' as const,
      category: 'achievement' as const,
      priority: 'low' as const
    }
  ];

  try {
    for (const notification of notifications) {
      await notificationService.createNotification(userId, notification);
    }
    console.log('Test notifications created successfully');
    return true;
  } catch (error) {
    console.error('Error creating test notifications:', error);
    return false;
  }
};

export const createApplicationStatusNotification = async (userId: string, universityName: string, status: string) => {
  return notificationService.sendApplicationUpdate(userId, universityName, status, '/application-tracking');
};

export const createDeadlineReminder = async (userId: string, deadlineTitle: string, daysUntil: number) => {
  return notificationService.sendDeadlineReminder(userId, deadlineTitle, daysUntil, '/application-tracking');
};

export const createSystemNotification = async (userId: string, title: string, message: string) => {
  return notificationService.sendSystemNotification(userId, title, message, 'system');
};

export const createSocialNotification = async (userId: string, fromUser: string, message: string) => {
  return notificationService.createNotification(userId, {
    title: `New message from ${fromUser}`,
    message,
    type: 'social',
    category: 'message',
    priority: 'normal',
    action_url: '/gradnet?tab=messages',
    action_label: 'Reply'
  });
};