import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  ExternalLink, 
  MapPin, 
  GraduationCap, 
  Users, 
  Award, 
  Globe, 
  Star,
  Heart,
  BookOpen,
  Target,
  Brain,
  Lightbulb
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { facultyMatchingService, type FacultyMatch, type ResearchProfile } from '@/services/facultyMatchingService';
import { dashboardService } from '@/services/dashboardService';
import AuthenticatedHeader from '@/components/AuthenticatedHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import SEOHead from '@/components/SEOHead';

interface MatchedUniversityData {
  id: string;
  university_name: string;
  program_name: string;
  location: string;
  match_score: number;
  match_reason?: string;
  website_url?: string;
  match_factors?: any;
  similarity_score?: number;
}

const UniversityPreview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // State management
  const [university, setUniversity] = useState<MatchedUniversityData | null>(null);
  const [facultyMatches, setFacultyMatches] = useState<FacultyMatch[]>([]);
  const [userResearchProfile, setUserResearchProfile] = useState<ResearchProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [facultyLoading, setFacultyLoading] = useState(false);
  const [addingToSelected, setAddingToSelected] = useState(false);
  const [alreadySelected, setAlreadySelected] = useState(false);

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

      // Fetch university from matched_universities table
      const { data: universityData, error } = await supabase
        .from('matched_universities')
        .select('*')
        .eq('id', universityId)
        .eq('user_id', user.user.id)
        .single();

      if (error || !universityData) {
        toast({
          title: 'University Not Found',
          description: 'The university you are looking for was not found.',
          variant: 'destructive',
        });
        navigate('/matched-universities');
        return;
      }

      setUniversity(universityData);

      // Check if university is already selected
      const { data: selectedCheck } = await supabase
        .from('selected_universities')
        .select('id')
        .eq('user_id', user.user.id)
        .eq('university_name', universityData.university_name)
        .eq('program_name', universityData.program_name)
        .maybeSingle();

      setAlreadySelected(Boolean(selectedCheck));

      // Load user research profile
      const researchProfile = await facultyMatchingService.getUserResearchProfile(user.user.id);
      setUserResearchProfile(researchProfile);

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

  const handleAddToSelected = async () => {
    if (!university) {return;}

    try {
      setAddingToSelected(true);
      const { error } = await dashboardService.addSelectedUniversity({
        id: university.id,
        university_name: university.university_name,
        program_name: university.program_name,
        location: university.location,
        match_score: university.match_score,
        match_reason: university.match_reason,
        website_url: university.website_url
      });

      if (error) {
        if (error === "University already selected") {
          setAlreadySelected(true);
          toast({
            title: 'Already Selected',
            description: 'This university is already in your selected list',
            variant: 'default',
          });
        } else {
          toast({
            title: 'Error',
            description: 'Failed to add university to selection',
            variant: 'destructive',
          });
        }
        return;
      }

      toast({
        title: 'Success',
        description: `${university.university_name} added to your selected universities!`,
      });

      // Navigate to selected universities page
      navigate('/selected-universities');

    } catch (error) {
      console.error('Error adding university:', error);
      toast({
        title: 'Error',
        description: 'Failed to add university to selection',
        variant: 'destructive',
      });
    } finally {
      setAddingToSelected(false);
    }
  };

  const getUniversityImage = (universityName: string) => {
    const imageMap: Record<string, string> = {
      'Stanford University': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop',
      'Massachusetts Institute of Technology': 'https://images.unsplash.com/photo-1564981797816-1043664bf78d?w=800&h=400&fit=crop',
      'California Institute of Technology': 'https://images.unsplash.com/photo-1562774053-701939374585?w=800&h=400&fit=crop',
      'University of California, Berkeley': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop',
      'Harvard University': 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&h=400&fit=crop',
      'University of Toronto': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop',
      'University of Cambridge': 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&h=400&fit=crop'
    };
    return imageMap[universityName] || 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=800&h=400&fit=crop';
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 0.9) {return 'text-green-600 bg-green-50 border-green-200';}
    if (score >= 0.8) {return 'text-blue-600 bg-blue-50 border-blue-200';}
    if (score >= 0.7) {return 'text-yellow-600 bg-yellow-50 border-yellow-200';}
    return 'text-red-600 bg-red-50 border-red-200';
  };

  if (loading) {
    return (
      <>
        <AuthenticatedHeader />
        <LoadingOverlay message="Loading university details..." />
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
              onClick={() => navigate('/matched-universities')}
              className="mt-4 bg-gradapp-primary hover:bg-gradapp-accent"
            >
              Back to Matched Universities
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEOHead 
        title="University Preview"
        description="Preview university information and program details"
        keywords="university preview, program details, university information, faculty matches"
      />
      <AuthenticatedHeader />
      <div className="min-h-screen bg-gray-50">
        {/* Header with university image */}
        <div className="relative h-64 bg-gradient-to-r from-gradapp-primary to-gradapp-accent">
          <img
            src={getUniversityImage(university.university_name)}
            alt={university.university_name}
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40" />
          <div className="absolute top-4 left-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/matched-universities')}
              className="bg-white/90 hover:bg-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Matches
            </Button>
          </div>
          <div className="absolute bottom-4 left-4 text-white">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{university.university_name}</h1>
              <Badge className={`${getMatchScoreColor(university.match_score)} border text-sm`}>
                {Math.round(university.match_score * 100)}% Match
              </Badge>
            </div>
            <p className="text-lg opacity-90">{university.program_name}</p>
          </div>
        </div>

        <div className="container mx-auto py-8 px-4 max-w-7xl">
          {/* Quick Actions Bar */}
          <div className="bg-white rounded-xl shadow-sm border-0 p-4 mb-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <Star className="h-5 w-5 text-yellow-500" />
                <span className="font-medium text-gray-900">
                  {university.match_reason || `Great match based on your research interests`}
                </span>
              </div>
              <div className="flex gap-3">
                {university.website_url && (
                  <Button variant="outline" asChild>
                    <a href={university.website_url} target="_blank" rel="noopener noreferrer">
                      <Globe className="h-4 w-4 mr-2" />
                      Visit Website
                    </a>
                  </Button>
                )}
                <Button
                  onClick={handleAddToSelected}
                  disabled={addingToSelected || alreadySelected}
                  className={`${alreadySelected 
                    ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                    : 'bg-gradapp-primary hover:bg-gradapp-accent'
                  }`}
                >
                  {addingToSelected ? (
                    <LoadingSpinner variant="micro" size="xs" color="secondary" className="mr-2" />
                  ) : alreadySelected ? (
                    <span className="mr-2">✓</span>
                  ) : (
                    <Heart className="h-4 w-4 mr-2" />
                  )}
                  {alreadySelected ? 'Already Selected' : 'Add to Selected Universities'}
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border-0 p-2">
              <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 gap-2 bg-gray-50">
                <TabsTrigger 
                  value="overview" 
                  className="data-[state=active]:bg-white data-[state=active]:text-gradapp-primary data-[state=active]:shadow-sm font-medium"
                >
                  <BookOpen className="w-4 h-4 mr-2" /> 
                  Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="match-analysis" 
                  className="data-[state=active]:bg-white data-[state=active]:text-gradapp-primary data-[state=active]:shadow-sm font-medium"
                >
                  <Target className="w-4 h-4 mr-2" /> 
                  Match Analysis
                </TabsTrigger>
                <TabsTrigger 
                  value="faculty" 
                  className="data-[state=active]:bg-white data-[state=active]:text-gradapp-primary data-[state=active]:shadow-sm font-medium"
                >
                  <Users className="w-4 h-4 mr-2" /> 
                  Faculty Matches
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
                      <CardTitle className="text-gradapp-primary">About {university.university_name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 leading-relaxed">
                        {university.university_name} is renowned for its excellence in {university.program_name} and offers 
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
                        <div className="flex items-center gap-3">
                          <Users className="h-5 w-5 text-gradapp-primary" />
                          <span>Collaborative environment</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Target className="h-5 w-5 text-gradapp-primary" />
                          <span>Industry connections</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* University Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-gradapp-primary">University Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gradapp-primary" />
                        <span className="text-sm">{university.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-gradapp-primary" />
                        <span className="text-sm">Match Score: {Math.round(university.match_score * 100)}%</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Match Analysis Tab */}
            <TabsContent value="match-analysis" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-gradapp-primary flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Why This University Matches You
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Match Score Breakdown</h4>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Research Alignment</span>
                            <span>{Math.round((university.match_factors?.research_alignment || 0.8) * 100)}%</span>
                          </div>
                          <Progress value={(university.match_factors?.research_alignment || 0.8) * 100} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Academic Fit</span>
                            <span>{Math.round((university.match_factors?.academic_fit || 0.9) * 100)}%</span>
                          </div>
                          <Progress value={(university.match_factors?.academic_fit || 0.9) * 100} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Field Match</span>
                            <span>{Math.round((university.match_factors?.field_match || 0.95) * 100)}%</span>
                          </div>
                          <Progress value={(university.match_factors?.field_match || 0.95) * 100} className="h-2" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Match Reasoning</h4>
                      <p className="text-gray-600 leading-relaxed">
                        {university.match_reason || `This university shows strong alignment with your academic background and research interests. The program offers excellent opportunities in your field of study with renowned faculty and cutting-edge research facilities.`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Faculty Matches Tab */}
            <TabsContent value="faculty" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-gradapp-primary flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Faculty Matches ({facultyMatches.length} found)
                  </CardTitle>
                  {userResearchProfile && (
                    <p className="text-gray-600">
                      Faculty members whose research aligns with your interests in: {userResearchProfile.primaryInterests.join(', ')}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  {facultyLoading ? (
                    <div className="text-center py-8">
                      <LoadingSpinner size="md" message="Finding matching faculty..." />
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
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default UniversityPreview;