import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar,
  Clock,
  Video,
  Plus,
  ChevronLeft,
  ChevronRight,
  MapPin,
  User as UserIcon,
  FileText,
  MessageCircle,
  Edit,
  Trash2,
  Play,
  Loader2,
  CalendarDays,
  Filter,
  Search
} from 'lucide-react';
import { toast } from 'sonner';
import UpcomingSessions from './UpcomingSessions';
import SessionForm from './SessionForm';

interface SessionsSchedulerProps {
  user: User;
}

interface MentorshipSession {
  id: string;
  mentorship_id: string;
  title: string;
  description?: string;
  session_type: string;
  scheduled_at: string;
  duration_minutes: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  meeting_link?: string;
  agenda?: string;
  student_profile: {
    display_name: string;
    profile_image_url?: string;
    field_of_study?: string;
    academic_level?: string;
  };
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  sessions: MentorshipSession[];
}

const SessionsScheduler: React.FC<SessionsSchedulerProps> = ({ user }) => {
  const [sessions, setSessions] = useState<MentorshipSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [editingSession, setEditingSession] = useState<MentorshipSession | null>(null);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);

  useEffect(() => {
    loadSessions();
    
    // Set up real-time subscriptions for session updates
    const sessionSubscription = supabase
      .channel(`mentor_sessions_${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'mentor_sessions'
      }, (payload) => {
        console.log('🔄 Real-time session update in scheduler:', payload);
        loadSessions(); // Reload sessions when any session changes
      })
      .subscribe();

    // Set up real-time subscriptions for mentorship changes
    const mentorshipSubscription = supabase
      .channel(`mentor_student_relationships_scheduler_${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'mentor_student_relationships',
        filter: `mentor_id=eq.${user.id}`
      }, (payload) => {
        console.log('🔄 Real-time mentorship update in scheduler:', payload);
        loadSessions(); // Reload sessions when mentorships change
      })
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      sessionSubscription.unsubscribe();
      mentorshipSubscription.unsubscribe();
    };
  }, [user]);

  useEffect(() => {
    generateCalendarDays();
  }, [currentDate, sessions]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      // First get all mentorship relationships for this mentor
      const { data: mentorships, error: mentorshipError } = await supabase
        .from('mentor_student_relationships')
        .select('id')
        .eq('mentor_id', user.id);

      if (mentorshipError) {
        console.error('Error loading mentorships:', mentorshipError);
        setSessions([]);
        return;
      }

      if (!mentorships || mentorships.length === 0) {
        setSessions([]);
        return;
      }

      const mentorshipIds = mentorships.map(m => m.id);

      // Now get sessions for these mentorships with proper joins
      const { data: sessionData, error } = await supabase
        .from('mentor_sessions')
        .select(`
          id,
          mentorship_id,
          title,
          description,
          session_type,
          scheduled_start,
          duration_minutes,
          status,
          meeting_link,
          agenda,
          mentee_id
        `)
        .in('mentorship_id', mentorshipIds)
        .gte('scheduled_start', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('scheduled_start', { ascending: true });

      if (error) {
        console.error('Error loading sessions:', error);
        setSessions([]);
        return;
      }

      if (!sessionData || sessionData.length === 0) {
        setSessions([]);
        return;
      }

      // Get user profiles for all mentees in these sessions
      const menteeIds = [...new Set(sessionData.map(s => s.mentee_id))];
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, profile_image_url, field_of_study, academic_level')
        .in('user_id', menteeIds);

      // Create profile lookup map
      const profileMap = new Map();
      if (profiles) {
        profiles.forEach(profile => {
          profileMap.set(profile.user_id, profile);
        });
      }

      // Transform sessions with profile data
      const transformedSessions: MentorshipSession[] = sessionData.map(session => {
        const profile = profileMap.get(session.mentee_id);
        return {
          id: session.id,
          mentorship_id: session.mentorship_id,
          title: session.title || 'Mentoring Session',
          description: session.description,
          session_type: session.session_type || 'general',
          scheduled_at: session.scheduled_start,
          duration_minutes: session.duration_minutes || 60,
          status: session.status,
          meeting_link: session.meeting_link,
          agenda: session.agenda,
          student_profile: {
            display_name: profile?.display_name || 'Unknown Student',
            profile_image_url: profile?.profile_image_url,
            field_of_study: profile?.field_of_study,
            academic_level: profile?.academic_level
          }
        };
      });

      setSessions(transformedSessions);

    } catch (error) {
      console.error('Error loading sessions:', error);
      setSessions([]);
      if (error?.message?.includes('relation') && error?.message?.includes('does not exist')) {
        toast.error('Database setup incomplete', {
          description: 'Session scheduling requires database setup. Please contact support.',
        });
      } else {
        toast.error('Failed to load sessions', {
          description: 'Please try refreshing the page.'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get first day of the month and last day
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Get start of calendar (Sunday of the week containing the first day)
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    // Get end of calendar (Saturday of the week containing the last day)
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    
    const days: CalendarDay[] = [];
    const currentDateObj = new Date(startDate);
    const today = new Date();
    
    while (currentDateObj <= endDate) {
      const dateStr = currentDateObj.toDateString();
      const dayString = currentDateObj.toISOString().split('T')[0];
      
      const daySessions = sessions.filter(session => {
        const sessionDate = new Date(session.scheduled_at).toISOString().split('T')[0];
        return sessionDate === dayString;
      });
      
      days.push({
        date: new Date(currentDateObj),
        isCurrentMonth: currentDateObj.getMonth() === month,
        isToday: currentDateObj.toDateString() === today.toDateString(),
        sessions: daySessions
      });
      
      currentDateObj.setDate(currentDateObj.getDate() + 1);
    }
    
    setCalendarDays(days);
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setActiveTab('calendar');
  };

  const handleNewSession = () => {
    setEditingSession(null);
    setShowSessionForm(true);
  };

  const handleEditSession = (session: MentorshipSession) => {
    setEditingSession(session);
    setShowSessionForm(true);
  };

  const handleSessionSaved = () => {
    setShowSessionForm(false);
    setEditingSession(null);
    loadSessions();
  };

  const handleJoinSession = (session: MentorshipSession) => {
    if (session.meeting_link) {
      window.open(session.meeting_link, '_blank');
    } else {
      toast.info('Meeting link will be available 15 minutes before the session');
    }
  };

  const getSessionTypeColor = (type: string) => {
    switch (type) {
      case 'initial_consultation': return 'bg-blue-100 text-blue-800';
      case 'document_review': return 'bg-green-100 text-green-800';
      case 'interview_prep': return 'bg-purple-100 text-purple-800';
      case 'general_guidance': return 'bg-orange-100 text-orange-800';
      case 'progress_check': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'no_show': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const upcomingSessions = sessions
    .filter(s => new Date(s.scheduled_at) > new Date() && s.status === 'scheduled')
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

  const todaySessions = sessions.filter(s => {
    const sessionDate = new Date(s.scheduled_at).toDateString();
    const today = new Date().toDateString();
    return sessionDate === today && s.status === 'scheduled';
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-gradapp-primary" />
        <span className="ml-2 text-gray-600">Loading sessions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gradapp-primary">Sessions & Schedule</h2>
          <p className="text-gray-600">Manage your mentoring sessions and calendar</p>
        </div>
        <Button onClick={handleNewSession} className="bg-gradapp-primary hover:bg-gradapp-accent">
          <Plus className="h-4 w-4 mr-2" />
          Schedule Session
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{todaySessions.length}</div>
            <div className="text-sm text-gray-600">Today's Sessions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{upcomingSessions.length}</div>
            <div className="text-sm text-gray-600">Upcoming Sessions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {sessions.filter(s => s.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-600">Completed Sessions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {Math.round(sessions.filter(s => s.status === 'completed').reduce((sum, s) => sum + s.duration_minutes, 0) / 60)}
            </div>
            <div className="text-sm text-gray-600">Total Hours</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upcoming" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Upcoming Sessions
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendar View
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Session History
          </TabsTrigger>
        </TabsList>

        {/* Upcoming Sessions Tab */}
        <TabsContent value="upcoming" className="mt-6">
          <UpcomingSessions 
            sessions={upcomingSessions}
            onJoinSession={handleJoinSession}
            onEditSession={handleEditSession}
            formatTime={formatTime}
            formatDate={formatDate}
            getSessionTypeColor={getSessionTypeColor}
            getStatusColor={getStatusColor}
          />
        </TabsContent>

        {/* Calendar View Tab */}
        <TabsContent value="calendar" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handlePrevMonth}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleNextMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {dayNames.map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                    {day}
                  </div>
                ))}
                {calendarDays.map((day, index) => (
                  <div
                    key={index}
                    className={`
                      p-2 min-h-[80px] border rounded cursor-pointer hover:bg-gray-50
                      ${!day.isCurrentMonth ? 'text-gray-400 bg-gray-50' : ''}
                      ${day.isToday ? 'bg-blue-50 border-blue-200' : ''}
                    `}
                    onClick={() => handleDateClick(day.date)}
                  >
                    <div className={`text-sm ${day.isToday ? 'font-bold text-blue-600' : ''}`}>
                      {day.date.getDate()}
                    </div>
                    {day.sessions.slice(0, 2).map(session => (
                      <div
                        key={session.id}
                        className="text-xs bg-gradapp-primary text-white px-1 py-0.5 rounded mt-1 truncate"
                      >
                        {formatTime(session.scheduled_at)} - {session.title}
                      </div>
                    ))}
                    {day.sessions.length > 2 && (
                      <div className="text-xs text-gray-500 mt-1">
                        +{day.sessions.length - 2} more
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Session History Tab */}
        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Session History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sessions
                  .filter(s => s.status === 'completed' || s.status === 'cancelled' || s.status === 'no_show')
                  .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime())
                  .map(session => (
                    <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={session.student_profile.profile_image_url} />
                          <AvatarFallback>
                            {session.student_profile.display_name?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium">{session.title}</h4>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>{session.student_profile.display_name}</span>
                            <span>•</span>
                            <span>{formatDate(session.scheduled_at)}</span>
                            <span>•</span>
                            <span>{session.duration_minutes} min</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(session.status)}>
                          {session.status.replace('_', ' ')}
                        </Badge>
                        <Badge className={getSessionTypeColor(session.session_type)}>
                          {session.session_type.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Session Form Modal */}
      {showSessionForm && (
        <SessionForm
          isOpen={showSessionForm}
          onClose={() => setShowSessionForm(false)}
          onSave={handleSessionSaved}
          user={user}
          session={editingSession}
        />
      )}
    </div>
  );
};

export default SessionsScheduler;