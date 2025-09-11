import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MessageCircle,
  UserPlus,
  GraduationCap,
  MapPin,
  BookOpen,
  Star,
  TrendingUp,
  Target,
  CheckCircle,
  Clock,
  Loader2
} from 'lucide-react';

interface AvailableStudent {
  id: string;
  user_id: string;
  display_name: string;
  profile_image_url?: string;
  bio?: string;
  field_of_study?: string;
  academic_level?: string;
  current_institution?: string;
  location?: string;
  graduation_year?: number;
  gpa?: number;
  research_interests?: string[];
  skills?: string[];
  match_score?: number;
  connection_status?: 'none' | 'pending' | 'connected';
}

interface ApplicantCardProps {
  student: AvailableStudent;
  onConnect: () => void;
  onMessage: (studentId: string) => Promise<void>;
  onViewProfile: (studentId: string) => void;
  isConnecting?: boolean;
}

const ApplicantCard: React.FC<ApplicantCardProps> = ({
  student,
  onConnect,
  onMessage,
  onViewProfile,
  isConnecting = false
}) => {
  const [isMessaging, setIsMessaging] = useState(false);
  const [isViewingProfile, setIsViewingProfile] = useState(false);

  const handleMessageClick = async () => {
    setIsMessaging(true);
    try {
      await onMessage(student.user_id);
    } catch (error) {
      console.error('Error starting message:', error);
      // Error is already handled in the parent component
    } finally {
      setIsMessaging(false);
    }
  };

  const handleViewProfileClick = () => {
    setIsViewingProfile(true);
    try {
      onViewProfile(student.user_id);
    } catch (error) {
      console.error('Error viewing profile:', error);
      setIsViewingProfile(false);
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) {return 'text-green-600 bg-green-100';}
    if (score >= 80) {return 'text-blue-600 bg-blue-100';}
    if (score >= 70) {return 'text-yellow-600 bg-yellow-100';}
    return 'text-gray-600 bg-gray-100';
  };

  const getConnectionStatusDisplay = () => {
    switch (student.connection_status) {
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Request Sent
          </Badge>
        );
      case 'connected':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Connected
          </Badge>
        );
      default:
        return null;
    }
  };

  const isConnectable = student.connection_status === 'none' || !student.connection_status;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={student.profile_image_url} />
              <AvatarFallback className="text-lg">
                {student.display_name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {student.display_name}
                </h3>
                {student.match_score && (
                  <Badge className={`${getMatchScoreColor(student.match_score)} border-0`}>
                    <Target className="h-3 w-3 mr-1" />
                    {student.match_score}% match
                  </Badge>
                )}
                {getConnectionStatusDisplay()}
              </div>
              
              <div className="space-y-1 mb-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <GraduationCap className="h-4 w-4" />
                  <span>
                    {student.academic_level?.charAt(0).toUpperCase() + student.academic_level?.slice(1)} 
                    {student.field_of_study && ` • ${student.field_of_study}`}
                  </span>
                </div>
                
                {student.current_institution && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <BookOpen className="h-4 w-4" />
                    <span>{student.current_institution}</span>
                  </div>
                )}
                
                {student.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{student.location}</span>
                  </div>
                )}

                {student.graduation_year && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <GraduationCap className="h-4 w-4" />
                    <span>Graduating {student.graduation_year}</span>
                  </div>
                )}

                {student.gpa && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Star className="h-4 w-4" />
                    <span>GPA: {student.gpa}</span>
                  </div>
                )}
              </div>

              {student.bio && (
                <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                  {student.bio}
                </p>
              )}

              {/* Research Interests */}
              {student.research_interests && student.research_interests.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-xs font-medium text-gray-500 mb-2">Research Interests</h4>
                  <div className="flex flex-wrap gap-1">
                    {student.research_interests.slice(0, 4).map((interest, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {interest}
                      </Badge>
                    ))}
                    {student.research_interests.length > 4 && (
                      <Badge variant="secondary" className="text-xs">
                        +{student.research_interests.length - 4} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Skills */}
              {student.skills && student.skills.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-xs font-medium text-gray-500 mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-1">
                    {student.skills.slice(0, 4).map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {student.skills.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{student.skills.length - 4} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-3 border-t">
          {isConnectable ? (
            <Button 
              onClick={onConnect}
              disabled={isConnecting}
              className="flex-1 bg-gradapp-primary hover:bg-gradapp-accent"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending Request...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Connect
                </>
              )}
            </Button>
          ) : (
            <Button 
              disabled
              variant="outline"
              className="flex-1"
            >
              {student.connection_status === 'pending' ? (
                <>
                  <Clock className="h-4 w-4 mr-2" />
                  Request Sent
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Connected
                </>
              )}
            </Button>
          )}
          
          <Button 
            variant="outline" 
            size="default"
            onClick={handleMessageClick}
            disabled={isMessaging || isConnecting}
          >
            {isMessaging ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Opening...
              </>
            ) : (
              <>
                <MessageCircle className="h-4 w-4 mr-2" />
                Message
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            size="default"
            onClick={handleViewProfileClick}
            disabled={isViewingProfile || isConnecting}
          >
            {isViewingProfile ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'View Profile'
            )}
          </Button>
        </div>

        {/* Match Score Details */}
        {student.match_score && student.match_score > 0 && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Compatibility Score</span>
              <span className="font-medium">{student.match_score}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
              <div 
                className="bg-gradapp-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${student.match_score}%` }}
              />
            </div>
            <div className="mt-1 text-xs text-gray-500">
              Based on academic interests, goals, and experience
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ApplicantCard;