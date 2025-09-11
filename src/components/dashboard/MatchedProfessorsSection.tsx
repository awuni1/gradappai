
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboardService, MatchedProfessor } from '@/services/dashboardService';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { ExternalLink, Mail } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

const MatchedProfessorsSection: React.FC = () => {
  const [matchedProfessors, setMatchedProfessors] = useState<MatchedProfessor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatchedProfessors = async () => {
      setLoading(true);
      try {
        const { data, error } = await dashboardService.getMatchedProfessors();
        
        if (error) {
          toast({
            title: 'Error',
            description: 'Failed to load matched professors',
            variant: 'destructive',
          });
          return;
        }
        
        setMatchedProfessors(data || []);
      } catch (error) {
        console.error('Error fetching matched professors:', error);
        toast({
          title: 'Error',
          description: 'Failed to load matched professors',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchMatchedProfessors();
  }, []);

  const handleRegenerateMatches = async () => {
    setLoading(true);
    try {
      await dashboardService.generateMatches();
      
      // Fetch the new matches
      const { data, error } = await dashboardService.getMatchedProfessors();
      
      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to load new matches',
          variant: 'destructive',
        });
        return;
      }
      
      setMatchedProfessors(data || []);
      
      toast({
        title: 'Success',
        description: 'Professor matches regenerated successfully',
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

  const renderMatchScore = (score: number) => {
    const percentage = Math.round(score * 100);
    return (
      <div className="flex items-center space-x-2">
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-gradapp-primary h-2.5 rounded-full" 
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-sm font-medium">{percentage}%</span>
      </div>
    );
  };

  const renderResearchAreas = (areas?: string) => {
    if (!areas) {return null;}
    
    return (
      <div>
        <p className="text-sm font-medium mb-1">Research Areas</p>
        <div className="flex flex-wrap gap-2">
          {areas.split(',').map((area, index) => (
            <Badge key={index} variant="outline">
              {area.trim()}
            </Badge>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Matched Professors</h2>
        </div>
        {[1, 2, 3].map(i => (
          <Card key={i} className="w-full">
            <CardHeader>
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gradapp-primary">Matched Professors</h2>
        <Button 
          onClick={handleRegenerateMatches}
          className="bg-gradapp-primary hover:bg-gradapp-accent"
        >
          Regenerate Matches
        </Button>
      </div>
      
      {matchedProfessors.length === 0 ? (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>No Matches Found</CardTitle>
            <CardDescription>
              Upload your resume and complete your profile to get professor matches
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
        matchedProfessors.map((professor) => (
          <Card key={professor.id} className="w-full">
            <CardHeader>
              <div className="flex justify-between">
                <div>
                  <CardTitle>{professor.professor_name}</CardTitle>
                  <CardDescription>{professor.university}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-1">Match Score</p>
                  {renderMatchScore(professor.match_score)}
                </div>
                
                {professor.match_reason && (
                  <div>
                    <p className="text-sm font-medium mb-1">Why This Match</p>
                    <p className="text-sm text-gray-700">{professor.match_reason}</p>
                  </div>
                )}
                
                {renderResearchAreas(professor.research_areas)}
                
                {professor.email && (
                  <div>
                    <a 
                      href={`mailto:${professor.email}`}
                      className="text-gradapp-primary hover:underline flex items-center space-x-1"
                    >
                      <Mail className="h-4 w-4" />
                      <span>{professor.email}</span>
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

export default MatchedProfessorsSection;
