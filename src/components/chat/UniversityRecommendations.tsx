import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  University, 
  MapPin, 
  Heart, 
  Search,
  Filter,
  Star,
  Target,
  Shield,
  MessageSquare
} from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { toast } from '@/hooks/use-toast';
import { dashboardService } from '@/services/dashboardService';

interface UniversityRecommendation {
  id: string;
  conversation_id: string;
  message_id: string;
  country: string;
  universities: University[];
  filters_applied: any;
  recommendation_type: 'general' | 'reach' | 'target' | 'safety';
  created_at: string;
}

interface University {
  name: string;
  program: string;
  location: string;
  match_score: number;
  category: 'reach' | 'target' | 'safety';
  ranking?: string;
  why_recommended: string[];
  concerns?: string[];
  logo_url?: string;
  website_url?: string;
}

interface UniversityRecommendationsProps {
  recommendations: UniversityRecommendation[];
  selectedConversationId: string | null;
  onUniversitySelected: (university: University) => void;
  isMobile?: boolean;
}

export const UniversityRecommendations: React.FC<UniversityRecommendationsProps> = ({
  recommendations,
  selectedConversationId,
  onUniversitySelected,
  isMobile = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [pickingUniversity, setPicking] = useState<string | null>(null);

  // Flatten all universities from all recommendations
  const allUniversities: University[] = recommendations.flatMap(rec => rec.universities || []);

  // Filter universities based on search and category
  const filteredUniversities = allUniversities.filter(university => {
    const matchesSearch = university.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         university.program.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         university.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || university.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'reach': return <Target className="h-4 w-4 text-orange-500" />;
      case 'target': return <Star className="h-4 w-4 text-blue-500" />;
      case 'safety': return <Shield className="h-4 w-4 text-green-500" />;
      default: return <University className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'reach': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'target': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'safety': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getUniversityImage = (universityName: string) => {
    // Using the same image mapping from MatchedUniversities.tsx
    const imageMap: Record<string, string> = {
      'Stanford University': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=200&fit=crop',
      'Massachusetts Institute of Technology': 'https://images.unsplash.com/photo-1564981797816-1043664bf78d?w=400&h=200&fit=crop',
      'California Institute of Technology': 'https://images.unsplash.com/photo-1562774053-701939374585?w=400&h=200&fit=crop',
      'University of Toronto': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=200&fit=crop',
      'University of Cambridge': 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=400&h=200&fit=crop',
      'University of Washington': 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=400&h=200&fit=crop',
      'University of California, Irvine': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=200&fit=crop'
    };
    return universityName in imageMap ? imageMap[universityName] : 
           university.logo_url || 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=400&h=200&fit=crop';
  };

  const handlePickUniversity = async (university: University) => {
    const universityId = `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setPicking(universityId);

    try {
      const { error } = await dashboardService.addSelectedUniversity({
        id: universityId,
        university_name: university.name,
        program_name: university.program,
        location: university.location,
        match_score: university.match_score / 100, // Convert percentage to decimal
        match_reason: university.why_recommended.join('. '),
        website_url: university.website_url
      });

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
        description: `${university.name} added to your selected universities!`,
      });

      onUniversitySelected(university);

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

  const handleDiscussUniversity = (university: University) => {
    // TODO: Add message to chat about this specific university
    toast({
      title: 'Feature Coming Soon',
      description: 'Chat about specific universities will be available soon!',
    });
  };

  if (!selectedConversationId) {
    return (
      <Card className="h-full flex items-center justify-center">
        <div className="text-center">
          <University className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h3 className="font-medium text-gray-600 mb-2">No conversation selected</h3>
          <p className="text-sm text-gray-500">
            Start a conversation to see university recommendations
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b">
        <CardTitle className="text-lg flex items-center gap-2">
          <University className="h-5 w-5" />
          University Recommendations
          {filteredUniversities.length > 0 && (
            <Badge variant="secondary" className="bg-blue-50 text-blue-600">
              {filteredUniversities.length}
            </Badge>
          )}
        </CardTitle>

        {/* Filters */}
        {allUniversities.length > 0 && (
          <div className="space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Search universities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-9"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="reach">Reach Schools</SelectItem>
                  <SelectItem value="target">Target Schools</SelectItem>
                  <SelectItem value="safety">Safety Schools</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            {filteredUniversities.length > 0 ? (
              filteredUniversities.map((university, index) => (
                <Card 
                  key={`${university.name}-${index}`} 
                  className="overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* University Header */}
                      <div className="flex gap-3">
                        {/* University Image */}
                        <div className="flex-shrink-0">
                          <img
                            src={getUniversityImage(university.name)}
                            alt={university.name}
                            className="w-20 h-12 object-cover rounded-lg"
                          />
                        </div>

                        {/* University Info */}
                        <div className="flex-1 space-y-1">
                          <h3 className="font-semibold text-blue-600 text-sm leading-tight">
                            {university.name}
                          </h3>
                          <p className="text-gray-600 text-xs">{university.program}</p>
                          
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin className="h-3 w-3" />
                            <span>{university.location}</span>
                          </div>
                        </div>
                      </div>

                      {/* Category and Match Score */}
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className={`text-xs ${getCategoryColor(university.category)}`}>
                          {getCategoryIcon(university.category)}
                          <span className="ml-1 capitalize">{university.category}</span>
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {university.match_score}% match
                        </Badge>
                      </div>

                      {/* Ranking */}
                      {university.ranking && (
                        <p className="text-xs text-gray-600 font-medium">{university.ranking}</p>
                      )}

                      {/* Why Recommended */}
                      {university.why_recommended && university.why_recommended.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-green-700">Why recommended:</p>
                          <ul className="text-xs text-gray-600 space-y-0.5">
                            {university.why_recommended.slice(0, 2).map((reason, idx) => (
                              <li key={idx} className="flex items-start gap-1">
                                <span className="text-green-500 mt-0.5">•</span>
                                <span>{reason}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Concerns */}
                      {university.concerns && university.concerns.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-orange-700">Consider:</p>
                          <ul className="text-xs text-gray-600 space-y-0.5">
                            {university.concerns.slice(0, 1).map((concern, idx) => (
                              <li key={idx} className="flex items-start gap-1">
                                <span className="text-orange-500 mt-0.5">•</span>
                                <span>{concern}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white flex-1 h-8 text-xs"
                          onClick={() => handlePickUniversity(university)}
                          disabled={pickingUniversity !== null}
                        >
                          {pickingUniversity ? (
                            <LoadingSpinner variant="micro" size="xs" color="secondary" className="mr-1" />
                          ) : (
                            <Heart className="h-3 w-3 mr-1" />
                          )}
                          Pick
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2"
                          onClick={() => handleDiscussUniversity(university)}
                        >
                          <MessageSquare className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : allUniversities.length > 0 ? (
              <div className="text-center py-8">
                <Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <h3 className="font-medium text-gray-600 mb-2">No universities found</h3>
                <p className="text-sm text-gray-500">
                  Try adjusting your search or category filters
                </p>
              </div>
            ) : (
              <div className="text-center py-12">
                <University className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="font-medium text-gray-600 mb-2">No recommendations yet</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Start chatting to get personalized university recommendations
                </p>
                <p className="text-xs text-gray-400">
                  Try asking: "Can you recommend universities for Computer Science MS programs?"
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};