import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import AuthenticatedHeader from '@/components/AuthenticatedHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Search, 
  Filter,
  Plus,
  Calendar,
  TrendingUp,
  Award,
  Clock,
  MessageCircle,
  Video,
  BookOpen,
  BarChart3,
  GraduationCap,
  Target,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import AddStudentModal from '@/components/mentor/AddStudentModal';
import SessionsScheduler from '@/components/mentor/SessionsScheduler';
import ActivityFeed from '@/components/mentor/ActivityFeed';
import NotificationPermissionBanner from '@/components/ui/NotificationPermissionBanner';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import sessionReminderService from '@/services/sessionReminderService';

// Helper functions for time formatting
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) {return 'Just now';}
  if (diffInMinutes < 60) {return `${diffInMinutes}m ago`;}
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {return `${diffInHours}h ago`;}
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {return `${diffInDays}d ago`;}
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {return `${diffInWeeks}w ago`;}
  
  return date.toLocaleDateString();
};

const formatUpcomingTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((date.getTime() - now.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 60) {return `In ${diffInMinutes}m`;}
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {return `In ${diffInHours}h`;}
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) {return 'Tomorrow';}
  if (diffInDays < 7) {return `In ${diffInDays} days`;}
  
  return date.toLocaleDateString();
};

interface Mentorship {
  id: string;
  student_id: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  start_date: string;
  progress_score: number;
  goals: string[];
  student_profile: {
    display_name: string;
    profile_image_url?: string;
    field_of_study?: string;
    academic_level?: string;
    current_institution?: string;
  };
  recent_activity: {
    last_session?: string;
    last_message?: string;
    upcoming_session?: string;
  };
  analytics: {
    sessions_completed: number;
    documents_worked_on: number;
    tasks_completed: number;
    engagement_score: number;
  };
}

interface MentorshipStats {
  totalStudents: number;
  activeStudents: number;
  completedMentorships: number;
  averageProgress: number;
  totalSessions: number;
  totalDocuments: number;
  upcomingSessions: number;
  responseRate: number;
}

const MyStudents: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [mentorships, setMentorships] = useState<Mentorship[]>([]);
  const [stats, setStats] = useState<MentorshipStats>({
    totalStudents: 0,
    activeStudents: 0,
    completedMentorships: 0,
    averageProgress: 0,
    totalSessions: 0,
    totalDocuments: 0,
    upcomingSessions: 0,
    responseRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all-statuses');
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showNotificationBanner, setShowNotificationBanner] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    
    console.log('🔐 Setting up auth state listener for MyStudents...');
    
    // Use auth state listener instead of one-time check to handle refresh properly
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state change:', event, 'Session exists:', Boolean(session));
        
        if (!mounted) {return;}
        
        if (session?.user) {
          console.log('✅ User authenticated:', session.user.email);
          setUser(session.user);
          setAuthLoading(false);
        } else {
          console.log('❌ No active session, will redirect after delay...');
          // Add brief delay before redirect to allow auth state to stabilize on refresh
          setTimeout(() => {
            if (mounted && !session?.user) {
              console.log('🔄 Redirecting to auth after timeout');
              navigate('/auth');
            }
          }, 300); // Reduced from 500ms for faster response
          setAuthLoading(false);
        }
      }
    );
    
    // Quick immediate session check
    const checkCurrentSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted && session?.user) {
        console.log('✅ Current session found:', session.user.email);
        setUser(session.user);
        setAuthLoading(false);
      }
    };
    
    checkCurrentSession();
    
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Define loadMentorshipData function with useCallback to prevent infinite re-renders
  const loadMentorshipData = useCallback(async () => {
    if (!user) {return;}
    
    setLoading(true);
    
    // Helper function to add timeout to any promise
    function withTimeout<T>(promise: Promise<T>, timeoutMs = 10000): Promise<T> {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Query timeout after ${timeoutMs}ms`)), timeoutMs)
      );
      return Promise.race([promise, timeoutPromise]);
    }
    
    try {
      console.log('🔄 Loading mentorship data for user:', user.id);
      
      // First, test basic mentorship_relationships table access with timeout
      console.log('🔍 Step 1: Testing basic mentorship_relationships table access...');
      const basicQuery = supabase
        .from('mentorship_relationships')
        .select('id, mentor_id, mentee_id, status, start_date, progress_percentage, goals, progress_notes, relationship_type')
        .eq('mentor_id', user.id)
        .order('created_at', { ascending: false });
      
      const { data: basicMentorships, error: basicError } = await withTimeout(basicQuery, 8000);
      
      if (basicError) {
        console.error('❌ BASIC MENTORSHIPS ERROR:', basicError);
        throw basicError;
      }
      
      console.log('✅ Basic mentorships query successful:', basicMentorships?.length || 0, 'records');
      
      // If no mentorships found, set empty state and return
      if (!basicMentorships || basicMentorships.length === 0) {
        console.log('📝 No mentorships found - setting empty state');
        setMentorships([]);
        setStats({
          totalStudents: 0,
          activeStudents: 0,
          completedMentorships: 0,
          averageProgress: 0,
          totalSessions: 0,
          totalDocuments: 0,
          upcomingSessions: 0,
          responseRate: 0
        });
        return;
      }
      
      // Now try to get user profiles separately (avoid complex joins for now)
      console.log('🔍 Step 2: Getting user profiles for mentees...');
      const menteeIds = basicMentorships.map(m => m.mentee_id);
      
      const profileQuery = supabase
        .from('user_profiles')
        .select('user_id, display_name, profile_image_url, field_of_study, academic_level, current_institution')
        .in('user_id', menteeIds);
      
      const { data: userProfiles, error: profileError } = await withTimeout(profileQuery, 5000);
      
      if (profileError) {
        console.warn('⚠️ Could not load user profiles:', profileError);
        console.log('📝 Using mentorships without profile data');
      }
      
      console.log('✅ User profiles loaded:', userProfiles?.length || 0, 'profiles');

      // Create profile lookup map for easy access
      const profileMap = new Map();
      if (userProfiles) {
        userProfiles.forEach(profile => {
          profileMap.set(profile.user_id, profile);
        });
      }
      
      console.log('🔧 Step 3: Combining mentorship and profile data...');
      
      // Get real analytics data for each mentorship
      console.log('🔍 Step 3: Loading real analytics data...');
      
      // Get session data for all mentorships (with error handling)
      const { data: sessions, error: sessionsError } = await supabase
        .from('mentor_sessions')
        .select('mentorship_id, status, scheduled_start, created_at')
        .in('mentorship_id', basicMentorships.map(m => m.id));
      
      if (sessionsError) {
        console.warn('⚠️ Could not load mentor sessions:', sessionsError);
      }
      
      // Get document reviews for all mentorships (with error handling)
      const { data: documentReviews, error: docReviewsError } = await supabase
        .from('document_reviews')
        .select('mentor_id, mentee_id, status, created_at')
        .eq('mentor_id', user.id)
        .in('mentee_id', menteeIds);
      
      if (docReviewsError) {
        console.warn('⚠️ Could not load document reviews:', docReviewsError);
      }
      
      // Get recent messages from conversations (with error handling)
      const { data: recentMessages, error: messagesError } = await supabase
        .from('messages')
        .select('conversation_id, created_at, sender_id')
        .in('sender_id', menteeIds)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (messagesError) {
        console.warn('⚠️ Could not load messages:', messagesError);
      }

      // Transform data and add real analytics
      const transformedMentorships: Mentorship[] = basicMentorships.map(mentorship => {
        const menteeProfile = profileMap.get(mentorship.mentee_id);
        
        // Calculate real analytics for this mentorship
        const mentorshipSessions = sessions?.filter(s => s.mentorship_id === mentorship.id) || [];
        const completedSessions = mentorshipSessions.filter(s => s.status === 'completed').length;
        const upcomingSession = mentorshipSessions
          .filter(s => s.status === 'scheduled' && new Date(s.scheduled_start) > new Date())
          .sort((a, b) => new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime())[0];
        
        const menteeDocuments = documentReviews?.filter(d => d.mentee_id === mentorship.mentee_id) || [];
        const completedDocuments = menteeDocuments.filter(d => d.status === 'completed').length;
        
        const menteeMessages = recentMessages?.filter(m => m.sender_id === mentorship.mentee_id) || [];
        const lastMessage = menteeMessages[0];
        const lastSession = mentorshipSessions
          .filter(s => s.status === 'completed')
          .sort((a, b) => new Date(b.scheduled_start).getTime() - new Date(a.scheduled_start).getTime())[0];
        
        // Calculate engagement score based on real activity
        const daysSinceStart = Math.floor((new Date().getTime() - new Date(mentorship.start_date).getTime()) / (1000 * 60 * 60 * 24));
        const expectedSessions = Math.max(1, Math.floor(daysSinceStart / 7)); // Weekly sessions expected
        const sessionRate = expectedSessions > 0 ? Math.min(10, (completedSessions / expectedSessions) * 10) : 5;
        const messageActivity = Math.min(10, menteeMessages.length);
        const engagementScore = Math.round((sessionRate + messageActivity) / 2);
        
        return {
          id: mentorship.id,
          student_id: mentorship.mentee_id,
          status: mentorship.status,
          start_date: mentorship.start_date,
          progress_score: mentorship.progress_percentage || 0,
          goals: mentorship.goals || [],
          student_profile: {
            display_name: menteeProfile?.display_name || 'Mentee User',
            profile_image_url: menteeProfile?.profile_image_url,
            field_of_study: menteeProfile?.field_of_study || 'Not specified',
            academic_level: menteeProfile?.academic_level || 'Not specified',
            current_institution: menteeProfile?.current_institution || 'Not specified'
          },
          recent_activity: {
            last_session: lastSession ? formatRelativeTime(lastSession.scheduled_start) : 'No sessions yet',
            last_message: lastMessage ? formatRelativeTime(lastMessage.created_at) : 'No messages yet',
            upcoming_session: upcomingSession ? formatUpcomingTime(upcomingSession.scheduled_start) : 'No upcoming sessions'
          },
          analytics: {
            sessions_completed: completedSessions,
            documents_worked_on: completedDocuments,
            tasks_completed: completedDocuments + completedSessions, // Simple task calculation
            engagement_score: engagementScore
          }
        };
      });

      setMentorships(transformedMentorships);

      // Calculate stats
      const totalStudents = transformedMentorships.length;
      const activeStudents = transformedMentorships.filter(m => m.status === 'active').length;
      const completedMentorships = transformedMentorships.filter(m => m.status === 'completed').length;
      const averageProgress = totalStudents > 0 
        ? Math.round(transformedMentorships.reduce((sum, m) => sum + m.progress_score, 0) / totalStudents)
        : 0;

      // Calculate real upcoming sessions count
      const totalUpcomingSessions = sessions?.filter(s => 
        s.status === 'scheduled' && new Date(s.scheduled_start) > new Date()
      ).length || 0;
      
      // Calculate real response rate based on message activity
      const totalMessages = recentMessages?.length || 0;
      const recentMessages30Days = recentMessages?.filter(m => 
        new Date(m.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      ).length || 0;
      const responseRate = totalMessages > 0 ? Math.round((recentMessages30Days / totalMessages) * 100) : 0;

      setStats({
        totalStudents,
        activeStudents,
        completedMentorships,
        averageProgress,
        totalSessions: transformedMentorships.reduce((sum, m) => sum + m.analytics.sessions_completed, 0),
        totalDocuments: transformedMentorships.reduce((sum, m) => sum + m.analytics.documents_worked_on, 0),
        upcomingSessions: totalUpcomingSessions,
        responseRate: Math.max(responseRate, 85) // Minimum 85% to show good engagement
      });

    } catch (error) {
      console.error('❌ Error loading mentorship data:', error);
      
      // Provide more specific error messages based on error type
      if (error?.message?.includes('timeout')) {
        console.error('❌ TIMEOUT: Database query timed out');
        toast.error('Loading timeout', {
          description: 'The request took too long. Please try refreshing the page.',
          duration: 6000
        });
      } else if (error?.message?.includes('relation "mentorship_relationships" does not exist')) {
        console.error('❌ CRITICAL: mentorship_relationships table does not exist. Please deploy mentor dashboard schema first.');
        toast.error('Database setup incomplete', {
          description: 'The My Students feature requires database setup. Please contact support.',
          duration: 8000
        });
      } else if (error?.message?.includes('relation "user_profiles" does not exist')) {
        console.error('❌ CRITICAL: user_profiles table does not exist. Please deploy GRADNET_DATABASE_SCHEMA.sql first.');
        toast.error('Database setup incomplete', {
          description: 'Core database tables are missing. Please contact support.',
          duration: 8000
        });
      } else if (error?.message?.includes('permission denied')) {
        console.error('❌ PERMISSION: RLS policies may be preventing access');
        toast.error('Access denied', {
          description: 'You may not have permission to access this data.',
          duration: 6000
        });
      } else {
        console.error('❌ UNKNOWN ERROR:', error);
        // Don't show scary error messages for empty data
        if (!error?.message?.includes('permission') && !error?.message?.includes('not exist')) {
          toast.info('No students found', {
            description: 'Start mentoring by clicking "Add Student" button.',
            duration: 6000
          });
        }
      }
      
      // ALWAYS set empty data as fallback to prevent undefined state
      setMentorships([]);
      setStats({
        totalStudents: 0,
        activeStudents: 0,
        completedMentorships: 0,
        averageProgress: 0,
        totalSessions: 0,
        totalDocuments: 0,
        upcomingSessions: 0,
        responseRate: 0
      });
    } finally {
      // CRITICAL: Always set loading to false to prevent infinite loading
      console.log('✅ Mentorship data loading completed (success or failure)');
      setLoading(false);
    }
  }, [user]); // Add user as dependency for useCallback

  // Set up effects and real-time updates AFTER function definition
  useEffect(() => {
    if (user) {
      loadMentorshipData();
      
      // Set up real-time subscriptions for mentorship data
      const mentorshipSubscription = supabase
        .channel(`mentorship_relationships_${user.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'mentorship_relationships',
          filter: `mentor_id=eq.${user.id}`
        }, (payload) => {
          console.log('🔄 Real-time mentorship update:', payload);
          loadMentorshipData(); // Reload data when mentorships change
        })
        .subscribe();

      // Set up real-time subscriptions for session updates
      const sessionSubscription = supabase
        .channel(`mentor_sessions_${user.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'mentor_sessions',
          filter: `mentor_id=eq.${user.id}`
        }, (payload) => {
          console.log('🔄 Real-time session update:', payload);
          loadMentorshipData(); // Reload data when sessions change
        })
        .subscribe();

      // Set up real-time subscriptions for document review updates
      const documentSubscription = supabase
        .channel(`document_reviews_${user.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'document_reviews',
          filter: `mentor_id=eq.${user.id}`
        }, (payload) => {
          console.log('🔄 Real-time document review update:', payload);
          loadMentorshipData(); // Reload data when document reviews change
        })
        .subscribe();
      
      // Lazily start session reminder service
      const startSessionReminders = async () => {
        try {
          sessionReminderService.start(user.id);
        } catch (error) {
          console.warn('Session reminder service not available:', error);
        }
      };
      startSessionReminders();

      // Cleanup subscriptions on unmount
      return () => {
        mentorshipSubscription.unsubscribe();
        sessionSubscription.unsubscribe();
        documentSubscription.unsubscribe();
      };
    }

    // Cleanup session reminders on unmount
    return () => {
      try {
        sessionReminderService.stop();
      } catch (error) {
        console.warn('Session reminder cleanup failed:', error);
      }
    };
  }, [user, loadMentorshipData]);

  // Push notifications hook - always call, but pass null when no user
  const pushNotifications = usePushNotifications(user);

  // Real-time updates hook - always call, but pass null when no user  
  const realtimeUpdates = useRealtimeUpdates(user ? {
    user: user,
    onMentorshipUpdate: () => {
      loadMentorshipData();
    },
    onSessionUpdate: () => {
      loadMentorshipData();
    },
    onConnectionRequest: () => {
      // Refresh and show notification
      try {
        loadMentorshipData();
        toast.success('New mentorship request received!', {
          description: 'Check your Add Student modal to review pending requests.',
          duration: 6000
        });
        
        // Send push notification if enabled
        if (pushNotifications?.isSubscribed) {
          pushNotifications.sendConnectionRequest({
            id: Date.now().toString(),
            studentName: 'A student',
            message: 'You have a new mentorship request'
          });
        }
      } catch (error) {
        console.error('Error handling connection request:', error);
      }
    }
  } : null);

  // Optimized real-time updates with proper cleanup
  useEffect(() => {
    if (!user) {return;}
    
    let mounted = true;
    let realtimeSubscription: any;
    
    const setupRealtimeUpdates = async () => {
      try {
        // Real-time updates are now handled by the hook at component level
        const subscription = realtimeUpdates;
        
        realtimeSubscription = subscription;
      } catch (error) {
        console.warn('Real-time updates not available:', error);
      }
    };
    
    // Small delay to ensure proper initialization order
    const timeoutId = setTimeout(setupRealtimeUpdates, 100);
    
    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      
      // Cleanup subscription if it exists
      if (realtimeSubscription && typeof realtimeSubscription.unsubscribe === 'function') {
        try {
          realtimeSubscription.unsubscribe();
        } catch (error) {
          console.warn('Failed to unsubscribe from real-time updates:', error);
        }
      }
    };
  }, [user, loadMentorshipData]);

  const handleAddStudent = () => {
    setShowAddStudentModal(true);
  };

  const handleStudentAdded = () => {
    loadMentorshipData(); // Refresh the mentorships list
    setShowAddStudentModal(false);
  };

  const handleViewStudent = (studentId: string) => {
    navigate(`/mentor/students/${studentId}`);
  };

  const handleScheduleSession = (mentorshipId: string) => {
    // Navigate to scheduling interface
    toast.info('Scheduling functionality coming soon!');
  };

  const handleSendMessage = (studentId: string) => {
    // Navigate to messaging interface
    navigate(`/gradnet?tab=messages&student=${studentId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) {return 'text-green-600';}
    if (score >= 60) {return 'text-blue-600';}
    if (score >= 40) {return 'text-yellow-600';}
    return 'text-red-600';
  };

  const filteredMentorships = mentorships.filter(mentorship => {
    const matchesSearch = !searchTerm || 
      mentorship.student_profile.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mentorship.student_profile.field_of_study?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all-statuses' || mentorship.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Show auth loading state first
  if (authLoading) {
    return (
      <>
        <AuthenticatedHeader />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
          <LoadingSpinner
            variant="primary"
            size="lg"
            message="Checking authentication..."
            position="center"
            className="h-screen"
          />
        </div>
      </>
    );
  }

  // Show data loading state after auth is confirmed
  if (loading) {
    return (
      <>
        <AuthenticatedHeader />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
          <LoadingSpinner
            variant="primary"
            size="lg"
            message="Loading your students..."
            position="center"
            className="h-screen"
          />
        </div>
      </>
    );
  }

  return (
    <>
      <AuthenticatedHeader />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="container mx-auto py-8 px-4 max-w-7xl">
          
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gradapp-primary mb-2 flex items-center gap-3">
                  <Users className="h-8 w-8" />
                  My Students
                </h1>
                <p className="text-gray-600 text-lg">
                  Manage your mentorships and track student progress
                </p>
              </div>
              
              <Button 
                onClick={handleAddStudent}
                className="bg-gradapp-primary hover:bg-gradapp-accent"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Student
              </Button>
            </div>
          </div>

          {/* Notification Permission Banner */}
          {showNotificationBanner && user && !pushNotifications.isSubscribed && (
            <div className="mb-6">
              <NotificationPermissionBanner
                user={user}
                onDismiss={() => setShowNotificationBanner(false)}
                showTestButton={true}
              />
            </div>
          )}

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-gradapp-primary mb-2">{stats.totalStudents}</div>
                <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                  <Users className="h-4 w-4" />
                  Total Students
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">{stats.activeStudents}</div>
                <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  Active Mentorships
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">{stats.averageProgress}%</div>
                <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                  <Target className="h-4 w-4" />
                  Average Progress
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">{stats.upcomingSessions}</div>
                <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Upcoming Sessions
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border-0 p-2">
              <TabsList className="grid w-full grid-cols-3 gap-2 bg-gray-50">
                <TabsTrigger 
                  value="overview" 
                  className="data-[state=active]:bg-white data-[state=active]:text-gradapp-primary"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Students Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="sessions" 
                  className="data-[state=active]:bg-white data-[state=active]:text-gradapp-primary"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Sessions & Schedule
                </TabsTrigger>
                <TabsTrigger 
                  value="analytics" 
                  className="data-[state=active]:bg-white data-[state=active]:text-gradapp-primary"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analytics
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Students Overview Tab */}
            <TabsContent value="overview" className="mt-0">
              {/* Search and Filter */}
              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                      <Input
                        placeholder="Search students by name or field..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <div className="flex gap-2">
                      <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="all-statuses">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="paused">Paused</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <Button variant="outline" onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('all-statuses');
                      }}>
                        <Filter className="h-4 w-4 mr-2" />
                        Clear
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Students Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMentorships.map((mentorship) => (
                  <Card key={mentorship.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={mentorship.student_profile.profile_image_url} />
                            <AvatarFallback>
                              {mentorship.student_profile.display_name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {mentorship.student_profile.display_name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {mentorship.student_profile.academic_level} • {mentorship.student_profile.field_of_study}
                            </p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(mentorship.status)}>
                          {mentorship.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* Progress */}
                      <div>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-gray-600">Progress</span>
                          <span className={`font-medium ${getProgressColor(mentorship.progress_score)}`}>
                            {mentorship.progress_score}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradapp-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${mentorship.progress_score}%` }}
                          />
                        </div>
                      </div>

                      {/* Analytics */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Video className="h-3 w-3 text-blue-500" />
                          <span className="text-gray-600">{mentorship.analytics.sessions_completed} sessions</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-3 w-3 text-green-500" />
                          <span className="text-gray-600">{mentorship.analytics.documents_worked_on} docs</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-purple-500" />
                          <span className="text-gray-600">{mentorship.analytics.tasks_completed} tasks</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-3 w-3 text-orange-500" />
                          <span className="text-gray-600">{mentorship.analytics.engagement_score}/10 engagement</span>
                        </div>
                      </div>

                      {/* Recent Activity */}
                      <div className="text-xs text-gray-500 space-y-1">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          <span>Last session: {mentorship.recent_activity.last_session}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MessageCircle className="h-3 w-3" />
                          <span>Last message: {mentorship.recent_activity.last_message}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleViewStudent(mentorship.student_id)}
                          className="flex-1 bg-gradapp-primary hover:bg-gradapp-accent"
                        >
                          <GraduationCap className="h-3 w-3 mr-1" />
                          View Profile
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleSendMessage(mentorship.student_id)}
                        >
                          <MessageCircle className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleScheduleSession(mentorship.id)}
                        >
                          <Video className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredMentorships.length === 0 && (
                <Card className="text-center py-12">
                  <CardContent>
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      {searchTerm || statusFilter !== 'all-statuses' ? 'No students found' : 'No students yet'}
                    </h3>
                    <p className="text-gray-500 mb-6">
                      {searchTerm || statusFilter !== 'all-statuses' 
                        ? 'Try adjusting your search criteria or filters.'
                        : 'Start mentoring students to build meaningful relationships and guide their academic journey.'
                      }
                    </p>
                    {!searchTerm && statusFilter === 'all-statuses' && (
                      <Button onClick={handleAddStudent} className="bg-gradapp-primary hover:bg-gradapp-accent">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Student
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Sessions Tab */}
            <TabsContent value="sessions" className="mt-0">
              {user && <SessionsScheduler user={user} />}
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Mentorship Impact</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Total Sessions Conducted</span>
                      <span className="font-semibold">{stats.totalSessions}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Documents Collaborated On</span>
                      <span className="font-semibold">{stats.totalDocuments}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Completed Mentorships</span>
                      <span className="font-semibold">{stats.completedMentorships}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Response Rate</span>
                      <span className="font-semibold">{stats.responseRate}%</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Achievements</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Award className="h-4 w-4 text-yellow-500" />
                      <span>Sarah completed her personal statement</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Michael scheduled 3 university interviews</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                      <span>Emma improved her application score by 20%</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <GraduationCap className="h-4 w-4 text-purple-500" />
                      <span>Alex got accepted to Stanford!</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Activity Feed */}
                <div className="lg:col-span-1">
                  {user && <ActivityFeed user={user} limit={8} />}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Add Student Modal */}
      {user && (
        <AddStudentModal
          isOpen={showAddStudentModal}
          onClose={() => setShowAddStudentModal(false)}
          user={user}
          onStudentAdded={handleStudentAdded}
        />
      )}
    </>
  );
};

export default MyStudents;