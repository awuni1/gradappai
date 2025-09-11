
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Bot } from 'lucide-react';

interface SelectedUniversity {
  id?: string;
  university_name: string;
  program_name?: string | null;
}

interface UniversitySpecificDocumentsProps {
  selectedUniversities: SelectedUniversity[];
}

const UniversitySpecificDocuments: React.FC<UniversitySpecificDocumentsProps> = ({ 
  selectedUniversities 
}) => {
  const navigate = useNavigate();

  if (selectedUniversities.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>University-Specific Documents</CardTitle>
        <CardDescription>Tailor your documents for specific universities</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {selectedUniversities.slice(0, 3).map((university) => (
            <div key={university.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-medium text-gray-900">{university.university_name}</h4>
                  <p className="text-sm text-gray-600">{university.program_name}</p>
                </div>
                <Badge variant="outline" className="border-gradapp-primary text-gradapp-primary">
                  No drafts
                </Badge>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button 
                  size="sm" 
                  onClick={() => navigate(`/document-creator?type=sop&university=${university.id}`)}
                  className="bg-gradapp-primary hover:bg-gradapp-accent text-white"
                >
                  Create SOP
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => navigate(`/document-creator?type=ps&university=${university.id}`)}
                  className="bg-gradapp-primary hover:bg-gradapp-accent text-white"
                >
                  Create PS
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => navigate(`/ai-document-creator?type=sop&university=${university.id}`)}
                  className="border-purple-500 text-purple-600 hover:bg-purple-500 hover:text-white"
                >
                  <Bot className="h-3 w-3 mr-1" />
                  AI SOP
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => navigate(`/ai-document-creator?type=ps&university=${university.id}`)}
                  className="border-purple-500 text-purple-600 hover:bg-purple-500 hover:text-white"
                >
                  <Bot className="h-3 w-3 mr-1" />
                  AI PS
                </Button>
              </div>
            </div>
          ))}
          {selectedUniversities.length > 3 && (
            <p className="text-sm text-gray-500 text-center">
              And {selectedUniversities.length - 3} more universities...
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UniversitySpecificDocuments;
