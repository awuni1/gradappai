
import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { dashboardService, SelectedUniversity, SelectedProfessor } from '@/services/dashboardService';
import { supabase } from '@/integrations/supabase/client';
import AuthenticatedHeader from '@/components/AuthenticatedHeader';
import ErrorBoundary from '@/components/ErrorBoundary';
import { GraduationCap, FileText, ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import SEOHead from '@/components/SEOHead';

// Import refactored components
import UniversityCard from '@/components/selected-universities/UniversityCard';
import DocumentSection from '@/components/selected-universities/DocumentSection';
import RecentDocuments from '@/components/selected-universities/RecentDocuments';
import UniversitySpecificDocuments from '@/components/selected-universities/UniversitySpecificDocuments';
import EmptyUniversitiesState from '@/components/selected-universities/EmptyUniversitiesState';
import AddUniversityModal from '@/components/selected-universities/AddUniversityModal';

interface SelectedUniversityWithProfessors extends SelectedUniversity {
  selected_professors?: SelectedProfessor[];
}

const SelectedUniversities: React.FC = () => {
  const navigate = useNavigate();
  const [selectedUniversities, setSelectedUniversities] = useState<SelectedUniversityWithProfessors[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSelectedUniversities();
  }, []);

  const fetchSelectedUniversities = async () => {
    setLoading(true);
    try {
      // Check authentication first
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        console.warn('User not authenticated, redirecting to auth');
        navigate('/auth');
        return;
      }

      const { data, error } = await dashboardService.getSelectedUniversities();

      if (error) {
        console.warn('Error fetching selected universities:', error);
        // Check if it's a table not found error (database not set up)
        if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
          console.warn('Database tables not yet set up');
          setSelectedUniversities([]);
          return;
        }
        
        toast({
          title: 'Error',
          description: 'Failed to load selected universities',
          variant: 'destructive',
        });
        return;
      }

      setSelectedUniversities(data || []);
    } catch (error) {
      console.warn('Error fetching selected universities:', error);
      // Graceful fallback - show empty state instead of error
      setSelectedUniversities([]);
      
      // Only show toast for unexpected errors
      if (error instanceof Error && !error.message.includes('relation')) {
        toast({
          title: 'Service Unavailable',
          description: 'Selected universities will load when the service is ready',
          variant: 'default',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUniversity = async (id: string) => {
    try {
      const { error } = await dashboardService.removeSelectedUniversity(id);

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to remove university',
          variant: 'destructive',
        });
        return;
      }

      setSelectedUniversities(prev => prev.filter(uni => uni.id !== id));

      toast({
        title: 'Success',
        description: 'University removed successfully',
      });
    } catch (error) {
      console.error('Error removing university:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove university',
        variant: 'destructive',
      });
    }
  };

  const handleProfessorStatusUpdate = (professorId: string, newStatus: string) => {
    setSelectedUniversities(prev => 
      prev.map(uni => ({
        ...uni,
        selected_professors: uni.selected_professors?.map(prof => 
          prof.id === professorId ? { ...prof, contact_status: newStatus } : prof
        )
      }))
    );
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  const renderUniversitiesTab = () => (
    <div className="space-y-6">
      {/* Add University Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">
          Your Selected Universities ({selectedUniversities.length})
        </h2>
        <AddUniversityModal onUniversityAdded={fetchSelectedUniversities} />
      </div>
      
      {selectedUniversities.length === 0 ? (
        <EmptyUniversitiesState />
      ) : (
        <div className="space-y-6">
          {selectedUniversities.map((university) => (
            <UniversityCard
              key={university.id}
              university={university}
              onRemove={handleRemoveUniversity}
              onProfessorStatusUpdate={handleProfessorStatusUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );

  const renderDocumentsTab = () => (
    <div className="space-y-6">
      <DocumentSection />
      <RecentDocuments />
      <UniversitySpecificDocuments selectedUniversities={selectedUniversities} />
    </div>
  );

  if (loading) {
    return (
      <>
        <AuthenticatedHeader />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
          <div className="container mx-auto py-12 px-4 max-w-6xl">
            <div className="mb-8">
              <Skeleton className="h-10 w-64 mb-4" />
              <Skeleton className="h-6 w-96" />
            </div>
            {[1, 2, 3].map(i => (
              <Card key={i} className="mb-6">
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
        </div>
      </>
    );
  }

  return (
    <>
      <SEOHead 
        title="My Applications"
        description="Track and manage your graduate school applications"
        keywords="application tracking, selected universities, application management, document drafts"
      />
      <AuthenticatedHeader />
      <ErrorBoundary>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
          <div className="container mx-auto py-12 px-4 max-w-6xl">
            <div className="mb-8">
              <Button
                variant="ghost"
                onClick={handleBack}
                className="mb-4 text-gradapp-primary hover:bg-gradapp-primary/10"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              
              <h1 className="text-4xl font-bold text-gradapp-primary mb-4">Application Management</h1>
              <p className="text-xl text-gray-600">Manage your selected universities and draft application documents</p>
            </div>

            <Tabs defaultValue="universities" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="universities" className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Selected Universities
                </TabsTrigger>
                <TabsTrigger value="documents" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Draft Documents
                </TabsTrigger>
              </TabsList>

              <ErrorBoundary>
                <TabsContent value="universities">
                  {renderUniversitiesTab()}
                </TabsContent>
              </ErrorBoundary>

              <ErrorBoundary>
                <TabsContent value="documents">
                  {renderDocumentsTab()}
                </TabsContent>
              </ErrorBoundary>
            </Tabs>
          </div>
        </div>
      </ErrorBoundary>
    </>
  );
};

export default SelectedUniversities;
