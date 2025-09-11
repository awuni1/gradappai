import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import AuthenticatedHeader from '@/components/AuthenticatedHeader';
import SEOHead from '@/components/SEOHead';
import { analyticsService, type AnalyticsMetrics, type UserJourneyStep, type PersonalAnalytics } from '@/services/analyticsService';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  LineChart, 
  Line,
  PieChart, 
  Pie, 
  Cell,
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  LabelList
} from 'recharts';
import {
  TrendingUp,
  Users,
  Clock,
  Target,
  Award,
  Activity,
  Calendar,
  Eye,
  MousePointer,
  Download,
  Share2,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Filter,
  RefreshCw
} from 'lucide-react';

const Analytics: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [platformMetrics, setPlatformMetrics] = useState<AnalyticsMetrics | null>(null);
  const [userJourney, setUserJourney] = useState<UserJourneyStep[]>([]);
  const [personalAnalytics, setPersonalAnalytics] = useState<PersonalAnalytics | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        await loadAnalyticsData(user.id);
      }
    };
    
    getUser();
  }, []);

  const loadAnalyticsData = async (userId: string) => {
    try {
      setLoading(true);
      
      // Load all analytics data
      const [metrics, journey, personal] = await Promise.all([
        analyticsService.getPlatformMetrics(),
        analyticsService.getUserJourney(),
        analyticsService.getPersonalAnalytics(userId)
      ]);
      
      setPlatformMetrics(metrics);
      setUserJourney(journey);
      setPersonalAnalytics(personal);
      
      // Track analytics page view
      await analyticsService.trackPageView(userId, '/analytics', 'Analytics Dashboard');
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshData = async () => {
    if (user) {
      await loadAnalyticsData(user.id);
    }
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316'];

  // Chart data transformations
  const engagementData = platformMetrics ? [
    { name: 'CV Uploads', value: platformMetrics.user_engagement.cv_uploads },
    { name: 'University Searches', value: platformMetrics.user_engagement.university_searches },
    { name: 'Applications', value: platformMetrics.user_engagement.applications_created },
    { name: 'Social Posts', value: platformMetrics.user_engagement.social_posts },
    { name: 'Documents Generated', value: platformMetrics.user_engagement.document_generations }
  ] : [];

  const funnelData = platformMetrics ? [
    { name: 'Visitors', value: platformMetrics.conversion_funnel.visitors, fill: '#3B82F6' },
    { name: 'Sign-ups', value: platformMetrics.conversion_funnel.signups, fill: '#10B981' },
    { name: 'Profiles Complete', value: platformMetrics.conversion_funnel.profile_completions, fill: '#F59E0B' },
    { name: 'First Application', value: platformMetrics.conversion_funnel.first_application, fill: '#EF4444' },
    { name: 'Submitted', value: platformMetrics.conversion_funnel.application_submissions, fill: '#8B5CF6' }
  ] : [];

  const weeklyActivityData = personalAnalytics?.weekly_activity.map(week => ({
    week: week.week.replace('2024-W', 'Week '),
    sessions: week.sessions,
    duration: week.duration,
    interactions: week.interactions
  })) || [];

  if (loading) {
    return (
      <>
        <AuthenticatedHeader />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analytics data...</p>
          </div>
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <AuthenticatedHeader />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Analytics Access Required</h2>
            <p className="text-gray-600">Please sign in to view analytics data</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEOHead 
        title="Analytics Dashboard"
        description="Comprehensive analytics and insights for your graduate school application journey on GradApp platform."
        keywords="analytics, insights, application tracking, user engagement, platform metrics"
      />
      <AuthenticatedHeader />
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-8 px-4 max-w-7xl">
          
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
              <p className="text-gray-600">Comprehensive insights into platform usage and your progress</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={handleRefreshData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
              <Button variant="outline">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          {platformMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Users</p>
                      <p className="text-2xl font-bold text-gray-900">{platformMetrics.total_users.toLocaleString()}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="mt-2 flex items-center text-sm">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-green-600">+12.5% from last month</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Today</p>
                      <p className="text-2xl font-bold text-gray-900">{platformMetrics.active_users_today}</p>
                    </div>
                    <Activity className="h-8 w-8 text-green-500" />
                  </div>
                  <div className="mt-2 flex items-center text-sm">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-green-600">+8.3% from yesterday</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Avg. Session</p>
                      <p className="text-2xl font-bold text-gray-900">{platformMetrics.avg_session_duration}m</p>
                    </div>
                    <Clock className="h-8 w-8 text-orange-500" />
                  </div>
                  <div className="mt-2 flex items-center text-sm">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-green-600">+3.2min from last week</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Bounce Rate</p>
                      <p className="text-2xl font-bold text-gray-900">{platformMetrics.bounce_rate}%</p>
                    </div>
                    <Target className="h-8 w-8 text-purple-500" />
                  </div>
                  <div className="mt-2 flex items-center text-sm">
                    <span className="text-red-600">-2.1% from last month</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="flex items-center">
                <BarChart3 className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="engagement" className="flex items-center">
                <PieChartIcon className="h-4 w-4 mr-2" />
                User Engagement
              </TabsTrigger>
              <TabsTrigger value="journey" className="flex items-center">
                <LineChartIcon className="h-4 w-4 mr-2" />
                User Journey
              </TabsTrigger>
              <TabsTrigger value="personal" className="flex items-center">
                <Award className="h-4 w-4 mr-2" />
                Personal Insights
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Most Visited Pages */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Eye className="h-5 w-5 mr-2 text-blue-500" />
                      Most Visited Pages
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {platformMetrics?.most_visited_pages.map((page, index) => (
                      <div key={page.page} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline" className="text-xs">{index + 1}</Badge>
                          <span className="font-medium">{page.page}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-900">{page.visits.toLocaleString()}</div>
                          <div className="text-sm text-gray-500">visits</div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Conversion Funnel */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Target className="h-5 w-5 mr-2 text-purple-500" />
                      Conversion Funnel
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <FunnelChart>
                        <Tooltip />
                        <Funnel
                          dataKey="value"
                          data={funnelData}
                          isAnimationActive
                        >
                          <LabelList position="center" fill="#fff" stroke="none" />
                        </Funnel>
                      </FunnelChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

              </div>
            </TabsContent>

            {/* User Engagement Tab */}
            <TabsContent value="engagement" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Feature Usage */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MousePointer className="h-5 w-5 mr-2 text-green-500" />
                      Feature Usage
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={engagementData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {engagementData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Engagement Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Activity className="h-5 w-5 mr-2 text-orange-500" />
                      Engagement Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {platformMetrics && Object.entries(platformMetrics.user_engagement).map(([key, value]) => (
                      <div key={key} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize text-gray-600">{key.replace('_', ' ')}</span>
                          <span className="font-medium">{value.toLocaleString()}</span>
                        </div>
                        <Progress 
                          value={(value / Math.max(...Object.values(platformMetrics.user_engagement))) * 100} 
                          className="h-2"
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>

              </div>
            </TabsContent>

            {/* User Journey Tab */}
            <TabsContent value="journey" className="space-y-6">
              
              {/* Journey Flow */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <LineChartIcon className="h-5 w-5 mr-2 text-blue-500" />
                    User Journey Flow
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {userJourney.map((step, index) => (
                      <div key={step.step_name} className="relative">
                        <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                              {step.step_order}
                            </div>
                          </div>
                          
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{step.step_name}</h3>
                            <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Reached:</span>
                                <span className="ml-1 font-medium">{step.users_reached.toLocaleString()}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Completed:</span>
                                <span className="ml-1 font-medium">{step.users_completed.toLocaleString()}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Completion:</span>
                                <span className="ml-1 font-medium text-green-600">{step.completion_rate.toFixed(1)}%</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Avg. Time:</span>
                                <span className="ml-1 font-medium">{step.avg_time_spent}s</span>
                              </div>
                            </div>
                            <div className="mt-2">
                              <Progress value={step.completion_rate} className="h-2" />
                            </div>
                          </div>
                        </div>
                        
                        {index < userJourney.length - 1 && (
                          <div className="flex justify-center py-2">
                            <div className="w-px h-6 bg-gray-300"></div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

            </TabsContent>

            {/* Personal Insights Tab */}
            <TabsContent value="personal" className="space-y-6">
              {personalAnalytics && (
                <>
                  {/* Personal Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                      <CardContent className="p-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-blue-600 mb-2">{personalAnalytics.profile_completion}%</div>
                          <p className="text-gray-600">Profile Complete</p>
                          <Progress value={personalAnalytics.profile_completion} className="mt-3" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-green-600 mb-2">{personalAnalytics.total_logins}</div>
                          <p className="text-gray-600">Total Logins</p>
                          <p className="text-sm text-gray-500 mt-2">{Math.round(personalAnalytics.time_spent_total / 60)} hours spent</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-purple-600 mb-2">{personalAnalytics.achievements.length}</div>
                          <p className="text-gray-600">Achievements</p>
                          <p className="text-sm text-gray-500 mt-2">{personalAnalytics.features_used.length} features used</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Weekly Activity Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Calendar className="h-5 w-5 mr-2 text-blue-500" />
                        Weekly Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={weeklyActivityData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="week" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="sessions" fill="#3B82F6" name="Sessions" />
                          <Bar dataKey="duration" fill="#10B981" name="Duration (min)" />
                          <Bar dataKey="interactions" fill="#F59E0B" name="Interactions" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Achievements */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Award className="h-5 w-5 mr-2 text-yellow-500" />
                        Recent Achievements
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {personalAnalytics.achievements.map((achievement, index) => (
                          <div key={index} className="flex items-center space-x-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                              <Award className="h-6 w-6 text-yellow-600" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900">{achievement.title}</h3>
                              <p className="text-sm text-gray-600">{achievement.description}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                Earned on {new Date(achievement.date_earned).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge variant="outline" className="capitalize">
                              {achievement.category}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

          </Tabs>
        </div>
      </div>
    </>
  );
};

export default Analytics;