
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { dashboardService, SelectedUniversity, SelectedProfessor } from '@/services/dashboardService';
import AuthenticatedHeader from '@/components/AuthenticatedHeader';
import TextEditor from '@/components/document-creator/TextEditor';
import { 
  FileText, 
  Upload, 
  Bot, 
  Edit3, 
  ArrowLeft,
  Lightbulb,
  Download,
  Eye,
  CheckCircle,
  X,
  Sparkles
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import SEOHead from '@/components/SEOHead';

interface SelectedUniversityWithProfessors extends SelectedUniversity {
  selected_professors?: SelectedProfessor[];
}

const DocumentCreator: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const documentType = searchParams.get('type') as 'sop' | 'ps' || 'sop';
  const universityId = searchParams.get('university');
  const [university, setUniversity] = useState<SelectedUniversityWithProfessors | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'draft' | 'upload'>('draft');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancedContent, setEnhancedContent] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (universityId) {
      fetchUniversityDetails();
    }
  }, [universityId]);

  const fetchUniversityDetails = async () => {
    setLoading(true);
    try {
      const { data, error } = await dashboardService.getSelectedUniversities();
      if (data) {
        const foundUniversity = data.find(uni => uni.id === universityId) as SelectedUniversityWithProfessors;
        setUniversity(foundUniversity || null);
      }
    } catch (error) {
      console.error('Error fetching university details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/selected-universities');
  };

  const getDocumentTitle = () => {
    const typeTitle = documentType === 'sop' ? 'Statement of Purpose' : 'Personal Statement';
    return university ? `${typeTitle} for ${university.university_name}` : typeTitle;
  };

  const getDocumentDescription = () => {
    if (documentType === 'sop') {
      return university 
        ? `Create a tailored Statement of Purpose for your application to ${university.program_name} at ${university.university_name}`
        : 'Create your Statement of Purpose focusing on your academic and research goals';
    } 
      return university
        ? `Create a tailored Personal Statement for your application to ${university.program_name} at ${university.university_name}`
        : 'Create your Personal Statement highlighting your personal journey and motivations';
    
  };

  const handleEnhanceWithAI = async (content?: string) => {
    setIsEnhancing(true);
    try {
      // Simulate AI enhancement process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const enhancedText = content 
        ? `Enhanced version of your ${documentType.toUpperCase()}:\n\n${content}\n\n[AI has enhanced this content with improved structure, stronger academic language, and better alignment with ${university?.university_name || 'your target university'}'s requirements.]`
        : `AI-Generated ${documentType.toUpperCase()} for ${university?.university_name || 'your application'}:\n\nThis is a professionally crafted document that incorporates your background, research interests, and specific alignment with the program requirements. The content has been optimized for academic excellence and compelling narrative structure.`;
      
      setEnhancedContent(enhancedText);
      toast({
        title: 'AI Enhancement Complete',
        description: 'Your document has been enhanced with AI suggestions and improvements.',
      });
    } catch (error) {
      console.error('Enhancement error:', error);
      toast({
        title: 'Enhancement Failed',
        description: 'There was an error enhancing your document. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

    setIsUploading(true);
    
    try {
      // Simulate upload process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setUploadedFile(file);
      setActiveTab('upload');
      toast({
        title: 'File Uploaded Successfully',
        description: `${file.name} has been uploaded and is ready for processing.`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: 'There was an error uploading your file. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      // Reset the input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setEnhancedContent('');
    toast({
      title: 'File Removed',
      description: 'The uploaded file has been removed.',
    });
  };

  const handleDownloadEnhanced = () => {
    if (!enhancedContent) {return;}

    const element = document.createElement('a');
    const file = new Blob([enhancedContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `Enhanced_${documentType.toUpperCase()}_${university?.university_name || 'Document'}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    toast({
      title: 'Enhanced Document Downloaded',
      description: 'Your AI-enhanced document has been downloaded.',
    });
  };

  const handleEditEnhanced = () => {
    setActiveTab('draft');
    // Here you would pass the enhanced content to the text editor
    toast({
      title: 'Switched to Editor',
      description: 'Enhanced content is ready for editing in the draft section.',
    });
  };

  const handleSaveDocument = (documentData: { title: string; content: string }) => {
    console.log('Saving document:', documentData);
    // Here you would typically save to your backend/database
  };

  if (loading) {
    return (
      <>
        <AuthenticatedHeader />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
          <div className="container mx-auto py-12 px-4 max-w-6xl">
            <Skeleton className="h-10 w-64 mb-4" />
            <Skeleton className="h-6 w-96 mb-8" />
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEOHead 
        title="Document Creator"
        description="Create and edit application documents with intelligent assistance"
        keywords="document creator, sop writing, personal statement, ai writing assistant"
      />
      <AuthenticatedHeader />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="container mx-auto py-12 px-4 max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="mb-4 text-gradapp-primary hover:bg-gradapp-primary/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Application Management
            </Button>
            
            <h1 className="text-4xl font-bold text-gradapp-primary mb-4">
              {getDocumentTitle()}
            </h1>
            <p className="text-xl text-gray-600">
              {getDocumentDescription()}
            </p>
            
            {university && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-gradapp-primary text-white">University-Specific</Badge>
                </div>
                <p className="text-sm text-gray-700">
                  This document will be tailored specifically for <strong>{university.university_name}</strong> 
                  {university.selected_professors && university.selected_professors.length > 0 && (
                    <span> and your selected professors: {university.selected_professors.map(p => p.professor_name).join(', ')}</span>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'draft' | 'upload')}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="draft" className="flex items-center gap-2">
                <Edit3 className="h-4 w-4" />
                Draft Document
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload Document
              </TabsTrigger>
            </TabsList>

            <TabsContent value="draft">
              <div className="space-y-6">
                <TextEditor
                  documentType={documentType}
                  universityName={university?.university_name}
                  programName={university?.program_name || undefined}
                  onSave={handleSaveDocument}
                  enhancedContent={enhancedContent}
                />
                
                {/* AI Enhancement Section for Draft */}
                <Card className="border-2 border-purple-200 bg-purple-50/50">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <Sparkles className="h-6 w-6 text-purple-600" />
                      <div>
                        <CardTitle className="text-lg text-purple-700">
                          Enhance with AI
                        </CardTitle>
                        <CardDescription className="text-purple-600">
                          Let AI improve your draft with advanced language and structure
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-white p-4 rounded-lg mb-4">
                      <h4 className="font-medium text-purple-900 mb-2">AI will enhance:</h4>
                      <ul className="text-sm text-purple-700 space-y-1">
                        <li>• Academic language and tone</li>
                        <li>• Structure and flow</li>
                        {university && (
                          <>
                            <li>• Alignment with {university.university_name} requirements</li>
                            {university.selected_professors && university.selected_professors.length > 0 && (
                              <li>• Research fit with selected professors</li>
                            )}
                          </>
                        )}
                        <li>• Compelling narrative structure</li>
                      </ul>
                    </div>
                    <Button 
                      onClick={() => handleEnhanceWithAI()}
                      disabled={isEnhancing}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <Bot className="h-4 w-4 mr-2" />
                      {isEnhancing ? 'Enhancing with AI...' : 'Enhance with AI'}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="upload">
              {uploadedFile ? (
                <div className="space-y-6">
                  <Card className="border-green-200 bg-green-50">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-6 w-6 text-green-600" />
                          <div>
                            <CardTitle className="text-lg text-green-800">File Uploaded Successfully</CardTitle>
                            <CardDescription className="text-green-700">
                              {uploadedFile.name} ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
                            </CardDescription>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveFile}
                          className="text-gray-500 hover:text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>

                  {/* AI Enhancement Section for Upload */}
                  <Card className="border-2 border-purple-200 bg-purple-50/50">
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-3">
                        <Sparkles className="h-6 w-6 text-purple-600" />
                        <div>
                          <CardTitle className="text-lg text-purple-700">
                            Enhance Uploaded Document with AI
                          </CardTitle>
                          <CardDescription className="text-purple-600">
                            Improve your uploaded document with AI enhancement
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-white p-4 rounded-lg">
                        <h4 className="font-medium text-purple-900 mb-2">AI Enhancement Features:</h4>
                        <ul className="text-sm text-purple-700 space-y-1">
                          <li>• Content analysis and improvement</li>
                          <li>• Academic language enhancement</li>
                          <li>• Structure optimization</li>
                          {university && (
                            <li>• University-specific customization for {university.university_name}</li>
                          )}
                        </ul>
                      </div>
                      
                      <Button 
                        onClick={() => handleEnhanceWithAI('Sample content from uploaded file')}
                        disabled={isEnhancing}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        <Bot className="h-4 w-4 mr-2" />
                        {isEnhancing ? 'Enhancing Document...' : 'Enhance with AI'}
                      </Button>

                      {enhancedContent && (
                        <div className="bg-white p-4 rounded-lg border-2 border-green-200">
                          <h4 className="font-medium text-green-800 mb-2">✓ Enhancement Complete</h4>
                          <p className="text-sm text-gray-600 mb-4">Your document has been enhanced with AI.</p>
                          <div className="flex gap-3">
                            <Button 
                              onClick={handleDownloadEnhanced}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download Enhanced
                            </Button>
                            <Button 
                              onClick={handleEditEnhanced}
                              variant="outline"
                              className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                            >
                              <Edit3 className="h-4 w-4 mr-2" />
                              Edit in Draft
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Upload className="h-6 w-6 text-gradapp-primary" />
                      <CardTitle className="text-lg">Upload Your Document</CardTitle>
                    </div>
                    <CardDescription>
                      Upload an existing document (PDF, DOC, DOCX, RTF) to enhance with AI
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gradapp-primary transition-colors">
                      <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-lg font-medium text-gray-600 mb-2">
                        Drag and drop your file here, or click to browse
                      </p>
                      <p className="text-sm text-gray-500 mb-4">
                        Supports PDF, DOC, DOCX, RTF files up to 10MB
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.rtf"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                        disabled={isUploading}
                      />
                      <Button 
                        onClick={handleUploadClick}
                        className="bg-gradapp-primary hover:bg-gradapp-accent text-white"
                        disabled={isUploading}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {isUploading ? 'Uploading...' : 'Choose File'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          {/* Additional Resources */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-6 w-6 text-gradapp-primary" />
                  <CardTitle className="text-lg">Writing Tips & Templates</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Get guidance on writing effective {documentType.toUpperCase()}s
                </p>
                <Button 
                  onClick={() => navigate(`/document-templates?type=${documentType}`)}
                  variant="outline" 
                  className="w-full border-gradapp-primary text-gradapp-primary hover:bg-gradapp-primary hover:text-white"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Resources
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Download className="h-6 w-6 text-gradapp-primary" />
                  <CardTitle className="text-lg">Sample Documents</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Download successful {documentType.toUpperCase()} examples for reference
                </p>
                <Button 
                  variant="outline" 
                  className="w-full border-gradapp-primary text-gradapp-primary hover:bg-gradapp-primary hover:text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Samples
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default DocumentCreator;
