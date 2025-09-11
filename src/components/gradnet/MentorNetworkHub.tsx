import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  MessageCircle, 
  Calendar, 
  CheckCircle,
  X,
  Clock,
  TrendingUp,
  Award,
  Target,
  BookOpen,
  Video,
  FileText,
  UserPlus,
  UserCheck,
  UserX,
  BarChart3,
  Star,
  Loader2,
  Search,
  Filter,
  Send,
  Phone,
  Mail
} from 'lucide-react';
import { toast } from 'sonner';

interface MentorNetworkHubProps {
  user: User;
}

interface Mentee {
  id: string;
  user_id: string;
  display_name: string;
  profile_image_url?: string;
  field_of_study?: string;
  academic_level?: string;
  current_institution?: string;
  progress_percentage: number;
  connection_date: string;
  last_interaction?: string;
  goals?: string[];
  status: 'active' | 'inactive' | 'completed';
}

interface ConnectionRequest {
  id: string;
  requester_id: string;
  requester_name: string;
  requester_image?: string;
  requester_field?: string;
  requester_level?: string;
  message: string;
  created_at: string;
}

interface MentorshipStats {
  totalMentees: number;
  activeMentees: number;
  successfulCompletions: number;
  averageRating: number;
  totalSessions: number;
  responseRate: number;
}

const MentorNetworkHub: React.FC<MentorNetworkHubProps> = ({ user }) => {
  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([]);
  const [stats, setStats] = useState<MentorshipStats>({
    totalMentees: 0,
    activeMentees: 0,
    successfulCompletions: 0,
    averageRating: 0,
    totalSessions: 0,
    responseRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('mentees');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all-statuses');

  useEffect(() => {
    loadMentorshipData();
  }, [user.id]);

  const loadMentorshipData = async () => {
    setLoading(true);
    try {
      // Load mentees
      const { data: mentorships } = await supabase
        .from('user_connections')
        .select(`
          id,
          receiver_id,
          status,
          created_at,
          receiver:auth.users!receiver_id(
            id,
            raw_user_meta_data
          )
        `)
        .eq('requester_id', user.id)
        .eq('connection_type', 'mentor')
        .eq('status', 'accepted');

      // Transform to mentees format
      const menteeData: Mentee[] = (mentorships || []).map(connection => ({
        id: connection.id,
        user_id: connection.receiver_id,
        display_name: connection.receiver?.raw_user_meta_data?.name || 'Unknown',
        profile_image_url: connection.receiver?.raw_user_meta_data?.avatar_url,
        field_of_study: 'Computer Science', // Would come from user_profiles
        academic_level: 'masters', // Would come from user_profiles
        current_institution: 'University', // Would come from user_profiles
        progress_percentage: Math.floor(Math.random() * 100), // Would be calculated
        connection_date: connection.created_at,
        status: 'active' as const,
        goals: ['Get into top program', 'Improve application'] // Would come from mentorship goals
      }));

      setMentees(menteeData);

      // Load pending connection requests
      const { data: requests } = await supabase
        .from('user_connections')
        .select(`
          id,
          requester_id,
          message,
          created_at,
          requester:auth.users!requester_id(
            id,
            raw_user_meta_data
          )
        `)
        .eq('receiver_id', user.id)
        .eq('connection_type', 'mentor')
        .eq('status', 'pending');

      const requestData: ConnectionRequest[] = (requests || []).map(request => ({
        id: request.id,
        requester_id: request.requester_id,
        requester_name: request.requester?.raw_user_meta_data?.name || 'Unknown',
        requester_image: request.requester?.raw_user_meta_data?.avatar_url,
        requester_field: 'Computer Science', // Would come from user_profiles
        requester_level: 'masters', // Would come from user_profiles
        message: request.message || '',
        created_at: request.created_at
      }));

      setConnectionRequests(requestData);

      // Calculate stats
      setStats({
        totalMentees: menteeData.length,
        activeMentees: menteeData.filter(m => m.status === 'active').length,
        successfulCompletions: menteeData.filter(m => m.status === 'completed').length,
        averageRating: 4.8, // Would come from feedback
        totalSessions: menteeData.length * 5, // Would come from session records
        responseRate: 95 // Would be calculated from response times
      });

    } catch (error) {
      console.error('Error loading mentorship data:', error);
      toast.error('Failed to load mentorship data');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectionRequest = async (requestId: string, action: 'accept' | 'decline') => {
    try {
      const { error } = await supabase
        .from('user_connections')
        .update({ status: action === 'accept' ? 'accepted' : 'declined' })
        .eq('id', requestId);

      if (error) {throw error;}

      toast.success(`Connection request ${action}ed`);
      loadMentorshipData(); // Reload data
    } catch (error) {
      console.error(`Error ${action}ing connection request:`, error);
      toast.error(`Failed to ${action} connection request`);
    }
  };

  const handleStartConversation = async (menteeId: string, menteeName: string) => {
    try {
      // Create or get direct conversation
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .contains('participants', [user.id, menteeId])
        .eq('conversation_type', 'direct')
        .single();

      let conversationId = existingConv?.id;

      if (!conversationId) {
        const { data: newConv, error } = await supabase
          .from('conversations')
          .insert({
            participants: [user.id, menteeId],
            conversation_type: 'direct',
            title: `Mentorship with ${menteeName}`,
            created_by: user.id
          })
          .select('id')
          .single();

        if (error) {throw error;}
        conversationId = newConv.id;
      }

      toast.success(`Opening conversation with ${menteeName}`);
      // Navigate to messages tab
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.error('Failed to start conversation');
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {return 'Today';}
    if (diffInDays === 1) {return 'Yesterday';}
    if (diffInDays < 7) {return `${diffInDays} days ago`;}
    if (diffInDays < 30) {return `${Math.floor(diffInDays / 7)} weeks ago`;}
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  const getProgressColor = (percentage: number): string => {
    if (percentage >= 80) {return 'text-green-600';}
    if (percentage >= 60) {return 'text-blue-600';}
    if (percentage >= 40) {return 'text-yellow-600';}
    return 'text-red-600';
  };

  const filteredMentees = mentees.filter(mentee => {
    const matchesSearch = !searchTerm || 
      mentee.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mentee.field_of_study?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || statusFilter === 'all-statuses' || mentee.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gradapp-primary" />
        <span className="ml-2 text-gray-600">Loading network data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gradapp-primary">{stats.totalMentees}</div>
            <div className="text-sm text-gray-600">Total Mentees</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.activeMentees}</div>
            <div className="text-sm text-gray-600">Active</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.successfulCompletions}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.averageRating.toFixed(1)}</div>
            <div className="text-sm text-gray-600">Avg Rating</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.totalSessions}</div>
            <div className="text-sm text-gray-600">Sessions</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-indigo-600">{stats.responseRate}%</div>
            <div className="text-sm text-gray-600">Response Rate</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="mentees" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            My Mentees ({stats.activeMentees})
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Requests ({connectionRequests.length})
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* My Mentees Tab */}
        <TabsContent value="mentees" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Active Mentorships</CardTitle>
                <div className="flex gap-4">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                    <Input
                      placeholder="Search mentees..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-statuses">All</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMentees.map((mentee) => (
                  <Card key={mentee.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={mentee.profile_image_url} />
                            <AvatarFallback>
                              {mentee.display_name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {mentee.display_name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {mentee.academic_level} • {mentee.field_of_study}
                            </p>
                          </div>
                        </div>
                        <Badge variant={mentee.status === 'active' ? 'default' : 'secondary'}>
                          {mentee.status}
                        </Badge>
                      </div>

                      <div className="space-y-3 mb-4">
                        <div>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-600">Progress</span>
                            <span className={`font-medium ${getProgressColor(mentee.progress_percentage)}`}>
                              {mentee.progress_percentage}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradapp-primary h-2 rounded-full transition-all duration-300"
                              style={{ width: `${mentee.progress_percentage}%` }}
                            />
                          </div>
                        </div>

                        <div className="text-sm text-gray-600">
                          <p>Connected: {formatTimeAgo(mentee.connection_date)}</p>
                          {mentee.last_interaction && (
                            <p>Last interaction: {formatTimeAgo(mentee.last_interaction)}</p>
                          )}
                        </div>

                        {mentee.goals && mentee.goals.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-gray-700 mb-1">Goals:</p>
                            <div className="space-y-1">
                              {mentee.goals.slice(0, 2).map((goal, index) => (
                                <div key={index} className="flex items-center gap-2 text-xs">
                                  <Target className="h-3 w-3 text-gradapp-primary" />
                                  <span className="text-gray-600">{goal}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleStartConversation(mentee.user_id, mentee.display_name)}
                          className="flex-1 bg-gradapp-primary hover:bg-gradapp-accent"
                        >
                          <MessageCircle className="h-3 w-3 mr-1" />
                          Message
                        </Button>
                        <Button size="sm" variant="outline">
                          <Calendar className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Video className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredMentees.length === 0 && (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No mentees found</h3>
                  <p className="text-gray-500">
                    {searchTerm || statusFilter ? 'Try adjusting your filters' : 'Start accepting mentorship requests to build your network'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Connection Requests Tab */}
        <TabsContent value="requests" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mentorship Requests</CardTitle>
              <p className="text-gray-600">Students seeking your guidance and mentorship</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {connectionRequests.map((request) => (
                  <Card key={request.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={request.requester_image} />
                          <AvatarFallback>
                            {request.requester_name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            {request.requester_name}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2">
                            {request.requester_level} • {request.requester_field}
                          </p>
                          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                            "{request.message}"
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            Sent {formatTimeAgo(request.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleConnectionRequest(request.id, 'accept')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <UserCheck className="h-3 w-3 mr-1" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleConnectionRequest(request.id, 'decline')}
                          className="text-red-600 hover:text-red-700"
                        >
                          <UserX className="h-3 w-3 mr-1" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}

                {connectionRequests.length === 0 && (
                  <div className="text-center py-8">
                    <UserPlus className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No pending requests</h3>
                    <p className="text-gray-500">
                      New mentorship requests will appear here when students reach out to you.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Impact Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Success Rate</span>
                  <span className="font-semibold">92%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Average Session Duration</span>
                  <span className="font-semibold">45 min</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Mentee Satisfaction</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="font-semibold">4.8/5</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Completion Rate</span>
                  <span className="font-semibold">78%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <MessageCircle className="h-4 w-4 text-blue-500" />
                  <span>Responded to Sarah's question about research proposals</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-green-500" />
                  <span>Completed session with Michael about interview prep</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <FileText className="h-4 w-4 text-purple-500" />
                  <span>Shared CV template with Emma</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Award className="h-4 w-4 text-yellow-500" />
                  <span>Alex got accepted to Stanford - celebration!</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MentorNetworkHub;