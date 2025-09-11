import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Heart, 
  Star,
  Target,
  Shield,
  ExternalLink
} from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { toast } from '@/hooks/use-toast';
import { dashboardService } from '@/services/dashboardService';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  message_type: 'text' | 'cv_upload' | 'universities_list' | 'cv_analysis' | 'file';
  metadata: any;
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
  application_deadline?: string;
  tuition_fee?: string;
  admission_requirements?: {
    gpa_requirement?: string;
    gre_requirement?: string;
    toefl_requirement?: string;
    ielts_requirement?: string;
  };
  research_areas?: string[];
  faculty_highlights?: string[];
}

interface UniversityCardMessageProps {
  message: Message;
}

export const UniversityCardMessage: React.FC<UniversityCardMessageProps> = ({ message }) => {
  const [universities, setUniversities] = useState<University[]>([]);
  const [pickingUniversity, setPicking] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUniversityRecommendations();
  }, [message.id]);

  const loadUniversityRecommendations = async () => {
    try {
      setLoading(true);
      console.log('🏛️ Loading university recommendations for message:', message.id);
      
      const { data, error } = await supabase
        .from('university_recommendations')
        .select('*')
        .eq('message_id', message.id);

      if (error) {
        console.error('❌ Error loading university recommendations:', error);
        return;
      }

      if (data && data.length > 0) {
        // Extract universities from the recommendations
        const allUniversities = data.flatMap(rec => rec.universities || []);
        setUniversities(allUniversities);
        console.log('✅ Loaded universities:', allUniversities.length);
      }
    } catch (error) {
      console.error('❌ Error in loadUniversityRecommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'reach': return <Target className="h-4 w-4 text-orange-500" />;
      case 'target': return <Star className="h-4 w-4 text-blue-500" />;
      case 'safety': return <Shield className="h-4 w-4 text-green-500" />;
      default: return <Star className="h-4 w-4 text-gray-500" />;
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

  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'reach': return 'bg-gradient-to-r from-red-500 to-rose-500 text-white';
      case 'target': return 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white';
      case 'safety': return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white';
      default: return 'bg-gradient-to-r from-slate-500 to-slate-600 text-white';
    }
  };

  // Using the exact same image mapping from MatchedUniversities.tsx
  const getUniversityImage = (universityName: string) => {
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

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="text-sm leading-relaxed">
          {message.content}
        </div>
        <div className="flex items-center justify-center py-4">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
          <span className="text-sm text-gray-600">Loading university recommendations...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* AI Message Content */}
      <div className="text-sm leading-relaxed">
        {message.content}
      </div>

      {/* Modern Borderless University Cards */}
      {universities.length > 0 && (
        <div className="space-y-6 mt-6">
          {universities.map((university, index) => (
            <div 
              key={`${university.name}-${index}`} 
              className="group bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-white/50 hover:border-blue-200/50"
            >
                <div className="flex gap-6">
                  {/* Modern University Image */}
                  <div className="flex-shrink-0">
                    <div className="w-36 h-24 rounded-2xl overflow-hidden shadow-md bg-gradient-to-br from-slate-100 to-slate-200">
                      <img
                        src={getUniversityImage(university.name)}
                        alt={university.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.src = `https://images.unsplash.com/photo-1562774053-701939374585?w=400&h=200&fit=crop`;
                        }}
                      />
                    </div>
                  </div>

                  {/* Modern University Details */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-blue-600 hover:text-blue-700 transition-colors">
                          {university.name}
                        </h3>
                        <p className="text-slate-700 font-semibold text-lg mt-1">{university.program}</p>
                      </div>

                      {/* Modern Category Badge */}
                      {university.category && (
                        <div className="flex-shrink-0 ml-6">
                          <div className={`px-4 py-2 rounded-xl font-semibold text-sm shadow-sm ${getCategoryStyles(university.category)}`}>
                            {university.category.toUpperCase()}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Location and Match Score */}
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-xl">
                        <MapPin className="h-4 w-4 text-slate-500" />
                        <span className="font-medium text-slate-700">{university.location}</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                        <Target className="h-4 w-4 text-green-600" />
                        <span className="font-bold text-green-700">
                          {Math.round(university.match_score)}% match
                        </span>
                      </div>
                    </div>

                    {/* Ranking */}
                    {university.ranking && (
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 rounded-xl border border-amber-200">
                        <Star className="h-4 w-4 text-amber-600" />
                        <span className="text-sm font-semibold text-amber-700">{university.ranking}</span>
                      </div>
                    )}

                    {/* Why Recommended */}
                    {university.why_recommended && university.why_recommended.length > 0 && (
                      <div className="bg-green-50/80 rounded-2xl p-4 border border-green-100">
                        <p className="text-sm text-green-800 leading-relaxed">
                          <span className="font-bold text-green-700">✓ Why recommended: </span>
                          {university.why_recommended.join('. ')}
                        </p>
                      </div>
                    )}

                    {/* Concerns */}
                    {university.concerns && university.concerns.length > 0 && (
                      <div className="bg-orange-50/80 rounded-2xl p-4 border border-orange-100">
                        <p className="text-sm text-orange-800 leading-relaxed">
                          <span className="font-bold text-orange-700">⚠ Considerations: </span>
                          {university.concerns.join('. ')}
                        </p>
                      </div>
                    )}

                    {/* Additional Info - Modern Grid */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      {university.application_deadline && (
                        <div className="flex items-center gap-2 text-xs bg-blue-50 px-3 py-2 rounded-xl">
                          <span className="font-semibold text-blue-700">Deadline:</span>
                          <span className="text-blue-600">{university.application_deadline}</span>
                        </div>
                      )}
                      {university.tuition_fee && (
                        <div className="flex items-center gap-2 text-xs bg-purple-50 px-3 py-2 rounded-xl">
                          <span className="font-semibold text-purple-700">Tuition:</span>
                          <span className="text-purple-600">{university.tuition_fee}</span>
                        </div>
                      )}
                      {university.admission_requirements?.gpa_requirement && (
                        <div className="flex items-center gap-2 text-xs bg-indigo-50 px-3 py-2 rounded-xl">
                          <span className="font-semibold text-indigo-700">GPA:</span>
                          <span className="text-indigo-600">{university.admission_requirements.gpa_requirement}</span>
                        </div>
                      )}
                      {university.admission_requirements?.gre_requirement && (
                        <div className="flex items-center gap-2 text-xs bg-teal-50 px-3 py-2 rounded-xl">
                          <span className="font-semibold text-teal-700">GRE:</span>
                          <span className="text-teal-600">{university.admission_requirements.gre_requirement}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Modern Action Buttons */}
                  <div className="flex flex-col gap-3 pt-2">
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 rounded-xl h-11 px-6 font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePickUniversity(university);
                      }}
                      disabled={pickingUniversity !== null}
                    >
                      {pickingUniversity ? (
                        <LoadingSpinner className="h-4 w-4 mr-2" />
                      ) : (
                        <Heart className="h-4 w-4 mr-2" />
                      )}
                      {pickingUniversity ? 'Adding...' : 'Pick University'}
                    </Button>
                    
                    {university.website_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(university.website_url, '_blank');
                        }}
                        className="border-slate-300 hover:border-slate-400 hover:bg-slate-50 rounded-xl h-11 px-6 font-medium transition-all duration-200"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Visit Website
                      </Button>
                    )}
                  </div>
                </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};