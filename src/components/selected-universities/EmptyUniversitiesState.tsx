
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Plus } from 'lucide-react';

const EmptyUniversitiesState: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Card className="text-center py-12">
      <CardContent>
        <GraduationCap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Universities Selected</h3>
        <p className="text-gray-600 mb-6">
          Start by exploring matched universities and adding them to your selection
        </p>
        <Button 
          onClick={() => navigate('/matched-universities')}
          className="bg-gradapp-primary hover:bg-gradapp-accent"
        >
          <Plus className="h-4 w-4 mr-2" />
          Explore Universities
        </Button>
      </CardContent>
    </Card>
  );
};

export default EmptyUniversitiesState;
