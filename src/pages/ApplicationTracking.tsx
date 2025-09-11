import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription } from '../components/ui/alert';
import { 
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Target,
  TrendingUp,
  Award,
  Loader2
} from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import AuthenticatedHeader from '../components/AuthenticatedHeader';
import SEOHead from '../components/SEOHead';
import { User } from '@supabase/supabase-js';
import { 
  applicationTrackingService, 
  Application, 
  ApplicationRequirement, 
  ApplicationFinance, 
  ApplicationStats 
} from '../services/applicationTrackingService';


export default function ApplicationTracking() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [requirements, setRequirements] = useState<ApplicationRequirement[]>([]);
  const [finances, setFinances] = useState<ApplicationFinance[]>([]);
  const [stats, setStats] = useState<ApplicationStats | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState<string | null>(null);

  // Get user authentication state
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    
    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load real data from database
  useEffect(() => {
    if (user) {
      loadApplicationData();
    }
  }, [user]);

  const loadApplicationData = async () => {
    if (!user) {return;}
    
    try {
      setLoading(true);
      setError(null);

      // Load applications
      const userApplications = await applicationTrackingService.getUserApplications(user.id);
      setApplications(userApplications);

      // Load requirements for all applications
      const allRequirements = await applicationTrackingService.getAllUserRequirements(user.id);
      setRequirements(allRequirements);

      // Load finances for all applications
      const allFinances = await applicationTrackingService.getAllUserFinances(user.id);
      setFinances(allFinances);

      // Load statistics
      const applicationStats = await applicationTrackingService.getApplicationStats(user.id);
      setStats(applicationStats);

      console.log('✅ Loaded application data:', {
        applications: userApplications.length,
        requirements: allRequirements.length,
        finances: allFinances.length,
        stats: applicationStats
      });

    } catch (error) {
      console.error('❌ Error loading application data:', error);
      setError('Failed to load application data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'submitted': return 'bg-green-100 text-green-800';
      case 'interview': return 'bg-purple-100 text-purple-800';
      case 'decision_pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'waitlisted': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityIcon = (level: number) => {
    switch (level) {
      case 1: return <Target className="h-4 w-4 text-red-500" />;
      case 2: return <TrendingUp className="h-4 w-4 text-yellow-500" />;
      case 3: return <Award className="h-4 w-4 text-green-500" />;
      default: return <Target className="h-4 w-4 text-gray-500" />;
    }
  };

  const calculateProgress = (requirements: ApplicationRequirement[]) => {
    const completed = requirements.filter(req => req.status === 'completed').length;
    return (completed / requirements.length) * 100;
  };

  const getUpcomingDeadlines = () => {
    return applications
      .filter(app => new Date(app.application_deadline) > new Date())
      .sort((a, b) => new Date(a.application_deadline).getTime() - new Date(b.application_deadline).getTime())
      .slice(0, 5);
  };

  const totalCosts = stats?.total_costs || 0;
  const paidCosts = stats?.paid_costs || 0;

  // Authentication check
  if (!user && !loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AuthenticatedHeader />
        <div className="container mx-auto px-4 py-8">
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Please sign in to access application tracking.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AuthenticatedHeader />
        <div className="flex items-center justify-center h-96">
          <div className="flex items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="text-gray-600">Loading application data...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AuthenticatedHeader />
        <div className="container mx-auto px-4 py-8">
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
              <Button 
                onClick={loadApplicationData} 
                className="ml-4"
                size="sm"
              >
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead 
        title="Application Tracking - GradApp"
        description="Track your graduate school applications and deadlines"
      />
      <AuthenticatedHeader />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">Application Tracking</h1>
              <p className="text-muted-foreground">
                Monitor your graduate school applications and stay on top of deadlines
              </p>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Application
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Applications</p>
                  <p className="text-2xl font-bold">{applications.length}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Submitted</p>
                  <p className="text-2xl font-bold">
                    {applications.filter(app => app.application_status === 'submitted').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Upcoming Deadlines</p>
                  <p className="text-2xl font-bold">{getUpcomingDeadlines().length}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Costs</p>
                  <p className="text-2xl font-bold">${totalCosts}</p>
                  <p className="text-xs text-muted-foreground">${paidCosts} paid</p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="deadlines">Deadlines</TabsTrigger>
            <TabsTrigger value="finances">Finances</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {applications.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Applications Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Start by saving universities from the University Matching page, then track your applications here.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button onClick={() => window.location.href = '/university-matching'}>
                      <Target className="h-4 w-4 mr-2" />
                      Find Universities
                    </Button>
                    <Button variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Application
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Applications Progress */}
                <Card>
                  <CardHeader>
                    <CardTitle>Applications Progress</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {applications.map((app) => (
                      <div key={app.id} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            {getPriorityIcon(app.priority_level)}
                            <span className="font-medium">{app.university_name}</span>
                            <Badge className={getStatusColor(app.application_status)}>
                              {app.application_status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            Due: {new Date(app.application_deadline).toLocaleDateString()}
                          </span>
                        </div>
                        <Progress value={calculateProgress(requirements)} className="h-2" />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Upcoming Deadlines */}
                <Card>
                  <CardHeader>
                    <CardTitle>Upcoming Deadlines</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {getUpcomingDeadlines().map((app) => (
                      <div key={app.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                        <div>
                          <div className="font-medium">{app.university_name}</div>
                          <div className="text-sm text-muted-foreground">{app.program_name}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-orange-600">
                            {new Date(app.application_deadline).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {Math.ceil((new Date(app.application_deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="applications" className="space-y-6">
            {applications.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Applications to Track</h3>
                  <p className="text-muted-foreground mb-6">
                    Save universities from the University Matching page to start tracking your applications.
                  </p>
                  <Button onClick={() => window.location.href = '/university-matching'}>
                    <Target className="h-4 w-4 mr-2" />
                    Find & Save Universities
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => (
                <Card key={app.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getPriorityIcon(app.priority_level)}
                          <h3 className="font-bold text-xl">{app.university_name}</h3>
                          <Badge className={getStatusColor(app.application_status)}>
                            {app.application_status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mb-2">{app.program_name}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Deadline: {new Date(app.application_deadline).toLocaleDateString()}
                          </div>
                          {app.decision_date && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              Decision: {new Date(app.decision_date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {app.notes && (
                      <div className="mb-4">
                        <p className="text-sm text-muted-foreground">{app.notes}</p>
                      </div>
                    )}

                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Requirements Progress</span>
                        <span className="text-sm text-muted-foreground">
                          {requirements.filter(req => req.status === 'completed').length} of {requirements.length} completed
                        </span>
                      </div>
                      <Progress value={calculateProgress(requirements)} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {requirements.map((req) => (
                        <div key={req.id} className="flex items-center gap-2">
                          {req.status === 'completed' ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : req.status === 'in_progress' ? (
                            <Clock className="h-4 w-4 text-blue-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-orange-500" />
                          )}
                          <span className="text-sm">{req.requirement_name}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="deadlines" className="space-y-6">
            {applications.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Deadlines to Track</h3>
                  <p className="text-muted-foreground mb-6">
                    Save universities and set application deadlines to see them here.
                  </p>
                  <Button onClick={() => window.location.href = '/university-matching'}>
                    <Target className="h-4 w-4 mr-2" />
                    Find Universities
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>All Deadlines</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {applications
                      .sort((a, b) => new Date(a.application_deadline).getTime() - new Date(b.application_deadline).getTime())
                      .map((app) => (
                        <div key={app.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-blue-500" />
                            <div>
                              <div className="font-medium">{app.university_name}</div>
                              <div className="text-sm text-muted-foreground">{app.program_name}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">
                              {new Date(app.application_deadline).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(app.application_deadline) > new Date() ? (
                                `${Math.ceil((new Date(app.application_deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left`
                              ) : (
                                'Past due'
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="finances" className="space-y-6">
            {applications.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Financial Data</h3>
                  <p className="text-muted-foreground mb-6">
                    Start tracking applications to manage your application costs and finances.
                  </p>
                  <Button onClick={() => window.location.href = '/university-matching'}>
                    <Target className="h-4 w-4 mr-2" />
                    Find Universities
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <DollarSign className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <div className="text-2xl font-bold">${totalCosts}</div>
                  <div className="text-sm text-muted-foreground">Total Costs</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <div className="text-2xl font-bold">${paidCosts}</div>
                  <div className="text-sm text-muted-foreground">Paid</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                  <div className="text-2xl font-bold">${totalCosts - paidCosts}</div>
                  <div className="text-sm text-muted-foreground">Outstanding</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Financial Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {finances.map((finance, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <DollarSign className="h-5 w-5 text-purple-500" />
                        <div>
                          <div className="font-medium">
                            {finance.expense_type.replace('_', ' ').toUpperCase()}
                          </div>
                          <div className="text-sm text-muted-foreground">{finance.notes}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">${finance.amount} {finance.currency}</div>
                        <div className="text-sm">
                          {finance.paid ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Paid
                            </Badge>
                          ) : (
                            <Badge className="bg-orange-100 text-orange-800">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}