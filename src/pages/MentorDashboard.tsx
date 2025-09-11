import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  FileText, 
  Calendar, 
  Star, 
  Clock, 
  TrendingUp,
  MessageCircle,
  Award,
  Plus,
  Filter,
  Search,
  Bell,
  Video,
  BookOpen,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import AuthenticatedHeader from '@/components/AuthenticatedHeader';
import AnimatedGradient from '@/components/ui/AnimatedGradient';
import GlassmorphicCard from '@/components/ui/GlassmorphicCard';
import ProgressRing from '@/components/ui/ProgressRing';
import FloatingActionButton from '@/components/ui/FloatingActionButton';
import MentorBadge from '@/components/ui/MentorBadge';
import ComingSoonOverlay from '@/components/ui/ComingSoonOverlay';
import { supabase } from '@/integrations/supabase/client';
import { MentorDashboardSummary, MentorshipRelationship, DocumentReview, MentorSession } from '@/types/mentorTypes';
import SEOHead from '@/components/SEOHead';

const MentorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<MentorDashboardSummary | null>(null);
  const [activeMentorships, setActiveMentorships] = useState<MentorshipRelationship[]>([]);
  const [pendingReviews, setPendingReviews] = useState<DocumentReview[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<MentorSession[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    checkMentorAuth();
    loadDashboardData();
  }, []);

  const checkMentorAuth = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        navigate('/auth');
        return;
      }

      // Check if user has mentor role
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (!userRole || userRole.role !== 'mentor') {
        toast.error('Access denied. Mentor privileges required.');
        navigate('/dashboard');
        return;
      }

      // Check if mentor profile exists
      const { data: mentorProfile } = await supabase
        .from('mentor_profiles')
        .select('id, profile_completion_percentage')
        .eq('user_id', user.id)
        .single();

      if (!mentorProfile) {
        toast.info('Complete your mentor profile to get started!');
        navigate('/mentor/onboarding');
        return;
      }

      // If profile is incomplete, suggest completion
      if (mentorProfile.profile_completion_percentage < 80) {
        toast.warning('Consider completing your profile to attract more mentees!');
      }

    } catch (error) {
      console.error('Mentor auth check failed:', error);
      navigate('/auth');
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {return;}

      // Load dashboard summary
      const { data: summary } = await supabase
        .from('mentor_dashboard_summary')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setDashboardData(summary);

      // Load active mentorships
      const { data: mentorships } = await supabase
        .from('mentorship_relationships')
        .select(`
          *,
          mentee_profile:auth.users!mentee_id(email, raw_user_meta_data)
        `)
        .eq('mentor_id', user.id)
        .eq('status', 'active')
        .limit(5);

      setActiveMentorships(mentorships || []);

      // Load pending document reviews
      const { data: reviews } = await supabase
        .from('document_reviews')
        .select(`
          *,
          mentorship:mentorship_relationships(
            mentee_id,
            mentee_profile:auth.users!mentee_id(email, raw_user_meta_data)
          )
        `)
        .eq('status', 'pending')
        .in('mentorship_id', (mentorships || []).map(m => m.id))
        .order('created_at', { ascending: false })
        .limit(5);

      setPendingReviews(reviews || []);

      // Load upcoming sessions
      const { data: sessions } = await supabase
        .from('mentor_sessions')
        .select(`
          *,
          mentorship:mentorship_relationships(
            mentee_id,
            mentee_profile:auth.users!mentee_id(email, raw_user_meta_data)
          )
        `)
        .gte('scheduled_start', new Date().toISOString())
        .eq('status', 'scheduled')
        .in('mentorship_id', (mentorships || []).map(m => m.id))
        .order('scheduled_start', { ascending: true })
        .limit(5);

      setUpcomingSessions(sessions || []);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleNewMenteeRequest = () => {
    navigate('/mentorship/requests');
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'schedule_session':
        navigate('/mentor/schedule');
        break;
      case 'review_documents':
        navigate('/mentor/reviews');
        break;
      case 'view_mentees':
        navigate('/mentor/mentees');
        break;
      case 'create_resource':
        navigate('/mentor/resources/create');
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-screen">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"
          />
          <span className="ml-4 text-lg text-gray-700">Loading your mentor dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead 
        title="Mentor Dashboard"
        description="Manage your mentoring activities and connect with students in your field. Track mentee progress, schedule sessions, and provide guidance."
        keywords="mentor, graduate student mentoring, academic mentoring, research guidance, faculty connections, mentor dashboard, student guidance"
      />
      <AuthenticatedHeader />
      
      <div className="bg-white">
        <div className="container mx-auto px-4 py-8 max-w-7xl relative">
          {/* Welcome Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <motion.div
                className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-lg"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                <Award className="w-8 h-8 text-white" />
              </motion.div>
              <div className="flex gap-2">
                <MentorBadge type="verified" showLabel />
                <MentorBadge type="expert" showLabel />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Mentor Dashboard
            </h1>
            <p className="text-gray-600 text-lg">
              Empowering the next generation of graduate students
            </p>
          </motion.div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="p-6 bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 text-sm font-medium">Active Mentees</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {dashboardData?.current_mentees || 0}
                    </p>
                    <p className="text-gray-500 text-sm">
                      of {dashboardData?.mentoring_capacity || 5} capacity
                    </p>
                  </div>
                  <ProgressRing 
                    progress={((dashboardData?.current_mentees || 0) / (dashboardData?.mentoring_capacity || 5)) * 100}
                    size={60}
                    color="blue"
                    showPercentage={false}
                  />
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-6 bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <FileText className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-orange-600 text-sm font-medium">Pending Reviews</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {dashboardData?.pending_reviews || 0}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="p-6 bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-green-600 text-sm font-medium">Upcoming Sessions</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {dashboardData?.upcoming_sessions || 0}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="p-6 bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Star className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-yellow-600 text-sm font-medium">Average Rating</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {dashboardData?.average_rating?.toFixed(1) || '5.0'}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-8"
          >
            <Card className="p-6 bg-white shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button
                  onClick={() => handleQuickAction('schedule_session')}
                  className="h-20 bg-blue-600 hover:bg-blue-700 flex flex-col gap-2 text-white"
                >
                  <Calendar className="w-6 h-6" />
                  <span className="text-sm">Schedule Session</span>
                </Button>

                <Button
                  onClick={() => handleQuickAction('review_documents')}
                  className="h-20 bg-orange-600 hover:bg-orange-700 flex flex-col gap-2 text-white"
                >
                  <FileText className="w-6 h-6" />
                  <span className="text-sm">Review Documents</span>
                </Button>

                <Button
                  onClick={() => handleQuickAction('view_mentees')}
                  className="h-20 bg-green-600 hover:bg-green-700 flex flex-col gap-2 text-white"
                >
                  <Users className="w-6 h-6" />
                  <span className="text-sm">View Mentees</span>
                </Button>

                <Button
                  onClick={() => handleQuickAction('create_resource')}
                  className="h-20 bg-gray-600 hover:bg-gray-700 flex flex-col gap-2 text-white"
                >
                  <BookOpen className="w-6 h-6" />
                  <span className="text-sm">Create Resource</span>
                </Button>
              </div>
            </Card>
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Active Mentorships */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="p-6 h-fit bg-white shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Active Mentorships</h2>
                  <Badge variant="secondary">{activeMentorships.length}</Badge>
                </div>

                {activeMentorships.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>No active mentorships yet</p>
                    <p className="text-sm">Start mentoring to see your mentees here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeMentorships.map((mentorship) => (
                      <motion.div
                        key={mentorship.id}
                        whileHover={{ scale: 1.02 }}
                        className="p-4 bg-white/50 rounded-lg border border-gray-200 cursor-pointer"
                        onClick={() => navigate(`/mentorship/${mentorship.id}`)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-semibold">
                              {mentorship.mentee_profile?.raw_user_meta_data?.name?.[0] || 'M'}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {mentorship.mentee_profile?.raw_user_meta_data?.name || 'Mentee'}
                              </p>
                              <p className="text-sm text-gray-600">{mentorship.relationship_type}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <ProgressRing 
                              progress={mentorship.progress_percentage}
                              size={40}
                              color="blue"
                              showPercentage={false}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              {mentorship.progress_percentage}% complete
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </Card>
            </motion.div>

            {/* Pending Reviews & Upcoming Sessions */}
            <div className="space-y-6">
              {/* Pending Reviews */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Card className="p-6 bg-white shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Pending Reviews</h2>
                    <Badge variant="destructive">{pendingReviews.length}</Badge>
                  </div>

                  {pendingReviews.length === 0 ? (
                    <div className="text-center py-6 text-gray-500">
                      <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">No pending reviews</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingReviews.slice(0, 3).map((review) => (
                        <div
                          key={review.id}
                          className="p-3 bg-red-50 rounded-lg border border-red-200 cursor-pointer hover:bg-red-100 transition-colors"
                          onClick={() => navigate(`/mentor/reviews/${review.id}`)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{review.document_type}</p>
                              <p className="text-sm text-gray-600">
                                {review.mentorship?.mentee_profile?.raw_user_meta_data?.name || 'Mentee'}
                              </p>
                            </div>
                            <Badge variant="destructive" size="sm">
                              {review.priority}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </motion.div>

              {/* Upcoming Sessions */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
              >
                <Card className="p-6 bg-white shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Upcoming Sessions</h2>
                    <Badge variant="secondary">{upcomingSessions.length}</Badge>
                  </div>

                  {upcomingSessions.length === 0 ? (
                    <div className="text-center py-6 text-gray-500">
                      <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">No upcoming sessions</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {upcomingSessions.slice(0, 3).map((session) => (
                        <div
                          key={session.id}
                          className="p-3 bg-blue-50 rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors"
                          onClick={() => navigate(`/mentor/sessions/${session.id}`)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{session.title || 'Mentoring Session'}</p>
                              <p className="text-sm text-gray-600">
                                {new Date(session.scheduled_start).toLocaleDateString()} at{' '}
                                {new Date(session.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            <Button size="sm" variant="outline">
                              <Video className="w-4 h-4 mr-1" />
                              Join
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </motion.div>
            </div>
          </div>

          {/* Coming Soon Overlay */}
          <ComingSoonOverlay
            feature="Mentor Platform"
            description="The comprehensive mentoring platform is currently being finalized. Soon you'll be able to guide graduate students, review documents, schedule sessions, and build meaningful academic relationships."
            expectedDate="Q2 2025"
            features={[
              "Student mentee matching and management",
              "Document review and feedback system",
              "Virtual meeting scheduling and video calls",
              "Progress tracking and milestone setting",
              "Resource sharing and collaboration tools",
              "Analytics and impact reporting"
            ]}
            onNotifyMe={() => {
              toast.success("Great! We'll notify you when the mentor platform launches.");
            }}
            className="absolute inset-0 rounded-lg"
          />
        </div>
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton
        icon={Plus}
        onClick={handleNewMenteeRequest}
        variant="mentor"
        tooltip="Accept new mentee"
        position="bottom-right"
      />
    </div>
  );
};

export default MentorDashboard;