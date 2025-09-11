import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Bell, BellRing } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { notificationService } from '../../services/notificationService';
import NotificationCenter from './NotificationCenter';

interface NotificationBellProps {
  user: User | null;
  className?: string;
}

export default function NotificationBell({ user, className = "" }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);

  useEffect(() => {
    if (user) {
      loadUnreadCount();
      
      // Subscribe to real-time updates
      const subscription = notificationService.subscribeToNotifications(
        user.id,
        (newNotification) => {
          setUnreadCount(prev => prev + 1);
          setHasNewNotification(true);
          
          // Clear the animation after 3 seconds
          setTimeout(() => setHasNewNotification(false), 3000);
        },
        (updatedNotification) => {
          if (updatedNotification.read) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        }
      );

      return () => {
        notificationService.unsubscribeFromNotifications(user.id);
      };
    }
  }, [user]);

  const loadUnreadCount = async () => {
    if (!user) {return;}

    try {
      const stats = await notificationService.getNotificationStats(user.id);
      setUnreadCount(stats.unread_count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const handleClick = () => {
    setIsOpen(true);
    setHasNewNotification(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    // Refresh count when closing
    loadUnreadCount();
  };

  if (!user) {return null;}

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClick}
        className={`relative p-2 hover:bg-gray-100 ${className}`}
      >
        {hasNewNotification ? (
          <BellRing className="h-5 w-5 text-gray-600 animate-pulse" />
        ) : (
          <Bell className="h-5 w-5 text-gray-600" />
        )}
        
        {unreadCount > 0 && (
          <Badge 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center p-0 min-w-[20px]"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      <NotificationCenter
        user={user}
        isOpen={isOpen}
        onClose={handleClose}
      />
    </>
  );
}