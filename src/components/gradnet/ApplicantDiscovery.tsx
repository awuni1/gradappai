import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  GraduationCap, 
  MapPin, 
  Calendar,
  BookOpen,
  Star,
  Filter,
  MessageCircle,
  UserPlus,
  Loader2,
  TrendingUp,
  Target
} from 'lucide-react';
import { toast } from 'sonner';

interface ApplicantDiscoveryProps {
  user: User;
}

interface ApplicantProfile {
  user_id: string;
  display_name: string;
  profile_image_url?: string;
  field_of_study?: string;
  academic_level?: string;
  target_degree?: string;
  current_institution?: string;
  location?: string;
  graduation_year?: number;
  gpa?: number;
  research_interests?: string[];
  skills?: string[];
  bio?: string;
}

const ApplicantDiscovery: React.FC<ApplicantDiscoveryProps> = ({ user }) => {
  const [applicants, setApplicants] = useState<ApplicantProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [fieldFilter, setFieldFilter] = useState('all-fields');
  const [levelFilter, setLevelFilter] = useState('all-levels');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 12;

  useEffect(() => {
    loadApplicants();
  }, [searchTerm, fieldFilter, levelFilter, currentPage]);

  const loadApplicants = async () => {
    setLoading(true);
    try {
      // Build query to find applicants
      let query = supabase
        .from('user_profiles')
        .select('user_id, display_name, profile_image_url, field_of_study, academic_level, target_degree, current_institution, location, graduation_year, gpa, research_interests, skills, bio')
        .neq('user_id', user.id); // Exclude current user

      // Add filters
      if (searchTerm) {
        query = query.or(`display_name.ilike.%${searchTerm}%,field_of_study.ilike.%${searchTerm}%,bio.ilike.%${searchTerm}%`);
      }
      if (fieldFilter && fieldFilter !== 'all-fields') {
        query = query.ilike('field_of_study', `%${fieldFilter}%`);
      }
      if (levelFilter && levelFilter !== 'all-levels') {
        query = query.eq('academic_level', levelFilter);
      }

      // Add pagination
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {throw error;}

      setApplicants(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error loading applicants:', error);
      toast.error('Failed to load applicants');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (applicantId: string, applicantName: string) => {
    try {
      // Create a connection request
      const { error } = await supabase
        .from('user_connections')
        .insert({
          requester_id: user.id,
          receiver_id: applicantId,
          connection_type: 'mentor',
          message: `Hi ${applicantName}, I'd like to offer mentorship and guidance for your graduate school journey. Let's connect!`,
          status: 'pending'
        });

      if (error) {throw error;}

      toast.success(`Connection request sent to ${applicantName}!`);
    } catch (error) {
      console.error('Error sending connection request:', error);
      toast.error('Failed to send connection request');
    }
  };

  const handleMessage = async (applicantId: string, applicantName: string) => {
    try {
      // Create or get direct conversation
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .contains('participants', [user.id, applicantId])
        .eq('conversation_type', 'direct')
        .single();

      let conversationId = existingConv?.id;

      if (!conversationId) {
        // Create new conversation
        const { data: newConv, error } = await supabase
          .from('conversations')
          .insert({
            participants: [user.id, applicantId],
            conversation_type: 'direct',
            title: `Conversation with ${applicantName}`,
            created_by: user.id
          })
          .select('id')
          .single();

        if (error) {throw error;}
        conversationId = newConv.id;
      }

      // Navigate to messages tab with conversation selected
      toast.success(`Opening conversation with ${applicantName}`);
      // TODO: Navigate to messages tab or open message modal
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.error('Failed to start conversation');
    }
  };

  const getMatchScore = (applicant: ApplicantProfile): number => {
    // Simple matching algorithm - can be enhanced later
    let score = 50; // Base score

    // Field of study alignment
    if (applicant.field_of_study) {
      score += 20;
    }

    // GPA consideration
    if (applicant.gpa && applicant.gpa >= 3.5) {
      score += 15;
    }

    // Research interests
    if (applicant.research_interests && applicant.research_interests.length > 0) {
      score += 15;
    }

    return Math.min(100, score);
  };

  const fields = [
    'Computer Science', 'Biology', 'Chemistry', 'Physics', 'Mathematics',
    'Engineering', 'Medicine', 'Psychology', 'Business', 'Economics',
    'Literature', 'History', 'Political Science', 'Sociology', 'Art'
  ];

  const levels = [
    'undergraduate', 'masters', 'phd', 'postdoc'
  ];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-3">
            <GraduationCap className="h-6 w-6 text-gradapp-primary" />
            Find Potential Mentees
          </CardTitle>
          <p className="text-gray-600">
            Discover motivated applicants who could benefit from your mentorship and guidance.
          </p>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Search by name, field, or interests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={fieldFilter} onValueChange={setFieldFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Field of Study" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-fields">All Fields</SelectItem>
                {fields.map((field) => (
                  <SelectItem key={field} value={field}>{field}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Academic Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-levels">All Levels</SelectItem>
                {levels.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setFieldFilter('all-fields');
                setLevelFilter('all-levels');
                setCurrentPage(1);
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gradapp-primary" />
          <span className="ml-2 text-gray-600">Finding applicants...</span>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {totalCount} Potential Mentees Found
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {applicants.map((applicant) => {
              const matchScore = getMatchScore(applicant);
              return (
                <Card key={applicant.user_id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={applicant.profile_image_url} />
                          <AvatarFallback>
                            {(applicant.display_name || 'U').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {applicant.display_name || 'Unknown User'}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {applicant.academic_level} Student
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 mb-1">
                          <Target className="h-3 w-3 text-green-500" />
                          <span className="text-sm font-medium text-green-600">
                            {matchScore}% Match
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      {applicant.field_of_study && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <BookOpen className="h-3 w-3" />
                          {applicant.field_of_study}
                        </div>
                      )}
                      
                      {applicant.current_institution && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <GraduationCap className="h-3 w-3" />
                          {applicant.current_institution}
                        </div>
                      )}
                      
                      {applicant.location && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="h-3 w-3" />
                          {applicant.location}
                        </div>
                      )}

                      {applicant.gpa && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Star className="h-3 w-3" />
                          GPA: {applicant.gpa.toFixed(2)}
                        </div>
                      )}
                    </div>

                    {applicant.research_interests && applicant.research_interests.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-medium text-gray-700 mb-2">Research Interests:</p>
                        <div className="flex flex-wrap gap-1">
                          {applicant.research_interests.slice(0, 3).map((interest, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {interest}
                            </Badge>
                          ))}
                          {applicant.research_interests.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{applicant.research_interests.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {applicant.bio && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {applicant.bio}
                      </p>
                    )}

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleConnect(applicant.user_id, applicant.display_name || 'User')}
                        className="flex-1 bg-gradapp-primary hover:bg-gradapp-accent"
                      >
                        <UserPlus className="h-3 w-3 mr-1" />
                        Connect
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMessage(applicant.user_id, applicant.display_name || 'User')}
                      >
                        <MessageCircle className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {applicants.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <GraduationCap className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No applicants found</h3>
                <p className="text-gray-500 mb-6">
                  Try adjusting your search criteria or check back later for new applicants.
                </p>
                <Button 
                  onClick={() => {
                    setSearchTerm('');
                    setFieldFilter('all-fields');
                    setLevelFilter('all-levels');
                  }}
                  variant="outline"
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Pagination */}
          {totalCount > pageSize && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {Math.ceil(totalCount / pageSize)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={currentPage >= Math.ceil(totalCount / pageSize)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ApplicantDiscovery;