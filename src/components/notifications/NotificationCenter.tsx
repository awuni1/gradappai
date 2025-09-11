import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  Archive,
  Settings,
  Filter,
  MoreHorizontal,
  Calendar,
  GraduationCap,
  Users,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  Eye,
  EyeOff
} from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { notificationService, type Notification, type NotificationPreferences } from '../../services/notificationService';
import { toast } from 'sonner';

interface NotificationCenterProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationCenter({ user, isOpen, onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    today: 0,
    thisWeek: 0
  });

  useEffect(() => {
    if (user && isOpen) {
      loadNotifications();
      loadPreferences();
      loadStats();

      // Subscribe to real-time updates
      const subscription = notificationService.subscribeToNotifications(
        user.id,
        (newNotification) => {
          setNotifications(prev => [newNotification, ...prev]);
          updateStats();
        },
        (updatedNotification) => {
          setNotifications(prev => prev.map(n => 
            n.id === updatedNotification.id ? updatedNotification : n
          ));
          updateStats();
        }
      );

      return () => {
        notificationService.unsubscribeFromNotifications(user.id);
      };
    }
  }, [user, isOpen]);

  const loadNotifications = async () => {
    if (!user) {return;}

    try {
      setLoading(true);
      const { data } = await notificationService.getUserNotifications(user.id, {
        limit: 50
      });
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPreferences = async () => {
    if (!user) {return;}

    try {
      const { data } = await notificationService.getNotificationPreferences(user.id);
      setPreferences(data);
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const loadStats = async () => {
    if (!user) {return;}

    try {
      const notificationStats = await notificationService.getNotificationStats(user.id);
      setStats({
        total: notificationStats.total_notifications,
        unread: notificationStats.unread_count,
        today: notificationStats.today_count,
        thisWeek: notificationStats.this_week_count
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const updateStats = () => {
    const unread = notifications.filter(n => !n.read).length;
    const today = notifications.filter(n => {
      const notificationDate = new Date(n.created_at);
      const today = new Date();
      return notificationDate.toDateString() === today.toDateString();
    }).length;

    setStats(prev => ({
      ...prev,
      unread,
      today
    }));
  };

  const handleMarkAsRead = async (notificationId: string) => {
    if (!user) {return;}

    try {
      await notificationService.markAsRead(notificationId, user.id);
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
      updateStats();
    } catch (error) {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) {return;}

    try {
      await notificationService.markAllAsRead(user.id);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      updateStats();
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all notifications as read');
    }
  };

  const handleArchive = async (notificationId: string) => {
    if (!user) {return;}

    try {
      await notificationService.archiveNotification(notificationId, user.id);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      updateStats();
      toast.success('Notification archived');
    } catch (error) {
      toast.error('Failed to archive notification');
    }
  };

  const handleDelete = async (notificationId: string) => {
    if (!user) {return;}

    try {
      await notificationService.deleteNotification(notificationId, user.id);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      updateStats();
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const handleBulkAction = async (action: 'read' | 'archive' | 'delete') => {
    if (!user || selectedNotifications.length === 0) {return;}

    try {
      switch (action) {
        case 'read':
          await notificationService.bulkMarkAsRead(selectedNotifications, user.id);
          setNotifications(prev => prev.map(n => 
            selectedNotifications.includes(n.id) ? { ...n, read: true } : n
          ));
          break;
        case 'archive':
          await notificationService.bulkArchive(selectedNotifications, user.id);
          setNotifications(prev => prev.filter(n => !selectedNotifications.includes(n.id)));
          break;
        case 'delete':
          await notificationService.bulkDelete(selectedNotifications, user.id);
          setNotifications(prev => prev.filter(n => !selectedNotifications.includes(n.id)));
          break;
      }
      
      setSelectedNotifications([]);
      updateStats();
      toast.success(`${selectedNotifications.length} notifications ${action === 'read' ? 'marked as read' : action + 'd'}`);
    } catch (error) {
      toast.error(`Failed to ${action} notifications`);
    }
  };

  const handlePreferenceUpdate = async (updates: Partial<NotificationPreferences>) => {
    if (!user) {return;}

    try {
      const { data } = await notificationService.updateNotificationPreferences(user.id, updates);
      setPreferences(data);
      toast.success('Notification preferences updated');
    } catch (error) {
      toast.error('Failed to update preferences');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'deadline':
        return <Clock className="h-5 w-5 text-orange-500" />;
      case 'application':
        return <GraduationCap className="h-5 w-5 text-blue-500" />;
      case 'social':
        return <Users className="h-5 w-5 text-purple-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {return 'Just now';}
    if (diffInSeconds < 3600) {return `${Math.floor(diffInSeconds / 60)}m ago`;}
    if (diffInSeconds < 86400) {return `${Math.floor(diffInSeconds / 3600)}h ago`;}
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (activeTab) {
      case 'unread':
        return !notification.read;
      case 'urgent':
        return notification.priority === 'urgent' || notification.priority === 'high';
      case 'applications':
        return notification.category === 'application';
      case 'deadlines':
        return notification.category === 'deadline';
      default:
        return true;
    }
  });

  if (!isOpen) {return null;}

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-6 w-6 text-blue-600" />
              <DialogTitle>Notifications</DialogTitle>
              {stats.unread > 0 && (
                <Badge className="bg-red-500 text-white">
                  {stats.unread}
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="h-4 w-4" />
              </Button>
              {selectedNotifications.length > 0 && (
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('read')}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('archive')}
                  >
                    <Archive className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('delete')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={stats.unread === 0}
              >
                <CheckCheck className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col h-full">
          {/* Stats Overview */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-red-600">{stats.unread}</div>
                <div className="text-xs text-muted-foreground">Unread</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.today}</div>
                <div className="text-xs text-muted-foreground">Today</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-green-600">{stats.thisWeek}</div>
                <div className="text-xs text-muted-foreground">This Week</div>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">Unread ({stats.unread})</TabsTrigger>
              <TabsTrigger value="urgent">Urgent</TabsTrigger>
              <TabsTrigger value="applications">Applications</TabsTrigger>
              <TabsTrigger value="deadlines">Deadlines</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="flex-1 mt-4">
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : filteredNotifications.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No notifications found</p>
                    </div>
                  ) : (
                    filteredNotifications.map((notification) => (
                      <Card key={notification.id} 
                        className={`p-4 hover:shadow-md transition-shadow cursor-pointer ${
                          !notification.read ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''
                        } ${selectedNotifications.includes(notification.id) ? 'ring-2 ring-blue-200' : ''}`}
                        onClick={() => {
                          if (!notification.read) {
                            handleMarkAsRead(notification.id);
                          }
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedNotifications.includes(notification.id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                if (e.target.checked) {
                                  setSelectedNotifications(prev => [...prev, notification.id]);
                                } else {
                                  setSelectedNotifications(prev => prev.filter(id => id !== notification.id));
                                }
                              }}
                              className="rounded"
                            />
                            {getNotificationIcon(notification.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className={`font-medium ${!notification.read ? 'font-semibold' : ''}`}>
                                    {notification.title}
                                  </h4>
                                  <Badge className={`text-xs ${getPriorityColor(notification.priority)}`}>
                                    {notification.priority}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {notification.message}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>{formatTimeAgo(notification.created_at)}</span>
                                  <span>•</span>
                                  <span className="capitalize">{notification.category}</span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-1 ml-2">
                                {notification.action_url && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.open(notification.action_url, '_blank');
                                    }}
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleArchive(notification.id);
                                  }}
                                >
                                  <Archive className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(notification.id);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            {notification.action_url && notification.action_label && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(notification.action_url, '_blank');
                                }}
                              >
                                {notification.action_label}
                                <ExternalLink className="h-4 w-4 ml-2" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>

          {/* Settings Panel */}
          {showSettings && preferences && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <Switch
                      id="email-notifications"
                      checked={preferences.email_notifications}
                      onCheckedChange={(checked) => 
                        handlePreferenceUpdate({ email_notifications: checked })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="push-notifications">Push Notifications</Label>
                    <Switch
                      id="push-notifications"
                      checked={preferences.push_notifications}
                      onCheckedChange={(checked) => 
                        handlePreferenceUpdate({ push_notifications: checked })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="deadline-reminders">Deadline Reminders</Label>
                    <Switch
                      id="deadline-reminders"
                      checked={preferences.deadline_reminders}
                      onCheckedChange={(checked) => 
                        handlePreferenceUpdate({ deadline_reminders: checked })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="application-updates">Application Updates</Label>
                    <Switch
                      id="application-updates"
                      checked={preferences.application_updates}
                      onCheckedChange={(checked) => 
                        handlePreferenceUpdate({ application_updates: checked })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="social-notifications">Social Notifications</Label>
                    <Switch
                      id="social-notifications"
                      checked={preferences.social_notifications}
                      onCheckedChange={(checked) => 
                        handlePreferenceUpdate({ social_notifications: checked })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="weekly-digest">Weekly Digest</Label>
                    <Switch
                      id="weekly-digest"
                      checked={preferences.weekly_digest}
                      onCheckedChange={(checked) => 
                        handlePreferenceUpdate({ weekly_digest: checked })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}