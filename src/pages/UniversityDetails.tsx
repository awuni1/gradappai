import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  ExternalLink, 
  MapPin, 
  GraduationCap, 
  Calendar, 
  DollarSign, 
  Users, 
  Award, 
  Phone, 
  Mail, 
  Globe, 
  UserCheck,
  Star,
  MessageCircle,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Brain,
  Target,
  BookOpen,
  Lightbulb
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { facultyMatchingService, type FacultyMatch, type ResearchProfile } from '@/services/facultyMatchingService';
import AuthenticatedHeader from '@/components/AuthenticatedHeader';
import SEOHead from '@/components/SEOHead';

interface UniversityDetailsData {
  id: string;
  university_name: string;
  program_name?: string;
  location?: string;
  application_deadline?: string;
  funding_available?: boolean;
  funding_details?: string;
  website_url?: string;
  notes?: string;
  created_at?: string;
  user_id?: string;
}

interface ApplicationDeadline {
  type: string;
  date: string;
  description: string;
  status: 'upcoming' | 'due_soon' | 'overdue' | 'completed';
}

const UniversityDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTabFromUrl = searchParams.get('tab') || 'overview';
  const professorIdFromUrl = searchParams.get('professor');

  // State management
  const [university, setUniversity] = useState<UniversityDetailsData | null>(null);
  const [facultyMatches, setFacultyMatches] = useState<FacultyMatch[]>([]);
  const [userResearchProfile, setUserResearchProfile] = useState<ResearchProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [facultyLoading, setFacultyLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(activeTabFromUrl);
  const [notes, setNotes] = useState('');
  const [deadlines, setDeadlines] = useState<ApplicationDeadline[]>([]);

  useEffect(() => {
    if (id) {
      fetchUniversityDetails(id);
    }
  }, [id]);

  useEffect(() => {
    if (university && userResearchProfile) {
      loadFacultyMatches();
    }
  }, [university, userResearchProfile]);

  const fetchUniversityDetails = async (universityId: string) => {
    try {
      setLoading(true);
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) {
        toast({
          title: 'Authentication Required',
          description: 'Please sign in to view university details',
          variant: 'destructive',
        });
        navigate('/auth');
        return;
      }

      // Fetch university from selected_universities table
      const { data: universityData, error } = await supabase
        .from('selected_universities')
        .select('*')
        .eq('id', universityId)
        .eq('user_id', user.user.id)
        .single();

      if (error || !universityData) {
        toast({
          title: 'University Not Found',
          description: 'The university you are looking for does not exist in your selected list.',
          variant: 'destructive',
        });
        navigate('/selected-universities');
        return;
      }

      setUniversity(universityData);
      setNotes(universityData.notes || '');

      // Load user research profile
      const researchProfile = await facultyMatchingService.getUserResearchProfile(user.user.id);
      setUserResearchProfile(researchProfile);

      // Generate mock deadlines
      generateMockDeadlines();

    } catch (error) {
      console.error('Error fetching university details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load university details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFacultyMatches = async () => {
    if (!university || !userResearchProfile) {return;}

    try {
      setFacultyLoading(true);
      const matches = await facultyMatchingService.findMatchedFaculty(
        university.university_name,
        userResearchProfile
      );
      setFacultyMatches(matches);
    } catch (error) {
      console.error('Error loading faculty matches:', error);
      toast({
        title: 'Error',
        description: 'Failed to load faculty matches',
        variant: 'destructive',
      });
    } finally {
      setFacultyLoading(false);
    }
  };

  const generateMockDeadlines = () => {
    const mockDeadlines: ApplicationDeadline[] = [
      {
        type: 'Application Deadline',
        date: '2024-12-15',
        description: 'Submit complete application including transcripts, SOP, and recommendations',
        status: 'upcoming'
      },
      {
        type: 'Funding Application',
        date: '2024-12-01',
        description: 'Apply for graduate assistantships and fellowships',
        status: 'due_soon'
      },
      {
        type: 'Standardized Tests',
        date: '2024-11-30',
        description: 'Submit GRE/GMAT scores',
        status: 'completed'
      },
      {
        type: 'Letters of Recommendation',
        date: '2024-12-10',
        description: 'Ensure all recommendation letters are submitted',
        status: 'upcoming'
      }
    ];
    setDeadlines(mockDeadlines);
  };

  const getUniversityImage = (universityName: string | undefined | null) => {
    if (!universityName) {
      return 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=800&h=400&fit=crop';
    }
    
    const imageMap: Record<string, string> = {
      'Stanford University': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop',
      'Massachusetts Institute of Technology': 'https://images.unsplash.com/photo-1564981797816-1043664bf78d?w=800&h=400&fit=crop',
      'California Institute of Technology': 'https://images.unsplash.com/photo-1562774053-701939374585?w=800&h=400&fit=crop',
      'University of California, Berkeley': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop',
      'Harvard University': 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&h=400&fit=crop'
    };
    return imageMap[universityName] || 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=800&h=400&fit=crop';
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 0.8) {return 'text-green-600 bg-green-50 border-green-200';}
    if (score >= 0.6) {return 'text-blue-600 bg-blue-50 border-blue-200';}
    if (score >= 0.4) {return 'text-yellow-600 bg-yellow-50 border-yellow-200';}
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getDeadlineStatus = (deadline: ApplicationDeadline) => {
    switch (deadline.status) {
      case 'completed':
        return { icon: CheckCircle, color: 'text-green-600 bg-green-50' };
      case 'due_soon':
        return { icon: AlertCircle, color: 'text-orange-600 bg-orange-50' };
      case 'overdue':
        return { icon: AlertCircle, color: 'text-red-600 bg-red-50' };
      default:
        return { icon: Clock, color: 'text-blue-600 bg-blue-50' };
    }
  };

  const handleNotesUpdate = async () => {
    if (!university?.id) {return;}

    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) {return;}

      const { error } = await supabase
        .from('selected_universities')
        .update({ notes })
        .eq('id', university.id)
        .eq('user_id', user.user.id);

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to update notes',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'Notes updated successfully',
      });
    } catch (error) {
      console.error('Error updating notes:', error);
    }
  };

  const handleContactFaculty = async (facultyId: string, contactStatus: string) => {
    try {
      const result = await facultyMatchingService.updateFacultyContactStatus(
        facultyId,
        contactStatus as any
      );

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Contact status updated successfully',
        });
        loadFacultyMatches(); // Refresh faculty data
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update contact status',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating contact status:', error);
    }
  };

  if (loading) {
    return (
      <>
        <AuthenticatedHeader />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gradapp-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading university details...</p>
          </div>
        </div>
      </>
    );
  }

  if (!university) {
    return (
      <>
        <AuthenticatedHeader />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">University Not Found</h2>
            <p className="mt-2 text-gray-600">The university you're looking for doesn't exist.</p>
            <Button 
              onClick={() => navigate('/selected-universities')}
              className="mt-4 bg-gradapp-primary hover:bg-gradapp-accent"
            >
              Back to Selected Universities
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEOHead 
        title="University Details"
        description="Detailed information about graduate programs and admission requirements"
        keywords="university details, program information, admission requirements, faculty matches"
      />
      <AuthenticatedHeader />
      <div className="min-h-screen bg-gray-50">
        {/* Header with university image */}
        <div className="relative h-64 bg-gradient-to-r from-gradapp-primary to-gradapp-accent">
          <img
            src={getUniversityImage(university.university_name)}
            alt={university.university_name || 'University'}
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40" />
          <div className="absolute top-4 left-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/selected-universities')}
              className="bg-white/90 hover:bg-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          <div className="absolute bottom-4 left-4 text-white">
            <h1 className="text-3xl font-bold">{university.university_name}</h1>
            <p className="text-lg opacity-90">{university.program_name}</p>
          </div>
        </div>

        <div className="container mx-auto py-8 px-4 max-w-7xl">
          {/* Main Navigation Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border-0 p-2">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-2 bg-gray-50">
                <TabsTrigger 
                  value="overview" 
                  className="data-[state=active]:bg-white data-[state=active]:text-gradapp-primary data-[state=active]:shadow-sm font-medium"
                >
                  <BookOpen className="w-4 h-4 mr-2" /> 
                  Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="faculty" 
                  className="data-[state=active]:bg-white data-[state=active]:text-gradapp-primary data-[state=active]:shadow-sm font-medium"
                >
                  <Users className="w-4 h-4 mr-2" /> 
                  Faculty Matches
                </TabsTrigger>
                <TabsTrigger 
                  value="deadlines" 
                  className="data-[state=active]:bg-white data-[state=active]:text-gradapp-primary data-[state=active]:shadow-sm font-medium"
                >
                  <Calendar className="w-4 h-4 mr-2" /> 
                  Deadlines
                </TabsTrigger>
                <TabsTrigger 
                  value="notes" 
                  className="data-[state=active]:bg-white data-[state=active]:text-gradapp-primary data-[state=active]:shadow-sm font-medium"
                >
                  <FileText className="w-4 h-4 mr-2" /> 
                  Notes
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                  {/* About Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-gradapp-primary">About {university.university_name || 'University'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 leading-relaxed">
                        {university.university_name || 'This university'} is renowned for its excellence in {university.program_name || 'graduate programs'} and offers 
                        cutting-edge research opportunities. The program is designed to prepare 
                        students for leadership roles in academia and industry.
                      </p>
                    </CardContent>
                  </Card>

                  {/* Research Alignment */}
                  {userResearchProfile && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-gradapp-primary flex items-center gap-2">
                          <Brain className="h-5 w-5" />
                          Research Alignment
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Your Research Interests</h4>
                            <div className="flex flex-wrap gap-2">
                              {userResearchProfile.primaryInterests.map((interest, index) => (
                                <Badge key={index} variant="secondary" className="bg-gradapp-primary/10 text-gradapp-primary">
                                  {interest}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">University Strengths</h4>
                            <div className="flex flex-wrap gap-2">
                              {['Machine Learning', 'Robotics', 'AI Research', 'Computer Vision'].map((strength, index) => (
                                <Badge key={index} variant="outline" className="border-green-300 text-green-700">
                                  {strength}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Key Highlights */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-gradapp-primary">Program Highlights</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                          <GraduationCap className="h-5 w-5 text-gradapp-primary" />
                          <span>World-class faculty</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Award className="h-5 w-5 text-gradapp-primary" />
                          <span>Research excellence</span>
                        </div>
                        {university.funding_available && (
                          <div className="flex items-center gap-3">
                            <DollarSign className="h-5 w-5 text-gradapp-primary" />
                            <span>Funding available</span>
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <Users className="h-5 w-5 text-gradapp-primary" />
                          <span>Collaborative environment</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Quick Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-gradapp-primary">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button className="w-full bg-gradapp-primary hover:bg-gradapp-accent">
                        Start Application
                      </Button>
                      {university.website_url && (
                        <Button variant="outline" className="w-full" asChild>
                          <a href={university.website_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Visit Website
                          </a>
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setActiveTab('faculty')}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        View Faculty
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Program Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-gradapp-primary">Program Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gradapp-primary" />
                        <span className="text-sm">{university.location}</span>
                      </div>
                      {university.application_deadline && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gradapp-primary" />
                          <span className="text-sm">Deadline: {university.application_deadline}</span>
                        </div>
                      )}
                      {university.funding_available && (
                        <div className="flex items-start gap-2">
                          <DollarSign className="h-4 w-4 text-gradapp-primary mt-0.5" />
                          <div className="text-sm">
                            <div className="font-medium">Funding Available</div>
                            <div className="text-gray-600">{university.funding_details || 'Details not specified'}</div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Contact Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-gradapp-primary">Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gradapp-primary" />
                        <span className="text-sm">(555) 123-4567</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gradapp-primary" />
                        <span className="text-sm">admissions@{(university.university_name || 'university').toLowerCase().replace(/\s+/g, '')}.edu</span>
                      </div>
                      {university.website_url && (
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-gradapp-primary" />
                          <a 
                            href={university.website_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-gradapp-primary hover:underline"
                          >
                            Visit Website
                          </a>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Faculty Matches Tab */}
            <TabsContent value="faculty" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-gradapp-primary flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    AI-Matched Faculty ({facultyMatches.length} matches)
                  </CardTitle>
                  <p className="text-gray-600">
                    Faculty members whose research aligns with your interests in: {userResearchProfile?.primaryInterests.join(', ')}
                  </p>
                </CardHeader>
                <CardContent>
                  {facultyLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gradapp-primary mx-auto"></div>
                      <p className="mt-2 text-gray-600">Finding matching faculty...</p>
                    </div>
                  ) : facultyMatches.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Faculty Matches Found</h3>
                      <p className="text-gray-600">No faculty members found matching your research interests.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {facultyMatches.map((match) => (
                        <Card key={match.professor.id} className="border-l-4 border-l-gradapp-primary">
                          <CardContent className="pt-6">
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="text-lg font-semibold text-gray-900">
                                    {match.professor.name}
                                  </h3>
                                  <Badge className={`${getMatchScoreColor(match.matchScore)} border`}>
                                    {Math.round(match.matchScore * 100)}% Match
                                  </Badge>
                                </div>
                                <p className="text-gray-600">{match.professor.department}</p>
                                <p className="text-sm text-gray-500">{match.professor.email}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Star className="h-4 w-4 text-yellow-500" />
                                <span className="text-sm font-medium">
                                  {match.availability === 'accepting' ? 'Accepting Students' : 'Contact to Inquire'}
                                </span>
                              </div>
                            </div>

                            <div className="mb-4">
                              <h4 className="font-medium text-gray-900 mb-2">Research Areas</h4>
                              <p className="text-gray-600 text-sm mb-3">{match.professor.researchDescription}</p>
                              <div className="flex flex-wrap gap-1">
                                {match.matchingKeywords.map((keyword, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs bg-green-100 text-green-800">
                                    <Lightbulb className="h-3 w-3 mr-1" />
                                    {keyword}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            <div className="mb-4">
                              <h4 className="font-medium text-gray-900 mb-2">Research Alignment</h4>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                <div>
                                  <span className="text-gray-600">Primary:</span>
                                  <Progress value={match.researchAlignment.primaryMatch * 100} className="h-2 mt-1" />
                                </div>
                                <div>
                                  <span className="text-gray-600">Secondary:</span>
                                  <Progress value={match.researchAlignment.secondaryMatch * 100} className="h-2 mt-1" />
                                </div>
                                <div>
                                  <span className="text-gray-600">Application:</span>
                                  <Progress value={match.researchAlignment.applicationMatch * 100} className="h-2 mt-1" />
                                </div>
                                <div>
                                  <span className="text-gray-600">Methodology:</span>
                                  <Progress value={match.researchAlignment.methodologyMatch * 100} className="h-2 mt-1" />
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleContactFaculty(match.professor.id, 'interested')}
                                className="bg-gradapp-primary hover:bg-gradapp-accent"
                              >
                                <MessageCircle className="h-3 w-3 mr-1" />
                                Mark as Interested
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleContactFaculty(match.professor.id, 'contacted')}
                                className="border-gradapp-primary text-gradapp-primary hover:bg-gradapp-primary hover:text-white"
                              >
                                Mark as Contacted
                              </Button>
                              {match.professor.email && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  asChild
                                  className="border-gray-300"
                                >
                                  <a href={`mailto:${match.professor.email}`}>
                                    <Mail className="h-3 w-3 mr-1" />
                                    Email
                                  </a>
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Deadlines Tab */}
            <TabsContent value="deadlines" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-gradapp-primary flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Application Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {deadlines.map((deadline, index) => {
                      const { icon: StatusIcon, color } = getDeadlineStatus(deadline);
                      return (
                        <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                          <div className={`p-2 rounded-full ${color}`}>
                            <StatusIcon className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-medium text-gray-900">{deadline.type}</h3>
                              <Badge variant="outline" className="text-xs">
                                {deadline.date}
                              </Badge>
                            </div>
                            <p className="text-gray-600 text-sm">{deadline.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notes Tab */}
            <TabsContent value="notes" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-gradapp-primary flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Application Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Add your notes about this university application..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="min-h-32"
                    />
                    <Button onClick={handleNotesUpdate} className="bg-gradapp-primary hover:bg-gradapp-accent">
                      Save Notes
                    </Button>
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

export default UniversityDetails;