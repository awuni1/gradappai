
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import { CalendarCheck, FileText, Clock, ArrowUp, ArrowDown, Filter, PieChart, BarChart as BarChartIcon } from 'lucide-react';
import { ChartContainer } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { dashboardService, Application } from '@/services/dashboardService';

interface UpcomingDeadline {
  deadline_id: string;
  application_id: string;
  university_name: string;
  program_name: string;
  deadline_type: string;
  deadline_date: string;
  deadline_time?: string;
  description?: string;
  days_remaining: number;
  is_urgent: boolean;
}


const statusColors = {
  not_started: 'bg-slate-400',
  in_progress: 'bg-blue-500',
  submitted: 'bg-emerald-500',
  interview: 'bg-purple-500',
  accepted: 'bg-green-500',
  rejected: 'bg-red-500'
};

const statusTextColors = {
  not_started: 'text-slate-500',
  in_progress: 'text-blue-500',
  submitted: 'text-emerald-500',
  interview: 'text-purple-500',
  accepted: 'text-green-500',
  rejected: 'text-red-500'
};

const statusLabels = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  submitted: 'Submitted',
  interview: 'Interview',
  accepted: 'Accepted',
  rejected: 'Rejected'
};

const statusColors2 = ['#94a3b8', '#3b82f6', '#10b981', '#8b5cf6', '#22c55e', '#ef4444'];

const getStatusColor = (status: string) => {
  return statusColors[status as keyof typeof statusColors] || 'bg-gray-400';
};

const getStatusTextColor = (status: string) => {
  return statusTextColors[status as keyof typeof statusTextColors] || 'text-gray-500';
};

const ApplicationProgressSection: React.FC = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<UpcomingDeadline[]>([]);
  const [applicationStats, setApplicationStats] = useState<{
    total: number;
    by_status: { status: string; count: number; color: string }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'deadline' | 'progress'>('deadline');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Fetch real data from Supabase and set up real-time subscriptions
  useEffect(() => {
    fetchApplicationData();
    
    // Set up real-time subscriptions for applications
    const applicationsSubscription = supabase
      .channel('applications_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'applications'
      }, (payload) => {
        console.log('Applications table changed:', payload);
        // Refresh data when applications change
        fetchApplicationData();
      })
      .subscribe();

    // Set up real-time subscriptions for deadlines
    const deadlinesSubscription = supabase
      .channel('deadlines_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'deadlines'
      }, (payload) => {
        console.log('Deadlines table changed:', payload);
        // Refresh data when deadlines change
        fetchApplicationData();
      })
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      applicationsSubscription.unsubscribe();
      deadlinesSubscription.unsubscribe();
    };
  }, []);

  const fetchApplicationData = async () => {
    try {
      setLoading(true);
      
      // Check if user is authenticated first
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        console.log('User not authenticated, skipping application data fetch');
        setLoading(false);
        return;
      }

      // Try to fetch applications with better error handling
      try {
        const { data: appsData, error: appsError } = await dashboardService.getApplications();
        if (appsError) {
          console.warn('Applications table may not exist yet:', appsError);
          // Set empty data instead of showing error
          setApplications([]);
        } else {
          setApplications(appsData || []);
        }
      } catch (appError) {
        console.warn('Application tracking not yet set up:', appError);
        setApplications([]);
      }

      // Try to fetch upcoming deadlines
      try {
        const { data: deadlinesData, error: deadlinesError } = await dashboardService.getUpcomingDeadlines(30);
        if (deadlinesError) {
          console.warn('Deadlines table may not exist yet:', deadlinesError);
          setUpcomingDeadlines([]);
        } else {
          setUpcomingDeadlines(deadlinesData || []);
        }
      } catch (deadlineError) {
        console.warn('Deadline tracking not yet set up:', deadlineError);
        setUpcomingDeadlines([]);
      }

      // Try to fetch application statistics
      try {
        const { data: statsData, error: statsError } = await dashboardService.getApplicationStats();
        if (statsError) {
          console.warn('Application stats may not be available yet:', statsError);
          setApplicationStats({
            total: 0,
            not_started: 0,
            in_progress: 0,
            submitted: 0,
            interview: 0,
            accepted: 0,
            rejected: 0,
            waitlisted: 0,
            average_progress: 0
          });
        } else {
          setApplicationStats(statsData || {
            total: 0,
            not_started: 0,
            in_progress: 0,
            submitted: 0,
            interview: 0,
            accepted: 0,
            rejected: 0,
            waitlisted: 0,
            average_progress: 0
          });
        }
      } catch (statsError) {
        console.warn('Application statistics not yet available:', statsError);
        setApplicationStats({
          total: 0,
          not_started: 0,
          in_progress: 0,
          submitted: 0,
          interview: 0,
          accepted: 0,
          rejected: 0,
          waitlisted: 0,
          average_progress: 0
        });
      }
    } catch (error) {
      console.warn('Application tracking system not fully configured yet:', error);
      // Set default empty state instead of showing error
      setApplications([]);
      setUpcomingDeadlines([]);
      setApplicationStats({
        total: 0,
        not_started: 0,
        in_progress: 0,
        submitted: 0,
        interview: 0,
        accepted: 0,
        rejected: 0,
        waitlisted: 0,
        average_progress: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // Format deadline for display
  const formatDeadline = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Calculate days remaining until deadline
  const getDaysRemaining = (dateString: string) => {
    const today = new Date();
    const deadline = new Date(dateString);
    const diffTime = deadline.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Get status for chart visualization
  const getStatusData = () => {
    if (!applicationStats) {return [];}
    
    return [
      { name: 'Not Started', value: applicationStats.not_started },
      { name: 'In Progress', value: applicationStats.in_progress },
      { name: 'Submitted', value: applicationStats.submitted },
      { name: 'Interview', value: applicationStats.interview },
      { name: 'Accepted', value: applicationStats.accepted },
      { name: 'Rejected', value: applicationStats.rejected },
      { name: 'Waitlisted', value: applicationStats.waitlisted }
    ].filter(item => item.value > 0);
  };

  // Get pie chart data
  const getPieData = () => {
    if (!applicationStats) {return [];}
    
    const completed = applicationStats.submitted + applicationStats.accepted;
    const inProgress = applicationStats.in_progress + applicationStats.interview;
    const notStarted = applicationStats.not_started;
    
    return [
      { name: 'Completed', value: completed, color: '#10b981' },
      { name: 'In Progress', value: inProgress, color: '#3b82f6' },
      { name: 'Not Started', value: notStarted, color: '#94a3b8' }
    ].filter(item => item.value > 0);
  };

  // Calculate overall progress
  const getOverallProgress = () => {
    return applicationStats?.average_progress || 0;
  };

  // Get deadline dates for calendar highlighting
  const getDeadlineDates = () => {
    return upcomingDeadlines.map(deadline => new Date(deadline.deadline_date));
  };

  // Sort applications
  const sortApplications = () => {
    const sorted = [...applications];
    
    if (sortOrder === 'deadline') {
      sorted.sort((a, b) => {
        const dateA = new Date(a.deadline_text || '').getTime();
        const dateB = new Date(b.deadline_text || '').getTime();
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      });
    } else {
      sorted.sort((a, b) => {
        return sortDirection === 'asc' ? a.progress - b.progress : b.progress - a.progress;
      });
    }
    
    setApplications(sorted);
  };

  // Toggle sort direction
  const toggleSort = (order: 'deadline' | 'progress') => {
    if (sortOrder === order) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortOrder(order);
      setSortDirection('asc');
    }
  };

  // Effect for sorting
  useEffect(() => {
    const sorted = [...applications];
    
    if (sortOrder === 'deadline') {
      sorted.sort((a, b) => {
        const dateA = new Date(a.deadline_text || '').getTime();
        const dateB = new Date(b.deadline_text || '').getTime();
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      });
    } else {
      sorted.sort((a, b) => {
        return sortDirection === 'asc' ? a.progress - b.progress : b.progress - a.progress;
      });
    }
    
    setApplications(sorted);
  }, [applications, sortOrder, sortDirection]);

  // Custom tooltip component for the chart
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-200 rounded shadow-sm">
          <p className="font-medium">{`${payload[0].name}: ${payload[0].value} applications`}</p>
        </div>
      );
    }
    return null;
  };

  // Get appropriate status badge
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'not_started':
        return <Badge variant="outline" className="bg-slate-100 text-slate-500">Not Started</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-blue-100 text-blue-500">In Progress</Badge>;
      case 'submitted':
        return <Badge variant="outline" className="bg-emerald-100 text-emerald-500">Submitted</Badge>;
      case 'interview':
        return <Badge variant="outline" className="bg-purple-100 text-purple-500">Interview</Badge>;
      case 'accepted':
        return <Badge variant="outline" className="bg-green-100 text-green-500">Accepted</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-100 text-red-500">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gradapp-primary">Application Progress Dashboard</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="shadow-md">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gradapp-primary">Application Progress Dashboard</h2>
        <div className="flex gap-2">
          <Button 
            variant={viewMode === 'grid' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <PieChart className="h-4 w-4 mr-1" /> Grid
          </Button>
          <Button 
            variant={viewMode === 'list' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <BarChartIcon className="h-4 w-4 mr-1" /> List
          </Button>
        </div>
      </div>
      
      {/* Overall Progress Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 shadow-md border-gradapp-accent/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex justify-between">
              <span>Overall Progress</span>
              <span className="text-2xl font-bold text-gradapp-primary">{getOverallProgress()}%</span>
            </CardTitle>
            <CardDescription>Your application journey</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Progress value={getOverallProgress()} className="h-3" />
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="flex flex-col items-center p-2 rounded-md bg-blue-50">
                <span className="text-xl font-bold text-blue-500">{applicationStats?.in_progress || 0}</span>
                <span className="text-xs text-blue-500">In Progress</span>
              </div>
              <div className="flex flex-col items-center p-2 rounded-md bg-emerald-50">
                <span className="text-xl font-bold text-emerald-500">{applicationStats?.submitted || 0}</span>
                <span className="text-xs text-emerald-500">Submitted</span>
              </div>
              <div className="flex flex-col items-center p-2 rounded-md bg-gray-50">
                <span className="text-xl font-bold text-gray-500">{applicationStats?.not_started || 0}</span>
                <span className="text-xs text-gray-500">Not Started</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 shadow-md border-gradapp-accent/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Applications by Status</CardTitle>
            <CardDescription>Overview of your applications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[180px]">
              <RechartsPieChart width={250} height={180}>
                <Pie
                  data={getPieData()}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {getPieData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </RechartsPieChart>
            </div>
            <div className="grid grid-cols-3 gap-1 text-sm mt-2">
              {getPieData().map((entry) => (
                <div key={entry.name} className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: entry.color }}></div>
                  <span>{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 shadow-md border-gradapp-accent/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Upcoming Deadlines</CardTitle>
            <CardDescription>Applications due soon</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingDeadlines.slice(0, 3).map(deadline => {
                const isUrgent = deadline.is_urgent;
                return (
                  <div 
                    key={deadline.deadline_id} 
                    className={`p-3 rounded-lg ${isUrgent ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-100'}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{deadline.university_name}</h4>
                        <p className="text-sm text-muted-foreground">{deadline.program_name}</p>
                        <p className="text-xs text-gray-500 capitalize">{deadline.deadline_type} deadline</p>
                      </div>
                      <Badge variant={isUrgent ? "destructive" : "outline"}>
                        {isUrgent ? 'Urgent' : 'Upcoming'}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center">
                      <Clock className={`h-4 w-4 mr-2 ${isUrgent ? 'text-red-500' : 'text-blue-500'}`} />
                      <p className={`text-sm ${isUrgent ? 'text-red-500 font-medium' : ''}`}>
                        {formatDeadline(deadline.deadline_date)} ({deadline.days_remaining} {deadline.days_remaining === 1 ? 'day' : 'days'} left)
                      </p>
                    </div>
                  </div>
                );
              })}

              {upcomingDeadlines.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  No upcoming deadlines in the next 30 days
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              <CalendarCheck className="mr-2 h-4 w-4" />
              View All Deadlines
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* Application Progress Cards (Grid View) */}
      {viewMode === 'grid' && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Your Applications</h3>
            <Button variant="outline" size="sm" className="gap-1">
              <Filter className="h-4 w-4" /> Filter
            </Button>
          </div>
          
          {applications.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="flex flex-col items-center space-y-4">
                  <div className="rounded-full bg-gradapp-primary/10 p-4">
                    <FileText className="h-8 w-8 text-gradapp-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Applications Yet</h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                      Start your graduate school journey by selecting universities and tracking your applications.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => navigate('/matched-universities')}
                      className="bg-gradapp-primary hover:bg-gradapp-accent"
                    >
                      Find Universities
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => navigate('/selected-universities')}
                    >
                      View Selected
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {applications.map(app => (
              <Card key={app.id} className="shadow-md hover:shadow-lg transition-shadow duration-300 border-t-4" style={{ borderTopColor: app.status === 'not_started' ? '#94a3b8' : app.status === 'in_progress' ? '#3b82f6' : '#10b981' }}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between">
                    <CardTitle className="text-lg">{app.university_name}</CardTitle>
                    {getStatusBadge(app.status)}
                  </div>
                  <CardDescription>{app.program_name}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <span>Progress</span>
                      <span className={`font-medium ${getStatusTextColor(app.status)}`}>{app.progress}%</span>
                    </div>
                    <Progress value={app.progress} className="h-2" />
                  </div>
                  
                  {app.deadline_text && (
                    <>
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1 text-gradapp-primary" />
                          <span>Deadline:</span>
                        </div>
                        <span className="font-medium">{formatDeadline(app.deadline_text)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center">
                          <CalendarCheck className="h-4 w-4 mr-1 text-gradapp-primary" />
                          <span>Time left:</span>
                        </div>
                        <span className={`font-medium ${getDaysRemaining(app.deadline_text) <= 7 ? 'text-red-500' : ''}`}>
                          {getDaysRemaining(app.deadline_text)} days
                        </span>
                      </div>
                    </>
                  )}
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" className="w-full">
                    View Details
                  </Button>
                </CardFooter>
              </Card>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Application List (List View) */}
      {viewMode === 'list' && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Your Applications</CardTitle>
              <Button variant="outline" size="sm">
                <FileText className="mr-2 h-4 w-4" />
                New Application
              </Button>
            </div>
            <CardDescription>Track your graduate school applications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-hidden">
              <div className="grid grid-cols-12 gap-4 py-3 px-4 border-b bg-muted/50 font-medium">
                <div className="col-span-4">School & Program</div>
                <div 
                  className="col-span-2 flex items-center cursor-pointer"
                  onClick={() => toggleSort('deadline')}
                >
                  Deadline
                  {sortOrder === 'deadline' && (
                    sortDirection === 'asc' ? 
                      <ArrowUp className="ml-1 h-3 w-3" /> : 
                      <ArrowDown className="ml-1 h-3 w-3" />
                  )}
                </div>
                <div className="col-span-2">Status</div>
                <div 
                  className="col-span-4 flex items-center cursor-pointer"
                  onClick={() => toggleSort('progress')}
                >
                  Progress
                  {sortOrder === 'progress' && (
                    sortDirection === 'asc' ? 
                      <ArrowUp className="ml-1 h-3 w-3" /> : 
                      <ArrowDown className="ml-1 h-3 w-3" />
                  )}
                </div>
              </div>
              
              {applications.map(app => (
                <div key={app.id} className="grid grid-cols-12 gap-4 py-4 px-4 border-b items-center hover:bg-muted/20 transition-colors">
                  <div className="col-span-4">
                    <div className="font-medium">{app.university_name}</div>
                    <div className="text-sm text-muted-foreground">{app.program_name}</div>
                  </div>
                  <div className="col-span-2">
                    {app.deadline_text ? (
                      <>
                        <div className="font-medium">{formatDeadline(app.deadline_text)}</div>
                        <div className={`text-xs ${getDaysRemaining(app.deadline_text) <= 7 ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                          {getDaysRemaining(app.deadline_text) <= 0 
                            ? 'Due today!' 
                            : `${getDaysRemaining(app.deadline_text)} days left`}
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-muted-foreground">No deadline set</div>
                    )}
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(app.status)}`}></div>
                      <span>{statusLabels[app.status as keyof typeof statusLabels]}</span>
                    </div>
                  </div>
                  <div className="col-span-4">
                    <div className="flex items-center gap-3">
                      <Progress value={app.progress} className="h-2" />
                      <span className="text-sm font-medium w-8">{app.progress}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Calendar View Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Card className="md:col-span-1 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Application Calendar</CardTitle>
            <CardDescription>Important dates at a glance</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar 
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
            />
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Your Progress Timeline</CardTitle>
            <CardDescription>Track your application journey</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={applications.map(app => ({
                  name: app.university_name?.split(' ')[0] || 'University',
                  progress: app.progress,
                  status: app.status
                }))}>
                  <XAxis dataKey="name" />
                  <YAxis label={{ value: 'Progress (%)', angle: -90, position: 'insideLeft' }} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Bar dataKey="progress" radius={[4, 4, 0, 0]}>
                    {applications.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={
                        entry.status === 'not_started' ? '#94a3b8' :
                        entry.status === 'in_progress' ? '#3b82f6' :
                        entry.status === 'submitted' ? '#10b981' :
                        entry.status === 'accepted' ? '#22c55e' :
                        entry.status === 'rejected' ? '#ef4444' : 
                        entry.status === 'waitlisted' ? '#f59e0b' : '#8b5cf6'
                      } />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ApplicationProgressSection;
