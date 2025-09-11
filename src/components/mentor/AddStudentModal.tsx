import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Filter,
  Loader2,
  UserPlus,
  MessageCircle,
  GraduationCap,
  MapPin,
  BookOpen,
  Star,
  TrendingUp,
  Target,
  CheckCircle,
  Clock,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import ApplicantCard from './ApplicantCard';
import { messagingService } from '@/services/messagingService';
import { connectionRequestService } from '@/services/connectionRequestService';
import { useMentorRealtimeUpdates } from '@/hooks/useMentorRealtimeUpdates';
import MentorStudentErrorBoundary from './MentorStudentErrorBoundary';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onStudentAdded: () => void;
}

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

interface ConnectionRequest {
  id: string;
  student_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
}

const AddStudentModal: React.FC<AddStudentModalProps> = ({
  isOpen,
  onClose,
  user,
  onStudentAdded
}) => {
  const [availableStudents, setAvailableStudents] = useState<AvailableStudent[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<AvailableStudent[]>([]);
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [fieldFilter, setFieldFilter] = useState('all-fields');
  const [levelFilter, setLevelFilter] = useState('all-levels');
  const [locationFilter, setLocationFilter] = useState('all-locations');
  const [activeTab, setActiveTab] = useState('discover');
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);
  
  const navigate = useNavigate();

  // Set up real-time updates for mentor-student interactions
  useMentorRealtimeUpdates({
    user,
    onStudentListUpdate: () => {
      if (isOpen) {
        loadAvailableStudents();
      }
    },
    onConnectionRequestUpdate: () => {
      if (isOpen) {
        loadConnectionRequests();
        loadAvailableStudents(); // Refresh to update connection status
      }
    },
    onNotificationUpdate: () => {
      // Could add notification badge updates here
      console.log('New notification received in mentor dashboard');
    }
  });

  useEffect(() => {
    if (isOpen) {
      loadAvailableStudents();
      loadConnectionRequests();
    }
  }, [isOpen, user]);

  useEffect(() => {
    filterStudents();
  }, [availableStudents, searchTerm, fieldFilter, levelFilter, locationFilter]);

  const loadAvailableStudents = async () => {
    setLoading(true);
    try {
      // Get user profiles where user has student role and not already connected
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select(`
          id,
          user_id,
          display_name,
          profile_image_url,
          bio,
          field_of_study,
          academic_level,
          current_institution,
          location,
          graduation_year,
          gpa,
          research_interests,
          skills
        `)
        .neq('user_id', user.id);

      if (profilesError) {
        console.error('Error loading profiles:', profilesError);
        setAvailableStudents([]);
        if (profilesError.code === 'PGRST116') {
          toast.error('Database setup incomplete', {
            description: 'Student discovery requires database setup. Please contact support.',
          });
        } else {
          toast.error('Failed to load available students', {
            description: 'Please try refreshing the page.'
          });
        }
        return;
      }

      // Get existing mentorships to exclude already connected students
      const { data: existingMentorships, error: mentorshipsError } = await supabase
        .from('mentor_student_relationships')
        .select('student_id')
        .eq('mentor_id', user.id);

      if (mentorshipsError) {
        console.warn('Could not load existing mentorships:', mentorshipsError);
        if (mentorshipsError.code === '42P01') {
          console.error('❌ CRITICAL: mentor_student_relationships table does not exist');
          toast.error('Database setup incomplete', {
            description: 'The mentor platform requires database setup. Please contact support to deploy the mentor schema.',
            duration: 8000
          });
          return;
        }
      }

      const connectedStudentIds = existingMentorships?.map(m => m.mentee_id) || [];

      // Filter out already connected students and add match scores
      const availableWithScores = (profiles || [])
        .filter(profile => !connectedStudentIds.includes(profile.user_id))
        .map(profile => ({
          ...profile,
          match_score: calculateMatchScore(profile),
          connection_status: 'none' as const
        }))
        .sort((a, b) => (b.match_score || 0) - (a.match_score || 0));

      setAvailableStudents(availableWithScores);

    } catch (error) {
      console.error('Error loading available students:', error);
      toast.error('Failed to load available students');
    } finally {
      setLoading(false);
    }
  };

  const loadConnectionRequests = async () => {
    // Since we're creating relationships directly, we don't need pending requests
    // This function can be simplified or removed
    setConnectionRequests([]);
  };

  const calculateMatchScore = (profile: any): number => {
    let score = 50; // Base score

    // Add points for complete profile
    if (profile.bio) {score += 10;}
    if (profile.research_interests?.length > 0) {score += 15;}
    if (profile.skills?.length > 0) {score += 10;}
    if (profile.gpa && profile.gpa > 3.5) {score += 10;}
    if (profile.current_institution) {score += 5;}

    // Random variation for demo
    score += Math.floor(Math.random() * 20) - 10;

    return Math.min(Math.max(score, 0), 100);
  };

  const filterStudents = () => {
    let filtered = [...availableStudents];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.field_of_study?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.current_institution?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.research_interests?.some(interest => 
          interest.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Field filter
    if (fieldFilter !== 'all-fields') {
      filtered = filtered.filter(student => student.field_of_study === fieldFilter);
    }

    // Level filter
    if (levelFilter !== 'all-levels') {
      filtered = filtered.filter(student => student.academic_level === levelFilter);
    }

    // Location filter
    if (locationFilter !== 'all-locations') {
      filtered = filtered.filter(student => 
        student.location?.includes(locationFilter)
      );
    }

    setFilteredStudents(filtered);
  };

  const handleSendConnectionRequest = async (studentId: string) => {
    setSendingRequest(studentId);
    try {
      console.log('🔄 Attempting to create mentorship relationship:', {
        mentor_id: user.id,
        mentee_id: studentId
      });

      // Check if relationship already exists
      const { data: existingRelationship, error: checkError } = await supabase
        .from('mentor_student_relationships')
        .select('id, status')
        .eq('mentor_id', user.id)
        .eq('mentee_id', studentId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.warn('Could not check for existing relationship:', checkError);
      }

      if (existingRelationship) {
        console.log('⚠️ Relationship already exists:', existingRelationship);
        toast.error('Connection already exists', {
          description: `You are already connected to this student with status: ${existingRelationship.status}`
        });
        return;
      }

      // Send connection request instead of creating direct relationship
      const result = await connectionRequestService.sendConnectionRequest(user.id, {
        recipientId: studentId,
        initiatorType: 'mentor',
        message: 'I would like to mentor you and help with your academic journey.'
      });

      if (!result.success) {
        console.error('❌ Connection request failed:', result.error);
        throw new Error(result.error || 'Failed to send connection request');
      }

      console.log('✅ Connection request sent successfully:', result.data);

      // Update local state to show request sent
      setAvailableStudents(prev => 
        prev.map(student => 
          student.user_id === studentId 
            ? { ...student, connection_status: 'pending' }
            : student
        )
      );

      toast.success('Connection request sent!', {
        description: 'The student will be notified and can accept your mentorship request.'
      });
      
      onStudentAdded(); // Notify parent to refresh
      loadAvailableStudents(); // Refresh the list

    } catch (error: any) {
      console.error('❌ Error adding student:', error);
      
      // Show user-friendly error message
      toast.error('Failed to send connection request', {
        description: error.message || 'An unexpected error occurred. Please try again or contact support.',
        duration: 8000,
        action: {
          label: 'Retry',
          onClick: () => handleSendConnectionRequest(studentId)
        }
      });
    } finally {
      setSendingRequest(null);
    }
  };


  const handleMessage = async (studentId: string, retryCount = 0): Promise<void> => {
    const maxRetries = 2;
    
    try {
      // Show loading toast for longer operations
      const loadingToast = toast.loading('Starting conversation...', {
        duration: 5000
      });

      // Get or create conversation between mentor and student
      const conversationId = await messagingService.getOrCreateDirectConversation(user.id, studentId);

      toast.dismiss(loadingToast);

      if (!conversationId) {
        throw new Error('Failed to create conversation - no conversation ID returned');
      }

      // Navigate to GradNet with conversation pre-loaded
      navigate(`/gradnet?conversation=${conversationId}`);
      onClose(); // Close the modal

      toast.success('Conversation opened successfully!', {
        duration: 3000
      });

    } catch (error: any) {
      console.error('Error starting conversation:', error);
      
      // Retry logic for temporary failures
      if (retryCount < maxRetries && (
        error.message?.includes('network') || 
        error.message?.includes('timeout') ||
        error.code === 'ECONNRESET'
      )) {
        console.log(`Retrying conversation creation... (${retryCount + 1}/${maxRetries})`);
        toast.loading(`Retrying... (${retryCount + 1}/${maxRetries})`, {
          duration: 2000
        });
        
        setTimeout(() => {
          handleMessage(studentId, retryCount + 1);
        }, 1000 * (retryCount + 1)); // Exponential backoff
        
        return;
      }

      // Show specific error messages
      if (error.code === '42P01') {
        toast.error('Database setup incomplete', {
          description: 'Messaging system needs to be configured. Please contact support.',
          duration: 6000
        });
      } else if (error.message?.includes('permission')) {
        toast.error('Permission denied', {
          description: 'You may not have permission to message this student.',
          duration: 5000
        });
      } else if (error.message?.includes('conversation')) {
        toast.error('Failed to start conversation', {
          description: 'Could not create or access the conversation. Please try again.',
          duration: 5000,
          action: {
            label: 'Retry',
            onClick: () => handleMessage(studentId, 0)
          }
        });
      } else {
        toast.error('Failed to start conversation', {
          description: 'An unexpected error occurred. Please try again or contact support.',
          duration: 5000,
          action: {
            label: 'Retry',
            onClick: () => handleMessage(studentId, 0)
          }
        });
      }
    }
  };

  const handleViewProfile = (studentId: string) => {
    try {
      // Validate student ID
      if (!studentId || typeof studentId !== 'string') {
        toast.error('Invalid student ID', {
          description: 'Cannot view profile: student ID is missing or invalid.',
          duration: 4000
        });
        return;
      }

      // Navigate to student profile page
      navigate(`/mentor/students/${studentId}`);
      onClose(); // Close the modal

      toast.info('Loading student profile...', {
        duration: 2000
      });

    } catch (error) {
      console.error('Error navigating to student profile:', error);
      toast.error('Navigation failed', {
        description: 'Could not open student profile. Please try again.',
        duration: 4000,
        action: {
          label: 'Retry',
          onClick: () => handleViewProfile(studentId)
        }
      });
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFieldFilter('all-fields');
    setLevelFilter('all-levels');
    setLocationFilter('all-locations');
  };

  const getUniqueFields = () => {
    const fields = availableStudents
      .map(s => s.field_of_study)
      .filter(Boolean)
      .filter((field, index, array) => array.indexOf(field) === index);
    return fields;
  };

  const getUniqueLevels = () => {
    const levels = availableStudents
      .map(s => s.academic_level)
      .filter(Boolean)
      .filter((level, index, array) => array.indexOf(level) === index);
    return levels;
  };

  const getUniqueLocations = () => {
    const locations = availableStudents
      .map(s => s.location?.split(',')[1]?.trim() || s.location)
      .filter(Boolean)
      .filter((location, index, array) => array.indexOf(location) === index);
    return locations;
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <MentorStudentErrorBoundary>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-gradapp-primary" />
            Add Student to Mentorship
          </DialogTitle>
          <DialogDescription>
            Discover and connect with students who could benefit from your mentorship
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="discover" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Discover Students
              <Badge variant="secondary">{filteredStudents.length}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* Discover Students Tab */}
          <TabsContent value="discover" className="mt-6 space-y-4">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="relative flex-1">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="Search by name, field, institution, or interests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2">
                <Select value={fieldFilter} onValueChange={setFieldFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Field of Study" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-fields">All Fields</SelectItem>
                    {getUniqueFields().map(field => (
                      <SelectItem key={field} value={field!}>{field}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Academic Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-levels">All Levels</SelectItem>
                    {getUniqueLevels().map(level => (
                      <SelectItem key={level} value={level!}>
                        {level?.charAt(0).toUpperCase() + level?.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button variant="outline" onClick={clearFilters}>
                  <Filter className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            </div>

            {/* Students Grid */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-gradapp-primary" />
                  <span className="ml-2 text-gray-600">Loading students...</span>
                </div>
              ) : filteredStudents.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {filteredStudents.map((student) => (
                    <ApplicantCard
                      key={student.id}
                      student={student}
                      onConnect={() => handleSendConnectionRequest(student.user_id)}
                      onMessage={handleMessage}
                      onViewProfile={handleViewProfile}
                      isConnecting={sendingRequest === student.user_id}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <UserPlus className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No students found</h3>
                  <p className="text-gray-500">
                    Try adjusting your search criteria or filters to find more students.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

        </Tabs>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>
        </MentorStudentErrorBoundary>
      </DialogContent>
    </Dialog>
  );
};

export default AddStudentModal;