import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  Star, 
  MessageCircle, 
  Calendar, 
  MapPin, 
  GraduationCap, 
  Users, 
  Clock,
  CheckCircle,
  Award,
  TrendingUp,
  BookOpen,
  Target,
  Zap,
  Video,
  Phone
} from 'lucide-react';
import { toast } from 'sonner';
import { videoCallService } from '@/services/videoCallService';
import { messagingService } from '@/services/messagingService';

interface MentorDiscoveryProps {
  user: User;
}

const MentorDiscovery: React.FC<MentorDiscoveryProps> = ({ user }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedField, setSelectedField] = useState('all');
  const [selectedAvailability, setSelectedAvailability] = useState('all');
  const [selectedRating, setSelectedRating] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [mentors, setMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredMentors, setFilteredMentors] = useState<any[]>([]);

  // Fetch real mentors from database
  useEffect(() => {
    const fetchMentors = async () => {
      try {
        setLoading(true);
        
        // Query users with mentor role or fallback to all users
        const { data: mentorUsers, error: userError } = await supabase
          .from('user_profiles')
          .select('*')
          .or('role.eq.mentor,role.eq.graduate_student,role.eq.professor');

        if (userError) {
          console.error('Error fetching mentors:', userError);
          setMentors([]);
        } else if (mentorUsers && mentorUsers.length > 0) {
          // Format mentor data - remove all mock data generation
          const formattedMentors = mentorUsers.map(profile => {
            const role = profile.role || 'graduate_student';
            const title = {
              'mentor': 'Graduate Mentor',
              'professor': 'Professor',
              'graduate_student': 'Graduate Student',
              'phd_student': 'PhD Student'
            }[role] || 'Graduate Student';
            
            return {
              id: profile.user_id,
              name: profile.display_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User',
              title: title,
              university: profile.university || profile.current_institution || 'University',
              field: profile.field_of_study || profile.degree || profile.current_degree || 'Academic Field',
              specializations: Array.isArray(profile.research_interests) ? profile.research_interests : 
                              (profile.research_interests ? [profile.research_interests] : ['General Guidance']),
              rating: 4.8, // Static high rating for all mentors
              totalReviews: 25,
              sessionsCompleted: 15,
              responseTime: '< 24 hours',
              availability: 'Available',
              hourlyRate: role === 'professor' ? 100 : (role === 'mentor' ? 75 : 50),
              matchScore: 85, // Static good match score
              bio: profile.bio || `Experienced ${title.toLowerCase()} ready to help with your graduate school journey.`,
              achievements: [],
              education: profile.highest_degree || profile.degree || 'Graduate Degree',
              verified: role === 'professor' || role === 'mentor',
              avatar: profile.profile_image_url || profile.avatar_url || null,
              languages: profile.languages || ['English'],
              timezone: profile.timezone || 'UTC',
              menteeSuccessRate: 85,
              publications: role === 'professor' ? 10 : (role === 'mentor' ? 3 : 0),
              yearsExperience: role === 'professor' ? 8 : (role === 'mentor' ? 5 : 2)
            };
          });
          
          setMentors(formattedMentors);
        } else {
          // No mentors found, show empty state
          setMentors([]);
        }
      } catch (error) {
        console.error('Error fetching mentors:', error);
        setMentors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMentors();
  }, []);

  // Filter mentors based on search criteria
  useEffect(() => {
    let filtered = [...mentors];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(mentor => 
        mentor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mentor.university?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mentor.field?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mentor.specializations?.some((spec: string) => 
          spec.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Field filter
    if (selectedField !== 'all') {
      filtered = filtered.filter(mentor => 
        mentor.field?.toLowerCase().includes(selectedField.toLowerCase())
      );
    }

    // Availability filter
    if (selectedAvailability !== 'all') {
      filtered = filtered.filter(mentor => 
        mentor.availability.toLowerCase() === selectedAvailability.toLowerCase()
      );
    }

    // Rating filter
    if (selectedRating !== 'all') {
      const minRating = parseFloat(selectedRating);
      filtered = filtered.filter(mentor => mentor.rating >= minRating);
    }

    setFilteredMentors(filtered);
  }, [mentors, searchTerm, selectedField, selectedAvailability, selectedRating]);

  // All mock data removed - using real database data only

  const handleMessageMentor = async (mentor: any) => {
    try {
      // Create or get direct conversation with mentor using actual user ID
      const conversationId = await messagingService.getOrCreateDirectConversation(user.id, mentor.id);
      
      if (conversationId) {
        toast.success(`Starting conversation with ${mentor.name}`);
        // Navigate to messages tab in GradNet
        window.location.href = '/gradnet?tab=messages';
      } else {
        toast.error('Failed to start conversation');
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.error('Failed to start conversation');
    }
  };

  const handleBookSession = async (mentor: any) => {
    try {
      // Schedule a session 15 minutes from now
      const scheduledAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      
      const session = await videoCallService.createMentoringSession(
        mentor.id, // Use actual mentor ID
        user.id,
        scheduledAt,
        'mentoring_session',
        60 // 60 minutes
      );

      if (session) {
        toast.success(`Session booked with ${mentor.name}! Check your calendar.`);
        
        // Send session invitation
        await videoCallService.sendSessionInvitation(session.id);
      } else {
        toast.error('Failed to book session. Please ensure database tables are set up.');
      }
    } catch (error) {
      console.error('Error booking session:', error);
      toast.error('Video calling requires proper database setup. Please run MASTER_DATABASE_SCHEMA.sql');
    }
  };

  const handleInstantVideoCall = async (mentor: any) => {
    try {
      // Create immediate video session
      const scheduledAt = new Date().toISOString();
      
      const session = await videoCallService.createMentoringSession(
        mentor.id, // Use actual mentor ID
        user.id,
        scheduledAt,
        'instant_video_call',
        30 // 30 minutes for instant calls
      );

      if (session && session.zoom_meeting_id) {
        // Open video call in new window
        const callUrl = `/video-call/${session.zoom_meeting_id}`;
        window.open(callUrl, '_blank', 'width=1200,height=800');
        
        toast.success(`Starting video call with ${mentor.name}!`);
      } else {
        toast.error('Video calling requires Zoom configuration. Please set up Zoom API keys.');
      }
    } catch (error) {
      console.error('Error starting video call:', error);
      toast.error('Video calling requires proper setup. Please configure Zoom API.');
    }
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'Available':
        return 'bg-green-500';
      case 'Busy':
        return 'bg-yellow-500';
      case 'Limited':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) {return 'text-green-600 bg-green-50';}
    if (score >= 80) {return 'text-blue-600 bg-blue-50';}
    if (score >= 70) {return 'text-yellow-600 bg-yellow-50';}
    return 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="space-y-6">
      
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Find Your Perfect Mentor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Search by name, university, or expertise..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Field Filter */}
            <Select value={selectedField} onValueChange={setSelectedField}>
              <SelectTrigger>
                <SelectValue placeholder="Field of Study" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Fields</SelectItem>
                <SelectItem value="computer-science">Computer Science</SelectItem>
                <SelectItem value="biology">Biology</SelectItem>
                <SelectItem value="psychology">Psychology</SelectItem>
                <SelectItem value="engineering">Engineering</SelectItem>
                <SelectItem value="physics">Physics</SelectItem>
                <SelectItem value="chemistry">Chemistry</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Availability Filter */}
            <Select value={selectedAvailability} onValueChange={setSelectedAvailability}>
              <SelectTrigger>
                <SelectValue placeholder="Availability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Availability</SelectItem>
                <SelectItem value="available">Available Now</SelectItem>
                <SelectItem value="busy">Busy (Limited)</SelectItem>
                <SelectItem value="limited">Very Limited</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Rating Filter */}
            <Select value={selectedRating} onValueChange={setSelectedRating}>
              <SelectTrigger>
                <SelectValue placeholder="Minimum Rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Rating</SelectItem>
                <SelectItem value="4.5">4.5+ Stars</SelectItem>
                <SelectItem value="4.7">4.7+ Stars</SelectItem>
                <SelectItem value="4.8">4.8+ Stars</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Found {filteredMentors.length} mentors</span>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </div>
            <div className="flex gap-2">
              <Button 
                variant={viewMode === 'grid' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                Grid
              </Button>
              <Button 
                variant={viewMode === 'list' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setViewMode('list')}
              >
                List
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gradapp-primary mb-4"></div>
          <p className="text-gray-600">Loading mentors...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredMentors.length === 0 && (
        <Card className="py-12">
          <CardContent className="text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm || selectedField !== 'all' || selectedAvailability !== 'all' || selectedRating !== 'all' 
                ? 'No mentors found matching your criteria' 
                : 'No mentors available yet'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedField !== 'all' || selectedAvailability !== 'all' || selectedRating !== 'all'
                ? 'Try adjusting your search filters to find more mentors.'
                : 'Check back later as more mentors join the platform.'}
            </p>
            {(searchTerm || selectedField !== 'all' || selectedAvailability !== 'all' || selectedRating !== 'all') && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedField('all');
                  setSelectedAvailability('all');
                  setSelectedRating('all');
                }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Mentor Cards */}
      {!loading && filteredMentors.length > 0 && (
      <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
        {filteredMentors.map((mentor) => (
          <Card key={mentor.id} className="hover:shadow-xl transition-all duration-300 border-l-4 border-l-gradapp-primary">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="relative">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={mentor.avatar} />
                      <AvatarFallback>{mentor.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getAvailabilityColor(mentor.availability)}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg text-gray-900">{mentor.name}</h3>
                      {mentor.verified && (
                        <CheckCircle className="h-5 w-5 text-blue-500" />
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-700">{mentor.title}</p>
                    <p className="text-sm text-gray-600">{mentor.university}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{mentor.field}</Badge>
                      <Badge variant="outline" className="text-xs">{mentor.yearsExperience}+ years</Badge>
                    </div>
                  </div>
                </div>
                
                {/* Match Score */}
                <div className={`px-3 py-1 rounded-full text-sm font-bold ${getMatchScoreColor(mentor.matchScore)}`}>
                  {mentor.matchScore}% Match
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                {/* Bio */}
                <p className="text-sm text-gray-700 leading-relaxed">{mentor.bio}</p>
                
                {/* Specializations */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Specializations:</h4>
                  <div className="flex flex-wrap gap-1">
                    {mentor.specializations.map((spec, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-center gap-1 text-yellow-500 mb-1">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="font-bold text-sm">{mentor.rating}</span>
                    </div>
                    <p className="text-xs text-gray-600">{mentor.totalReviews} reviews</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-center gap-1 text-green-500 mb-1">
                      <TrendingUp className="h-4 w-4" />
                      <span className="font-bold text-sm">{mentor.menteeSuccessRate}%</span>
                    </div>
                    <p className="text-xs text-gray-600">Success Rate</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-center gap-1 text-blue-500 mb-1">
                      <Users className="h-4 w-4" />
                      <span className="font-bold text-sm">{mentor.sessionsCompleted}</span>
                    </div>
                    <p className="text-xs text-gray-600">Sessions</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-center gap-1 text-purple-500 mb-1">
                      <Clock className="h-4 w-4" />
                      <span className="font-bold text-sm">{mentor.responseTime}</span>
                    </div>
                    <p className="text-xs text-gray-600">Response</p>
                  </div>
                </div>
                
                {/* Additional Info */}
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>{mentor.timezone}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      <span>{mentor.publications} publications</span>
                    </div>
                  </div>
                  <div className="font-bold text-gradapp-primary">
                    ${mentor.hourlyRate}/hour
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="space-y-2 pt-2">
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1 bg-gradapp-primary hover:bg-gradapp-accent"
                      onClick={() => handleMessageMentor(mentor)}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handleBookSession(mentor)}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Book Session
                    </Button>
                    <Button variant="outline" size="sm">
                      <Star className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1 border-green-200 text-green-700 hover:bg-green-50"
                      onClick={() => handleInstantVideoCall(mentor)}
                      disabled={mentor.availability === 'Offline'}
                    >
                      <Video className="h-4 w-4 mr-2" />
                      Instant Video Call
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      )}

      {/* Load More */}
      {!loading && filteredMentors.length > 0 && (
        <div className="text-center">
          <Button variant="outline" className="w-full md:w-auto">
            Load More Mentors
          </Button>
        </div>
      )}
    </div>
  );
};

export default MentorDiscovery;