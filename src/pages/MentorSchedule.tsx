import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AuthenticatedHeader from '@/components/AuthenticatedHeader';
import SessionsScheduler from '@/components/mentor/SessionsScheduler';
import UpcomingSessions from '@/components/mentor/UpcomingSessions';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar, 
  Clock, 
  Users, 
  Settings, 
  ArrowLeft,
  TrendingUp,
  AlertCircle,
  Video,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface SessionStats {
  totalSessions: number;
  completedSessions: number;
  upcomingSessions: number;
  cancelledSessions: number;
  totalHours: number;
  averageRating: number;
}

const MentorSchedule: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('calendar');
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    totalSessions: 0,
    completedSessions: 0,
    upcomingSessions: 0,
    cancelledSessions: 0,
    totalHours: 0,
    averageRating: 0
  });

  useEffect(() => {
    checkMentorAuth();
    loadSessionStats();
  }, []);

  const checkMentorAuth = async () => {
    try {
      const { data: { user: authUser }, error } = await supabase.auth.getUser();
      if (error || !authUser) {
        navigate('/auth');
        return;
      }

      // Check if user has mentor role
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authUser.id)
        .single();

      if (!userRole || userRole.role !== 'mentor') {
        toast.error('Access denied. Mentor privileges required.');
        navigate('/dashboard');
        return;
      }

      setUser(authUser);
    } catch (error) {
      console.error('Mentor auth check failed:', error);
      navigate('/auth');
    } finally {
      setLoading(false);
    }
  };

  const loadSessionStats = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {return;}

      // Get session statistics
      const { data: sessions } = await supabase
        .from('mentor_sessions')
        .select('*')
        .eq('mentor_id', authUser.id);

      if (sessions) {
        const now = new Date();
        const stats = {
          totalSessions: sessions.length,
          completedSessions: sessions.filter(s => s.status === 'completed').length,
          upcomingSessions: sessions.filter(s => s.status === 'scheduled' && new Date(s.scheduled_at) > now).length,
          cancelledSessions: sessions.filter(s => s.status === 'cancelled').length,
          totalHours: sessions.reduce((acc, s) => acc + (s.duration_minutes || 60), 0) / 60,
          averageRating: sessions.filter(s => s.rating).reduce((acc, s) => acc + s.rating, 0) / sessions.filter(s => s.rating).length || 0
        };
        setSessionStats(stats);
      }
    } catch (error) {
      console.error('Error loading session stats:', error);
    }
  };

  if (loading) {
    return (
      <>
        <AuthenticatedHeader />
        <div className="min-h-screen bg-gray-50">
          <LoadingSpinner
            variant="primary"
            size="lg"
            message="Loading scheduling dashboard..."
            position="center"
            className="h-screen"
          />
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AuthenticatedHeader />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => navigate('/mentor/dashboard')}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Calendar className="h-8 w-8 text-blue-600" />
                Session Scheduling
              </h1>
              <p className="text-gray-600 mt-2">Manage your mentoring sessions and availability</p>
            </div>
            
            <Button
              onClick={() => navigate('/settings/availability')}
              variant="outline"
            >
              <Settings className="h-4 w-4 mr-2" />
              Availability Settings
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Sessions</p>
                  <p className="text-2xl font-bold text-gray-900">{sessionStats.totalSessions}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{sessionStats.completedSessions}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Upcoming</p>
                  <p className="text-2xl font-bold text-blue-600">{sessionStats.upcomingSessions}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Cancelled</p>
                  <p className="text-2xl font-bold text-red-600">{sessionStats.cancelledSessions}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Hours</p>
                  <p className="text-2xl font-bold text-gray-900">{sessionStats.totalHours.toFixed(1)}</p>
                </div>
                <Video className="h-8 w-8 text-purple-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Rating</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {sessionStats.averageRating > 0 ? sessionStats.averageRating.toFixed(1) : 'N/A'}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-yellow-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Important Notice */}
        <Alert className="mb-8 border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Scheduling Tips:</strong> Keep your availability up to date, respond to booking requests within 24 hours, 
            and send session reminders to improve attendance rates.
          </AlertDescription>
        </Alert>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Calendar & Booking
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Upcoming Sessions
              {sessionStats.upcomingSessions > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {sessionStats.upcomingSessions}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Session Calendar & Availability
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SessionsScheduler user={user} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Your Upcoming Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <UpcomingSessions mentorId={user?.id} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MentorSchedule;