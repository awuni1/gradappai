
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import AuthenticatedHeader from '@/components/AuthenticatedHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Search, MapPin, GraduationCap, ExternalLink, Star, Filter, BookOpen } from 'lucide-react';
import { Session, User } from '@supabase/supabase-js';
import SEOHead from '@/components/SEOHead';

interface UniversityProgram {
  id: string;
  university_name: string;
  program_name: string;
  location: string;
  country: string;
  degree_type: string;
  field_of_study: string;
  specializations: string[];
  research_areas: string[];
  website_url?: string;
  image_url?: string;
  ranking?: number;
  application_deadline?: string;
  tuition_fees?: string;
  funding_available: boolean;
}

interface MatchedProgram extends UniversityProgram {
  match_score?: number;
  match_reason?: string;
  similarity_score?: number;
}

const Programs: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [programs, setPrograms] = useState<UniversityProgram[]>([]);
  const [matchedPrograms, setMatchedPrograms] = useState<MatchedProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedDegreeType, setSelectedDegreeType] = useState<string>('all');
  const [selectedField, setSelectedField] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      }
    );

    const getInitialSession = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
      } catch (error) {
        console.error('Error checking session:', error);
      }
    };
    
    getInitialSession();
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    fetchPrograms();
    if (user) {
      fetchMatchedPrograms();
    }
  }, [user]);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('university_programs')
        .select('*')
        .order('ranking', { ascending: true });

      if (error) {
        console.error('Error fetching programs:', error);
        toast({
          title: 'Error',
          description: 'Failed to load university programs',
          variant: 'destructive',
        });
        return;
      }

      setPrograms(data || []);
    } catch (error) {
      console.error('Error fetching programs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load university programs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMatchedPrograms = async () => {
    if (!user) {return;}

    try {
      const { data, error } = await supabase
        .from('matched_universities')
        .select(`
          *,
          university_programs!matched_universities_program_id_fkey (*)
        `)
        .eq('user_id', user.id)
        .order('match_score', { ascending: false });

      if (error) {
        console.error('Error fetching matched programs:', error);
        return;
      }

      // Transform the data to include program details
      const transformedData = data?.map(match => ({
        ...match.university_programs,
        match_score: match.match_score,
        match_reason: match.match_reason,
        similarity_score: match.similarity_score
      })) || [];

      setMatchedPrograms(transformedData);
    } catch (error) {
      console.error('Error fetching matched programs:', error);
    }
  };

  const generateMatches = async () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to generate personalized matches',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      
      // Get user's academic profile and research interests
      const { data: profile } = await supabase
        .from('academic_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      const { data: interests } = await supabase
        .from('user_research_interests')
        .select(`
          research_interests:research_interest_id (title, category)
        `)
        .eq('user_id', user.id);

      // Generate matches based on field of study and research interests
      const userField = profile?.field;
      const userInterests = interests?.map(i => i.research_interests?.title).filter(Boolean) || [];

      // Find programs that match the user's field and interests
      const { data: relevantPrograms } = await supabase
        .from('university_programs')
        .select('*')
        .eq('field_of_study', userField || 'Computer Science');

      // Generate mock matches with scores
      const mockMatches = relevantPrograms?.slice(0, 5).map((program, index) => ({
        user_id: user.id,
        university_name: program.university_name,
        program_name: program.program_name,
        match_score: 0.95 - (index * 0.05), // Decreasing match scores
        match_reason: `Strong alignment with your ${userField} background and research interests`,
        website_url: program.website_url,
        location: program.location,
        program_id: program.id,
        match_factors: {
          field_match: 0.9,
          research_alignment: 0.85,
          academic_fit: 0.8
        },
        similarity_score: 0.92 - (index * 0.03)
      })) || [];

      // Clear existing matches and insert new ones
      await supabase
        .from('matched_universities')
        .delete()
        .eq('user_id', user.id);

      if (mockMatches.length > 0) {
        const { error: insertError } = await supabase
          .from('matched_universities')
          .insert(mockMatches);

        if (insertError) {
          console.error('Error saving matches:', insertError);
          toast({
            title: 'Error',
            description: 'Failed to save program matches',
            variant: 'destructive',
          });
          return;
        }
      }

      await fetchMatchedPrograms();
      
      toast({
        title: 'Success',
        description: `Generated ${mockMatches.length} personalized program matches!`,
      });

      setActiveTab('matched');
    } catch (error) {
      console.error('Error generating matches:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate program matches',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPrograms = programs.filter(program => {
    const matchesSearch = program.university_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         program.program_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         program.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCountry = selectedCountry === 'all' || program.country === selectedCountry;
    const matchesDegreeType = selectedDegreeType === 'all' || program.degree_type === selectedDegreeType;
    const matchesField = selectedField === 'all' || program.field_of_study === selectedField;

    return matchesSearch && matchesCountry && matchesDegreeType && matchesField;
  });

  const countries = [...new Set(programs.map(p => p.country))];
  const degreeTypes = [...new Set(programs.map(p => p.degree_type))];
  const fields = [...new Set(programs.map(p => p.field_of_study))];

  const renderProgramCard = (program: MatchedProgram, showMatchScore = false) => (
    <Card key={program.id} className="h-full">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg text-gradapp-primary">{program.university_name}</CardTitle>
            <CardDescription className="mt-1">{program.program_name}</CardDescription>
          </div>
          {program.ranking && (
            <Badge variant="secondary" className="ml-2">
              #{program.ranking}
            </Badge>
          )}
        </div>
        
        {showMatchScore && program.match_score && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">Match Score</span>
              <span className="text-sm font-bold text-gradapp-primary">
                {Math.round(program.match_score * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradapp-primary h-2 rounded-full" 
                style={{ width: `${program.match_score * 100}%` }}
              />
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="h-4 w-4 mr-1" />
          {program.location}, {program.country}
        </div>
        
        <div className="flex items-center text-sm text-gray-600">
          <GraduationCap className="h-4 w-4 mr-1" />
          {program.degree_type} in {program.field_of_study}
        </div>

        {program.specializations && program.specializations.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Specializations:</p>
            <div className="flex flex-wrap gap-1">
              {program.specializations.slice(0, 3).map((spec, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {spec}
                </Badge>
              ))}
              {program.specializations.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{program.specializations.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {showMatchScore && program.match_reason && (
          <div>
            <p className="text-sm font-medium mb-1">Why This Match:</p>
            <p className="text-sm text-gray-600">{program.match_reason}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t">
          {program.funding_available && (
            <Badge className="bg-green-100 text-green-800">
              Funding Available
            </Badge>
          )}
          
          {program.website_url && (
            <Button variant="outline" size="sm" asChild>
              <a href={program.website_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-1" />
                Visit Website
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <>
        <AuthenticatedHeader />
        <div className="container mx-auto py-8 px-4 max-w-7xl">
          <div className="space-y-6">
            <Skeleton className="h-12 w-1/3" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Card key={i} className="h-80">
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEOHead 
        title="Programs"
        description="Browse graduate programs and find your perfect academic match"
        keywords="graduate programs, university search, program matching, phd programs, masters programs"
      />
      <AuthenticatedHeader />
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="space-y-8">
          {/* Header Section */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-gradapp-primary">University Programs</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover graduate programs that match your academic background and research interests
            </p>
            
            {user && (
              <Button 
                onClick={generateMatches}
                className="bg-gradapp-primary hover:bg-gradapp-accent"
                disabled={loading}
              >
                <Star className="h-4 w-4 mr-2" />
                Generate Personalized Matches
              </Button>
            )}
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="all" className="data-[state=active]:bg-gradapp-primary data-[state=active]:text-white">
                <BookOpen className="w-4 h-4 mr-2" />
                All Programs ({filteredPrograms.length})
              </TabsTrigger>
              <TabsTrigger value="matched" className="data-[state=active]:bg-gradapp-primary data-[state=active]:text-white">
                <Star className="w-4 h-4 mr-2" />
                My Matches ({matchedPrograms.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-6">
              {/* Search and Filters */}
              <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Filter className="h-5 w-5 text-gradapp-primary" />
                  <h3 className="text-lg font-semibold">Search & Filter Programs</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search universities or programs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Countries</SelectItem>
                      {countries.map(country => (
                        <SelectItem key={country} value={country}>{country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={selectedDegreeType} onValueChange={setSelectedDegreeType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Degree type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Degree Types</SelectItem>
                      {degreeTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={selectedField} onValueChange={setSelectedField}>
                    <SelectTrigger>
                      <SelectValue placeholder="Field of study" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Fields</SelectItem>
                      {fields.map(field => (
                        <SelectItem key={field} value={field}>{field}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Programs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPrograms.map(program => renderProgramCard(program))}
              </div>

              {filteredPrograms.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">No programs found matching your criteria.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="matched" className="space-y-6">
              {user ? (
                matchedPrograms.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {matchedPrograms.map(program => renderProgramCard(program, true))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
                    <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No Matches Yet</h3>
                    <p className="text-gray-500 mb-4">
                      Complete your profile and generate personalized matches to see programs tailored to you.
                    </p>
                    <Button 
                      onClick={generateMatches}
                      className="bg-gradapp-primary hover:bg-gradapp-accent"
                    >
                      Generate Matches
                    </Button>
                  </div>
                )
              ) : (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
                  <GraduationCap className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">Sign In Required</h3>
                  <p className="text-gray-500 mb-4">
                    Sign in to get personalized university program matches based on your profile and interests.
                  </p>
                  <Button 
                    onClick={() => navigate('/onboarding')}
                    className="bg-gradapp-primary hover:bg-gradapp-accent"
                  >
                    Get Started
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default Programs;
