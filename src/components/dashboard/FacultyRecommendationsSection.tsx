import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboardService, MatchedProfessor } from '@/services/dashboardService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { ExternalLink, Mail, User, BookOpen, Star, MapPin, Phone } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const FacultyRecommendationsSection: React.FC = () => {
  const [matchedProfessors, setMatchedProfessors] = useState<MatchedProfessor[]>([]);
  const [loading, setLoading] = useState(true);
  const [contactingProfessor, setContactingProfessor] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatchedProfessors = async () => {
      setLoading(true);
      try {
        const { data, error } = await dashboardService.getMatchedProfessors();
        
        if (error) {
          toast({
            title: 'Error',
            description: 'Failed to load faculty recommendations',
            variant: 'destructive',
          });
          return;
        }
        
        setMatchedProfessors(data || []);
      } catch (error) {
        console.error('Error fetching matched professors:', error);
        toast({
          title: 'Error',
          description: 'Failed to load faculty recommendations',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchMatchedProfessors();
  }, []);

  const handleContactProfessor = async (professor: MatchedProfessor) => {
    if (!professor.email) {
      toast({
        title: 'Contact Info Unavailable',
        description: 'No email address available for this professor',
        variant: 'destructive',
      });
      return;
    }

    setContactingProfessor(professor.id || professor.professor_name);
    
    // Create mailto link with pre-filled subject
    const subject = encodeURIComponent(`Graduate Program Inquiry - ${professor.university}`);
    const body = encodeURIComponent(`Dear Professor ${professor.professor_name},

I am interested in your research in ${professor.research_focus?.join(', ') || professor.research_areas} and would like to inquire about potential graduate opportunities in your lab.

I found your profile through the GradApp platform and believe my background aligns well with your research interests.

Could we schedule a brief conversation to discuss potential opportunities?

Best regards,
[Your Name]`);

    const mailtoLink = `mailto:${professor.email}?subject=${subject}&body=${body}`;
    
    // Open email client
    window.location.href = mailtoLink;
    
    setTimeout(() => {
      setContactingProfessor(null);
      toast({
        title: 'Email Client Opened',
        description: `Email draft created for ${professor.professor_name}`,
      });
    }, 1000);
  };

  const getMatchScoreColor = (score: number) => {
    const percentage = score * 100;
    if (percentage >= 80) {return 'text-green-600 bg-green-50';}
    if (percentage >= 60) {return 'text-blue-600 bg-blue-50';}
    if (percentage >= 40) {return 'text-yellow-600 bg-yellow-50';}
    return 'text-red-600 bg-red-50';
  };

  const getResearchBadgeColor = (index: number) => {
    const colors = ['bg-blue-100 text-blue-800', 'bg-green-100 text-green-800', 'bg-purple-100 text-purple-800'];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="p-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
                <Skeleton className="h-4 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-24" />
                </div>
                <Skeleton className="h-9 w-full" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (matchedProfessors.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-gradapp-primary">Faculty Recommendations</h3>
            <p className="text-sm text-gray-600 mt-1">Real professors with contact information and research details</p>
          </div>
        </div>
        
        <Card className="w-full">
          <CardHeader>
            <CardTitle>No Faculty Recommendations Available</CardTitle>
            <CardDescription>
              Generate university matches first to get personalized faculty recommendations with real contact information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-2">Faculty recommendations include:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Real professor names and titles</li>
                <li>Direct email addresses for contact</li>
                <li>Detailed research areas and expertise</li>
                <li>Current availability for new students</li>
                <li>Links to faculty profiles and websites</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-gradapp-primary">Faculty Recommendations</h3>
          <p className="text-sm text-gray-600 mt-1">
            {matchedProfessors.length} professor{matchedProfessors.length !== 1 ? 's' : ''} with real contact information
          </p>
        </div>
        <Badge variant="outline" className="bg-gradapp-primary/10 text-gradapp-primary">
          {matchedProfessors.filter(p => p.accepting_students).length} accepting students
        </Badge>
      </div>

      {/* Faculty Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {matchedProfessors.map((professor) => (
          <Card 
            key={professor.id || professor.professor_name} 
            className="hover:shadow-lg transition-shadow duration-200"
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <CardTitle className="text-lg text-gradapp-primary">
                    {professor.professor_name}
                  </CardTitle>
                  <p className="text-sm text-gray-600 font-medium">{professor.department || 'Faculty'}</p>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <MapPin className="h-3 w-3" />
                    <span>{professor.university}</span>
                  </div>
                </div>
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getMatchScoreColor(professor.match_score)}`}>
                  <Star className="h-3 w-3 mr-1" />
                  {Math.round(professor.match_score * 100)}%
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Match Reason */}
              {professor.match_reason && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {professor.match_reason}
                </p>
              )}

              {/* Research Areas */}
              {professor.research_focus && professor.research_focus.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-700">Research Areas:</p>
                  <div className="flex flex-wrap gap-1">
                    {professor.research_focus.slice(0, 3).map((area, index) => (
                      <Badge 
                        key={area} 
                        variant="secondary" 
                        className={`text-xs ${getResearchBadgeColor(index)}`}
                      >
                        {area}
                      </Badge>
                    ))}
                    {professor.research_focus.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{professor.research_focus.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Availability Status */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${professor.accepting_students ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <span className={professor.accepting_students ? 'text-green-700' : 'text-yellow-700'}>
                    {professor.accepting_students ? 'Accepting Students' : 'Status Unknown'}
                  </span>
                </div>
                {professor.profile_complete && (
                  <Badge variant="outline" className="text-xs">
                    Verified Profile
                  </Badge>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                {professor.contact_available && (
                  <Button
                    size="sm"
                    className="flex-1 bg-gradapp-primary hover:bg-gradapp-accent text-white"
                    onClick={() => handleContactProfessor(professor)}
                    disabled={contactingProfessor === (professor.id || professor.professor_name)}
                  >
                    <Mail className="h-3 w-3 mr-1" />
                    {contactingProfessor === (professor.id || professor.professor_name) ? 'Opening...' : 'Contact'}
                  </Button>
                )}
                
                {professor.profile_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <a 
                      href={professor.profile_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Profile
                    </a>
                  </Button>
                )}
              </div>

              {/* Contact Info */}
              {professor.email && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {professor.email}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Contact Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <BookOpen className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-medium text-blue-900">Contacting Faculty</h4>
              <p className="text-sm text-blue-700">
                When reaching out to professors, mention your specific research interests, relevant experience, 
                and why you're interested in their lab. Be professional and concise in your communication.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FacultyRecommendationsSection;