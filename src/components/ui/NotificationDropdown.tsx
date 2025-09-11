import React from 'react';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuHeader,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bell,
  Check,
  CheckCheck,
  Trash2,
  UserPlus,
  Clock,
  CheckCircle,
  FileText,
  MessageCircle,
  Info,
  Settings,
  Loader2
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

interface NotificationDropdownProps {
  user: User;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ user }) => {
  const {
    notifications,
    stats,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getNotificationIcon,
    getNotificationColor,
    formatTimeAgo
  } = useNotifications(user);

  const getIcon = (type: string) => {
    switch (type) {
      case 'connection_request': return <UserPlus className="h-4 w-4" />;
      case 'session_reminder': return <Clock className="h-4 w-4" />;
      case 'session_completed': return <CheckCircle className="h-4 w-4" />;
      case 'document_shared': return <FileText className="h-4 w-4" />;
      case 'new_message': return <MessageCircle className="h-4 w-4" />;
      case 'system': return <Info className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {stats.unreadCount > 0 && (
            <Badge 
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-red-500 text-white text-xs"
            >
              {stats.unreadCount > 9 ? '9+' : stats.unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold">Notifications</h3>
          <div className="flex items-center gap-2">
            {stats.unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs"
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
            <Button variant="ghost" size="sm">
              <Settings className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-6">
            <Loader2 className="h-6 w-6 animate-spin text-gradapp-primary" />
            <span className="ml-2 text-sm text-gray-600">Loading notifications...</span>
          </div>
        ) : notifications.length > 0 ? (
          <ScrollArea className="max-h-96">
            <div className="p-2">
              {notifications.slice(0, 10).map((notification) => (
                <div
                  key={notification.id}
                  className={`
                    flex items-start gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors
                    ${!notification.read ? 'bg-blue-50/50' : ''}
                  `}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <div className={`
                    p-2 rounded-full ${getNotificationColor(notification.notification_type)}
                    ${!notification.read ? 'ring-2 ring-blue-200' : ''}
                  `}>
                    {getIcon(notification.notification_type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(notification.created_at)}
                          </span>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 ml-2">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="h-6 w-6 p-0"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="p-6 text-center">
            <Bell className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <h3 className="text-sm font-medium text-gray-700 mb-1">No notifications</h3>
            <p className="text-xs text-gray-500">You're all caught up!</p>
          </div>
        )}

        {notifications.length > 10 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button variant="ghost" className="w-full text-sm">
                View all notifications
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationDropdown;