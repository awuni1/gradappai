import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import AuthenticatedHeader from '@/components/AuthenticatedHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  Mail, 
  Smartphone, 
  Settings, 
  CheckCircle, 
  AlertCircle,
  Clock,
  MessageCircle,
  Users,
  Calendar,
  BarChart3,
  Shield,
  Loader2,
  Save,
  TestTube
} from 'lucide-react';
import { toast } from 'sonner';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import emailNotificationService, { EmailPreferences } from '@/services/emailNotificationService';

interface NotificationSettingsState {
  // Push notification preferences
  pushNotifications: {
    enabled: boolean;
    sessionReminders: boolean;
    connectionRequests: boolean;
    newMessages: boolean;
    mentorshipUpdates: boolean;
    systemNotifications: boolean;
  };
  
  // Email notification preferences
  emailNotifications: EmailPreferences;
  
  // General settings
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
  
  // Frequency settings
  digestFrequency: 'daily' | 'weekly' | 'monthly' | 'disabled';
}

const NotificationSettings: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<NotificationSettingsState>({
    pushNotifications: {
      enabled: false,
      sessionReminders: true,
      connectionRequests: true,
      newMessages: true,
      mentorshipUpdates: true,
      systemNotifications: false
    },
    emailNotifications: {
      sessionReminders: true,
      connectionRequests: true,
      newMessages: true,
      weeklyDigest: true,
      mentorshipUpdates: true,
      systemNotifications: true,
      frequency: 'immediate',
      unsubscribed: false
    },
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00'
    },
    digestFrequency: 'weekly'
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const navigate = useNavigate();

  // Push notification hook
  const pushNotifications = usePushNotifications(user || undefined);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      setUser(user);
    };
    getUser();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      loadNotificationSettings();
    }
  }, [user]);

  // Update push notification settings when push hook state changes
  useEffect(() => {
    if (pushNotifications.isSubscribed !== undefined) {
      setSettings(prev => ({
        ...prev,
        pushNotifications: {
          ...prev.pushNotifications,
          enabled: pushNotifications.isSubscribed
        }
      }));
    }
  }, [pushNotifications.isSubscribed]);

  const loadNotificationSettings = async () => {
    setLoading(true);
    try {
      // Load email preferences
      const emailPrefs = await emailNotificationService.getEmailPreferences(user!.id);
      
      // Load push notification preferences (would come from database in production)
      const { data: pushPrefs } = await supabase
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (emailPrefs) {
        setSettings(prev => ({
          ...prev,
          emailNotifications: emailPrefs
        }));
      }

      if (pushPrefs) {
        setSettings(prev => ({
          ...prev,
          pushNotifications: {
            enabled: pushNotifications.isSubscribed,
            sessionReminders: pushPrefs.push_session_reminders ?? true,
            connectionRequests: pushPrefs.push_connection_requests ?? true,
            newMessages: pushPrefs.push_new_messages ?? true,
            mentorshipUpdates: pushPrefs.push_mentorship_updates ?? true,
            systemNotifications: pushPrefs.push_system_notifications ?? false
          },
          quietHours: {
            enabled: pushPrefs.quiet_hours_enabled ?? false,
            startTime: pushPrefs.quiet_hours_start ?? '22:00',
            endTime: pushPrefs.quiet_hours_end ?? '08:00'
          },
          digestFrequency: pushPrefs.digest_frequency ?? 'weekly'
        }));
      }

    } catch (error) {
      console.error('Error loading notification settings:', error);
      toast.error('Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (category: keyof NotificationSettingsState, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  const handlePushToggle = async (enabled: boolean) => {
    if (enabled) {
      const success = await pushNotifications.subscribe();
      if (success) {
        handleSettingChange('pushNotifications', 'enabled', true);
      }
    } else {
      const success = await pushNotifications.unsubscribe();
      if (success) {
        handleSettingChange('pushNotifications', 'enabled', false);
      }
    }
  };

  const saveSettings = async () => {
    if (!user) {return;}

    setSaving(true);
    try {
      // Save email preferences
      await emailNotificationService.updateEmailPreferences(user.id, settings.emailNotifications);

      // Save push notification preferences
      await supabase
        .from('user_notification_preferences')
        .upsert({
          user_id: user.id,
          push_session_reminders: settings.pushNotifications.sessionReminders,
          push_connection_requests: settings.pushNotifications.connectionRequests,
          push_new_messages: settings.pushNotifications.newMessages,
          push_mentorship_updates: settings.pushNotifications.mentorshipUpdates,
          push_system_notifications: settings.pushNotifications.systemNotifications,
          quiet_hours_enabled: settings.quietHours.enabled,
          quiet_hours_start: settings.quietHours.startTime,
          quiet_hours_end: settings.quietHours.endTime,
          digest_frequency: settings.digestFrequency,
          updated_at: new Date().toISOString()
        });

      setHasChanges(false);
      toast.success('Notification settings saved successfully!');

    } catch (error) {
      console.error('Error saving notification settings:', error);
      toast.error('Failed to save notification settings');
    } finally {
      setSaving(false);
    }
  };

  const testNotifications = async () => {
    try {
      // Test push notification
      if (pushNotifications.isSubscribed) {
        await pushNotifications.sendTestNotification();
      }

      // Test email notification (in development mode)
      if (emailNotificationService.isAvailable() && user?.email) {
        await emailNotificationService.sendEmail({
          to: user.email,
          templateId: 'session_reminder',
          variables: {
            mentorName: user.user_metadata?.display_name || 'Test User',
            sessionTitle: 'Test Session',
            studentName: 'Test Student',
            sessionDateTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toLocaleString(),
            sessionDuration: '1 hour',
            timeUntilSession: 'in 2 hours (this is a test)',
            sessionLink: window.location.origin + '/mentor/students'
          }
        });
        toast.success('Test notifications sent!');
      } else {
        toast.info('Email testing not available in current environment');
      }

    } catch (error) {
      console.error('Error testing notifications:', error);
      toast.error('Failed to send test notifications');
    }
  };

  if (loading) {
    return (
      <>
        <AuthenticatedHeader />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-gradapp-primary" />
            <span className="text-gray-600">Loading notification settings...</span>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AuthenticatedHeader />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="container mx-auto py-8 px-4 max-w-4xl">
          
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gradapp-primary mb-2 flex items-center gap-3">
                  <Settings className="h-8 w-8" />
                  Notification Settings
                </h1>
                <p className="text-gray-600 text-lg">
                  Customize how and when you receive notifications
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={testNotifications}
                  disabled={!pushNotifications.isSubscribed && !emailNotificationService.isAvailable()}
                >
                  <TestTube className="h-4 w-4 mr-2" />
                  Test Notifications
                </Button>
                <Button 
                  onClick={saveSettings} 
                  disabled={!hasChanges || saving}
                  className="bg-gradapp-primary hover:bg-gradapp-accent"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            
            {/* Push Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Push Notifications
                  {pushNotifications.isSubscribed ? (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-800">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Inactive
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!pushNotifications.isSupported && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm text-yellow-700">
                        Push notifications are not supported in this browser
                      </span>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Enable Push Notifications</h3>
                    <p className="text-sm text-gray-600">
                      Receive instant notifications even when the browser is closed
                    </p>
                  </div>
                  <Switch
                    checked={settings.pushNotifications.enabled}
                    onCheckedChange={handlePushToggle}
                    disabled={!pushNotifications.isSupported || pushNotifications.isLoading}
                  />
                </div>

                {settings.pushNotifications.enabled && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">Push Notification Types</h4>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-blue-500" />
                            <span className="text-sm">Session Reminders</span>
                          </div>
                          <Switch
                            checked={settings.pushNotifications.sessionReminders}
                            onCheckedChange={(value) => handleSettingChange('pushNotifications', 'sessionReminders', value)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-green-500" />
                            <span className="text-sm">Connection Requests</span>
                          </div>
                          <Switch
                            checked={settings.pushNotifications.connectionRequests}
                            onCheckedChange={(value) => handleSettingChange('pushNotifications', 'connectionRequests', value)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MessageCircle className="h-4 w-4 text-purple-500" />
                            <span className="text-sm">New Messages</span>
                          </div>
                          <Switch
                            checked={settings.pushNotifications.newMessages}
                            onCheckedChange={(value) => handleSettingChange('pushNotifications', 'newMessages', value)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-orange-500" />
                            <span className="text-sm">Mentorship Updates</span>
                          </div>
                          <Switch
                            checked={settings.pushNotifications.mentorshipUpdates}
                            onCheckedChange={(value) => handleSettingChange('pushNotifications', 'mentorshipUpdates', value)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">System Notifications</span>
                          </div>
                          <Switch
                            checked={settings.pushNotifications.systemNotifications}
                            onCheckedChange={(value) => handleSettingChange('pushNotifications', 'systemNotifications', value)}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Email Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Notifications
                  {!settings.emailNotifications.unsubscribed ? (
                    <Badge className="bg-blue-100 text-blue-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Unsubscribed
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Enable Email Notifications</h3>
                    <p className="text-sm text-gray-600">
                      Receive notifications via email to {user?.email}
                    </p>
                  </div>
                  <Switch
                    checked={!settings.emailNotifications.unsubscribed}
                    onCheckedChange={(value) => handleSettingChange('emailNotifications', 'unsubscribed', !value)}
                  />
                </div>

                {!settings.emailNotifications.unsubscribed && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">Email Notification Types</h4>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-blue-500" />
                            <span className="text-sm">Session Reminders</span>
                          </div>
                          <Switch
                            checked={settings.emailNotifications.sessionReminders}
                            onCheckedChange={(value) => handleSettingChange('emailNotifications', 'sessionReminders', value)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-green-500" />
                            <span className="text-sm">Connection Requests</span>
                          </div>
                          <Switch
                            checked={settings.emailNotifications.connectionRequests}
                            onCheckedChange={(value) => handleSettingChange('emailNotifications', 'connectionRequests', value)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MessageCircle className="h-4 w-4 text-purple-500" />
                            <span className="text-sm">New Messages</span>
                          </div>
                          <Switch
                            checked={settings.emailNotifications.newMessages}
                            onCheckedChange={(value) => handleSettingChange('emailNotifications', 'newMessages', value)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-indigo-500" />
                            <span className="text-sm">Weekly Digest</span>
                          </div>
                          <Switch
                            checked={settings.emailNotifications.weeklyDigest}
                            onCheckedChange={(value) => handleSettingChange('emailNotifications', 'weeklyDigest', value)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-orange-500" />
                            <span className="text-sm">Mentorship Updates</span>
                          </div>
                          <Switch
                            checked={settings.emailNotifications.mentorshipUpdates}
                            onCheckedChange={(value) => handleSettingChange('emailNotifications', 'mentorshipUpdates', value)}
                          />
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h4 className="font-medium text-sm mb-2">Email Frequency</h4>
                        <select
                          value={settings.emailNotifications.frequency}
                          onChange={(e) => handleSettingChange('emailNotifications', 'frequency', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        >
                          <option value="immediate">Immediate</option>
                          <option value="daily">Daily Digest</option>
                          <option value="weekly">Weekly Digest</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Quiet Hours */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Quiet Hours
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Enable Quiet Hours</h3>
                    <p className="text-sm text-gray-600">
                      Pause non-urgent notifications during specified hours
                    </p>
                  </div>
                  <Switch
                    checked={settings.quietHours.enabled}
                    onCheckedChange={(value) => handleSettingChange('quietHours', 'enabled', value)}
                  />
                </div>

                {settings.quietHours.enabled && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Start Time</label>
                        <input
                          type="time"
                          value={settings.quietHours.startTime}
                          onChange={(e) => handleSettingChange('quietHours', 'startTime', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">End Time</label>
                        <input
                          type="time"
                          value={settings.quietHours.endTime}
                          onChange={(e) => handleSettingChange('quietHours', 'endTime', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotificationSettings;