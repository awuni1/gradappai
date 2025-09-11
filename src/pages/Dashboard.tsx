import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useSession } from '@/contexts/SessionContext';
import AuthenticatedHeader from '@/components/AuthenticatedHeader';
import { dashboardService } from '@/services/dashboardService';
import { fastOnboardingService } from '@/services/fastOnboardingService';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import SEOHead from '@/components/SEOHead';
import { CVAnalysisInsights } from '@/components/dashboard/CVAnalysisInsights';
import { ChatBot } from '@/components/dashboard/ChatBot';
import { createTestNotifications } from '@/utils/testNotifications';
import { 
  Star, 
  MapPin, 
  Clock, 
  DollarSign, 
  School, 
  Users, 
  GraduationCap, 
  ArrowRight, 
  CheckCircle,
  Target,
  Calendar,
  TrendingUp,
  Lightbulb,
  BookOpen,
  MessageSquare,
  FileText
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { 
    user, 
    sessionData, 
    loading, 
    universityRecommendations, 
    selectedUniversities,
    academicProfile,
    cvAnalysis,
    onboardingComplete,
    refreshSessionData 
  } = useSession();
  
  const [profileCompletion, setProfileCompletion] = useState(17);
  const [dashboardData, setDashboardData] = useState({
    universitiesMatched: 0,
    deadlinesThisMonth: 0,
    scholarshipsFound: 0,
    applicationsSubmitted: 0,
    totalApplications: 0,
    newConnections: 5
  });
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<any[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const checkOnboardingCompletion = async (userId: string) => {
    try {
      // Check if user just completed onboarding
      const justCompleted = localStorage.getItem('onboarding_just_completed');
      const onboardingDataStr = localStorage.getItem('onboarding_data');
      
      if (justCompleted === 'true' && onboardingDataStr) {
        console.log('🎉 User just completed onboarding, running background completion...');
        
        // Clear the flags
        localStorage.removeItem('onboarding_just_completed');
        const onboardingData = JSON.parse(onboardingDataStr);
        localStorage.removeItem('onboarding_data');
        
        // Show welcome message
        toast({
          title: 'Welcome to GradApp!',
          description: 'Your profile is being set up in the background.',
        });
        
        // Run background completion
        fastOnboardingService.completeOnboardingFast(onboardingData).then(result => {
          if (result.success) {
            console.log('✅ Background onboarding completion successful');
            if (onboardingData.cvFile) {
              toast({
                title: 'CV Analysis Started',
                description: 'Your CV will be analyzed in the background.',
              });
            }
          } else {
            console.warn('⚠️ Background onboarding failed:', result.error);
          }
        }).catch(error => {
          console.warn('⚠️ Background onboarding error:', error);
        });
      }
    } catch (error) {
      console.warn('Error checking onboarding completion:', error);
    }
  };
  
  useEffect(() => {
    // Handle signed out users
    if (!loading && !user) {
      navigate('/');
      return;
    }

    // Load dashboard data when session data is available
    if (user && sessionData) {
      checkOnboardingCompletion(user.id);
      loadDashboardData(user.id).finally(() => {
        setDataLoaded(true);
      });
    }
  }, [user, sessionData, loading, navigate]);

  const loadDashboardData = async (userId: string) => {
    try {
      // Use a timeout wrapper to prevent hanging on slow queries (increased timeout)
      const timeoutWrapper = <T,>(promise: Promise<T>, timeoutMs = 8000): Promise<T> => {
        return Promise.race([
          promise,
          new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Operation timeout')), timeoutMs))
        ]);
      };

      // Parallelize all data loading operations with more reasonable timeouts
      const [
        completion,
        appStatsResult,
        matchedUniversitiesResult,
        upcomingDeadlinesResult,
        selectedUniversitiesResult
      ] = await Promise.allSettled([
        timeoutWrapper(calculateProfileCompletion(userId), 6000),
        timeoutWrapper(dashboardService.getApplicationStats(), 6000),
        timeoutWrapper(dashboardService.getMatchedUniversities(), 6000),
        timeoutWrapper(dashboardService.getUpcomingDeadlines(30), 6000),
        timeoutWrapper(dashboardService.getSelectedUniversities(), 6000)
      ]);

      // Extract data with fallbacks for failed requests
      const profileCompletion = completion.status === 'fulfilled' ? completion.value : 17;
      const appStats = appStatsResult.status === 'fulfilled' ? appStatsResult.value.data : { total: 0, submitted: 0 };
      const matchedUniversities = matchedUniversitiesResult.status === 'fulfilled' ? matchedUniversitiesResult.value.data : [];
      const upcomingDeadlines = upcomingDeadlinesResult.status === 'fulfilled' ? upcomingDeadlinesResult.value.data : [];
      const selectedUniversities = selectedUniversitiesResult.status === 'fulfilled' ? selectedUniversitiesResult.value.data : [];

      // Log any failures for debugging
      if (completion.status === 'rejected') {console.warn('Profile completion failed:', completion.reason);}
      if (appStatsResult.status === 'rejected') {console.warn('App stats failed:', appStatsResult.reason);}
      if (matchedUniversitiesResult.status === 'rejected') {console.warn('Matched universities failed:', matchedUniversitiesResult.reason);}
      if (upcomingDeadlinesResult.status === 'rejected') {console.warn('Upcoming deadlines failed:', upcomingDeadlinesResult.reason);}
      if (selectedUniversitiesResult.status === 'rejected') {console.warn('Selected universities failed:', selectedUniversitiesResult.reason);}

      // Set profile completion
      setProfileCompletion(profileCompletion);
      
      // Count deadlines this month with safe array handling
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();
      
      const deadlinesThisMonth = Array.isArray(upcomingDeadlines) ? upcomingDeadlines.filter(deadline => {
        try {
          const deadlineDate = new Date(deadline.due_date || deadline.deadline_date);
          return deadlineDate.getMonth() === thisMonth && deadlineDate.getFullYear() === thisYear;
        } catch {
          return false;
        }
      }).length : 0;
      
      // Store upcoming deadlines for display with safe slicing
      setUpcomingDeadlines(Array.isArray(upcomingDeadlines) ? upcomingDeadlines.slice(0, 3) : []);
      
      // Update dashboard data with session data prioritized  
      // Priority: 1. Session data (universityRecommendations), 2. Dashboard service data (matchedUniversities)
      const sessionCount = universityRecommendations?.length || 0;
      const dashboardCount = Array.isArray(matchedUniversities) ? matchedUniversities.length : 0;
      const uniCount = sessionCount > 0 ? sessionCount : dashboardCount;
      
      setDashboardData({
        universitiesMatched: uniCount,
        deadlinesThisMonth: deadlinesThisMonth,
        scholarshipsFound: 0, // TODO: Implement scholarship tracking
        applicationsSubmitted: appStats?.submitted || 0,
        totalApplications: appStats?.total || 0,
        newConnections: 5 // TODO: Implement connection tracking
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Set reasonable defaults to keep UI functional
      setDashboardData({
        universitiesMatched: 0,
        deadlinesThisMonth: 0,
        scholarshipsFound: 0,
        applicationsSubmitted: 0,
        totalApplications: 0,
        newConnections: 5
      });
      setUpcomingDeadlines([]);
    }
  };

  const calculateProfileCompletion = async (userId: string): Promise<number> => {
    try {
      // Use session data when available to avoid database calls
      const profile = sessionData?.profile;
      const academic = sessionData?.academicProfile;
      const interests = sessionData?.researchInterests;
      const cvData = sessionData?.cvAnalysis;
      const onboardingCompleted = sessionData?.onboardingComplete;

      let completion = 0;
      const totalFields = 12; // Increased for more granular scoring

      // Basic profile data (4 fields)
      if (profile?.first_name || profile?.display_name) {completion += 1;}
      if (profile?.last_name) {completion += 1;}
      if (profile?.bio && profile.bio.length > 10) {completion += 1;}
      if (profile?.location) {completion += 1;}

      // Academic profile (4 fields)
      if (academic?.current_degree || academic?.degree) {completion += 1;}
      if (academic?.current_institution || academic?.institution) {completion += 1;}
      if (academic?.gpa && academic.gpa > 0) {completion += 1;}
      if (academic?.target_degree_level || academic?.target_field || academic?.field_of_study) {completion += 1;}

      // Research and career data (3 fields)
      if (interests && interests.length > 0) {completion += 1;}
      if (academic?.research_experience && academic.research_experience.length > 10) {completion += 1;}
      if (academic?.career_goals) {completion += 1;}

      // Onboarding and CV (1 field)
      if (onboardingCompleted) {completion += 1;}

      const percentage = Math.round((completion / totalFields) * 100);
      console.log(`📊 Profile completion: ${completion}/${totalFields} fields = ${percentage}%`);
      
      return Math.max(percentage, 15); // Minimum 15% to show some progress
    } catch (error) {
      console.warn('Error calculating profile completion:', error);
      return 25; // Higher default value for better UX
    }
  };

  const handleCreateAccount = () => {
    navigate('/onboarding');
  };

  const handleTestNotifications = async () => {
    if (user) {
      const success = await createTestNotifications(user.id);
      if (success) {
        toast({
          title: 'Success',
          description: 'Test notifications created! Check your notification bell.',
          variant: 'default'
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to create test notifications. Notification system may not be set up yet.',
          variant: 'destructive'
        });
      }
    }
  }; 
  
  if (loading) {
    return <LoadingOverlay message="Loading your dashboard..." />;
  }
  
  if (!user) {
    navigate('/');
    return null;
  }
  
  return (
    <>
      <SEOHead 
        title="Dashboard"
        description="Track your graduate school application progress, view matched universities, and manage deadlines in your personalized dashboard."
        keywords="graduate school dashboard, application progress, university matching, deadline tracking"
      />
      <AuthenticatedHeader />
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-8 px-4 max-w-7xl">
          
          {/* Hero Section with Profile Completion */}
          <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white mb-8 overflow-hidden relative">
            <CardContent className="p-8">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center mb-4">
                    <Star className="h-8 w-8 mr-3" />
                    <h1 className="text-3xl font-bold">Welcome Back!</h1>
                  </div>
                  <p className="text-xl text-blue-100 mb-8">
                    Your graduate school journey is looking promising
                  </p>
                  
                  {/* Key Metrics Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-6 w-6 text-blue-200" />
                      <div>
                        <div className="text-2xl font-bold">{dashboardData.universitiesMatched}</div>
                        <div className="text-blue-200 text-sm">Universities Matched</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Clock className="h-6 w-6 text-blue-200" />
                      <div>
                        <div className="text-2xl font-bold">{dashboardData.deadlinesThisMonth}</div>
                        <div className="text-blue-200 text-sm">Deadlines This Month</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <DollarSign className="h-6 w-6 text-blue-200" />
                      <div>
                        <div className="text-2xl font-bold">${dashboardData.scholarshipsFound}K</div>
                        <div className="text-blue-200 text-sm">Scholarships Found</div>
                      </div>
                    </div>
                  </div>

                  {/* Platform Suggestion Banner */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <div className="flex items-start space-x-3">
                      <Lightbulb className="h-5 w-5 text-yellow-300 mt-0.5" />
                      <div>
                        <div className="font-semibold text-white mb-1">Platform Suggestion</div>
                        <div className="text-blue-100 text-sm">
                          Consider adding 2 more research publications to strengthen your profile for top-tier programs.{' '}
                          <button className="text-white underline hover:no-underline">
                            Learn more
                          </button>
                          {' • '}
                          <button 
                            onClick={handleTestNotifications}
                            className="text-yellow-200 underline hover:no-underline"
                          >
                            Test Notifications
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Profile Completion Circle */}
                <div className="text-center ml-8">
                  <div className="relative inline-block">
                    <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-blue-300"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-white"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeDasharray={`${profileCompletion}, 100`}
                        strokeLinecap="round"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">{profileCompletion}%</span>
                    </div>
                  </div>
                  <div className="text-blue-200 text-sm mt-2">Profile Complete</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            
            {/* Left Column - Discover Universities (Spans 2 columns) */}
            <div className="lg:col-span-2">
              <Card className="h-full border-blue-200 bg-gradient-to-br from-blue-50 to-white">
                <CardContent className="p-8">
                  <div className="flex items-start space-x-4 mb-6">
                    <div className="bg-blue-100 p-3 rounded-xl">
                      <School className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Discover Universities</h2>
                      <p className="text-blue-600 font-medium">Smart matching system</p>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-6 text-lg leading-relaxed">
                    Find your perfect graduate programs with integrated scholarship opportunities and 
                    faculty connections through our comprehensive database.
                  </p>
                  
                  {/* Feature Badges */}
                  <div className="flex flex-wrap gap-3 mb-8">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 px-3 py-1">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      95% Match Accuracy
                    </Badge>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 px-3 py-1">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Scholarships Included
                    </Badge>
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300 px-3 py-1">
                      <Users className="h-4 w-4 mr-2" />
                      Faculty Matching
                    </Badge>
                  </div>
                  
                  <Button 
                    onClick={() => navigate('/university-matching')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-lg"
                  >
                    Start Discovery
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Sidebar Cards */}
            <div className="space-y-6">
              

              {/* CV Analysis Card */}
              <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => navigate('/cv-analysis')}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <BookOpen className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">CV Analysis</h3>
                        <p className="text-blue-600 text-sm">AI-powered insights</p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <span className="font-medium text-blue-600">Upload & analyze your CV</span>
                  </div>
                </CardContent>
              </Card>

              {/* Document Generator Card */}
              <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-white hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => navigate('/document-generator')}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-orange-100 p-2 rounded-lg">
                        <FileText className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">Document Generator</h3>
                        <p className="text-orange-600 text-sm">AI-powered writing</p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <span className="font-medium text-orange-600">Generate SOPs & cover letters</span>
                  </div>
                </CardContent>
              </Card>

              {/* GradNet Card */}
              <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => navigate('/gradnet')}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-purple-100 p-2 rounded-lg">
                        <Users className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">GradNet</h3>
                        <p className="text-purple-600 text-sm">Connect & collaborate</p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <span className="font-medium text-purple-600">{dashboardData.newConnections} new connections</span>
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>


          {/* Guest User Alert */}
          {!user && (
            <Alert className="mt-8 border-amber-300 bg-amber-50 max-w-2xl mx-auto">
              <AlertDescription className="text-amber-700 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>
                You're using GradApp as a guest. Create an account to save your progress.
                <Button 
                  onClick={handleCreateAccount}
                  className="ml-4 bg-amber-600 hover:bg-amber-700 text-white"
                  size="sm"
                >
                  Create Account
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* ChatBot Component */}
        <ChatBot />
      </div>
    </>
  );
};

export default Dashboard;