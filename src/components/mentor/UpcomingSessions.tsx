import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Video,
  Clock,
  Calendar,
  Edit,
  MapPin,
  FileText,
  MessageCircle,
  Play,
  MoreHorizontal,
  AlertCircle,
  CheckCircle,
  Users
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

interface UpcomingSessionsProps {
  sessions: MentorshipSession[];
  onJoinSession: (session: MentorshipSession) => void;
  onEditSession: (session: MentorshipSession) => void;
  formatTime: (dateStr: string) => string;
  formatDate: (dateStr: string) => string;
  getSessionTypeColor: (type: string) => string;
  getStatusColor: (status: string) => string;
}

const UpcomingSessions: React.FC<UpcomingSessionsProps> = ({
  sessions,
  onJoinSession,
  onEditSession,
  formatTime,
  formatDate,
  getSessionTypeColor,
  getStatusColor
}) => {
  const getTimeUntilSession = (scheduledAt: string) => {
    const sessionTime = new Date(scheduledAt).getTime();
    const now = new Date().getTime();
    const diffMs = sessionTime - now;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffMs < 0) {return 'Past due';}
    if (diffHours < 1) {return `${diffMinutes}m`;}
    if (diffHours < 24) {return `${diffHours}h ${diffMinutes}m`;}
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ${diffHours % 24}h`;
  };

  const isSessionSoon = (scheduledAt: string) => {
    const sessionTime = new Date(scheduledAt).getTime();
    const now = new Date().getTime();
    const diffMs = sessionTime - now;
    return diffMs > 0 && diffMs <= 15 * 60 * 1000; // Within 15 minutes
  };

  const isSessionOverdue = (scheduledAt: string) => {
    const sessionTime = new Date(scheduledAt).getTime();
    const now = new Date().getTime();
    return now > sessionTime;
  };

  const todaySessions = sessions.filter(session => {
    const sessionDate = new Date(session.scheduled_at).toDateString();
    const today = new Date().toDateString();
    return sessionDate === today;
  });

  const laterSessions = sessions.filter(session => {
    const sessionDate = new Date(session.scheduled_at).toDateString();
    const today = new Date().toDateString();
    return sessionDate !== today;
  });

  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No upcoming sessions</h3>
          <p className="text-gray-500 mb-4">
            Schedule your next mentoring session to continue supporting your students.
          </p>
          <Button className="bg-gradapp-primary hover:bg-gradapp-accent">
            Schedule First Session
          </Button>
        </CardContent>
      </Card>
    );
  }

  const SessionCard = ({ session, showDate = false }: { session: MentorshipSession; showDate?: boolean }) => {
    const timeUntil = getTimeUntilSession(session.scheduled_at);
    const isSoon = isSessionSoon(session.scheduled_at);
    const isOverdue = isSessionOverdue(session.scheduled_at);

    return (
      <Card className={`hover:shadow-md transition-shadow ${isSoon ? 'ring-2 ring-yellow-200' : ''} ${isOverdue ? 'ring-2 ring-red-200' : ''}`}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-4 flex-1">
              <Avatar className="w-12 h-12">
                <AvatarImage src={session.student_profile.profile_image_url} />
                <AvatarFallback>
                  {session.student_profile.display_name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-gray-900">{session.title}</h3>
                  {isSoon && (
                    <Badge className="bg-yellow-100 text-yellow-800 animate-pulse">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Starting Soon
                    </Badge>
                  )}
                  {isOverdue && (
                    <Badge className="bg-red-100 text-red-800">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Overdue
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{session.student_profile.display_name}</span>
                    <span>•</span>
                    <span>{session.student_profile.academic_level} • {session.student_profile.field_of_study}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{showDate ? formatDate(session.scheduled_at) : formatTime(session.scheduled_at)}</span>
                    <span>•</span>
                    <span>{session.duration_minutes} minutes</span>
                    <span>•</span>
                    <span className={isOverdue ? 'text-red-600 font-medium' : 'text-blue-600'}>
                      {timeUntil}
                    </span>
                  </div>

                  {session.description && (
                    <div className="flex items-start gap-2 mt-2">
                      <FileText className="h-4 w-4 mt-0.5" />
                      <span className="text-gray-700">{session.description}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <Badge className={getSessionTypeColor(session.session_type)}>
                    {session.session_type.replace('_', ' ')}
                  </Badge>
                  <Badge className={getStatusColor(session.status)}>
                    {session.status}
                  </Badge>
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEditSession(session)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Session
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Message Student
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Calendar className="h-4 w-4 mr-2" />
                  Reschedule
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {session.agenda && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-1">Session Agenda</h4>
              <p className="text-sm text-gray-600">{session.agenda}</p>
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={() => onJoinSession(session)}
              className={`flex-1 ${isSoon || isOverdue ? 'bg-gradapp-primary hover:bg-gradapp-accent' : 'bg-gray-600 hover:bg-gray-700'}`}
              disabled={!session.meeting_link && !isSoon}
            >
              {isSoon || isOverdue ? (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Join Session
                </>
              ) : (
                <>
                  <Video className="h-4 w-4 mr-2" />
                  {session.meeting_link ? 'Join Meeting' : 'Meeting Link Available 15min Before'}
                </>
              )}
            </Button>
            
            <Button variant="outline" onClick={() => onEditSession(session)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Today's Sessions */}
      {todaySessions.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Today's Sessions</h3>
            <Badge variant="secondary">{todaySessions.length}</Badge>
          </div>
          <div className="grid gap-4">
            {todaySessions.map(session => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        </div>
      )}

      {/* Later Sessions */}
      {laterSessions.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Sessions</h3>
            <Badge variant="secondary">{laterSessions.length}</Badge>
          </div>
          <div className="grid gap-4">
            {laterSessions.map(session => (
              <SessionCard key={session.id} session={session} showDate />
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-gradapp-primary/5 to-gradapp-accent/5 border-gradapp-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gradapp-primary mb-1">Need to schedule more sessions?</h3>
              <p className="text-sm text-gray-600">Keep your mentoring momentum going with regular check-ins</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="border-gradapp-primary text-gradapp-primary hover:bg-gradapp-primary hover:text-white">
                <Calendar className="h-4 w-4 mr-2" />
                View Calendar
              </Button>
              <Button className="bg-gradapp-primary hover:bg-gradapp-accent">
                <Video className="h-4 w-4 mr-2" />
                Schedule Session
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UpcomingSessions;