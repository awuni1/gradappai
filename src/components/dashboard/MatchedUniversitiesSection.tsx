
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboardService, MatchedUniversity } from '@/services/dashboardService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { ExternalLink, Search, MapPin, GraduationCap, Heart } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/badge';

const MatchedUniversitiesSection: React.FC = () => {
  const [matchedUniversities, setMatchedUniversities] = useState<MatchedUniversity[]>([]);
  const [filteredUniversities, setFilteredUniversities] = useState<MatchedUniversity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedDeadline, setSelectedDeadline] = useState<string>('all');
  const [selectedGPA, setSelectedGPA] = useState<string>('all');
  const [selectedGRE, setSelectedGRE] = useState<string>('all');
  const [pickingUniversity, setPicking] = useState<string | null>(null);
  const navigate = useNavigate();

  // Predefined countries for location filter
  const countries = ['USA', 'Canada', 'UK', 'Australia', 'Germany'];

  useEffect(() => {
    const fetchMatchedUniversities = async () => {
      setLoading(true);
      try {
        const { data, error } = await dashboardService.getMatchedUniversities();
        
        if (error) {
          toast({
            title: 'Error',
            description: 'Failed to load matched universities',
            variant: 'destructive',
          });
          return;
        }
        
        setMatchedUniversities(data || []);
        setFilteredUniversities(data || []);
      } catch (error) {
        console.error('Error fetching matched universities:', error);
        toast({
          title: 'Error',
          description: 'Failed to load matched universities',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchMatchedUniversities();
  }, []);

  // Filter universities based on search and filters
  useEffect(() => {
    let filtered = matchedUniversities;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(uni => 
        uni.university_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        uni.program_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        uni.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Location filter - now using countries
    if (selectedLocation !== 'all') {
      filtered = filtered.filter(uni => 
        uni.location?.includes(selectedLocation)
      );
    }

    setFilteredUniversities(filtered);
  }, [searchTerm, selectedLocation, selectedDeadline, selectedGPA, selectedGRE, matchedUniversities]);

  const handleRegenerateMatches = async () => {
    setLoading(true);
    try {
      await dashboardService.generateMatches();
      
      // Fetch the new matches
      const { data, error } = await dashboardService.getMatchedUniversities();
      
      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to load new matches',
          variant: 'destructive',
        });
        return;
      }
      
      setMatchedUniversities(data || []);
      setFilteredUniversities(data || []);
      
      toast({
        title: 'Success',
        description: 'University matches regenerated successfully',
      });
    } catch (error) {
      console.error('Error regenerating matches:', error);
      toast({
        title: 'Error',
        description: 'Failed to regenerate matches',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePickUniversity = async (university: MatchedUniversity) => {
    if (!university.id) {return;}
    
    setPicking(university.id);
    try {
      const { error } = await dashboardService.addSelectedUniversity(university);
      
      if (error) {
        if (error === "University already selected") {
          toast({
            title: 'Already Selected',
            description: 'This university is already in your selected list',
            variant: 'destructive',
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
    } catch (error) {
      console.error('Error adding university:', error);
      toast({
        title: 'Error',
        description: 'Failed to add university to selection',
        variant: 'destructive',
      });
    } finally {
      setPicking(null);
    }
  };

  const getMatchScoreColor = (score: number) => {
    const percentage = score * 100;
    if (percentage >= 80) {return 'text-green-600 bg-green-50';}
    if (percentage >= 60) {return 'text-blue-600 bg-blue-50';}
    if (percentage >= 40) {return 'text-yellow-600 bg-yellow-50';}
    return 'text-red-600 bg-red-50';
  };

  const getUniversityImage = (universityName: string) => {
    // Mock images for demonstration - in a real app these would come from the database
    const imageMap: Record<string, string> = {
      'Stanford University': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=200&fit=crop',
      'Massachusetts Institute of Technology': 'https://images.unsplash.com/photo-1564981797816-1043664bf78d?w=400&h=200&fit=crop',
      'California Institute of Technology': 'https://images.unsplash.com/photo-1562774053-701939374585?w=400&h=200&fit=crop',
      'University of Chicago': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=200&fit=crop',
      'University of Pennsylvania': 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=400&h=200&fit=crop'
    };
    return imageMap[universityName] || 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=400&h=200&fit=crop';
  };

  const handleUniversityClick = (universityId: string) => {
    navigate(`/university/${universityId}`);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-12 gap-6">
        {/* Left sidebar skeleton */}
        <div className="col-span-3">
          <Card className="h-fit">
            <CardHeader>
              <Skeleton className="h-6 w-20" />
            </CardHeader>
            <CardContent className="space-y-6">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        
        {/* Main content skeleton */}
        <div className="col-span-9 space-y-6">
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <Skeleton className="h-10 w-full" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="p-6">
                <div className="flex gap-4">
                  <Skeleton className="h-20 w-32 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Left Sidebar - Filters */}
      <div className="col-span-3">
        <Card className="h-fit sticky top-4">
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Degree Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Degree</label>
              <Select defaultValue="all">
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Degrees</SelectItem>
                  <SelectItem value="phd">PhD</SelectItem>
                  <SelectItem value="masters">Masters</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Location Filter - Updated to use countries */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Country</label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {countries.map(country => (
                    <SelectItem key={country} value={country}>{country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Deadline Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Deadline</label>
              <Select value={selectedDeadline} onValueChange={setSelectedDeadline}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Deadlines</SelectItem>
                  <SelectItem value="dec">December</SelectItem>
                  <SelectItem value="jan">January</SelectItem>
                  <SelectItem value="feb">February</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* GPA Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">GPA</label>
              <Select value={selectedGPA} onValueChange={setSelectedGPA}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All GPAs</SelectItem>
                  <SelectItem value="3.5+">3.5+</SelectItem>
                  <SelectItem value="3.0+">3.0+</SelectItem>
                  <SelectItem value="2.5+">2.5+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* GRE Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">GRE</label>
              <Select value={selectedGRE} onValueChange={setSelectedGRE}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Scores</SelectItem>
                  <SelectItem value="320+">320+</SelectItem>
                  <SelectItem value="310+">310+</SelectItem>
                  <SelectItem value="300+">300+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              className="w-full bg-gradapp-primary hover:bg-gradapp-accent"
              onClick={() => {
                setSelectedLocation('all');
                setSelectedDeadline('all');
                setSelectedGPA('all');
                setSelectedGRE('all');
                setSearchTerm('');
              }}
            >
              Apply Filters
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="col-span-9">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gradapp-primary">University Recommendations</h2>
              <p className="text-sm text-gray-600 mt-1">Real universities with faculty contacts and detailed information</p>
            </div>
            <Button 
              onClick={handleRegenerateMatches}
              className="bg-gradapp-primary hover:bg-gradapp-accent"
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Generate New Matches'}
            </Button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search universities, programs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Results Header */}
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Results</h3>
            <Badge variant="secondary" className="bg-gradapp-primary/10 text-gradapp-primary">
              {filteredUniversities.length} matches
            </Badge>
          </div>

          {/* University Cards */}
          {filteredUniversities.length === 0 ? (
            <Card className="w-full">
              <CardHeader>
                <CardTitle>No Matches Found</CardTitle>
                <CardDescription>
                  {matchedUniversities.length === 0 
                    ? "Upload your resume and complete your profile to get university matches"
                    : "Try adjusting your filters or search terms"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleRegenerateMatches}
                  className="bg-gradapp-primary hover:bg-gradapp-accent"
                >
                  Generate Matches
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredUniversities.map((university) => (
                <Card 
                  key={university.id} 
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleUniversityClick(university.id!)}
                >
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      {/* University Image */}
                      <div className="flex-shrink-0">
                        <img
                          src={getUniversityImage(university.university_name)}
                          alt={university.university_name}
                          className="w-32 h-20 object-cover rounded-lg"
                        />
                      </div>

                      {/* University Info */}
                      <div className="flex-1 space-y-2">
                        <div>
                          <h3 className="font-semibold text-lg text-gradapp-primary">
                            {university.university_name}
                          </h3>
                          <p className="text-gray-600">{university.program_name}</p>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>{university.location}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <GraduationCap className="h-3 w-3" />
                            <span>PhD Program</span>
                          </div>
                        </div>

                        {university.match_reason && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {university.match_reason}
                          </p>
                        )}
                      </div>

                      {/* Match Score and Actions */}
                      <div className="flex flex-col items-end justify-between">
                        <div className="text-right">
                          <div className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${getMatchScoreColor(university.match_score)}`}>
                            {Math.round(university.match_score * 100)}% match
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            className="bg-gradapp-primary hover:bg-gradapp-accent text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePickUniversity(university);
                            }}
                            disabled={pickingUniversity === university.id}
                          >
                            {pickingUniversity === university.id ? (
                              <LoadingSpinner variant="micro" size="xs" color="secondary" className="mr-1" />
                            ) : (
                              <Heart className="h-3 w-3 mr-1" />
                            )}
                            Pick
                          </Button>
                          
                          {university.website_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              onClick={(e) => e.stopPropagation()}
                            >
                              <a 
                                href={university.website_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-1"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Visit
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {filteredUniversities.length > 0 && (
            <div className="flex justify-center items-center space-x-2 pt-4">
              <Button variant="outline" size="sm" disabled>
                &lt;
              </Button>
              {[1, 2, 3, 4, 5].map((page) => (
                <Button
                  key={page}
                  variant={page === 1 ? "default" : "outline"}
                  size="sm"
                  className={page === 1 ? "bg-gradapp-primary hover:bg-gradapp-accent" : ""}
                >
                  {page}
                </Button>
              ))}
              <Button variant="outline" size="sm">
                &gt;
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchedUniversitiesSection;
