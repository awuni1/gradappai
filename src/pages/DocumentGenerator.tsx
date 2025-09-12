import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Wand2, 
  Download, 
  Edit, 
  Copy, 
  Share2, 
  Save,
  Loader2,
  FileText as Template,
  Sparkles,
  BookOpen,
  GraduationCap,
  Target,
  PenTool,
  Clock,
  CheckCircle
} from 'lucide-react';
// import { vertexAIService } from '@/services/vertexAiService';
import { cvAnalysisService } from '@/services/cvAnalysisService';
import { documentService } from '@/services/documentService';
import { supabase } from '@/integrations/supabase/client';
import AuthenticatedHeader from '@/components/AuthenticatedHeader';
import SEOHead from '@/components/SEOHead';
import { useToast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';

interface DocumentTemplate {
  id: string;
  name: string;
  type: 'sop' | 'cover_letter' | 'personal_statement' | 'research_proposal';
  description: string;
  variables: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
}

interface GeneratedDocument {
  id: string;
  title: string;
  content: string;
  document_type: string;
  created_at: string;
  word_count?: number;
  is_ai_generated?: boolean;
  metadata: {
    word_count?: number;
    generated_by_ai?: boolean;
    [key: string]: any;
  };
}

export default function DocumentGenerator() {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('generator');
  const [generating, setGenerating] = useState(false);
  const [selectedType, setSelectedType] = useState<'sop' | 'cover_letter' | 'personal_statement' | 'research_proposal'>('sop');
  const [documentTitle, setDocumentTitle] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [cvAnalysis, setCvAnalysis] = useState<any>(null);
  const [copying, setCopying] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);

  // Get user authentication state
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    
    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);
  const [userDocuments, setUserDocuments] = useState<GeneratedDocument[]>([]);
  const [loading, setLoading] = useState(true);

  // AI Generation form data
  const [generationData, setGenerationData] = useState({
    universityName: '',
    programName: '',
    targetDegree: 'Masters',
    fieldOfStudy: '',
    researchInterests: '',
    careerGoals: '',
    whyUniversity: '',
    specificRequirements: ''
  });

  // Templates data
  const templates: DocumentTemplate[] = [
    {
      id: '1',
      name: 'Graduate School Statement of Purpose',
      type: 'sop',
      description: 'Comprehensive SOP template for graduate school applications',
      variables: ['University Name', 'Program Name', 'Research Interests', 'Career Goals'],
      difficulty: 'intermediate',
      estimatedTime: 45
    },
    {
      id: '2',
      name: 'Research Proposal',
      type: 'research_proposal',
      description: 'Structured research proposal for PhD applications',
      variables: ['Research Topic', 'Methodology', 'Expected Outcomes'],
      difficulty: 'advanced',
      estimatedTime: 120
    },
    {
      id: '3',
      name: 'Cover Letter',
      type: 'cover_letter',
      description: 'Professional cover letter for academic positions',
      variables: ['Position Title', 'Institution', 'Key Qualifications'],
      difficulty: 'beginner',
      estimatedTime: 30
    },
    {
      id: '4',
      name: 'Personal Statement',
      type: 'personal_statement',
      description: 'Personal narrative highlighting your journey and motivations',
      variables: ['Personal Background', 'Challenges Overcome', 'Future Aspirations'],
      difficulty: 'intermediate',
      estimatedTime: 60
    }
  ];

  useEffect(() => {
    if (user) {
      initializeData();
    }
  }, [user]);

  const initializeData = async () => {
    try {
      setLoading(true);
      
      // Load CV analysis for context
      const cvData = await cvAnalysisService.getStoredAnalysis(user!.id);
      setCvAnalysis(cvData);

      // Load user's existing documents using document service
      const documents = await documentService.getUserDocuments(user!.id);
      setUserDocuments(documents);

      // Pre-fill form with CV data if available
      if (cvData?.extracted_data) {
        setGenerationData(prev => ({
          ...prev,
          fieldOfStudy: cvData.extracted_data.education?.[0]?.field || '',
          researchInterests: cvData.extracted_data.researchAreas?.join(', ') || ''
        }));
      }

      console.log(`✅ Loaded ${documents.length} documents for user`);

    } catch (error) {
      console.error('Error initializing data:', error);
      toast({
        title: 'Loading error',
        description: 'Some data could not be loaded. You can still generate new documents.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const generateWithAI = async () => {
    if (!user) {return;}

    // Validate required fields
    const requiredFields = {
      'University Name': generationData.universityName,
      'Program Name': generationData.programName,
      'Field of Study': generationData.fieldOfStudy,
      'Research Interests': generationData.researchInterests,
      'Career Goals': generationData.careerGoals,
      'Why This University/Program': generationData.whyUniversity
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value?.trim())
      .map(([field, _]) => field);

    if (missingFields.length > 0) {
      toast({
        title: 'Missing Required Fields',
        description: `Please fill in the following required fields: ${missingFields.join(', ')}`,
        variant: 'destructive'
      });
      return;
    }

    try {
      setGenerating(true);
      setGeneratedContent('');

      // Create context for AI generation
      const context = {
        universityName: generationData.universityName,
        programName: generationData.programName,
        userProfile: {
          targetDegree: generationData.targetDegree,
          fieldOfStudy: generationData.fieldOfStudy,
          researchInterests: generationData.researchInterests.split(',').map(s => s.trim()),
          careerGoals: generationData.careerGoals
        },
        cvAnalysis: cvAnalysis?.extracted_data,
        specificRequirements: generationData.specificRequirements
      };

      // Generate content using Azure OpenAI
      console.log('🚀 Starting AI document generation...');
      const aiResponse = await generateDocumentContent(selectedType, context);
      setGeneratedContent(aiResponse.content);
      
      // Auto-generate title
      const title = generateDocumentTitle(selectedType, context);
      setDocumentTitle(title);

    } catch (error) {
      console.error('❌ Error generating document:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setGeneratedContent(`❌ Document Generation Failed\n\nError: ${errorMessage}\n\nPlease ensure your Azure OpenAI configuration is correct and try again.\n\nIf the problem persists, you can manually write your document using the text editor below.`);
    } finally {
      setGenerating(false);
    }
  };

  const generateDocumentContent = async (type: string, context: any) => {
    try {
      // Use Azure OpenAI for document generation
      const apiKey = import.meta.env.VITE_AZURE_OPENAI_API_KEY;
      const endpoint = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT;

      if (!apiKey || !endpoint) {
        throw new Error('AI configuration missing. Please check your environment variables.');
      }

      const prompt = createAIPrompt(type, context);
      console.log('🤖 Generating document with AI...');

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: [{ type: 'text', text: prompt }]
            }
          ],
          temperature: 0.3,
          top_p: 0.8,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        throw new Error(`Azure OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const generatedText = data.choices?.[0]?.message?.content;

      if (!generatedText) {
        throw new Error('No content generated from AI service');
      }

      console.log('✅ Document generated successfully');
      
      return {
        content: generatedText,
        metadata: {
          model_version: 'gpt-4o-mini',
          generated_at: new Date().toISOString(),
          word_count: generatedText.split(' ').length
        }
      };
    } catch (error) {
      console.error('Error generating content:', error);
      return {
        content: 'Document content could not be generated at this time. Please try again later.',
        metadata: { error: true }
      };
    }
  };

  const createAIPrompt = (type: string, context: any): string => {
    const basePrompt = `You are an expert academic writing assistant specializing in graduate school applications. Generate a professional, compelling, and personalized ${type.replace('_', ' ')} that will help the applicant stand out to admissions committees.`;
    
    switch (type) {
      case 'sop':
        return `${basePrompt}

Create a Statement of Purpose for:
- University: ${context.universityName || 'Target University'}
- Program: ${context.programName || 'Graduate Program'}
- Target Degree: ${context.userProfile?.targetDegree || 'Masters'}
- Field of Study: ${context.userProfile?.fieldOfStudy || 'Not specified'}
- Research Interests: ${context.userProfile?.researchInterests?.join(', ') || 'Not specified'}
- Career Goals: ${context.userProfile?.careerGoals || 'Not specified'}
- Why This University: ${context.whyUniversity || 'Strong program reputation and research opportunities'}
- Specific Requirements: ${context.specificRequirements || 'None specified'}

The Statement of Purpose should be 800-1000 words and include:

1. **Compelling Opening**: Start with a hook that captures attention and introduces your passion for the field
2. **Academic Foundation**: Highlight relevant educational background, key achievements, and formative experiences
3. **Research Experience**: Detail any research projects, publications, or relevant work experience
4. **Program Fit**: Explain specifically why this university and program align with your goals
5. **Research Alignment**: Show how your interests match with faculty research and program strengths
6. **Future Vision**: Articulate clear post-graduation career goals and how this program enables them
7. **Unique Value**: Explain what distinctive perspective or skills you bring to the program
8. **Strong Conclusion**: End with confidence and enthusiasm about joining the program

Write in first person, use specific examples, avoid clichés, and maintain an engaging yet scholarly tone. Show don't tell - use concrete achievements and experiences to demonstrate your qualities.`;
      
      case 'cover_letter':
        return `${basePrompt}

Create a compelling cover letter for:
- Program: ${context.programName || 'Graduate Program'}
- Institution: ${context.universityName || 'Target Institution'}
- Field: ${context.userProfile?.fieldOfStudy || 'Not specified'}
- Research Interests: ${context.userProfile?.researchInterests?.join(', ') || 'Not specified'}

The cover letter should be 350-450 words and include:

1. **Professional Opening**: Clear statement of application intent and enthusiasm
2. **Qualification Summary**: Key strengths, relevant experience, and achievements
3. **Program Connection**: Specific reasons for choosing this program and institution
4. **Value Proposition**: What unique contributions you will make to the program
5. **Professional Closing**: Request for consideration and invitation for further discussion

Maintain a professional, confident tone while showing genuine enthusiasm. Be specific about your qualifications and program fit.`;
      
      case 'personal_statement':
        return `${basePrompt}

Create a personal statement that focuses on:
- Academic Journey: Path to ${context.userProfile?.fieldOfStudy || 'this field'}
- Personal Motivation: What drives your passion for this area of study
- Formative Experiences: Key moments that shaped your academic and personal development
- Research Interests: ${context.userProfile?.researchInterests?.join(', ') || 'Your research interests'}
- Career Aspirations: ${context.userProfile?.careerGoals || 'Your future goals'}

The personal statement should be 600-800 words and include:

1. **Personal Journey**: Tell your unique story of how you discovered your passion
2. **Formative Experiences**: Specific moments, challenges, or opportunities that shaped you
3. **Growth and Learning**: How you've evolved academically and personally
4. **Unique Perspective**: What distinctive viewpoint or background you bring
5. **Connection to Goals**: How your experiences inform your academic and career objectives
6. **Authentic Voice**: Show your personality while maintaining academic appropriateness

Write in a reflective, personal tone with specific anecdotes and examples. Be authentic and show vulnerability while demonstrating strength and growth.`;
      
      case 'research_proposal':
        return `${basePrompt}

Develop a research proposal for:
- Research Area: ${context.userProfile?.researchInterests?.join(', ') || 'Not specified'}
- Field: ${context.userProfile?.fieldOfStudy || 'Not specified'}
- Target University: ${context.universityName || 'Target Institution'}
- Program: ${context.programName || 'Graduate Program'}

Create a comprehensive research proposal (1200-1500 words) with the following structure:

1. **Title**: Clear, specific, and engaging research question
2. **Abstract** (150 words): Concise summary of the research problem, approach, and significance
3. **Introduction & Background**: Context and importance of the research area
4. **Problem Statement**: Specific research gap or question to be addressed
5. **Literature Review**: Current state of knowledge and identification of gaps
6. **Research Questions/Hypotheses**: Clear, testable questions or predictions
7. **Methodology**: Detailed research design, methods, and analytical approach
8. **Expected Outcomes**: Anticipated findings and their significance
9. **Timeline**: Realistic project phases and milestones over 2-3 years
10. **Resources & Budget**: Required facilities, equipment, and support
11. **Broader Impact**: How this research contributes to the field and society

Demonstrate deep understanding of the field, methodological rigor, and feasibility. Show how this research fits with the target program's strengths.`;
      
      default:
        return basePrompt + '\n\nPlease specify the type of document you would like to generate.';
    }
  };

  const generateDocumentTitle = (type: string, context: any): string => {
    const university = context.universityName || 'Graduate Program';
    
    switch (type) {
      case 'sop':
        return `Statement of Purpose - ${university}`;
      case 'cover_letter':
        return `Cover Letter - ${university}`;
      case 'personal_statement':
        return `Personal Statement - ${university}`;
      case 'research_proposal':
        return `Research Proposal - ${context.userProfile?.researchInterests?.[0] || 'Research Topic'}`;
      default:
        return `Document - ${university}`;
    }
  };

  const saveDocument = async () => {
    if (!user || !generatedContent || !documentTitle) {
      toast({
        title: 'Cannot save document',
        description: 'Please ensure you have generated content and provided a title',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSaving(true);
      
      const savedDocument = await documentService.saveDocument(user, {
        document_type: selectedType,
        title: documentTitle,
        content: generatedContent,
        metadata: {
          ai_model_version: 'gpt-4o-mini',
          generation_context: generationData,
          template_used: selectedType,
          university_context: generationData.universityName,
          program_context: generationData.programName
        }
      });

      if (savedDocument) {
        // Add to local state
        setUserDocuments(prev => [savedDocument, ...prev]);
        
        toast({
          title: 'Document saved successfully! 📄',
          description: `"${documentTitle}" is now saved in your documents`,
        });
        
        // Reset form and switch to documents tab
        setGeneratedContent('');
        setDocumentTitle('');
        setActiveTab('documents');
      }

    } catch (error) {
      console.error('❌ Error saving document:', error);
      
      let errorMessage = 'Unable to save the document. Please try again.';
      
      if (error.message.includes('table')) {
        errorMessage = 'Database setup required. The document storage system needs to be initialized.';
      } else if (error.message.includes('permission')) {
        errorMessage = 'Permission denied. Please try logging out and back in.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Save failed',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = async (content: string) => {
    try {
      setCopying(true);
      await navigator.clipboard.writeText(content);
      
      toast({
        title: 'Copied to clipboard',
        description: 'Document content has been copied successfully',
      });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = content;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      toast({
        title: 'Copied to clipboard',
        description: 'Document content has been copied successfully',
      });
    } finally {
      setCopying(false);
    }
  };

  const downloadDocument = async (content: string, title: string, format: 'txt' | 'md' = 'txt') => {
    try {
      setDownloading(true);
      
      const fileName = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${format}`;
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Document downloaded',
        description: `${fileName} has been downloaded successfully`,
      });
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: 'Download failed',
        description: 'Unable to download the document. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setDownloading(false);
    }
  };

  const shareDocument = async (content: string, title: string) => {
    try {
      setSharing(true);
      
      if (navigator.share) {
        // Use native sharing API if available
        await navigator.share({
          title: title,
          text: `Check out my ${selectedType.replace('_', ' ')}: ${title}`,
          url: window.location.href
        });
      } else {
        // Fallback: copy sharing link to clipboard
        const shareText = `${title}\n\n${content}\n\n---\nGenerated with GradApp Document Generator`;
        await copyToClipboard(shareText);
        
        toast({
          title: 'Ready to share',
          description: 'Document content copied to clipboard for sharing',
        });
      }
    } catch (error) {
      console.error('Error sharing document:', error);
      // Fallback: just copy the content
      await copyToClipboard(content);
      
      toast({
        title: 'Ready to share',
        description: 'Document content copied to clipboard for sharing',
      });
    } finally {
      setSharing(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sop': return <GraduationCap className="h-4 w-4" />;
      case 'cover_letter': return <PenTool className="h-4 w-4" />;
      case 'personal_statement': return <BookOpen className="h-4 w-4" />;
      case 'research_proposal': return <Target className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AuthenticatedHeader />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead 
        title="Document Generator - GradApp"
        description="Generate professional academic documents with AI assistance"
      />
      <AuthenticatedHeader />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Document Generator</h1>
          <p className="text-muted-foreground">
            Create professional academic documents with AI assistance and templates
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="generator">
              <Wand2 className="h-4 w-4 mr-2" />
              AI Generator
            </TabsTrigger>
            <TabsTrigger value="templates">
              <Template className="h-4 w-4 mr-2" />
              Templates ({templates.length})
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FileText className="h-4 w-4 mr-2" />
              My Documents ({userDocuments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generator" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Generation Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                    AI Document Generator
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label>Document Type</Label>
                    <Select value={selectedType} onValueChange={(value: any) => setSelectedType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sop">Statement of Purpose</SelectItem>
                        <SelectItem value="cover_letter">Cover Letter</SelectItem>
                        <SelectItem value="personal_statement">Personal Statement</SelectItem>
                        <SelectItem value="research_proposal">Research Proposal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>University Name *</Label>
                      <Input 
                        value={generationData.universityName}
                        onChange={(e) => setGenerationData(prev => ({...prev, universityName: e.target.value}))}
                        placeholder="e.g., Stanford University"
                        required
                      />
                    </div>
                    <div>
                      <Label>Program Name *</Label>
                      <Input 
                        value={generationData.programName}
                        onChange={(e) => setGenerationData(prev => ({...prev, programName: e.target.value}))}
                        placeholder="e.g., MS Computer Science"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Target Degree</Label>
                      <Select 
                        value={generationData.targetDegree} 
                        onValueChange={(value) => setGenerationData(prev => ({...prev, targetDegree: value}))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Masters">Masters</SelectItem>
                          <SelectItem value="PhD">PhD</SelectItem>
                          <SelectItem value="Professional">Professional</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Field of Study *</Label>
                      <Input 
                        value={generationData.fieldOfStudy}
                        onChange={(e) => setGenerationData(prev => ({...prev, fieldOfStudy: e.target.value}))}
                        placeholder="e.g., Computer Science"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Research Interests *</Label>
                    <Textarea 
                      value={generationData.researchInterests}
                      onChange={(e) => setGenerationData(prev => ({...prev, researchInterests: e.target.value}))}
                      placeholder="Describe your research interests and areas of focus..."
                      rows={3}
                      required
                    />
                  </div>

                  <div>
                    <Label>Career Goals *</Label>
                    <Textarea 
                      value={generationData.careerGoals}
                      onChange={(e) => setGenerationData(prev => ({...prev, careerGoals: e.target.value}))}
                      placeholder="Describe your long-term career objectives..."
                      rows={3}
                      required
                    />
                  </div>

                  <div>
                    <Label>Why This University/Program *</Label>
                    <Textarea 
                      value={generationData.whyUniversity}
                      onChange={(e) => setGenerationData(prev => ({...prev, whyUniversity: e.target.value}))}
                      placeholder="Explain your interest in this specific program..."
                      rows={3}
                      required
                    />
                  </div>

                  <div>
                    <Label>Specific Requirements (Optional)</Label>
                    <Textarea 
                      value={generationData.specificRequirements}
                      onChange={(e) => setGenerationData(prev => ({...prev, specificRequirements: e.target.value}))}
                      placeholder="Any specific requirements or guidelines from the program..."
                      rows={2}
                    />
                  </div>

                  <Button 
                    onClick={generateWithAI}
                    disabled={generating || !generationData.universityName.trim() || !generationData.programName.trim() || !generationData.fieldOfStudy.trim() || !generationData.researchInterests.trim() || !generationData.careerGoals.trim() || !generationData.whyUniversity.trim()}
                    className="w-full"
                    size="lg"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating with AI...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4 mr-2" />
                        Generate Document
                      </>
                    )}
                  </Button>

                  {cvAnalysis && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Using your CV analysis data to personalize the document generation.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Generated Content */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Generated Content</CardTitle>
                    {generatedContent && (
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => copyToClipboard(generatedContent)}
                          disabled={copying}
                        >
                          {copying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => downloadDocument(generatedContent, documentTitle || 'document')}
                          disabled={downloading}
                        >
                          {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => shareDocument(generatedContent, documentTitle || 'document')}
                          disabled={sharing}
                        >
                          {sharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {generatedContent ? (
                    <div className="space-y-4">
                      <div>
                        <Label>Document Title</Label>
                        <Input 
                          value={documentTitle}
                          onChange={(e) => setDocumentTitle(e.target.value)}
                          placeholder="Enter document title..."
                        />
                      </div>
                      
                      <div>
                        <Label>Content ({generatedContent.split(' ').length} words)</Label>
                        <Textarea 
                          value={generatedContent}
                          onChange={(e) => setGeneratedContent(e.target.value)}
                          rows={20}
                          className="font-mono text-sm"
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          onClick={saveDocument}
                          disabled={saving || !documentTitle.trim()}
                          className="flex-1"
                        >
                          {saving ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Save Document
                            </>
                          )}
                        </Button>
                        <Button variant="outline">
                          <Edit className="h-4 w-4 mr-2" />
                          Continue Editing
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <FileText className="h-16 w-16 mx-auto mb-4 opacity-30" />
                      <h3 className="text-lg font-medium mb-2">No Document Generated Yet</h3>
                      <p className="text-sm mb-4">Fill out the form above and click "Generate Document" to create your personalized academic document using AI.</p>
                      <div className="text-xs text-gray-400">
                        🤖 Powered by AI
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <Card key={template.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(template.type)}
                        <h3 className="font-semibold">{template.name}</h3>
                      </div>
                      <Badge className={getDifficultyColor(template.difficulty)}>
                        {template.difficulty}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground mb-4">
                      {template.description}
                    </p>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{template.estimatedTime} minutes</span>
                      </div>
                      
                      <div>
                        <span className="text-sm font-medium">Variables:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {template.variables.slice(0, 3).map((variable, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {variable}
                            </Badge>
                          ))}
                          {template.variables.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{template.variables.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <Button className="w-full" variant="outline">
                      Use Template
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            {userDocuments.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Documents Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Generate your first document using our AI generator or templates
                  </p>
                  <Button onClick={() => setActiveTab('generator')}>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Start Generating
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {userDocuments.map((doc) => (
                  <Card key={doc.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {getTypeIcon(doc.document_type)}
                            <h3 className="font-semibold text-lg">{doc.title}</h3>
                            {(doc.is_ai_generated || doc.metadata?.generated_by_ai) && (
                              <Badge className="bg-purple-100 text-purple-800">
                                <Sparkles className="h-3 w-3 mr-1" />
                                AI Generated
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{doc.word_count || doc.metadata?.word_count || 'Unknown'} words</span>
                            <span>Created {new Date(doc.created_at).toLocaleDateString()}</span>
                            <Badge variant="outline">{doc.document_type.replace('_', ' ')}</Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setGeneratedContent(doc.content);
                              setDocumentTitle(doc.title);
                              setSelectedType(doc.document_type as any);
                              setActiveTab('generator');
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => downloadDocument(doc.content, doc.title)}
                            disabled={downloading}
                          >
                            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => shareDocument(doc.content, doc.title)}
                            disabled={sharing}
                          >
                            {sharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => copyToClipboard(doc.content)}
                            disabled={copying}
                          >
                            {copying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}