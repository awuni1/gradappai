import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Shield, Globe, Moon, Save } from "lucide-react";

interface SettingsTabProps {
  user: any;
}

interface UserSettings {
  email_notifications: boolean;
  application_reminders: boolean;
  marketing_emails: boolean;
  language: string;
  timezone: string;
  two_factor_enabled: boolean;
}

const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese (Simplified)' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'nl', name: 'Dutch' },
  { code: 'sv', name: 'Swedish' },
  { code: 'no', name: 'Norwegian' },
  { code: 'da', name: 'Danish' },
  { code: 'fi', name: 'Finnish' },
  { code: 'pl', name: 'Polish' },
  { code: 'cs', name: 'Czech' },
  { code: 'hu', name: 'Hungarian' },
];

const timezones = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
  { code: 'America/Chicago', label: 'Central Time (US & Canada)' },
  { code: 'America/Denver', label: 'Mountain Time (US & Canada)' },
  { code: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
  { code: 'America/Anchorage', label: 'Alaska Time' },
  { code: 'Pacific/Honolulu', label: 'Hawaii Time' },
  { code: 'America/Toronto', label: 'Toronto (Eastern)' },
  { code: 'America/Vancouver', label: 'Vancouver (Pacific)' },
  { code: 'America/Mexico_City', label: 'Mexico City' },
  { code: 'America/Sao_Paulo', label: 'São Paulo' },
  { code: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires' },
  { code: 'Europe/London', label: 'London (GMT/BST)' },
  { code: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { code: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
  { code: 'Europe/Rome', label: 'Rome (CET/CEST)' },
  { code: 'Europe/Madrid', label: 'Madrid (CET/CEST)' },
  { code: 'Europe/Amsterdam', label: 'Amsterdam (CET/CEST)' },
  { code: 'Europe/Zurich', label: 'Zurich (CET/CEST)' },
  { code: 'Europe/Stockholm', label: 'Stockholm (CET/CEST)' },
  { code: 'Europe/Oslo', label: 'Oslo (CET/CEST)' },
  { code: 'Europe/Copenhagen', label: 'Copenhagen (CET/CEST)' },
  { code: 'Europe/Helsinki', label: 'Helsinki (EET/EEST)' },
  { code: 'Europe/Warsaw', label: 'Warsaw (CET/CEST)' },
  { code: 'Europe/Prague', label: 'Prague (CET/CEST)' },
  { code: 'Europe/Budapest', label: 'Budapest (CET/CEST)' },
  { code: 'Europe/Moscow', label: 'Moscow (MSK)' },
  { code: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { code: 'Asia/Seoul', label: 'Seoul (KST)' },
  { code: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { code: 'Asia/Hong_Kong', label: 'Hong Kong (HKT)' },
  { code: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { code: 'Asia/Bangkok', label: 'Bangkok (ICT)' },
  { code: 'Asia/Kolkata', label: 'Mumbai/Delhi (IST)' },
  { code: 'Asia/Dubai', label: 'Dubai (GST)' },
  { code: 'Asia/Riyadh', label: 'Riyadh (AST)' },
  { code: 'Asia/Jerusalem', label: 'Jerusalem (IST)' },
  { code: 'Africa/Cairo', label: 'Cairo (EET)' },
  { code: 'Africa/Johannesburg', label: 'Johannesburg (SAST)' },
  { code: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
  { code: 'Australia/Melbourne', label: 'Melbourne (AEST/AEDT)' },
  { code: 'Australia/Perth', label: 'Perth (AWST)' },
  { code: 'Pacific/Auckland', label: 'Auckland (NZST/NZDT)' },
];

export const SettingsTab: React.FC<SettingsTabProps> = ({ user }) => {
  const [settings, setSettings] = useState<UserSettings>({
    email_notifications: true,
    application_reminders: true,
    marketing_emails: false,
    language: 'en',
    timezone: 'UTC',
    two_factor_enabled: false,
  });
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const { toast } = useToast();

  // Load user settings on component mount
  useEffect(() => {
    if (user) {
      loadUserSettings();
    }
  }, [user]);


  const loadUserSettings = async () => {
    try {
      setIsLoadingSettings(true);
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        const newSettings = {
          email_notifications: data.email_notifications,
          application_reminders: data.application_reminders,
          marketing_emails: data.marketing_emails,
          language: data.language,
          timezone: data.timezone,
          two_factor_enabled: data.two_factor_enabled,
        };
        setSettings(newSettings);
        // Don't call setTheme here - let ThemeContext handle it
      } else {
        // No settings found, ensure white theme
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
      toast({
        title: "Error",
        description: "Failed to load your settings. Using defaults.",
        variant: "destructive",
      });
      // On error, ensure white theme
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const saveUserSettings = async (settingsToSave: UserSettings) => {
    try {
      // First check if settings exist
      const { data: existingSettings } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingSettings) {
        // Update existing record
        const { error } = await supabase
          .from('user_settings')
          .update({
            ...settingsToSave,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        if (error) {throw error;}
      } else {
        // Insert new record
        const { error } = await supabase
          .from('user_settings')
          .insert({
            user_id: user.id,
            ...settingsToSave,
          });

        if (error) {throw error;}
      }
    } catch (error) {
      console.error('Error saving user settings:', error);
      throw error;
    }
  };

  const handleSaveNotifications = async () => {
    setIsLoading(true);
    try {
      await saveUserSettings(settings);

      toast({
        title: "Settings updated",
        description: "Your notification preferences have been saved.",
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: "Error",
        description: "Failed to update notification preferences.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAppearance = async () => {
    setIsLoading(true);
    try {
      await saveUserSettings(settings);

      // Update theme in context

      toast({
        title: "Appearance updated",
        description: "Your appearance preferences have been saved.",
      });
    } catch (error) {
      console.error('Error updating appearance:', error);
      toast({
        title: "Error",
        description: "Failed to update appearance preferences.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveLanguageRegion = async () => {
    setIsLoading(true);
    try {
      await saveUserSettings(settings);

      toast({
        title: "Language & Region updated",
        description: "Your language and region preferences have been saved.",
      });
    } catch (error) {
      console.error('Error updating language & region:', error);
      toast({
        title: "Error",
        description: "Failed to update language & region preferences.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSecurity = async () => {
    setIsLoading(true);
    try {
      await saveUserSettings(settings);

      toast({
        title: "Security settings updated",
        description: "Your security preferences have been saved.",
      });
    } catch (error) {
      console.error('Error updating security settings:', error);
      toast({
        title: "Error",
        description: "Failed to update security settings.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords don't match.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {throw error;}

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
    } catch (error) {
      console.error('Error updating password:', error);
      toast({
        title: "Error",
        description: "Failed to update password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = (key: keyof UserSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleDarkModeToggle = (checked: boolean) => {
    // Dark mode disabled - do nothing
  };

  if (isLoadingSettings) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gradapp-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notifications Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Email Notifications</Label>
              <p className="text-sm text-gray-500">Receive notifications via email</p>
            </div>
            <Switch
              checked={settings.email_notifications}
              onCheckedChange={(checked) => updateSetting('email_notifications', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Application Reminders</Label>
              <p className="text-sm text-gray-500">Get reminders about upcoming deadlines</p>
            </div>
            <Switch
              checked={settings.application_reminders}
              onCheckedChange={(checked) => updateSetting('application_reminders', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Marketing Emails</Label>
              <p className="text-sm text-gray-500">Receive updates about new features</p>
            </div>
            <Switch
              checked={settings.marketing_emails}
              onCheckedChange={(checked) => updateSetting('marketing_emails', checked)}
            />
          </div>
          
          <Button onClick={handleSaveNotifications} disabled={isLoading} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            Save Notification Preferences
          </Button>
        </CardContent>
      </Card>

      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="h-5 w-5" />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Theme</Label>
              <p className="text-sm text-gray-500">Light theme (dark mode disabled)</p>
            </div>
            <Switch
              checked={false}
              disabled={true}
              onCheckedChange={() => {
                // Disabled switch - no action needed
              }}
            />
          </div>
          
          <Button onClick={handleSaveAppearance} disabled={isLoading} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            Save Appearance Preferences
          </Button>
        </CardContent>
      </Card>

      {/* Language & Region */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Language & Region
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Language</Label>
              <Select value={settings.language} onValueChange={(value) => updateSetting('language', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select value={settings.timezone} onValueChange={(value) => updateSetting('timezone', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button onClick={handleSaveLanguageRegion} disabled={isLoading} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            Save Language & Region Preferences
          </Button>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Two-Factor Authentication</Label>
              <p className="text-sm text-gray-500">Add an extra layer of security</p>
            </div>
            <Switch
              checked={settings.two_factor_enabled}
              onCheckedChange={(checked) => updateSetting('two_factor_enabled', checked)}
            />
          </div>
          
          <Button onClick={handleSaveSecurity} disabled={isLoading} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            Save Security Preferences
          </Button>
          
          <Separator />
          
          <div className="space-y-4">
            <h4 className="font-medium">Change Password</h4>
            <div className="space-y-3">
              <div>
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>
              <Button 
                onClick={handlePasswordChange} 
                disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                Update Password
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
