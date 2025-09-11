
import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AuthenticatedHeader from '@/components/AuthenticatedHeader';
import { 
  ArrowLeft,
  FileText,
  Download,
  Eye,
  Lightbulb,
  CheckCircle,
  Star
} from 'lucide-react';
import SEOHead from '@/components/SEOHead';

const DocumentTemplates: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const documentType = searchParams.get('type') as 'sop' | 'ps' || 'sop';

  const sopTemplates = [
    {
      id: 1,
      title: 'Computer Science Research Focus',
      description: 'Template for CS students focusing on research and PhD applications',
      difficulty: 'Advanced',
      rating: 4.9,
      sections: ['Introduction', 'Research Experience', 'Academic Goals', 'Why This Program', 'Conclusion']
    },
    {
      id: 2,
      title: 'Professional to Graduate School',
      description: 'For working professionals transitioning to graduate studies',
      difficulty: 'Intermediate',
      rating: 4.7,
      sections: ['Career Background', 'Motivation for Graduate Study', 'Academic Preparation', 'Goals']
    },
    {
      id: 3,
      title: 'International Student Template',
      description: 'Tailored for international applicants highlighting cultural perspective',
      difficulty: 'Intermediate',
      rating: 4.8,
      sections: ['Background', 'Cultural Perspective', 'Academic Journey', 'Future Goals']
    }
  ];

  const psTemplates = [
    {
      id: 1,
      title: 'Personal Growth Journey',
      description: 'Focus on personal development and life experiences',
      difficulty: 'Beginner',
      rating: 4.6,
      sections: ['Early Influences', 'Challenges Overcome', 'Values & Motivation', 'Future Vision']
    },
    {
      id: 2,
      title: 'Diversity & Inclusion Focus',
      description: 'Highlighting unique background and perspective',
      difficulty: 'Intermediate',
      rating: 4.8,
      sections: ['Background', 'Unique Perspective', 'Contributions', 'Community Impact']
    },
    {
      id: 3,
      title: 'Career Change Narrative',
      description: 'For students changing fields or career direction',
      difficulty: 'Advanced',
      rating: 4.7,
      sections: ['Previous Experience', 'Transition Moment', 'New Direction', 'Goals']
    }
  ];

  const templates = documentType === 'sop' ? sopTemplates : psTemplates;
  const documentTitle = documentType === 'sop' ? 'Statement of Purpose' : 'Personal Statement';

  const writingTips = documentType === 'sop' ? [
    'Start with a compelling hook that shows your passion for the field',
    'Clearly state your research interests and academic goals',
    'Demonstrate fit with the specific program and faculty',
    'Highlight relevant research experience and publications',
    'Show progression in your academic journey',
    'End with clear future goals and how the program will help achieve them'
  ] : [
    'Begin with a meaningful personal story or moment',
    'Show your unique perspective and background',
    'Demonstrate personal growth and self-reflection',
    'Connect personal experiences to academic/career goals',
    'Highlight values that drive your decisions',
    'Show how you will contribute to the program community'
  ];

  return (
    <>
      <SEOHead 
        title="Document Templates"
        description="Access templates for personal statements, CVs, and recommendation letters"
        keywords="document templates, writing guides, sop templates, personal statement templates"
      />
      <AuthenticatedHeader />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="container mx-auto py-12 px-4 max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="mb-4 text-gradapp-primary hover:bg-gradapp-primary/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            <h1 className="text-4xl font-bold text-gradapp-primary mb-4">
              {documentTitle} Templates & Guide
            </h1>
            <p className="text-xl text-gray-600">
              Learn how to write an effective {documentTitle.toLowerCase()} with our templates and guidelines
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Templates Section */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Templates</h2>
                <div className="space-y-4">
                  {templates.map((template) => (
                    <Card key={template.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-xl">{template.title}</CardTitle>
                            <CardDescription className="mt-2">
                              {template.description}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              template.difficulty === 'Beginner' ? 'secondary' :
                              template.difficulty === 'Intermediate' ? 'default' : 'destructive'
                            }>
                              {template.difficulty}
                            </Badge>
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              <span className="text-sm font-medium">{template.rating}</span>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-900 mb-2">Template Sections:</h4>
                          <div className="flex flex-wrap gap-2">
                            {template.sections.map((section, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {section}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="border-gradapp-primary text-gradapp-primary hover:bg-gradapp-primary hover:text-white"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </Button>
                          <Button
                            variant="outline"
                            className="border-gradapp-primary text-gradapp-primary hover:bg-gradapp-primary hover:text-white"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Writing Structure Guide */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-6 w-6 text-gradapp-primary" />
                    Writing Structure Guide
                  </CardTitle>
                  <CardDescription>
                    Standard structure for a strong {documentTitle.toLowerCase()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {documentType === 'sop' ? (
                      <>
                        <div className="border-l-4 border-gradapp-primary pl-4">
                          <h4 className="font-semibold">Introduction (10-15%)</h4>
                          <p className="text-sm text-gray-600">Hook + Brief overview of your background and goals</p>
                        </div>
                        <div className="border-l-4 border-gradapp-primary pl-4">
                          <h4 className="font-semibold">Academic Background (25-30%)</h4>
                          <p className="text-sm text-gray-600">Education, relevant coursework, research experience</p>
                        </div>
                        <div className="border-l-4 border-gradapp-primary pl-4">
                          <h4 className="font-semibold">Research Interests (25-30%)</h4>
                          <p className="text-sm text-gray-600">Specific research areas, methodologies, current projects</p>
                        </div>
                        <div className="border-l-4 border-gradapp-primary pl-4">
                          <h4 className="font-semibold">Program Fit (20-25%)</h4>
                          <p className="text-sm text-gray-600">Why this program, faculty alignment, resources</p>
                        </div>
                        <div className="border-l-4 border-gradapp-primary pl-4">
                          <h4 className="font-semibold">Future Goals (10-15%)</h4>
                          <p className="text-sm text-gray-600">Career objectives, impact you want to make</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="border-l-4 border-gradapp-primary pl-4">
                          <h4 className="font-semibold">Opening Story (15-20%)</h4>
                          <p className="text-sm text-gray-600">Compelling personal narrative or defining moment</p>
                        </div>
                        <div className="border-l-4 border-gradapp-primary pl-4">
                          <h4 className="font-semibold">Background & Values (30-35%)</h4>
                          <p className="text-sm text-gray-600">Your unique perspective, experiences, core values</p>
                        </div>
                        <div className="border-l-4 border-gradapp-primary pl-4">
                          <h4 className="font-semibold">Growth & Learning (25-30%)</h4>
                          <p className="text-sm text-gray-600">Challenges overcome, lessons learned, development</p>
                        </div>
                        <div className="border-l-4 border-gradapp-primary pl-4">
                          <h4 className="font-semibold">Goals & Contribution (15-20%)</h4>
                          <p className="text-sm text-gray-600">Future aspirations, how you'll contribute to community</p>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Writing Tips Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-6 w-6 text-yellow-500" />
                    Writing Tips
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {writingTips.map((tip, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-700">{tip}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Length Guidelines</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Typical Length:</span> 500-1000 words</p>
                    <p><span className="font-medium">Pages:</span> 1-2 pages</p>
                    <p><span className="font-medium">Paragraphs:</span> 4-6 paragraphs</p>
                    <p className="text-gray-600 mt-2">Always check specific program requirements</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Common Mistakes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <p className="font-medium text-red-600">❌ Too generic</p>
                      <p className="text-gray-600">Could apply to any program</p>
                    </div>
                    <div className="text-sm">
                      <p className="font-medium text-red-600">❌ Too personal</p>
                      <p className="text-gray-600">Oversharing inappropriate details</p>
                    </div>
                    <div className="text-sm">
                      <p className="font-medium text-red-600">❌ Repetitive</p>
                      <p className="text-gray-600">Restating information from CV</p>
                    </div>
                    <div className="text-sm">
                      <p className="font-medium text-red-600">❌ No clear goals</p>
                      <p className="text-gray-600">Vague about future plans</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DocumentTemplates;
