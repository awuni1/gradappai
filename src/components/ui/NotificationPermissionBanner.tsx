import React, { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  BellOff, 
  CheckCircle, 
  AlertCircle, 
  Settings, 
  X, 
  Smartphone,
  Clock,
  MessageCircle,
  Users
} from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface NotificationPermissionBannerProps {
  user: User;
  onDismiss?: () => void;
  showTestButton?: boolean;
  className?: string;
}

const NotificationPermissionBanner: React.FC<NotificationPermissionBannerProps> = ({
  user,
  onDismiss,
  showTestButton = true,
  className = ''
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const {
    isSupported,
    isSubscribed,
    permission,
    isLoading,
    error,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification
  } = usePushNotifications(user);

  // Don't show banner if dismissed, not supported, or already subscribed
  if (isDismissed || !isSupported) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  const handleEnable = async () => {
    if (permission === 'granted' && !isSubscribed) {
      await subscribe();
    } else {
      await requestPermission();
    }
  };

  const handleDisable = async () => {
    await unsubscribe();
  };

  // Permission status indicators
  const getPermissionStatus = () => {
    if (isSubscribed) {
      return {
        icon: <CheckCircle className="h-5 w-5 text-green-600" />,
        label: 'Enabled',
        color: 'bg-green-100 text-green-800'
      };
    }
    
    switch (permission) {
      case 'granted':
        return {
          icon: <Bell className="h-5 w-5 text-blue-600" />,
          label: 'Available',
          color: 'bg-blue-100 text-blue-800'
        };
      case 'denied':
        return {
          icon: <BellOff className="h-5 w-5 text-red-600" />,
          label: 'Blocked',
          color: 'bg-red-100 text-red-800'
        };
      default:
        return {
          icon: <AlertCircle className="h-5 w-5 text-yellow-600" />,
          label: 'Not Set',
          color: 'bg-yellow-100 text-yellow-800'
        };
    }
  };

  const status = getPermissionStatus();

  // Show different UI based on notification status
  if (isSubscribed) {
    return (
      <Card className={`border-green-200 bg-green-50 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <h3 className="font-medium text-green-900">Push Notifications Active</h3>
                <p className="text-sm text-green-700">
                  You'll receive notifications for session reminders, new messages, and mentorship updates.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {showTestButton && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={sendTestNotification}
                  disabled={isLoading}
                  className="border-green-300 text-green-700 hover:bg-green-100"
                >
                  <Bell className="h-3 w-3 mr-1" />
                  Test
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={handleDisable}
                disabled={isLoading}
                className="border-green-300 text-green-700 hover:bg-green-100"
              >
                <Settings className="h-3 w-3 mr-1" />
                Manage
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                className="text-green-600 hover:bg-green-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (permission === 'denied') {
    return (
      <Card className={`border-red-200 bg-red-50 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BellOff className="h-5 w-5 text-red-600" />
              <div>
                <h3 className="font-medium text-red-900">Notifications Blocked</h3>
                <p className="text-sm text-red-700">
                  To receive important mentorship updates, please enable notifications in your browser settings.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open('https://support.google.com/chrome/answer/3220216?hl=en', '_blank')}
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                <Settings className="h-3 w-3 mr-1" />
                Help
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                className="text-red-600 hover:bg-red-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default: Show permission request banner
  return (
    <Card className={`border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Bell className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Stay Connected with Your Students
              </h3>
              <p className="text-gray-700 mb-4">
                Enable push notifications to get instant alerts for important mentorship activities. 
                Never miss a session reminder or urgent message from your students.
              </p>
              
              {/* Benefits list */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span>Session reminders</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MessageCircle className="h-4 w-4 text-green-500" />
                  <span>New messages</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="h-4 w-4 text-purple-500" />
                  <span>Mentorship requests</span>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-700">{error}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
            className="text-gray-400 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <Badge className={status.color}>
              {status.icon}
              <span className="ml-1">{status.label}</span>
            </Badge>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Smartphone className="h-3 w-3" />
              <span>Works even when browser is closed</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleDismiss}
              disabled={isLoading}
            >
              Maybe Later
            </Button>
            <Button
              onClick={handleEnable}
              disabled={isLoading}
              className="bg-gradapp-primary hover:bg-gradapp-accent"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Setting up...
                </>
              ) : (
                <>
                  <Bell className="h-4 w-4 mr-2" />
                  Enable Notifications
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationPermissionBanner;