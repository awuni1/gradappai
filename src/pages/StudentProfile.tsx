import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import AuthenticatedHeader from '@/components/AuthenticatedHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft,
  User as UserIcon,
  FileText,
  BarChart3,
  Video,
  MessageCircle,
  Calendar,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  BookOpen,
  Target,
  Clock,
  CheckCircle,
  Star,
  TrendingUp,
  Award,
  Edit,
  Save,
  X,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface StudentData {
  id: string;
  mentorship: {
    id: string;
    status: string;
    start_date: string;
    progress_score: number;
    goals: string[];
    notes: string;
  };
  profile: {
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
  };
  contact: {
    email?: string;
    phone?: string;
    linkedin_url?: string;
    website_url?: string;
  };
  documents: {
    id: string;
    title: string;
    document_type: string;
    created_at: string;
    last_edited_at: string;
    word_count: number;
  }[];
  progress: {
    id: string;
    title: string;
    milestone_type: string;
    status: string;
    due_date?: string;
    completed_date?: string;
    priority: number;
  }[];
  sessions: {
    id: string;
    title: string;
    scheduled_at: string;
    duration_minutes: number;
    status: string;
    session_type: string;
  }[];
  evaluations: {
    id: string;
    evaluation_period: string;
    overall_rating: number;
    created_at: string;
    strengths: string;
    areas_for_improvement: string;
  }[];
}

const StudentProfile: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      setUser(user);
    };
    getUser();
  }, [navigate]);

  useEffect(() => {
    if (user && studentId) {
      loadStudentData();
    }
  }, [user, studentId]);

  const loadStudentData = async () => {
    if (!user || !studentId) {return;}
    
    setLoading(true);
    try {
      // Load mentorship relationship
      const { data: mentorshipData, error: mentorshipError } = await supabase
        .from('mentorships')
        .select(`
          id,
          status,
          start_date,
          progress_score,
          goals,
          notes,
          student_profile:student_id (
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
          )
        `)
        .eq('mentor_id', user.id)
        .eq('student_id', studentId)
        .single();

      if (mentorshipError) {
        if (mentorshipError.code === 'PGRST116') {
          toast.error('Student not found or you do not have access to this student.');
          navigate('/mentor/students');
          return;
        }
        throw mentorshipError;
      }

      // Mock data for demonstration (would be loaded from actual tables)
      const mockStudentData: StudentData = {
        id: studentId,
        mentorship: {
          id: mentorshipData.id,
          status: mentorshipData.status,
          start_date: mentorshipData.start_date,
          progress_score: mentorshipData.progress_score || 0,
          goals: mentorshipData.goals || [],
          notes: mentorshipData.notes || ''
        },
        profile: {
          display_name: mentorshipData.student_profile?.display_name || 'Unknown Student',
          profile_image_url: mentorshipData.student_profile?.profile_image_url,
          bio: mentorshipData.student_profile?.bio,
          field_of_study: mentorshipData.student_profile?.field_of_study,
          academic_level: mentorshipData.student_profile?.academic_level,
          current_institution: mentorshipData.student_profile?.current_institution,
          location: mentorshipData.student_profile?.location,
          graduation_year: mentorshipData.student_profile?.graduation_year,
          gpa: mentorshipData.student_profile?.gpa,
          research_interests: mentorshipData.student_profile?.research_interests || [],
          skills: mentorshipData.student_profile?.skills || []
        },
        contact: {
          email: 'student@example.com',
          phone: '+1 (555) 123-4567',
          linkedin_url: 'https://linkedin.com/in/student',
          website_url: 'https://student-portfolio.com'
        },
        documents: [
          {
            id: '1',
            title: 'Personal Statement Draft',
            document_type: 'personal_statement',
            created_at: '2024-01-15T10:00:00Z',
            last_edited_at: '2024-01-20T14:30:00Z',
            word_count: 850
          },
          {
            id: '2',
            title: 'CV - Latest Version',
            document_type: 'resume',
            created_at: '2024-01-10T09:00:00Z',
            last_edited_at: '2024-01-18T16:45:00Z',
            word_count: 1200
          },
          {
            id: '3',
            title: 'Research Proposal',
            document_type: 'research_proposal',
            created_at: '2024-01-20T11:00:00Z',
            last_edited_at: '2024-01-22T13:15:00Z',
            word_count: 2500
          }
        ],
        progress: [
          {
            id: '1',
            title: 'Complete Personal Statement',
            milestone_type: 'essay_completed',
            status: 'in_progress',
            due_date: '2024-02-01T00:00:00Z',
            priority: 1
          },
          {
            id: '2',
            title: 'Submit Stanford Application',
            milestone_type: 'application_submitted',
            status: 'not_started',
            due_date: '2024-02-15T00:00:00Z',
            priority: 1
          },
          {
            id: '3',
            title: 'Schedule MIT Interview',
            milestone_type: 'interview_scheduled',
            status: 'completed',
            due_date: '2024-01-15T00:00:00Z',
            completed_date: '2024-01-14T00:00:00Z',
            priority: 2
          }
        ],
        sessions: [
          {
            id: '1',
            title: 'Personal Statement Review',
            scheduled_at: '2024-01-25T15:00:00Z',
            duration_minutes: 60,
            status: 'scheduled',
            session_type: 'document_review'
          },
          {
            id: '2',
            title: 'Application Strategy Discussion',
            scheduled_at: '2024-01-18T14:00:00Z',
            duration_minutes: 90,
            status: 'completed',
            session_type: 'general_guidance'
          }
        ],
        evaluations: [
          {
            id: '1',
            evaluation_period: 'January 2024',
            overall_rating: 4,
            created_at: '2024-01-20T00:00:00Z',
            strengths: 'Excellent communication skills, very motivated, strong academic background',
            areas_for_improvement: 'Time management, following up on action items more consistently'
          }
        ]
      };

      setStudentData(mockStudentData);
      setNotes(mockStudentData.mentorship.notes);

    } catch (error) {
      console.error('Error loading student data:', error);
      toast.error('Failed to load student data');
      navigate('/mentor/students');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!studentData || !user) {return;}

    try {
      const { error } = await supabase
        .from('mentorships')
        .update({ notes })
        .eq('id', studentData.mentorship.id)
        .eq('mentor_id', user.id);

      if (error) {throw error;}

      setStudentData(prev => prev ? {
        ...prev,
        mentorship: { ...prev.mentorship, notes }
      } : null);
      
      setIsEditingNotes(false);
      toast.success('Notes saved successfully');
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error('Failed to save notes');
    }
  };

  const handleStartVideoCall = () => {
    toast.info('Video call functionality coming soon!');
  };

  const handleScheduleSession = () => {
    toast.info('Session scheduling coming soon!');
  };

  const handleOpenDocument = (documentId: string) => {
    toast.info('Document collaboration coming soon!');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'not_started': return 'bg-gray-100 text-gray-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'text-red-600';
      case 2: return 'text-orange-600';
      case 3: return 'text-yellow-600';
      case 4: return 'text-blue-600';
      case 5: return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <>
        <AuthenticatedHeader />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex items-center justify-center">
          <LoadingSpinner size="lg" message="Loading student profile..." />
        </div>
      </>
    );
  }

  if (!studentData) {
    return (
      <>
        <AuthenticatedHeader />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex items-center justify-center">
          <Card className="text-center p-8">
            <CardContent>
              <UserIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Student not found</h3>
              <p className="text-gray-500 mb-6">The student you're looking for doesn't exist or you don't have access.</p>
              <Button onClick={() => navigate('/mentor/students')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Students
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <AuthenticatedHeader />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="container mx-auto py-8 px-4 max-w-7xl">
          
          {/* Header */}
          <div className="mb-8">
            <Button 
              variant="outline" 
              onClick={() => navigate('/mentor/students')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Students
            </Button>
            
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-6">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={studentData.profile.profile_image_url} />
                  <AvatarFallback className="text-2xl">
                    {studentData.profile.display_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <h1 className="text-3xl font-bold text-gradapp-primary mb-2">
                    {studentData.profile.display_name}
                  </h1>
                  <div className="flex items-center gap-4 text-gray-600 mb-2">
                    <span className="flex items-center gap-1">
                      <GraduationCap className="h-4 w-4" />
                      {studentData.profile.academic_level} • {studentData.profile.field_of_study}
                    </span>
                    {studentData.profile.current_institution && (
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        {studentData.profile.current_institution}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className="bg-green-100 text-green-800">
                      {studentData.mentorship.status}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      Mentoring since {formatDate(studentData.mentorship.start_date)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleStartVideoCall} className="bg-gradapp-primary hover:bg-gradapp-accent">
                  <Video className="h-4 w-4 mr-2" />
                  Start Call
                </Button>
                <Button variant="outline" onClick={handleScheduleSession}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule
                </Button>
                <Button variant="outline" onClick={() => navigate(`/gradnet?tab=messages&student=${studentId}`)}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Message
                </Button>
              </div>
            </div>
          </div>

          {/* Progress Overview */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Overall Progress</h3>
                <span className="text-2xl font-bold text-gradapp-primary">
                  {studentData.mentorship.progress_score}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradapp-primary h-3 rounded-full transition-all duration-300"
                  style={{ width: `${studentData.mentorship.progress_score}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border-0 p-2">
              <TabsList className="grid w-full grid-cols-5 gap-2 bg-gray-50">
                <TabsTrigger 
                  value="profile" 
                  className="data-[state=active]:bg-white data-[state=active]:text-gradapp-primary"
                >
                  <UserIcon className="w-4 h-4 mr-2" />
                  Profile
                </TabsTrigger>
                <TabsTrigger 
                  value="documents" 
                  className="data-[state=active]:bg-white data-[state=active]:text-gradapp-primary"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Documents
                </TabsTrigger>
                <TabsTrigger 
                  value="progress" 
                  className="data-[state=active]:bg-white data-[state=active]:text-gradapp-primary"
                >
                  <Target className="w-4 h-4 mr-2" />
                  Progress
                </TabsTrigger>
                <TabsTrigger 
                  value="sessions" 
                  className="data-[state=active]:bg-white data-[state=active]:text-gradapp-primary"
                >
                  <Video className="w-4 h-4 mr-2" />
                  Sessions
                </TabsTrigger>
                <TabsTrigger 
                  value="evaluations" 
                  className="data-[state=active]:bg-white data-[state=active]:text-gradapp-primary"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Evaluations
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Profile Tab */}
            <TabsContent value="profile" className="mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* Personal Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {studentData.profile.bio && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Bio</label>
                          <p className="text-gray-600 mt-1">{studentData.profile.bio}</p>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {studentData.profile.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">{studentData.profile.location}</span>
                          </div>
                        )}
                        
                        {studentData.profile.graduation_year && (
                          <div className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">Graduating {studentData.profile.graduation_year}</span>
                          </div>
                        )}
                        
                        {studentData.profile.gpa && (
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">GPA: {studentData.profile.gpa}</span>
                          </div>
                        )}
                      </div>

                      {/* Research Interests */}
                      {studentData.profile.research_interests && studentData.profile.research_interests.length > 0 && (
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">Research Interests</label>
                          <div className="flex flex-wrap gap-2">
                            {studentData.profile.research_interests.map((interest, index) => (
                              <Badge key={index} variant="secondary">
                                {interest}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Skills */}
                      {studentData.profile.skills && studentData.profile.skills.length > 0 && (
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">Skills</label>
                          <div className="flex flex-wrap gap-2">
                            {studentData.profile.skills.map((skill, index) => (
                              <Badge key={index} variant="outline">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Goals */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Mentorship Goals</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {studentData.mentorship.goals.length > 0 ? (
                        <ul className="space-y-2">
                          {studentData.mentorship.goals.map((goal, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <Target className="h-4 w-4 text-gradapp-primary mt-0.5" />
                              <span className="text-gray-700">{goal}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500 text-center py-4">
                          No goals set yet. Consider setting goals in your next session.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  {/* Contact Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {studentData.contact.email && (
                        <div className="flex items-center gap-3">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <a href={`mailto:${studentData.contact.email}`} className="text-gradapp-primary hover:underline">
                            {studentData.contact.email}
                          </a>
                        </div>
                      )}
                      
                      {studentData.contact.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <a href={`tel:${studentData.contact.phone}`} className="text-gradapp-primary hover:underline">
                            {studentData.contact.phone}
                          </a>
                        </div>
                      )}
                      
                      {studentData.contact.linkedin_url && (
                        <div className="flex items-center gap-3">
                          <TrendingUp className="h-4 w-4 text-gray-400" />
                          <a href={studentData.contact.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-gradapp-primary hover:underline">
                            LinkedIn Profile
                          </a>
                        </div>
                      )}
                      
                      {studentData.contact.website_url && (
                        <div className="flex items-center gap-3">
                          <BookOpen className="h-4 w-4 text-gray-400" />
                          <a href={studentData.contact.website_url} target="_blank" rel="noopener noreferrer" className="text-gradapp-primary hover:underline">
                            Personal Website
                          </a>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Mentor Notes */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Mentor Notes</CardTitle>
                        {!isEditingNotes ? (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setIsEditingNotes(true)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        ) : (
                          <div className="flex gap-1">
                            <Button 
                              size="sm" 
                              onClick={handleSaveNotes}
                              className="bg-gradapp-primary hover:bg-gradapp-accent"
                            >
                              <Save className="h-3 w-3 mr-1" />
                              Save
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setIsEditingNotes(false);
                                setNotes(studentData.mentorship.notes);
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {isEditingNotes ? (
                        <Textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Add your notes about this student..."
                          rows={6}
                          className="w-full"
                        />
                      ) : (
                        <div className="min-h-[120px]">
                          {notes ? (
                            <p className="text-gray-700 whitespace-pre-wrap">{notes}</p>
                          ) : (
                            <p className="text-gray-500 italic">No notes added yet. Click Edit to add notes.</p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="mt-0">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Collaborative Documents</CardTitle>
                    <Button className="bg-gradapp-primary hover:bg-gradapp-accent">
                      <Plus className="h-4 w-4 mr-2" />
                      New Document
                    </Button>
                  </div>
                  <p className="text-gray-600">Documents you're working on together</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {studentData.documents.map((doc) => (
                      <div 
                        key={doc.id} 
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleOpenDocument(doc.id)}
                      >
                        <div className="flex items-center gap-4">
                          <FileText className="h-8 w-8 text-gradapp-primary" />
                          <div>
                            <h4 className="font-medium text-gray-900">{doc.title}</h4>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>{doc.document_type.replace('_', ' ')}</span>
                              <span>•</span>
                              <span>{doc.word_count} words</span>
                              <span>•</span>
                              <span>Updated {formatDate(doc.last_edited_at)}</span>
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Progress Tab */}
            <TabsContent value="progress" className="mt-0">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Milestones & Progress</CardTitle>
                    <Button className="bg-gradapp-primary hover:bg-gradapp-accent">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Milestone
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {studentData.progress.map((milestone) => (
                      <div key={milestone.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
                            {milestone.status === 'completed' ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <Clock className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{milestone.title}</h4>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <Badge className={getStatusColor(milestone.status)}>
                                {milestone.status.replace('_', ' ')}
                              </Badge>
                              {milestone.due_date && (
                                <span>Due: {formatDate(milestone.due_date)}</span>
                              )}
                              <span className={`font-medium ${getPriorityColor(milestone.priority)}`}>
                                Priority {milestone.priority}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Sessions Tab */}
            <TabsContent value="sessions" className="mt-0">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Mentoring Sessions</CardTitle>
                    <Button onClick={handleScheduleSession} className="bg-gradapp-primary hover:bg-gradapp-accent">
                      <Plus className="h-4 w-4 mr-2" />
                      Schedule Session
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {studentData.sessions.map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <Video className="h-8 w-8 text-gradapp-primary" />
                          <div>
                            <h4 className="font-medium text-gray-900">{session.title}</h4>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>{formatDateTime(session.scheduled_at)}</span>
                              <span>•</span>
                              <span>{session.duration_minutes} minutes</span>
                              <span>•</span>
                              <Badge className={getStatusColor(session.status)}>
                                {session.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {session.status === 'scheduled' && (
                            <Button onClick={handleStartVideoCall} className="bg-gradapp-primary hover:bg-gradapp-accent">
                              <Video className="h-3 w-3 mr-1" />
                              Join
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Evaluations Tab */}
            <TabsContent value="evaluations" className="mt-0">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Student Evaluations</CardTitle>
                    <Button className="bg-gradapp-primary hover:bg-gradapp-accent">
                      <Plus className="h-4 w-4 mr-2" />
                      New Evaluation
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {studentData.evaluations.map((evaluation) => (
                      <div key={evaluation.id} className="border rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium text-gray-900">{evaluation.evaluation_period}</h4>
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star 
                                  key={star} 
                                  className={`h-4 w-4 ${
                                    star <= evaluation.overall_rating 
                                      ? 'text-yellow-500 fill-current' 
                                      : 'text-gray-300'
                                  }`} 
                                />
                              ))}
                            </div>
                            <span className="text-sm text-gray-500">
                              {formatDate(evaluation.created_at)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h5 className="font-medium text-green-700 mb-2">Strengths</h5>
                            <p className="text-gray-600 text-sm">{evaluation.strengths}</p>
                          </div>
                          <div>
                            <h5 className="font-medium text-orange-700 mb-2">Areas for Improvement</h5>
                            <p className="text-gray-600 text-sm">{evaluation.areas_for_improvement}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default StudentProfile;