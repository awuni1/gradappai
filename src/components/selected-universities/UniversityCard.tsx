
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { dashboardService, SelectedProfessor } from '@/services/dashboardService';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  Trash2, 
  DollarSign,
  ExternalLink,
  StickyNote,
  FileText,
  Bot
} from 'lucide-react';

interface SelectedUniversityWithProfessors {
  id?: string;
  university_name: string;
  program_name?: string | null;
  location?: string | null;
  application_deadline?: string | null;
  funding_available?: boolean | null;
  funding_details?: string | null;
  website_url?: string | null;
  notes?: string | null;
  selected_professors?: SelectedProfessor[];
}

interface UniversityCardProps {
  university: SelectedUniversityWithProfessors;
  onRemove: (id: string) => void;
  onProfessorStatusUpdate: (professorId: string, newStatus: string) => void;
}

const UniversityCard: React.FC<UniversityCardProps> = ({ 
  university, 
  onRemove, 
  onProfessorStatusUpdate 
}) => {
  const navigate = useNavigate();

  const getUniversityImage = (universityName: string) => {
    const imageMap: Record<string, string> = {
      'Stanford University': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=200&fit=crop',
      'Massachusetts Institute of Technology': 'https://images.unsplash.com/photo-1564981797816-1043664bf78d?w=400&h=200&fit=crop',
      'California Institute of Technology': 'https://images.unsplash.com/photo-1562774053-701939374585?w=400&h=200&fit=crop',
      'University of Chicago': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=200&fit=crop',
      'University of Pennsylvania': 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=400&h=200&fit=crop'
    };
    return imageMap[universityName] || 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=400&h=200&fit=crop';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Applied':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Contacted':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Contact':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getNextStatusAction = (currentStatus: string) => {
    switch (currentStatus) {
      case 'Apply':
        return { text: 'Mark as Applied', nextStatus: 'Applied' };
      case 'Contact':
        return { text: 'Mark as Contacted', nextStatus: 'Contacted' };
      case 'Applied':
        return { text: 'Contact Professor', nextStatus: 'Contacted' };
      case 'Contacted':
        return { text: 'Mark as Applied', nextStatus: 'Applied' };
      default:
        return null;
    }
  };

  const updateProfessorStatus = async (professorId: string, newStatus: string) => {
    try {
      const { error } = await dashboardService.updateProfessorStatus(professorId, newStatus);

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to update status',
          variant: 'destructive',
        });
        return;
      }

      onProfessorStatusUpdate(professorId, newStatus);

      toast({
        title: 'Success',
        description: 'Status updated successfully',
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex gap-4">
          {/* University Image */}
          <div className="flex-shrink-0">
            <img
              src={getUniversityImage(university.university_name)}
              alt={university.university_name}
              className="w-24 h-16 object-cover rounded-lg"
            />
          </div>
          
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl font-bold text-gradapp-primary">
                  {university.university_name}
                </CardTitle>
                <CardDescription className="text-lg font-medium text-gray-700">
                  {university.program_name}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(university.id!)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* University Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-gradapp-primary flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-700">Location</p>
                <p className="text-gray-600">{university.location}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gradapp-primary flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-700">Application Deadline</p>
                <p className="text-gray-600">{university.application_deadline}</p>
              </div>
            </div>

            {university.funding_available && (
              <div className="flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-gradapp-primary mt-1 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-700">Funding Available</p>
                  <p className="text-gray-600">{university.funding_details || 'Funding opportunities available'}</p>
                </div>
              </div>
            )}

            {university.notes && (
              <div className="flex items-start gap-3">
                <StickyNote className="h-5 w-5 text-gradapp-primary mt-1 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-700">Notes</p>
                  <p className="text-gray-600">{university.notes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-4">
            {university.website_url && (
              <Button
                variant="outline"
                className="w-full border-gradapp-primary text-gradapp-primary hover:bg-gradapp-primary hover:text-white"
                asChild
              >
                <a href={university.website_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Visit Program Website
                </a>
              </Button>
            )}

            <Button
              variant="outline"
              className="w-full border-gradapp-primary text-gradapp-primary hover:bg-gradapp-primary hover:text-white"
              onClick={() => navigate(`/university-details/${university.id}`)}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View University Details
            </Button>

          </div>
        </div>

        {/* Professors Section */}
        {university.selected_professors && university.selected_professors.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-4">Selected Professors</h4>
            <div className="space-y-3">
              {university.selected_professors.map((professor) => {
                const nextAction = getNextStatusAction(professor.contact_status);
                return (
                  <div key={professor.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h5 className="font-medium text-gray-900">Prof. {professor.professor_name}</h5>
                        <p className="text-sm text-gray-600">{professor.research_interests}</p>
                        {professor.email && (
                          <p className="text-sm text-gray-500">{professor.email}</p>
                        )}
                      </div>
                      <Badge className={getStatusColor(professor.contact_status)}>
                        {professor.contact_status}
                      </Badge>
                    </div>
                    
                    <div className="flex gap-2">
                      {nextAction && (
                        <Button
                          size="sm"
                          onClick={() => updateProfessorStatus(professor.id!, nextAction.nextStatus)}
                          className="bg-gradapp-primary hover:bg-gradapp-accent"
                        >
                          {nextAction.text}
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/university-details/${university.id}?tab=faculty&professor=${professor.id}`)}
                        className="border-gradapp-primary text-gradapp-primary hover:bg-gradapp-primary hover:text-white"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View Profile
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UniversityCard;
