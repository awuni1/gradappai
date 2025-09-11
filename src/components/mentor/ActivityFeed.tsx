import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Activity,
  UserPlus,
  Calendar,
  FileText,
  MessageCircle,
  CheckCircle,
  Clock,
  Video,
  TrendingUp,
  Award,
  Loader2
} from 'lucide-react';

interface ActivityFeedProps {
  user: User;
  limit?: number;
}

interface ActivityItem {
  id: string;
  type: 'mentorship_created' | 'session_completed' | 'document_shared' | 'message_sent' | 'milestone_completed' | 'connection_request';
  title: string;
  description: string;
  timestamp: string;
  student_name?: string;
  student_avatar?: string;
  metadata?: any;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ user, limit = 10 }) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();

    // Set up real-time subscriptions for activity updates
    const mentorshipSubscription = supabase
      .channel(`mentorship_activities_${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'mentor_student_relationships',
        filter: `mentor_id=eq.${user.id}`
      }, (payload) => {
        console.log('🔄 Real-time mentorship activity update:', payload);
        loadActivities(); // Reload activities when mentorships change
      })
      .subscribe();

    const sessionSubscription = supabase
      .channel(`session_activities_${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'mentor_sessions'
      }, (payload) => {
        console.log('🔄 Real-time session activity update:', payload);
        loadActivities(); // Reload activities when sessions change
      })
      .subscribe();

    const reviewSubscription = supabase
      .channel(`review_activities_${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'documents',
        filter: `mentor_id=eq.${user.id}`
      }, (payload) => {
        console.log('🔄 Real-time review activity update:', payload);
        loadActivities(); // Reload activities when reviews change
      })
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      mentorshipSubscription.unsubscribe();
      sessionSubscription.unsubscribe();
      reviewSubscription.unsubscribe();
    };
  }, [user, limit]);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const activities: ActivityItem[] = [];

      // Get recent mentorship relationships (new students)
      const { data: recentMentorships } = await supabase
        .from('mentor_student_relationships')
        .select(`
          id,
          created_at,
          mentee_id,
          user_profiles!mentee_id(display_name, profile_image_url)
        `)
        .eq('mentor_id', user.id)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(limit);

      if (recentMentorships) {
        recentMentorships.forEach(mentorship => {
          activities.push({
            id: `mentorship_${mentorship.id}`,
            type: 'mentorship_created',
            title: 'New Student Added',
            description: 'Started mentoring a new student',
            timestamp: mentorship.created_at,
            student_name: mentorship.user_profiles?.display_name || 'Unknown Student',
            student_avatar: mentorship.user_profiles?.profile_image_url
          });
        });
      }

      // Get recent completed sessions
      const { data: recentSessions } = await supabase
        .from('mentor_sessions')
        .select(`
          id,
          title,
          session_type,
          review_completed_at,
          mentee_id,
          user_profiles!mentee_id(display_name, profile_image_url)
        `)
        .eq('status', 'completed')
        .not('review_completed_at', 'is', null)
        .gte('review_completed_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('review_completed_at', { ascending: false })
        .limit(limit);

      if (recentSessions) {
        recentSessions.forEach(session => {
          activities.push({
            id: `session_${session.id}`,
            type: 'session_completed',
            title: 'Session Completed',
            description: `Completed "${session.title || session.session_type}" session`,
            timestamp: session.review_completed_at,
            student_name: session.user_profiles?.display_name || 'Unknown Student',
            student_avatar: session.user_profiles?.profile_image_url
          });
        });
      }

      // Get recent document reviews
      const { data: recentReviews } = await supabase
        .from('documents')
        .select(`
          id,
          feedback_summary,
          review_completed_at,
          mentee_id,
          user_profiles!mentee_id(display_name, profile_image_url)
        `)
        .eq('mentor_id', user.id)
        .eq('status', 'completed')
        .not('review_completed_at', 'is', null)
        .gte('review_completed_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('review_completed_at', { ascending: false })
        .limit(limit);

      if (recentReviews) {
        recentReviews.forEach(review => {
          activities.push({
            id: `review_${review.id}`,
            type: 'document_shared',
            title: 'Document Reviewed',
            description: review.feedback_summary || 'Provided feedback on document',
            timestamp: review.review_completed_at,
            student_name: review.user_profiles?.display_name || 'Unknown Student',
            student_avatar: review.user_profiles?.profile_image_url
          });
        });
      }

      // Sort all activities by timestamp (most recent first)
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Limit to requested number of activities
      setActivities(activities.slice(0, limit));

    } catch (error) {
      console.error('Error loading activities:', error);
      // Don't show error toast for activity feed - just log and show empty state
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'mentorship_created': return <UserPlus className="h-4 w-4 text-blue-600" />;
      case 'session_completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'document_shared': return <FileText className="h-4 w-4 text-purple-600" />;
      case 'message_sent': return <MessageCircle className="h-4 w-4 text-indigo-600" />;
      case 'milestone_completed': return <Award className="h-4 w-4 text-yellow-600" />;
      case 'connection_request': return <TrendingUp className="h-4 w-4 text-orange-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'mentorship_created': return 'bg-blue-100';
      case 'session_completed': return 'bg-green-100';
      case 'document_shared': return 'bg-purple-100';
      case 'message_sent': return 'bg-indigo-100';
      case 'milestone_completed': return 'bg-yellow-100';
      case 'connection_request': return 'bg-orange-100';
      default: return 'bg-gray-100';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) {return 'Just now';}
    if (diffMinutes < 60) {return `${diffMinutes}m ago`;}
    if (diffHours < 24) {return `${diffHours}h ago`;}
    if (diffDays < 7) {return `${diffDays}d ago`;}
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gradapp-primary" />
            <span className="ml-2 text-sm text-gray-600">Loading activities...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {activity.title}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {activity.description}
                      </p>
                      {activity.student_name && (
                        <div className="flex items-center gap-2 mt-2">
                          <Avatar className="w-5 h-5">
                            <AvatarImage src={activity.student_avatar} />
                            <AvatarFallback className="text-xs">
                              {activity.student_name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-gray-500">{activity.student_name}</span>
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                      {formatTimeAgo(activity.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Activity className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <h3 className="text-sm font-medium text-gray-700 mb-1">No recent activity</h3>
            <p className="text-xs text-gray-500">
              Your mentoring activities will appear here
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityFeed;