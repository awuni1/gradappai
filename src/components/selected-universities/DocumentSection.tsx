
import React, { useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { 
  FileText,
  Edit3,
  Bot,
  Eye,
  Upload
} from 'lucide-react';

const DocumentSection: React.FC = () => {
  const navigate = useNavigate();
  const sopFileInputRef = useRef<HTMLInputElement>(null);
  const psFileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, documentType: 'sop' | 'ps') => {
    const file = event.target.files?.[0];
    if (!file) {return;}

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/rtf'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a PDF, DOC, DOCX, or RTF file.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: 'File Too Large',
        description: 'Please upload a file smaller than 10MB.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Simulate upload process
      toast({
        title: 'Uploading Document',
        description: `Uploading your ${documentType.toUpperCase()}...`,
      });

      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: 'Upload Successful',
        description: `${file.name} has been uploaded successfully.`,
      });

      // Navigate to document creator with the uploaded file
      navigate(`/document-creator?type=${documentType}&uploaded=true`);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: 'There was an error uploading your file. Please try again.',
        variant: 'destructive',
      });
    } finally {
      // Reset the input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleSOPUpload = () => {
    sopFileInputRef.current?.click();
  };

  const handlePSUpload = () => {
    psFileInputRef.current?.click();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Statement of Purpose */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-gradapp-primary" />
            <div>
              <CardTitle className="text-xl">Statement of Purpose (SOP)</CardTitle>
              <CardDescription>
                Academic and research-focused statement for graduate applications
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Draft Status</h4>
            <p className="text-sm text-gray-600">No drafts created yet</p>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <Button 
              onClick={() => navigate('/document-creator?type=sop')}
              className="bg-gradapp-primary hover:bg-gradapp-accent"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Create New SOP
            </Button>
            <Button 
              onClick={() => navigate('/ai-document-creator?type=sop')}
              variant="outline" 
              className="border-purple-500 text-purple-600 hover:bg-purple-500 hover:text-white"
            >
              <Bot className="h-4 w-4 mr-2" />
              AI-Powered SOP
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={() => navigate('/document-templates?type=sop')}
                variant="outline" 
                className="border-gradapp-primary text-gradapp-primary hover:bg-gradapp-primary hover:text-white"
              >
                <Eye className="h-4 w-4 mr-2" />
                Templates
              </Button>
              <Button 
                onClick={handleSOPUpload}
                variant="outline" 
                className="border-gradapp-primary text-gradapp-primary hover:bg-gradapp-primary hover:text-white"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </div>
          </div>
          <input
            ref={sopFileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.rtf"
            onChange={(e) => handleFileUpload(e, 'sop')}
            style={{ display: 'none' }}
          />
        </CardContent>
      </Card>

      {/* Personal Statement */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-gradapp-primary" />
            <div>
              <CardTitle className="text-xl">Personal Statement (PS)</CardTitle>
              <CardDescription>
                Personal narrative highlighting your journey and motivations
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Draft Status</h4>
            <p className="text-sm text-gray-600">No drafts created yet</p>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <Button 
              onClick={() => navigate('/document-creator?type=ps')}
              className="bg-gradapp-primary hover:bg-gradapp-accent"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Create New PS
            </Button>
            <Button 
              onClick={() => navigate('/ai-document-creator?type=ps')}
              variant="outline" 
              className="border-purple-500 text-purple-600 hover:bg-purple-500 hover:text-white"
            >
              <Bot className="h-4 w-4 mr-2" />
              AI-Powered PS
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={() => navigate('/document-templates?type=ps')}
                variant="outline" 
                className="border-gradapp-primary text-gradapp-primary hover:bg-gradapp-primary hover:text-white"
              >
                <Eye className="h-4 w-4 mr-2" />
                Templates
              </Button>
              <Button 
                onClick={handlePSUpload}
                variant="outline" 
                className="border-gradapp-primary text-gradapp-primary hover:bg-gradapp-primary hover:text-white"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </div>
          </div>
          <input
            ref={psFileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.rtf"
            onChange={(e) => handleFileUpload(e, 'ps')}
            style={{ display: 'none' }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentSection;
