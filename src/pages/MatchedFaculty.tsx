
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis
} from '@/components/ui/pagination';
import { 
  Search, 
  Mail, 
  UserCheck, 
  MapPin, 
  GraduationCap,
  Star,
  Filter,
  ArrowLeft
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import SEOHead from '@/components/SEOHead';

interface MatchedFaculty {
  id: string;
  professor_name: string;
  university: string;
  research_areas: string;
  match_score: number;
  email?: string;
  match_reason?: string;
}

const MatchedFaculty: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const universityName = searchParams.get('university') || 'Stanford University';
  
  const [faculty, setFaculty] = useState<MatchedFaculty[]>([]);
  const [filteredFaculty, setFilteredFaculty] = useState<MatchedFaculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedResearchArea, setSelectedResearchArea] = useState('');
  
  const itemsPerPage = 8;

  useEffect(() => {
    fetchMatchedFaculty();
  }, [universityName]);

  useEffect(() => {
    filterFaculty();
  }, [faculty, searchTerm, selectedResearchArea]);

  const fetchMatchedFaculty = async () => {
    try {
      setLoading(true);
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) {
        toast({
          title: 'Authentication Required',
          description: 'Please sign in to view matched faculty',
          variant: 'destructive',
        });
        navigate('/');
        return;
      }

      const { data: facultyData, error } = await supabase
        .from('matched_professors')
        .select('*')
        .eq('user_id', user.user.id)
        .eq('university', universityName)
        .order('match_score', { ascending: false });

      if (error) {
        throw error;
      }

      if (facultyData) {
        setFaculty(facultyData);
      }
    } catch (error) {
      console.error('Error fetching matched faculty:', error);
      toast({
        title: 'Error',
        description: 'Failed to load matched faculty',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterFaculty = () => {
    let filtered = faculty;

    if (searchTerm) {
      filtered = filtered.filter(prof => 
        prof.professor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prof.research_areas.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedResearchArea) {
      filtered = filtered.filter(prof => 
        prof.research_areas.toLowerCase().includes(selectedResearchArea.toLowerCase())
      );
    }

    setFilteredFaculty(filtered);
    setCurrentPage(1);
  };

  const getFacultyImage = (index: number) => {
    const images = [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=200&h=200&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face'
    ];
    return images[index % images.length];
  };

  const getUniqueResearchAreas = () => {
    const allAreas = faculty.flatMap(prof => 
      prof.research_areas.split(',').map(area => area.trim())
    );
    return Array.from(new Set(allAreas)).filter(area => area.length > 0);
  };

  const getMatchColor = (score: number) => {
    if (score >= 0.9) {return 'text-green-600 bg-green-50';}
    if (score >= 0.8) {return 'text-blue-600 bg-blue-50';}
    if (score >= 0.7) {return 'text-orange-600 bg-orange-50';}
    return 'text-gray-600 bg-gray-50';
  };

  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredFaculty.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(filteredFaculty.length / itemsPerPage);

  const handleContactFaculty = (faculty: MatchedFaculty) => {
    if (faculty.email) {
      const subject = encodeURIComponent(`Research Collaboration Inquiry - ${faculty.professor_name}`);
      const body = encodeURIComponent(`Dear Professor ${faculty.professor_name},\n\nI am interested in your research in ${faculty.research_areas}. I would like to discuss potential collaboration opportunities.\n\nBest regards,`);
      window.open(`mailto:${faculty.email}?subject=${subject}&body=${body}`);
    }
  };

  if (loading) {
    return (
      <LoadingOverlay message="Loading faculty directory..." />
    );
  }

  return (
    <>
      <SEOHead 
        title="Matched Faculty"
        description="Connect with faculty members who align with your research interests"
        keywords="faculty matching, professors, research mentors, academic advisors"
      />
      <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto py-8 px-4 max-w-6xl">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/matched-universities')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gradapp-primary mb-2">Faculty Directory</h1>
            <h2 className="text-xl text-gray-700 mb-2">{universityName}</h2>
            <p className="text-gray-600">Faculty members whose research aligns with your interests</p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search faculty or research areas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={selectedResearchArea}
                onChange={(e) => setSelectedResearchArea(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md bg-white min-w-[200px]"
              >
                <option value="">All Research Areas</option>
                {getUniqueResearchAreas().slice(0, 10).map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedResearchArea('');
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            Showing {filteredFaculty.length} faculty members
          </div>
        </div>
      </div>

      {/* Faculty Directory */}
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        {filteredFaculty.length === 0 ? (
          <div className="text-center py-12">
            <GraduationCap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No faculty matches found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or complete your profile for better matches.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {getCurrentPageData().map((prof, index) => (
                <Card key={prof.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <img
                        src={getFacultyImage(index + (currentPage - 1) * itemsPerPage)}
                        alt={prof.professor_name}
                        className="w-20 h-20 rounded-full object-cover border-2 border-gray-100"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900">{prof.professor_name}</h3>
                            <div className="flex items-center gap-1 text-gray-600 text-sm">
                              <MapPin className="h-3 w-3" />
                              {prof.university}
                            </div>
                          </div>
                          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getMatchColor(prof.match_score)}`}>
                            <Star className="h-3 w-3" />
                            {Math.round(prof.match_score * 100)}% match
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{prof.research_areas}</p>
                        
                        {prof.match_reason && (
                          <div className="mb-3">
                            <div className="flex items-center gap-1 mb-1">
                              <UserCheck className="h-3 w-3 text-gradapp-primary" />
                              <span className="text-xs font-medium text-gradapp-primary">Why this match?</span>
                            </div>
                            <p className="text-xs text-gray-600">{prof.match_reason}</p>
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleContactFaculty(prof)}
                            disabled={!prof.email}
                            className="bg-gradapp-primary hover:bg-gradapp-accent"
                          >
                            <Mail className="h-3 w-3 mr-1" />
                            Contact
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`https://scholar.google.com/scholar?q="${prof.professor_name}"`, '_blank')}
                          >
                            View Research
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage > 1) {setCurrentPage(currentPage - 1);}
                        }}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(pageNum);
                            }}
                            isActive={currentPage === pageNum}
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    
                    {totalPages > 5 && currentPage < totalPages - 2 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    
                    <PaginationItem>
                      <PaginationNext 
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage < totalPages) {setCurrentPage(currentPage + 1);}
                        }}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>
      </div>
    </>
  );
};

export default MatchedFaculty;
