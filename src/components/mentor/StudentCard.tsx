import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Video,
  MessageCircle,
  GraduationCap,
  BookOpen,
  CheckCircle,
  TrendingUp,
  Clock
} from 'lucide-react';

interface StudentProfile {
  display_name: string;
  profile_image_url?: string;
  field_of_study?: string;
  academic_level?: string;
  current_institution?: string;
}

interface StudentAnalytics {
  sessions_completed: number;
  documents_worked_on: number;
  tasks_completed: number;
  engagement_score: number;
}

interface RecentActivity {
  last_session?: string;
  last_message?: string;
  upcoming_session?: string;
}

interface StudentCardProps {
  id: string;
  student_id: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  progress_score: number;
  student_profile: StudentProfile;
  analytics: StudentAnalytics;
  recent_activity: RecentActivity;
  onViewProfile: (studentId: string) => void;
  onSendMessage: (studentId: string) => void;
  onScheduleSession: (mentorshipId: string) => void;
}

const StudentCard: React.FC<StudentCardProps> = ({
  id,
  student_id,
  status,
  progress_score,
  student_profile,
  analytics,
  recent_activity,
  onViewProfile,
  onSendMessage,
  onScheduleSession
}) => {
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

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={student_profile.profile_image_url} />
              <AvatarFallback>
                {student_profile.display_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-gray-900">
                {student_profile.display_name}
              </h3>
              <p className="text-sm text-gray-600">
                {student_profile.academic_level} • {student_profile.field_of_study}
              </p>
              {student_profile.current_institution && (
                <p className="text-xs text-gray-500">
                  {student_profile.current_institution}
                </p>
              )}
            </div>
          </div>
          <Badge className={getStatusColor(status)}>
            {status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">Progress</span>
            <span className={`font-medium ${getProgressColor(progress_score)}`}>
              {progress_score}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradapp-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress_score}%` }}
            />
          </div>
        </div>

        {/* Analytics */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Video className="h-3 w-3 text-blue-500" />
            <span className="text-gray-600">{analytics.sessions_completed} sessions</span>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-3 w-3 text-green-500" />
            <span className="text-gray-600">{analytics.documents_worked_on} docs</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-3 w-3 text-purple-500" />
            <span className="text-gray-600">{analytics.tasks_completed} tasks</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-3 w-3 text-orange-500" />
            <span className="text-gray-600">{analytics.engagement_score}/10 engagement</span>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="text-xs text-gray-500 space-y-1">
          {recent_activity.last_session && (
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              <span>Last session: {recent_activity.last_session}</span>
            </div>
          )}
          {recent_activity.last_message && (
            <div className="flex items-center gap-2">
              <MessageCircle className="h-3 w-3" />
              <span>Last message: {recent_activity.last_message}</span>
            </div>
          )}
          {recent_activity.upcoming_session && (
            <div className="flex items-center gap-2 text-blue-600">
              <Video className="h-3 w-3" />
              <span>Next: {recent_activity.upcoming_session}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button 
            size="sm" 
            onClick={() => onViewProfile(student_id)}
            className="flex-1 bg-gradapp-primary hover:bg-gradapp-accent"
          >
            <GraduationCap className="h-3 w-3 mr-1" />
            View Profile
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onSendMessage(student_id)}
            title="Send Message"
          >
            <MessageCircle className="h-3 w-3" />
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onScheduleSession(id)}
            title="Schedule Session"
          >
            <Video className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentCard;