// import React, { useState, useCallback, useEffect } from 'react';
// import { FileText, Upload, CheckCircle, AlertCircle, Loader2, Download, Share2 } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge';
// import { Progress } from '@/components/ui/progress';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { Alert, AlertDescription } from '@/components/ui/alert';
// import { cvAnalysisService } from '@/services/cvAnalysisService';
// import { supabase } from '@/integrations/supabase/client';
// import { User } from '@supabase/supabase-js';
// import AuthenticatedHeader from '@/components/AuthenticatedHeader';
// import SEOHead from '@/components/SEOHead';

// interface CVAnalysisResult {
//   personalInfo: {
//     name?: string;
//     email?: string;
//     phone?: string;
//     location?: string;
//     linkedin?: string;
//     website?: string;
//     summary?: string;
//   };
//   education: Array<{
//     institution: string;
//     degree: string;
//     field: string;
//     gpa?: number;
//     graduationYear?: number;
//     startYear?: number;
//     location?: string;
//     honors?: string[];
//     coursework?: string[];
//   }>;
//   experience: Array<{
//     title: string;
//     company: string;
//     duration: string;
//     description: string;
//     location?: string;
//     startDate?: string;
//     endDate?: string;
//     achievements?: string[];
//     technologies?: string[];
//   }>;
//   skills: {
//     technical: string[];
//     languages: string[];
//     tools: string[];
//     soft: string[];
//     other: string[];
//   };
//   projects?: Array<{
//     title: string;
//     description: string;
//     technologies?: string[];
//     duration?: string;
//     url?: string;
//   }>;
//   publications?: Array<{
//     title: string;
//     authors: string[];
//     venue: string;
//     year: number;
//     url?: string;
//   }>;
//   certifications?: Array<{
//     name: string;
//     issuer: string;
//     year?: number;
//     expiryDate?: string;
//   }>;
//   awards?: Array<{
//     title: string;
//     issuer: string;
//     year: number;
//     description?: string;
//   }>;
//   researchAreas: string[];
//   recommendations: {
//     matchedPrograms: string[];
//     suggestedImprovements: string[];
//     strengthAreas: string[];
//     weaknessAreas: string[];
//     careerAdvice: string[];
//   };
//   metadata: {
//     analysisDate: string;
//     confidenceScore: number;
//     completenessScore: number;
//     qualityIssues: string[];
//   };
// }

// export default function CVAnalysis() {
//   const [user, setUser] = useState<User | null>(null);
//   const [userLoading, setUserLoading] = useState(true);
//   const [selectedFile, setSelectedFile] = useState<File | null>(null);
//   const [isUploading, setIsUploading] = useState(false);
//   const [isAnalyzing, setIsAnalyzing] = useState(false);
//   const [uploadProgress, setUploadProgress] = useState(0);
//   const [analysisResult, setAnalysisResult] = useState<CVAnalysisResult | null>(null);
//   const [error, setError] = useState<string | null>(null);
//   const [pageError, setPageError] = useState<string | null>(null);
//   const [processingStage, setProcessingStage] = useState<string>('');

//   // Get user authentication state (optional for CV analysis)
//   useEffect(() => {
//     const getUser = async () => {
//       try {
//         const { data: { user }, error } = await supabase.auth.getUser();
//         if (error) {
//           console.warn('Auth error in CV Analysis:', error);
//         }
//         setUser(user);
//         setUserLoading(false);
//       } catch (error) {
//         console.warn('Failed to get user in CV Analysis:', error);
//         setUser(null);
//         setUserLoading(false);
//       }
//     };
    
//     getUser();

//     // Listen for auth changes
//     const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
//       setUser(session?.user ?? null);
//       setUserLoading(false);
//     });

//     return () => subscription.unsubscribe();
//   }, []);

//   // Demo analysis removed - CV analysis now requires real authentication and AI processing

//   const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     console.log('📁 File selection event:', { 
//       hasFile: !!file, 
//       fileName: file?.name, 
//       fileSize: file?.size, 
//       fileType: file?.type 
//     });
    
//     if (file) {
//       const maxSize = 10 * 1024 * 1024; // 10MB
//       if (file.size > maxSize) {
//         setError('File size must be less than 10MB');
//         return;
//       }
      
//       // Check if file size is 0 - this indicates a problem
//       if (file.size === 0) {
//         console.error('❌ File has 0 bytes - this indicates a file reading issue');
//         setError('The selected file appears to be empty or corrupted. Please try selecting a different file.');
//         return;
//       }
      
//       const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
//       if (!allowedTypes.includes(file.type)) {
//         console.warn('⚠️ File type not in allowed list:', file.type);
//         // Allow the file anyway but warn - some files might not have proper MIME types
//         console.log('📝 Attempting to proceed with file despite type mismatch');
//       }
      
//       console.log('✅ File selected successfully:', {
//         name: file.name,
//         size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
//         type: file.type
//       });
      
//       setSelectedFile(file);
//       setError(null);
//     } else {
//       console.log('❌ No file selected');
//     }
//   }, []);

//   const handleUploadAndAnalyze = async () => {
//     if (!selectedFile) return;

//     setIsUploading(true);
//     setIsAnalyzing(true);
//     setError(null);
//     setUploadProgress(0);
//     setProcessingStage('Preparing analysis...');

//     // Add timeout to prevent infinite loading
//     const timeoutId = setTimeout(() => {
//       setError('ChatGPT analysis timed out after 30 seconds. Please try again.');
//       setIsAnalyzing(false);
//       setIsUploading(false);
//       setUploadProgress(0);
//       setProcessingStage('');
//     }, 30000); // 30 second timeout for ChatGPT

//     try {
//       console.log('🚀 Starting CV analysis process...');
//       console.log('📁 Selected file details:', {
//         name: selectedFile.name,
//         size: `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`,
//         type: selectedFile.type,
//         lastModified: new Date(selectedFile.lastModified).toISOString()
//       });

//       // Parse the document first
//       setProcessingStage('Parsing document...');
//       setUploadProgress(30);
//       const { documentParserService } = await import('@/services/documentParserService');
//       const parseResult = await documentParserService.parseDocument(selectedFile);

//       if (parseResult.error) {
//         if (parseResult.error.code === 'PDF_NO_TEXT_CONTENT') {
//           setError(
//             `❌ PDF Parsing Error: ${parseResult.error.message}\n\nThis PDF appears to be image-based or scanned. Please use:\n• A PDF with selectable text\n• Convert your PDF to Word (.docx) or text (.txt) instead.`
//           );
//           setUploadProgress(0);
//           setProcessingStage('');
//           setIsUploading(false);
//           setIsAnalyzing(false);
//           return;
//         } else {
//           setError(`Document parsing failed: ${parseResult.error.message}`);
//           setUploadProgress(0);
//           setProcessingStage('');
//           setIsUploading(false);
//           setIsAnalyzing(false);
//           return;
//         }
//       }

//       const parsedDocument = parseResult.data!;
//       // ...existing code for validation and analysis...
//     } catch (error) {
//       setError(`CV analysis failed: ${error instanceof Error ? error.message : String(error)}`);
//       setUploadProgress(0);
//       setProcessingStage('');
//       setIsUploading(false);
//       setIsAnalyzing(false);
//     } finally {
//       clearTimeout(timeoutId);
//       // ...existing code...
//     }
//   };

//   const renderAnalysisResults = () => {
//     if (!analysisResult) return null;
    
//     // Ensure all required properties exist with default values
//     const safeAnalysisResult = {
//       personalInfo: analysisResult.personalInfo || {},
//       education: analysisResult.education || [],
//       experience: analysisResult.experience || [],
//       skills: {
//         technical: analysisResult.skills?.technical || [],
//         tools: analysisResult.skills?.tools || [],
//         languages: analysisResult.skills?.languages || [],
//         soft: analysisResult.skills?.soft || []
//       },
//       projects: analysisResult.projects || [],
//       publications: analysisResult.publications || [],
//       researchAreas: analysisResult.researchAreas || [],
//       awards: analysisResult.awards || [],
//       extracurricular: analysisResult.extracurricular || [],
//       recommendations: {
//         strengthAreas: analysisResult.recommendations?.strengthAreas || [],
//         weaknessAreas: analysisResult.recommendations?.weaknessAreas || [],
//         suggestedImprovements: analysisResult.recommendations?.suggestedImprovements || [],
//         careerAdvice: analysisResult.recommendations?.careerAdvice || [],
//         universityRecommendations: analysisResult.recommendations?.universityRecommendations || [],
//         matchedPrograms: analysisResult.recommendations?.matchedPrograms || [],
//         applicationStrategy: {
//           recommendedTests: analysisResult.recommendations?.applicationStrategy?.recommendedTests || [],
//           essayTips: analysisResult.recommendations?.applicationStrategy?.essayTips || []
//         }
//       },
//       metadata: analysisResult.metadata || { confidenceScore: 0, completenessScore: 0, qualityIssues: [] }
//     };

//     return (
//       <div className="space-y-6">
//         <Tabs defaultValue="overview" className="w-full">
//           <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
//             <TabsTrigger value="overview">Overview</TabsTrigger>
//             <TabsTrigger value="education">Education</TabsTrigger>
//             <TabsTrigger value="experience">Experience</TabsTrigger>
//             <TabsTrigger value="skills">Skills</TabsTrigger>
//             <TabsTrigger value="projects">Projects</TabsTrigger>
//             <TabsTrigger value="awards">Awards</TabsTrigger>
//             <TabsTrigger value="recommendations">Analysis</TabsTrigger>
//             <TabsTrigger value="strategy">Strategy</TabsTrigger>
//           </TabsList>

//           <TabsContent value="overview" className="space-y-4">
//             <div className="grid gap-4 md:grid-cols-2">
//               <Card>
//                 <CardHeader>
//                   <CardTitle className="text-lg">Personal Information</CardTitle>
//                 </CardHeader>
//                 <CardContent className="space-y-2">
//                   {safeAnalysisResult.personalInfo?.name && (
//                     <div>
//                       <span className="font-medium">Name:</span> {safeAnalysisResult.personalInfo.name}
//                     </div>
//                   )}
//                   {safeAnalysisResult.personalInfo?.email && (
//                     <div>
//                       <span className="font-medium">Email:</span> {safeAnalysisResult.personalInfo.email}
//                     </div>
//                   )}
//                   {safeAnalysisResult.personalInfo?.phone && (
//                     <div>
//                       <span className="font-medium">Phone:</span> {safeAnalysisResult.personalInfo.phone}
//                     </div>
//                   )}
//                   {safeAnalysisResult.personalInfo?.location && (
//                     <div>
//                       <span className="font-medium">Location:</span> {safeAnalysisResult.personalInfo.location}
//                     </div>
//                   )}
//                   {safeAnalysisResult.personalInfo?.linkedin && (
//                     <div>
//                       <span className="font-medium">LinkedIn:</span> 
//                       <a href={safeAnalysisResult.personalInfo.linkedin} target="_blank" rel="noopener noreferrer" 
//                          className="text-blue-600 hover:underline ml-1">
//                         {safeAnalysisResult.personalInfo.linkedin.replace('https://', '')}
//                       </a>
//                     </div>
//                   )}
//                   {safeAnalysisResult.personalInfo?.github && (
//                     <div>
//                       <span className="font-medium">GitHub:</span> 
//                       <a href={safeAnalysisResult.personalInfo.github} target="_blank" rel="noopener noreferrer" 
//                          className="text-blue-600 hover:underline ml-1">
//                         {safeAnalysisResult.personalInfo.github.replace('https://', '')}
//                       </a>
//                     </div>
//                   )}
//                   {safeAnalysisResult.personalInfo?.website && (
//                     <div>
//                       <span className="font-medium">Website:</span> 
//                       <a href={safeAnalysisResult.personalInfo.website} target="_blank" rel="noopener noreferrer" 
//                          className="text-blue-600 hover:underline ml-1">
//                         {safeAnalysisResult.personalInfo.website.replace('https://', '')}
//                       </a>
//                     </div>
//                   )}
//                 </CardContent>
//               </Card>

//               {safeAnalysisResult.personalInfo?.summary && (
//                 <Card className="md:col-span-2">
//                   <CardHeader>
//                     <CardTitle className="text-lg">Professional Summary</CardTitle>
//                   </CardHeader>
//                   <CardContent>
//                     <p className="text-sm leading-relaxed text-gray-700">
//                       {safeAnalysisResult.personalInfo.summary}
//                     </p>
//                   </CardContent>
//                 </Card>
//               )}
//             </div>

//             {/* Skills & Research moved to separate section */}
//             <Card>
//               <CardHeader>
//                 <CardTitle className="text-lg">Skills & Research Areas</CardTitle>
//               </CardHeader>
//               <CardContent className="space-y-3">
//                 <div>
//                   <span className="font-medium">Technical Skills:</span>
//                   <div className="flex flex-wrap gap-1 mt-1">
//                     {(safeAnalysisResult.skills?.technical || []).slice(0, 6).map((skill, index) => (
//                       <Badge key={index} variant="secondary">{skill}</Badge>
//                     ))}
//                   </div>
//                 </div>
//                 <div>
//                   <span className="font-medium">Research Areas:</span>
//                   <div className="flex flex-wrap gap-1 mt-1">
//                     {(safeAnalysisResult.researchAreas || []).slice(0, 6).map((area, index) => (
//                       <Badge key={index} variant="outline">{area}</Badge>
//                     ))}
//                   </div>
//                 </div>
//                 {safeAnalysisResult.metadata && (
//                   <div>
//                     <span className="font-medium">Analysis Score:</span>
//                     <div className="flex gap-2 mt-1">
//                       <Badge variant="default">Confidence: {safeAnalysisResult.metadata?.confidenceScore || 0}%</Badge>
//                       <Badge variant="outline">Completeness: {safeAnalysisResult.metadata?.completenessScore || 0}%</Badge>
//                     </div>
//                   </div>
//                 )}
//               </CardContent>
//             </Card>
//           </TabsContent>

//           <TabsContent value="education" className="space-y-4">
//             {(analysisResult.education || []).map((edu, index) => (
//               <Card key={index}>
//                 <CardContent className="pt-4">
//                   <div className="flex justify-between items-start">
//                     <div>
//                       <h3 className="font-semibold">{edu.degree} in {edu.field}</h3>
//                       <p className="text-muted-foreground">{edu.institution}</p>
//                       {edu.gpa && <p className="text-sm">GPA: {edu.gpa}</p>}
//                     </div>
//                     {edu.graduationYear && (
//                       <Badge variant="outline">{edu.graduationYear}</Badge>
//                     )}
//                   </div>
//                 </CardContent>
//               </Card>
//             ))}
//           </TabsContent>

//           <TabsContent value="experience" className="space-y-4">
//             {(analysisResult.experience || []).map((exp, index) => (
//               <Card key={index}>
//                 <CardContent className="pt-4">
//                   <div className="flex justify-between items-start mb-2">
//                     <div>
//                       <h3 className="font-semibold">{exp.title}</h3>
//                       <p className="text-muted-foreground">{exp.company}</p>
//                       {exp.location && <p className="text-sm text-gray-500">{exp.location}</p>}
//                     </div>
//                     <Badge variant="outline">{exp.duration}</Badge>
//                   </div>
//                   <p className="text-sm mb-3">{exp.description}</p>
//                   {exp.achievements && exp.achievements.length > 0 && (
//                     <div className="mb-2">
//                       <span className="text-sm font-medium">Key Achievements:</span>
//                       <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
//                         {(exp.achievements || []).map((achievement, i) => (
//                           <li key={i}>{achievement}</li>
//                         ))}
//                       </ul>
//                     </div>
//                   )}
//                   {exp.technologies && exp.technologies.length > 0 && (
//                     <div className="flex flex-wrap gap-1">
//                       {(exp.technologies || []).map((tech, i) => (
//                         <Badge key={i} variant="secondary" className="text-xs">{tech}</Badge>
//                       ))}
//                     </div>
//                   )}
//                 </CardContent>
//               </Card>
//             ))}
//           </TabsContent>

//           <TabsContent value="skills" className="space-y-4">
//             <div className="grid gap-4 md:grid-cols-2">
//               <Card>
//                 <CardHeader>
//                   <CardTitle className="text-lg">Technical Skills</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="flex flex-wrap gap-2">
//                     {(analysisResult.skills?.technical || []).map((skill, index) => (
//                       <Badge key={index} variant="default">{skill}</Badge>
//                     ))}
//                   </div>
//                 </CardContent>
//               </Card>

//               <Card>
//                 <CardHeader>
//                   <CardTitle className="text-lg">Tools & Technologies</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="flex flex-wrap gap-2">
//                     {(analysisResult.skills?.tools || []).map((tool, index) => (
//                       <Badge key={index} variant="secondary">{tool}</Badge>
//                     ))}
//                   </div>
//                 </CardContent>
//               </Card>

//               <Card>
//                 <CardHeader>
//                   <CardTitle className="text-lg">Languages</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="flex flex-wrap gap-2">
//                     {(analysisResult.skills?.languages || []).map((lang, index) => (
//                       <Badge key={index} variant="outline">{lang}</Badge>
//                     ))}
//                   </div>
//                 </CardContent>
//               </Card>

//               <Card>
//                 <CardHeader>
//                   <CardTitle className="text-lg">Soft Skills</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="flex flex-wrap gap-2">
//                     {(analysisResult.skills?.soft || []).map((skill, index) => (
//                       <Badge key={index} variant="outline">{skill}</Badge>
//                     ))}
//                   </div>
//                 </CardContent>
//               </Card>
//             </div>
//           </TabsContent>

//           <TabsContent value="projects" className="space-y-4">
//             {analysisResult.projects && analysisResult.projects.length > 0 ? (
//               (analysisResult.projects || []).map((project, index) => (
//                 <Card key={index}>
//                   <CardContent className="pt-4">
//                     <div className="flex justify-between items-start mb-2">
//                       <div>
//                         <h3 className="font-semibold">{project.title}</h3>
//                         {project.duration && <p className="text-sm text-gray-500">{project.duration}</p>}
//                       </div>
//                       {project.url && (
//                         <a href={project.url} target="_blank" rel="noopener noreferrer" 
//                            className="text-blue-600 hover:text-blue-800 text-sm">
//                           View Project
//                         </a>
//                       )}
//                     </div>
//                     <p className="text-sm mb-3">{project.description}</p>
//                     {project.technologies && project.technologies.length > 0 && (
//                       <div className="flex flex-wrap gap-1">
//                         <span className="text-sm font-medium mr-2">Technologies:</span>
//                         {(project.technologies || []).map((tech, i) => (
//                           <Badge key={i} variant="secondary" className="text-xs">{tech}</Badge>
//                         ))}
//                       </div>
//                     )}
//                   </CardContent>
//                 </Card>
//               ))
//             ) : (
//               <Card>
//                 <CardContent className="pt-4 text-center text-gray-500">
//                   <p>No projects found in the CV analysis.</p>
//                 </CardContent>
//               </Card>
//             )}
            
//             {analysisResult.publications && analysisResult.publications.length > 0 && (
//               <div className="mt-6">
//                 <h3 className="text-lg font-semibold mb-4">Publications</h3>
//                 {(analysisResult.publications || []).map((pub, index) => (
//                   <Card key={index} className="mb-3">
//                     <CardContent className="pt-4">
//                       <div className="flex justify-between items-start mb-2">
//                         <div>
//                           <h4 className="font-semibold">{pub.title}</h4>
//                           <p className="text-sm text-gray-600">
//                             {pub.authors.join(', ')} • {pub.venue} ({pub.year})
//                           </p>
//                         </div>
//                         {pub.url && (
//                           <a href={pub.url} target="_blank" rel="noopener noreferrer" 
//                              className="text-blue-600 hover:text-blue-800 text-sm">
//                             View Paper
//                           </a>
//                         )}
//                       </div>
//                     </CardContent>
//                   </Card>
//                 ))}
//               </div>
//             )}
//           </TabsContent>

//           <TabsContent value="awards" className="space-y-4">
//             <div className="grid gap-4 md:grid-cols-2">
//               <Card>
//                 <CardHeader>
//                   <CardTitle className="text-lg text-yellow-600">Awards & Honors</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="space-y-3">
//                     {(safeAnalysisResult.awards || []).length > 0 ? (
//                       (safeAnalysisResult.awards || []).map((award, index) => (
//                         <div key={index} className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg">
//                           <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
//                           <span className="text-sm font-medium">{award}</span>
//                         </div>
//                       ))
//                     ) : (
//                       <p className="text-sm text-gray-500 italic">No awards or honors mentioned in CV</p>
//                     )}
//                   </div>
//                 </CardContent>
//               </Card>

//               <Card>
//                 <CardHeader>
//                   <CardTitle className="text-lg text-blue-600">Extracurricular Activities</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="space-y-3">
//                     {(safeAnalysisResult.extracurricular || []).length > 0 ? (
//                       (safeAnalysisResult.extracurricular || []).map((activity, index) => (
//                         <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
//                           <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
//                           <span className="text-sm">{activity}</span>
//                         </div>
//                       ))
//                     ) : (
//                       <p className="text-sm text-gray-500 italic">No extracurricular activities mentioned</p>
//                     )}
//                   </div>
//                 </CardContent>
//               </Card>
//             </div>

//             {safeAnalysisResult.publications && safeAnalysisResult.publications.length > 0 && (
//               <Card>
//                 <CardHeader>
//                   <CardTitle className="text-lg text-purple-600">Publications & Research</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="space-y-4">
//                     {safeAnalysisResult.publications.map((pub, index) => (
//                       <div key={index} className="border-l-4 border-purple-200 pl-4">
//                         <h4 className="font-semibold text-sm">{pub.title}</h4>
//                         <p className="text-sm text-gray-600">
//                           {pub.authors?.join(', ')} • {pub.venue} • {pub.year}
//                         </p>
//                         {pub.url && (
//                           <a href={pub.url} target="_blank" rel="noopener noreferrer" 
//                              className="text-xs text-purple-600 hover:underline">
//                             View Publication →
//                           </a>
//                         )}
//                       </div>
//                     ))}
//                   </div>
//                 </CardContent>
//               </Card>
//             )}
//           </TabsContent>

//           <TabsContent value="recommendations" className="space-y-4">
//             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
//               <Card>
//                 <CardHeader>
//                   <CardTitle className="text-lg text-green-600">Strengths</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <ul className="space-y-2">
//                     {(analysisResult.recommendations?.strengthAreas || []).map((strength, index) => (
//                       <li key={index} className="flex items-center gap-2">
//                         <CheckCircle className="h-4 w-4 text-green-500" />
//                         <span className="text-sm">{strength}</span>
//                       </li>
//                     ))}
//                   </ul>
//                 </CardContent>
//               </Card>

//               <Card>
//                 <CardHeader>
//                   <CardTitle className="text-lg text-blue-600">University Recommendations</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="space-y-4">
//                     {(analysisResult.recommendations?.universityRecommendations || []).slice(0, 3).map((uni, index) => (
//                       <div key={index} className="border rounded-lg p-3">
//                         <div className="flex justify-between items-start mb-2">
//                           <div>
//                             <h4 className="font-semibold text-sm">{uni.universityName}</h4>
//                             <p className="text-xs text-gray-600">{uni.programName}</p>
//                           </div>
//                           <div className="text-right">
//                             <Badge variant={uni.category === 'reach' ? 'destructive' : uni.category === 'target' ? 'default' : 'secondary'} className="text-xs">
//                               {uni.matchScore}% {uni.category}
//                             </Badge>
//                           </div>
//                         </div>
//                         <p className="text-xs text-gray-700 mb-2">{uni.reasoning}</p>
//                         <div className="flex gap-1 flex-wrap">
//                           <Badge variant="outline" className="text-xs">GPA: {uni.requirements?.gpa}</Badge>
//                           {uni.requirements?.gre && <Badge variant="outline" className="text-xs">GRE: {uni.requirements.gre}</Badge>}
//                           <Badge variant="outline" className="text-xs">Deadline: {uni.applicationDeadline}</Badge>
//                         </div>
//                       </div>
//                     ))}
//                     {(!analysisResult.recommendations.universityRecommendations || analysisResult.recommendations.universityRecommendations.length === 0) && 
//                       (analysisResult.recommendations?.matchedPrograms || []).map((program, index) => (
//                         <li key={index} className="flex items-center gap-2">
//                           <FileText className="h-4 w-4 text-blue-500" />
//                           <span className="text-sm">{program}</span>
//                         </li>
//                       ))
//                     }
//                   </div>
//                 </CardContent>
//               </Card>

//               <Card>
//                 <CardHeader>
//                   <CardTitle className="text-lg text-orange-600">Improvements</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <ul className="space-y-2">
//                     {(analysisResult.recommendations?.suggestedImprovements || []).map((improvement, index) => (
//                       <li key={index} className="flex items-center gap-2">
//                         <AlertCircle className="h-4 w-4 text-orange-500" />
//                         <span className="text-sm">{improvement}</span>
//                       </li>
//                     ))}
//                   </ul>
//                 </CardContent>
//               </Card>

//               <Card>
//                 <CardHeader>
//                   <CardTitle className="text-lg text-purple-600">Career Advice</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <ul className="space-y-2">
//                     {(analysisResult.recommendations?.careerAdvice || []).map((advice, index) => (
//                       <li key={index} className="flex items-center gap-2">
//                         <CheckCircle className="h-4 w-4 text-purple-500" />
//                         <span className="text-sm">{advice}</span>
//                       </li>
//                     ))}
//                   </ul>
//                 </CardContent>
//               </Card>
//             </div>

//             {analysisResult.recommendations.weaknessAreas && analysisResult.recommendations.weaknessAreas.length > 0 && (
//               <Card className="border-red-200">
//                 <CardHeader>
//                   <CardTitle className="text-lg text-red-600">Areas for Development</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <ul className="space-y-2">
//                     {(analysisResult.recommendations?.weaknessAreas || []).map((weakness, index) => (
//                       <li key={index} className="flex items-center gap-2">
//                         <AlertCircle className="h-4 w-4 text-red-500" />
//                         <span className="text-sm">{weakness}</span>
//                       </li>
//                     ))}
//                   </ul>
//                 </CardContent>
//               </Card>
//             )}

//             {/* Application Strategy Section */}
//             {analysisResult.recommendations.applicationStrategy && (
//               <Card className="border-purple-200 bg-purple-50">
//                 <CardHeader>
//                   <CardTitle className="text-lg text-purple-700">Application Strategy</CardTitle>
//                 </CardHeader>
//                 <CardContent className="space-y-3">
//                   <div>
//                     <h4 className="font-medium text-sm text-purple-800 mb-1">Timeline</h4>
//                     <p className="text-sm text-purple-700">{analysisResult.recommendations.applicationStrategy.timeline}</p>
//                   </div>
                  
//                   {analysisResult.recommendations.applicationStrategy.recommendedTests && (
//                     <div>
//                       <h4 className="font-medium text-sm text-purple-800 mb-1">Recommended Tests</h4>
//                       <div className="flex flex-wrap gap-1">
//                         {(analysisResult.recommendations?.applicationStrategy?.recommendedTests || []).map((test, index) => (
//                           <Badge key={index} variant="outline" className="text-xs border-purple-300 text-purple-700">{test}</Badge>
//                         ))}
//                       </div>
//                     </div>
//                   )}

//                   {analysisResult.recommendations.applicationStrategy.essayTips && (
//                     <div>
//                       <h4 className="font-medium text-sm text-purple-800 mb-1">Essay Tips</h4>
//                       <ul className="space-y-1">
//                         {(analysisResult.recommendations?.applicationStrategy?.essayTips || []).map((tip, index) => (
//                           <li key={index} className="text-sm text-purple-700">• {tip}</li>
//                         ))}
//                       </ul>
//                     </div>
//                   )}

//                   {analysisResult.recommendations.applicationStrategy.recommendationLetters && (
//                     <div>
//                       <h4 className="font-medium text-sm text-purple-800 mb-1">Recommendation Letters</h4>
//                       <p className="text-sm text-purple-700">{analysisResult.recommendations.applicationStrategy.recommendationLetters}</p>
//                     </div>
//                   )}
//                 </CardContent>
//               </Card>
//             )}

//             {analysisResult.metadata && analysisResult.metadata.qualityIssues && analysisResult.metadata.qualityIssues.length > 0 && (
//               <Card className="border-yellow-200 bg-yellow-50">
//                 <CardHeader>
//                   <CardTitle className="text-lg text-yellow-700">Analysis Notes</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <ul className="space-y-1">
//                     {(analysisResult.metadata?.qualityIssues || []).map((issue, index) => (
//                       <li key={index} className="text-sm text-yellow-700">• {issue}</li>
//                     ))}
//                   </ul>
//                 </CardContent>
//               </Card>
//             )}
//           </TabsContent>

//           <TabsContent value="strategy" className="space-y-4">
//             <div className="grid gap-4">
//               <Card>
//                 <CardHeader>
//                   <CardTitle className="text-lg text-indigo-600">Application Strategy</CardTitle>
//                   <CardDescription>Personalized recommendations for your graduate school applications</CardDescription>
//                 </CardHeader>
//                 <CardContent className="space-y-6">
//                   {(safeAnalysisResult.recommendations?.applicationStrategy?.recommendedTests || []).length > 0 && (
//                     <div>
//                       <h4 className="font-semibold text-sm text-indigo-800 mb-3">Recommended Standardized Tests</h4>
//                       <div className="flex flex-wrap gap-2 mb-2">
//                         {(safeAnalysisResult.recommendations?.applicationStrategy?.recommendedTests || []).map((test, index) => (
//                           <Badge key={index} variant="outline" className="border-indigo-300 text-indigo-700">{test}</Badge>
//                         ))}
//                       </div>
//                       {safeAnalysisResult.recommendations?.applicationStrategy?.targetScores && (
//                         <div className="text-sm text-gray-600">
//                           <strong>Target Scores:</strong> {JSON.stringify(safeAnalysisResult.recommendations.applicationStrategy.targetScores).replace(/[{},"]/g, ' ').trim()}
//                         </div>
//                       )}
//                     </div>
//                   )}

//                   {(safeAnalysisResult.recommendations?.applicationStrategy?.essayTips || []).length > 0 && (
//                     <div>
//                       <h4 className="font-semibold text-sm text-indigo-800 mb-3">Personal Statement & Essay Tips</h4>
//                       <ul className="space-y-2">
//                         {(safeAnalysisResult.recommendations?.applicationStrategy?.essayTips || []).map((tip, index) => (
//                           <li key={index} className="flex items-start gap-2">
//                             <div className="h-2 w-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
//                             <span className="text-sm">{tip}</span>
//                           </li>
//                         ))}
//                       </ul>
//                     </div>
//                   )}

//                   {safeAnalysisResult.recommendations?.applicationStrategy?.timelineAdvice && (
//                     <div>
//                       <h4 className="font-semibold text-sm text-indigo-800 mb-3">Timeline Advice</h4>
//                       <div className="bg-indigo-50 p-3 rounded-lg">
//                         <p className="text-sm text-indigo-800">{safeAnalysisResult.recommendations.applicationStrategy.timelineAdvice}</p>
//                       </div>
//                     </div>
//                   )}
//                 </CardContent>
//               </Card>

//               <div className="grid gap-4 md:grid-cols-2">
//                 <Card>
//                   <CardHeader>
//                     <CardTitle className="text-lg text-emerald-600">What to Work On</CardTitle>
//                     <CardDescription>Areas for improvement before applying</CardDescription>
//                   </CardHeader>
//                   <CardContent>
//                     <div className="space-y-3">
//                       {(safeAnalysisResult.recommendations?.suggestedImprovements || []).map((improvement, index) => (
//                         <div key={index} className="flex items-start gap-2 p-3 bg-emerald-50 rounded-lg">
//                           <div className="h-2 w-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
//                           <span className="text-sm text-emerald-800">{improvement}</span>
//                         </div>
//                       ))}
//                       {(safeAnalysisResult.recommendations?.suggestedImprovements || []).length === 0 && (
//                         <p className="text-sm text-gray-500 italic">Your profile looks strong! Keep up the excellent work.</p>
//                       )}
//                     </div>
//                   </CardContent>
//                 </Card>

//                 <Card>
//                   <CardHeader>
//                     <CardTitle className="text-lg text-purple-600">Career Development</CardTitle>
//                     <CardDescription>Long-term career advice</CardDescription>
//                   </CardHeader>
//                   <CardContent>
//                     <div className="space-y-3">
//                       {(safeAnalysisResult.recommendations?.careerAdvice || []).map((advice, index) => (
//                         <div key={index} className="flex items-start gap-2 p-3 bg-purple-50 rounded-lg">
//                           <div className="h-2 w-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
//                           <span className="text-sm text-purple-800">{advice}</span>
//                         </div>
//                       ))}
//                       {(safeAnalysisResult.recommendations?.careerAdvice || []).length === 0 && (
//                         <p className="text-sm text-gray-500 italic">Continue building on your current strengths and experiences.</p>
//                       )}
//                     </div>
//                   </CardContent>
//                 </Card>
//               </div>

//               {(safeAnalysisResult.metadata?.qualityIssues || []).length > 0 && (
//                 <Card>
//                   <CardHeader>
//                     <CardTitle className="text-lg text-amber-600">CV Improvement Suggestions</CardTitle>
//                     <CardDescription>Ways to enhance your CV presentation</CardDescription>
//                   </CardHeader>
//                   <CardContent>
//                     <ul className="space-y-2">
//                       {(safeAnalysisResult.metadata?.qualityIssues || []).map((issue, index) => (
//                         <li key={index} className="flex items-start gap-2">
//                           <div className="h-2 w-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
//                           <span className="text-sm text-amber-800">{issue}</span>
//                         </li>
//                       ))}
//                     </ul>
//                   </CardContent>
//                 </Card>
//               )}
//             </div>
//           </TabsContent>
//         </Tabs>

//         <div className="flex gap-2">
//           <Button variant="outline" className="flex items-center gap-2">
//             <Download className="h-4 w-4" />
//             Export Analysis
//           </Button>
//           <Button variant="outline" className="flex items-center gap-2">
//             <Share2 className="h-4 w-4" />
//             Share Results
//           </Button>
//         </div>
//       </div>
//     );
//   };

//   // Show page error if there's a critical issue
//   if (pageError) {
//     return (
//       <>
//         <SEOHead 
//           title="CV Analysis"
//           description="Upload your CV or resume for AI-powered analysis and personalized recommendations to strengthen your graduate school applications."
//           keywords="CV analysis, resume analysis, AI-powered CV review, graduate school applications"
//         />
//         <AuthenticatedHeader />
//         <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//           <div className="max-w-md mx-auto text-center">
//             <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
//             <h2 className="text-xl font-semibold text-gray-900 mb-2">Service Temporarily Unavailable</h2>
//             <p className="text-gray-600 mb-6">{pageError}</p>
//             <Button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700">
//               Retry
//             </Button>
//           </div>
//         </div>
//       </>
//     );
//   }

//   return (
//     <>
//       <SEOHead 
//         title="CV Analysis"
//         description="Upload your CV or resume for AI-powered analysis and personalized recommendations to strengthen your graduate school applications."
//         keywords="CV analysis, resume analysis, AI-powered CV review, graduate school applications"
//       />
//       <AuthenticatedHeader />
//       <div className="min-h-screen bg-gray-50">
//         <div className="container mx-auto px-4 py-8 max-w-6xl">
//           <div className="mb-8">
//             <h1 className="text-3xl font-bold mb-2">CV Analysis</h1>
//             <p className="text-muted-foreground">
//               Upload your CV or resume for AI-powered analysis and personalized recommendations
//             </p>
//           </div>

//       {!analysisResult ? (
//         <Card className="mb-6">
//           <CardHeader>
//             <CardTitle className="flex items-center gap-2">
//               <Upload className="h-5 w-5" />
//               Upload Your CV
//             </CardTitle>
//             <CardDescription>
//               Supported formats: PDF, DOC, DOCX, TXT (max 10MB)
//             </CardDescription>
//           </CardHeader>
//           <CardContent className="space-y-4">
//             <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
//               <input
//                 type="file"
//                 accept=".pdf,.doc,.docx,.txt"
//                 onChange={handleFileSelect}
//                 className="hidden"
//                 id="cv-upload"
//                 disabled={isAnalyzing}
//               />
//               <label htmlFor="cv-upload" className="cursor-pointer">
//                 <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
//                 <p className="text-lg font-medium mb-2">
//                   {selectedFile ? selectedFile.name : 'Click to upload your CV'}
//                 </p>
//                 <p className="text-sm text-muted-foreground">
//                   {selectedFile 
//                     ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`
//                     : 'or drag and drop your file here'
//                   }
//                 </p>
//               </label>
//             </div>

//             {error && (
//               <Alert className="border-red-200">
//                 <AlertCircle className="h-4 w-4" />
//                 <AlertDescription>{error}</AlertDescription>
//               </Alert>
//             )}

//             {(isUploading || isAnalyzing) && (
//               <div className="space-y-2">
//                 <div className="flex items-center justify-between">
//                   <span className="text-sm font-medium">{processingStage}</span>
//                   <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
//                 </div>
//                 <Progress value={uploadProgress} className="w-full" />
//               </div>
//             )}

//             <Button 
//               onClick={handleUploadAndAnalyze}
//               disabled={!selectedFile || isAnalyzing}
//               className="w-full"
//             >
//               {isAnalyzing ? (
//                 <>
//                   <Loader2 className="h-4 w-4 mr-2 animate-spin" />
//                   Analyzing...
//                 </>
//               ) : (
//                 <>
//                   <Upload className="h-4 w-4 mr-2" />
//                   Analyze CV
//                 </>
//               )}
//             </Button>
//           </CardContent>
//         </Card>
//       ) : (
//         <div className="space-y-6">
//           <Card>
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <CheckCircle className="h-5 w-5 text-green-500" />
//                 Analysis Complete
//               </CardTitle>
//               <CardDescription>
//                 Your CV has been successfully analyzed using AI technology
//               </CardDescription>
//             </CardHeader>
//           </Card>

//           {renderAnalysisResults()}

//           <div className="text-center">
//             <Button
//               variant="outline"
//               onClick={() => {
//                 setAnalysisResult(null);
//                 setSelectedFile(null);
//                 setError(null);
//               }}
//             >
//               Analyze Another CV
//             </Button>
//           </div>
//         </div>
//       )}
//         </div>
//       </div>
//     </>
//   );
// }






import React, { useState, useCallback, useEffect } from 'react';
import { FileText, Upload, CheckCircle, AlertCircle, Loader2, Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cvAnalysisService } from '@/services/cvAnalysisService';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import AuthenticatedHeader from '@/components/AuthenticatedHeader';
import SEOHead from '@/components/SEOHead';

interface CVAnalysisResult {
  personalInfo: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    website?: string;
    summary?: string;
  };
  education: {
    institution: string;
    degree: string;
    field: string;
    gpa?: number;
    graduationYear?: number;
    startYear?: number;
    location?: string;
    honors?: string[];
    coursework?: string[];
  }[];
  experience: {
    title: string;
    company: string;
    duration: string;
    description: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    achievements?: string[];
    technologies?: string[];
  }[];
  skills: {
    technical: string[];
    languages: string[];
    tools: string[];
    soft: string[];
    other: string[];
  };
  projects?: {
    title: string;
    description: string;
    technologies?: string[];
    duration?: string;
    url?: string;
  }[];
  publications?: {
    title: string;
    authors: string[];
    venue: string;
    year: number;
    url?: string;
  }[];
  certifications?: {
    name: string;
    issuer: string;
    year?: number;
    expiryDate?: string;
  }[];
  awards?: {
    title: string;
    issuer: string;
    year: number;
    description?: string;
  }[];
  researchAreas: string[];
  recommendations: {
    matchedPrograms: string[];
    suggestedImprovements: string[];
    strengthAreas: string[];
    weaknessAreas: string[];
    careerAdvice: string[];
  };
  metadata: {
    analysisDate: string;
    confidenceScore: number;
    completenessScore: number;
    qualityIssues: string[];
  };
}

export default function CVAnalysis() {
  const [user, setUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<CVAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [processingStage, setProcessingStage] = useState<string>('');

//   // Get user authentication state (optional for CV analysis)
//   useEffect(() => {
//     const getUser = async () => {
//       try {
//         const { data: { user }, error } = await supabase.auth.getUser();
//         if (error) {
//           console.warn('Auth error in CV Analysis:', error);
//         }
//         setUser(user);
//         setUserLoading(false);
//       } catch (error) {
//         console.warn('Failed to get user in CV Analysis:', error);
//         setUser(null);
//         setUserLoading(false);
//       }
//     };
    
//     getUser();

//     // Listen for auth changes
//     const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
//       setUser(session?.user ?? null);
//       setUserLoading(false);
//     });

//     return () => subscription.unsubscribe();
//   }, []);

//   // Demo analysis removed - CV analysis now requires real authentication and AI processing

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log('📁 File selection event:', { 
      hasFile: !!file, 
      fileName: file?.name, 
      fileSize: file?.size, 
      fileType: file?.type 
    });
    
    if (file) {
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        setError('File size must be less than 10MB');
        return;
      }
      
      // Check if file size is 0 - this indicates a problem
      if (file.size === 0) {
        console.error('❌ File has 0 bytes - this indicates a file reading issue');
        setError('The selected file appears to be empty or corrupted. Please try selecting a different file.');
        return;
      }
      
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      if (!allowedTypes.includes(file.type)) {
        console.warn('⚠️ File type not in allowed list:', file.type);
        // Allow the file anyway but warn - some files might not have proper MIME types
        console.log('📝 Attempting to proceed with file despite type mismatch');
      }
      
      console.log('✅ File selected successfully:', {
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        type: file.type
      });
      
      setSelectedFile(file);
      setError(null);
    } else {
      console.log('❌ No file selected');
    }
  }, []);

//   const handleUploadAndAnalyze = async () => {
//     if (!selectedFile) return;

//     setIsUploading(true);
//     setIsAnalyzing(true);
//     setError(null);
//     setUploadProgress(0);
//     setProcessingStage('Preparing analysis...');

//     // Add timeout to prevent infinite loading
//     const timeoutId = setTimeout(() => {
//       setError('ChatGPT analysis timed out after 30 seconds. Please try again.');
//       setIsAnalyzing(false);
//       setIsUploading(false);
//       setUploadProgress(0);
//       setProcessingStage('');
//     }, 30000); // 30 second timeout for ChatGPT

//     try {
//       console.log('🚀 Starting CV analysis process...');
//       console.log('📁 Selected file details:', {
//         name: selectedFile.name,
//         size: `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`,
//         type: selectedFile.type,
//         lastModified: new Date(selectedFile.lastModified).toISOString()
//       });

//       // Parse the document first
//       setProcessingStage('Parsing document...');
//       setUploadProgress(30);
//       const { documentParserService } = await import('@/services/documentParserService');
//       const parseResult = await documentParserService.parseDocument(selectedFile);

//       if (parseResult.error) {
//         if (parseResult.error.code === 'PDF_NO_TEXT_CONTENT') {
//           setError(
//             `❌ PDF Parsing Error: ${parseResult.error.message}\n\nThis PDF appears to be image-based or scanned. Please use:\n• A PDF with selectable text\n• Convert your PDF to Word (.docx) or text (.txt) instead.`
//           );
//           setUploadProgress(0);
//           setProcessingStage('');
//           setIsUploading(false);
//           setIsAnalyzing(false);
//           return;
//         } else {
//           setError(`Document parsing failed: ${parseResult.error.message}`);
//           setUploadProgress(0);
//           setProcessingStage('');
//           setIsUploading(false);
//           setIsAnalyzing(false);
//           return;
//         }
//       }

//       const parsedDocument = parseResult.data!;
//       // ...existing code for validation and analysis...
//     } catch (error) {
//       setError(`CV analysis failed: ${error instanceof Error ? error.message : String(error)}`);
//       setUploadProgress(0);
//       setProcessingStage('');
//       setIsUploading(false);
//       setIsAnalyzing(false);
//     } finally {
//       clearTimeout(timeoutId);
//       // ...existing code...
//     }
//   };

  const handleUploadAndAnalyze = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setIsAnalyzing(true);
    setError(null);
    setUploadProgress(0);
    setProcessingStage('Preparing analysis...');

    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setError('ChatGPT analysis timed out after 30 seconds. Please try again.');
      setIsAnalyzing(false);
      setIsUploading(false);
      setUploadProgress(0);
      setProcessingStage('');
    }, 30000); // 30 second timeout for ChatGPT

    try {
      console.log('🚀 Starting CV analysis process...');
      console.log('📁 Selected file details:', {
        name: selectedFile.name,
        size: `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`,
        type: selectedFile.type,
        lastModified: new Date(selectedFile.lastModified).toISOString()
      });

      // Parse the document first
      setProcessingStage('Parsing document...');
      setUploadProgress(30);
      const { documentParserService } = await import('@/services/documentParserService');
      const parseResult = await documentParserService.parseDocument(selectedFile);

      if (parseResult.error) {
        if (parseResult.error.code === 'PDF_NO_TEXT_CONTENT') {
          setError(
            `❌ PDF Parsing Error: ${parseResult.error.message}\n\nThis PDF appears to be image-based or scanned. Please use:\n• A PDF with selectable text\n• Convert your PDF to Word (.docx) or text (.txt) instead.`
          );
          setUploadProgress(0);
          setProcessingStage('');
          setIsUploading(false);
          setIsAnalyzing(false);
          return;
        } else {
          setError(`Document parsing failed: ${parseResult.error.message}`);
          setUploadProgress(0);
          setProcessingStage('');
          setIsUploading(false);
          setIsAnalyzing(false);
          return;
        }
      }

      const parsedDocument = parseResult.data!;
      console.log('📄 Parsed document preview:', {
        textPreview: parsedDocument.text?.substring(0, 200) + '...',
        wordCount: parsedDocument.metadata?.wordCount,
        characterCount: parsedDocument.metadata?.characterCount
      });
      
      // Validate CV content
      console.log('✅ Validating CV content...');
      const validation = documentParserService.validateCVContent(parsedDocument.text);
      console.log('✅ CV validation result:', validation);
      
      if (!validation.isValid) {
        throw new Error(`The uploaded document does not appear to be a valid CV/Resume: ${validation.reasons.join(', ')}`);
      }
      
      setUploadProgress(50);
      setProcessingStage('ChatGPT analyzing your CV...');
      
      // Analyze with ChatGPT directly
      console.log('🤖 Starting ChatGPT analysis...');
      const { ChatGPTService } = await import('@/services/chatGptService');
      const analysisResult = await ChatGPTService.analyzeCVContent(parsedDocument.text);
      
      console.log('🤖 ChatGPT analysis result:', {
        hasResult: !!analysisResult,
        hasPersonalInfo: !!analysisResult?.personalInfo,
        hasEducation: !!analysisResult?.education,
        hasExperience: !!analysisResult?.experience,
        hasSkills: !!analysisResult?.skills,
        resultType: typeof analysisResult
      });
      
      setUploadProgress(100);
      setProcessingStage('Analysis complete!');
      setAnalysisResult(analysisResult);
      console.log('✅ CV analysis completed without database storage')

    } catch (error) {
      console.error('❌ CV Analysis failed:', error);
      
      // Show detailed error information
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Check if it's a parsing error and provide specific guidance
      if (errorMessage.includes('Document parsing failed') || errorMessage.includes('PDF')) {
        setError(`Document parsing failed: ${errorMessage}\n\nTip: For best results, try uploading a Word document (.docx) or text file (.txt) instead.`);
      } else {
        setError(`CV analysis failed: ${errorMessage}. Please check your connection and try again.`);
      }
      setUploadProgress(0);
      setProcessingStage('');
      
    } finally {
      // Clear timeout
      clearTimeout(timeoutId);
      setIsAnalyzing(false);
      setIsUploading(false);
      setTimeout(() => {
        setUploadProgress(0);
        setProcessingStage('');
      }, 3000);
    }
  };

  const renderAnalysisResults = () => {
    if (!analysisResult) return null;
    
    // Ensure all required properties exist with default values
    const safeAnalysisResult = {
      personalInfo: analysisResult.personalInfo || {},
      education: analysisResult.education || [],
      experience: analysisResult.experience || [],
      skills: {
        technical: analysisResult.skills?.technical || [],
        tools: analysisResult.skills?.tools || [],
        languages: analysisResult.skills?.languages || [],
        soft: analysisResult.skills?.soft || []
      },
      projects: analysisResult.projects || [],
      publications: analysisResult.publications || [],
      researchAreas: analysisResult.researchAreas || [],
      awards: analysisResult.awards || [],
      extracurricular: analysisResult.extracurricular || [],
      recommendations: {
        strengthAreas: analysisResult.recommendations?.strengthAreas || [],
        weaknessAreas: analysisResult.recommendations?.weaknessAreas || [],
        suggestedImprovements: analysisResult.recommendations?.suggestedImprovements || [],
        careerAdvice: analysisResult.recommendations?.careerAdvice || [],
        universityRecommendations: analysisResult.recommendations?.universityRecommendations || [],
        matchedPrograms: analysisResult.recommendations?.matchedPrograms || [],
        applicationStrategy: {
          recommendedTests: analysisResult.recommendations?.applicationStrategy?.recommendedTests || [],
          essayTips: analysisResult.recommendations?.applicationStrategy?.essayTips || []
        }
      },
      metadata: analysisResult.metadata || { confidenceScore: 0, completenessScore: 0, qualityIssues: [] }
    };

    return (
      <div className="space-y-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="education">Education</TabsTrigger>
            <TabsTrigger value="experience">Experience</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="awards">Awards</TabsTrigger>
            <TabsTrigger value="recommendations">Analysis</TabsTrigger>
            <TabsTrigger value="strategy">Strategy</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {safeAnalysisResult.personalInfo?.name && (
                    <div>
                      <span className="font-medium">Name:</span> {safeAnalysisResult.personalInfo.name}
                    </div>
                  )}
                  {safeAnalysisResult.personalInfo?.email && (
                    <div>
                      <span className="font-medium">Email:</span> {safeAnalysisResult.personalInfo.email}
                    </div>
                  )}
                  {safeAnalysisResult.personalInfo?.phone && (
                    <div>
                      <span className="font-medium">Phone:</span> {safeAnalysisResult.personalInfo.phone}
                    </div>
                  )}
                  {safeAnalysisResult.personalInfo?.location && (
                    <div>
                      <span className="font-medium">Location:</span> {safeAnalysisResult.personalInfo.location}
                    </div>
                  )}
                  {safeAnalysisResult.personalInfo?.linkedin && (
                    <div>
                      <span className="font-medium">LinkedIn:</span> 
                      <a href={safeAnalysisResult.personalInfo.linkedin} target="_blank" rel="noopener noreferrer" 
                         className="text-blue-600 hover:underline ml-1">
                        {safeAnalysisResult.personalInfo.linkedin.replace('https://', '')}
                      </a>
                    </div>
                  )}
                  {safeAnalysisResult.personalInfo?.github && (
                    <div>
                      <span className="font-medium">GitHub:</span> 
                      <a href={safeAnalysisResult.personalInfo.github} target="_blank" rel="noopener noreferrer" 
                         className="text-blue-600 hover:underline ml-1">
                        {safeAnalysisResult.personalInfo.github.replace('https://', '')}
                      </a>
                    </div>
                  )}
                  {safeAnalysisResult.personalInfo?.website && (
                    <div>
                      <span className="font-medium">Website:</span> 
                      <a href={safeAnalysisResult.personalInfo.website} target="_blank" rel="noopener noreferrer" 
                         className="text-blue-600 hover:underline ml-1">
                        {safeAnalysisResult.personalInfo.website.replace('https://', '')}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>

              {safeAnalysisResult.personalInfo?.summary && (
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg">Professional Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-gray-700">
                      {safeAnalysisResult.personalInfo.summary}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Skills & Research moved to separate section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Skills & Research Areas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="font-medium">Technical Skills:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(safeAnalysisResult.skills?.technical || []).slice(0, 6).map((skill, index) => (
                      <Badge key={index} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Research Areas:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(safeAnalysisResult.researchAreas || []).slice(0, 6).map((area, index) => (
                      <Badge key={index} variant="outline">{area}</Badge>
                    ))}
                  </div>
                </div>
                {safeAnalysisResult.metadata && (
                  <div>
                    <span className="font-medium">Analysis Score:</span>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="default">Confidence: {safeAnalysisResult.metadata?.confidenceScore || 0}%</Badge>
                      <Badge variant="outline">Completeness: {safeAnalysisResult.metadata?.completenessScore || 0}%</Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="education" className="space-y-4">
            {(analysisResult.education || []).map((edu, index) => (
              <Card key={index}>
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{edu.degree} in {edu.field}</h3>
                      <p className="text-muted-foreground">{edu.institution}</p>
                      {edu.gpa && <p className="text-sm">GPA: {edu.gpa}</p>}
                    </div>
                    {edu.graduationYear && (
                      <Badge variant="outline">{edu.graduationYear}</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="experience" className="space-y-4">
            {(analysisResult.experience || []).map((exp, index) => (
              <Card key={index}>
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">{exp.title}</h3>
                      <p className="text-muted-foreground">{exp.company}</p>
                      {exp.location && <p className="text-sm text-gray-500">{exp.location}</p>}
                    </div>
                    <Badge variant="outline">{exp.duration}</Badge>
                  </div>
                  <p className="text-sm mb-3">{exp.description}</p>
                  {exp.achievements && exp.achievements.length > 0 && (
                    <div className="mb-2">
                      <span className="text-sm font-medium">Key Achievements:</span>
                      <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                        {(exp.achievements || []).map((achievement, i) => (
                          <li key={i}>{achievement}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {exp.technologies && exp.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {(exp.technologies || []).map((tech, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{tech}</Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="skills" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Technical Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {(analysisResult.skills?.technical || []).map((skill, index) => (
                      <Badge key={index} variant="default">{skill}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tools & Technologies</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {(analysisResult.skills?.tools || []).map((tool, index) => (
                      <Badge key={index} variant="secondary">{tool}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Languages</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {(analysisResult.skills?.languages || []).map((lang, index) => (
                      <Badge key={index} variant="outline">{lang}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Soft Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {(analysisResult.skills?.soft || []).map((skill, index) => (
                      <Badge key={index} variant="outline">{skill}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="projects" className="space-y-4">
            {analysisResult.projects && analysisResult.projects.length > 0 ? (
              (analysisResult.projects || []).map((project, index) => (
                <Card key={index}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold">{project.title}</h3>
                        {project.duration && <p className="text-sm text-gray-500">{project.duration}</p>}
                      </div>
                      {project.url && (
                        <a href={project.url} target="_blank" rel="noopener noreferrer" 
                           className="text-blue-600 hover:text-blue-800 text-sm">
                          View Project
                        </a>
                      )}
                    </div>
                    <p className="text-sm mb-3">{project.description}</p>
                    {project.technologies && project.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        <span className="text-sm font-medium mr-2">Technologies:</span>
                        {(project.technologies || []).map((tech, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{tech}</Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="pt-4 text-center text-gray-500">
                  <p>No projects found in the CV analysis.</p>
                </CardContent>
              </Card>
            )}
            
            {analysisResult.publications && analysisResult.publications.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Publications</h3>
                {(analysisResult.publications || []).map((pub, index) => (
                  <Card key={index} className="mb-3">
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold">{pub.title}</h4>
                          <p className="text-sm text-gray-600">
                            {pub.authors.join(', ')} • {pub.venue} ({pub.year})
                          </p>
                        </div>
                        {pub.url && (
                          <a href={pub.url} target="_blank" rel="noopener noreferrer" 
                             className="text-blue-600 hover:text-blue-800 text-sm">
                            View Paper
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="awards" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-yellow-600">Awards & Honors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(safeAnalysisResult.awards || []).length > 0 ? (
                      (safeAnalysisResult.awards || []).map((award, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg">
                          <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                          <span className="text-sm font-medium">{award}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 italic">No awards or honors mentioned in CV</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-blue-600">Extracurricular Activities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(safeAnalysisResult.extracurricular || []).length > 0 ? (
                      (safeAnalysisResult.extracurricular || []).map((activity, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                          <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                          <span className="text-sm">{activity}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 italic">No extracurricular activities mentioned</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {safeAnalysisResult.publications && safeAnalysisResult.publications.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-purple-600">Publications & Research</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {safeAnalysisResult.publications.map((pub, index) => (
                      <div key={index} className="border-l-4 border-purple-200 pl-4">
                        <h4 className="font-semibold text-sm">{pub.title}</h4>
                        <p className="text-sm text-gray-600">
                          {pub.authors?.join(', ')} • {pub.venue} • {pub.year}
                        </p>
                        {pub.url && (
                          <a href={pub.url} target="_blank" rel="noopener noreferrer" 
                             className="text-xs text-purple-600 hover:underline">
                            View Publication →
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-green-600">Strengths</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {(analysisResult.recommendations?.strengthAreas || []).map((strength, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-blue-600">University Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(analysisResult.recommendations?.universityRecommendations || []).slice(0, 3).map((uni, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold text-sm">{uni.universityName}</h4>
                            <p className="text-xs text-gray-600">{uni.programName}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant={uni.category === 'reach' ? 'destructive' : uni.category === 'target' ? 'default' : 'secondary'} className="text-xs">
                              {uni.matchScore}% {uni.category}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-xs text-gray-700 mb-2">{uni.reasoning}</p>
                        <div className="flex gap-1 flex-wrap">
                          <Badge variant="outline" className="text-xs">GPA: {uni.requirements?.gpa}</Badge>
                          {uni.requirements?.gre && <Badge variant="outline" className="text-xs">GRE: {uni.requirements.gre}</Badge>}
                          <Badge variant="outline" className="text-xs">Deadline: {uni.applicationDeadline}</Badge>
                        </div>
                      </div>
                    ))}
                    {(!analysisResult.recommendations.universityRecommendations || analysisResult.recommendations.universityRecommendations.length === 0) && 
                      (analysisResult.recommendations?.matchedPrograms || []).map((program, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-500" />
                          <span className="text-sm">{program}</span>
                        </li>
                      ))
                    }
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-orange-600">Improvements</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {(analysisResult.recommendations?.suggestedImprovements || []).map((improvement, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                        <span className="text-sm">{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-purple-600">Career Advice</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {(analysisResult.recommendations?.careerAdvice || []).map((advice, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-purple-500" />
                        <span className="text-sm">{advice}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {analysisResult.recommendations.weaknessAreas && analysisResult.recommendations.weaknessAreas.length > 0 && (
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="text-lg text-red-600">Areas for Development</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {(analysisResult.recommendations?.weaknessAreas || []).map((weakness, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <span className="text-sm">{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Application Strategy Section */}
            {analysisResult.recommendations.applicationStrategy && (
              <Card className="border-purple-200 bg-purple-50">
                <CardHeader>
                  <CardTitle className="text-lg text-purple-700">Application Strategy</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm text-purple-800 mb-1">Timeline</h4>
                    <p className="text-sm text-purple-700">{analysisResult.recommendations.applicationStrategy.timeline}</p>
                  </div>
                  
                  {analysisResult.recommendations.applicationStrategy.recommendedTests && (
                    <div>
                      <h4 className="font-medium text-sm text-purple-800 mb-1">Recommended Tests</h4>
                      <div className="flex flex-wrap gap-1">
                        {(analysisResult.recommendations?.applicationStrategy?.recommendedTests || []).map((test, index) => (
                          <Badge key={index} variant="outline" className="text-xs border-purple-300 text-purple-700">{test}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysisResult.recommendations.applicationStrategy.essayTips && (
                    <div>
                      <h4 className="font-medium text-sm text-purple-800 mb-1">Essay Tips</h4>
                      <ul className="space-y-1">
                        {(analysisResult.recommendations?.applicationStrategy?.essayTips || []).map((tip, index) => (
                          <li key={index} className="text-sm text-purple-700">• {tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysisResult.recommendations.applicationStrategy.recommendationLetters && (
                    <div>
                      <h4 className="font-medium text-sm text-purple-800 mb-1">Recommendation Letters</h4>
                      <p className="text-sm text-purple-700">{analysisResult.recommendations.applicationStrategy.recommendationLetters}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {analysisResult.metadata && analysisResult.metadata.qualityIssues && analysisResult.metadata.qualityIssues.length > 0 && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardHeader>
                  <CardTitle className="text-lg text-yellow-700">Analysis Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {(analysisResult.metadata?.qualityIssues || []).map((issue, index) => (
                      <li key={index} className="text-sm text-yellow-700">• {issue}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="strategy" className="space-y-4">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-indigo-600">Application Strategy</CardTitle>
                  <CardDescription>Personalized recommendations for your graduate school applications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {(safeAnalysisResult.recommendations?.applicationStrategy?.recommendedTests || []).length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm text-indigo-800 mb-3">Recommended Standardized Tests</h4>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {(safeAnalysisResult.recommendations?.applicationStrategy?.recommendedTests || []).map((test, index) => (
                          <Badge key={index} variant="outline" className="border-indigo-300 text-indigo-700">{test}</Badge>
                        ))}
                      </div>
                      {safeAnalysisResult.recommendations?.applicationStrategy?.targetScores && (
                        <div className="text-sm text-gray-600">
                          <strong>Target Scores:</strong> {JSON.stringify(safeAnalysisResult.recommendations.applicationStrategy.targetScores).replace(/[{},"]/g, ' ').trim()}
                        </div>
                      )}
                    </div>
                  )}

                  {(safeAnalysisResult.recommendations?.applicationStrategy?.essayTips || []).length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm text-indigo-800 mb-3">Personal Statement & Essay Tips</h4>
                      <ul className="space-y-2">
                        {(safeAnalysisResult.recommendations?.applicationStrategy?.essayTips || []).map((tip, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <div className="h-2 w-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-sm">{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {safeAnalysisResult.recommendations?.applicationStrategy?.timelineAdvice && (
                    <div>
                      <h4 className="font-semibold text-sm text-indigo-800 mb-3">Timeline Advice</h4>
                      <div className="bg-indigo-50 p-3 rounded-lg">
                        <p className="text-sm text-indigo-800">{safeAnalysisResult.recommendations.applicationStrategy.timelineAdvice}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-emerald-600">What to Work On</CardTitle>
                    <CardDescription>Areas for improvement before applying</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(safeAnalysisResult.recommendations?.suggestedImprovements || []).map((improvement, index) => (
                        <div key={index} className="flex items-start gap-2 p-3 bg-emerald-50 rounded-lg">
                          <div className="h-2 w-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-sm text-emerald-800">{improvement}</span>
                        </div>
                      ))}
                      {(safeAnalysisResult.recommendations?.suggestedImprovements || []).length === 0 && (
                        <p className="text-sm text-gray-500 italic">Your profile looks strong! Keep up the excellent work.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-purple-600">Career Development</CardTitle>
                    <CardDescription>Long-term career advice</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(safeAnalysisResult.recommendations?.careerAdvice || []).map((advice, index) => (
                        <div key={index} className="flex items-start gap-2 p-3 bg-purple-50 rounded-lg">
                          <div className="h-2 w-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-sm text-purple-800">{advice}</span>
                        </div>
                      ))}
                      {(safeAnalysisResult.recommendations?.careerAdvice || []).length === 0 && (
                        <p className="text-sm text-gray-500 italic">Continue building on your current strengths and experiences.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {(safeAnalysisResult.metadata?.qualityIssues || []).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-amber-600">CV Improvement Suggestions</CardTitle>
                    <CardDescription>Ways to enhance your CV presentation</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {(safeAnalysisResult.metadata?.qualityIssues || []).map((issue, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="h-2 w-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-sm text-amber-800">{issue}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Analysis
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Share Results
          </Button>
        </div>
      </div>
    );
  };

  // Show page error if there's a critical issue
  if (pageError) {
    return (
      <>
        <SEOHead 
          title="CV Analysis"
          description="Upload your CV or resume for AI-powered analysis and personalized recommendations to strengthen your graduate school applications."
          keywords="CV analysis, resume analysis, AI-powered CV review, graduate school applications"
        />
        <AuthenticatedHeader />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md mx-auto text-center">
            <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Service Temporarily Unavailable</h2>
            <p className="text-gray-600 mb-6">{pageError}</p>
            <Button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700">
              Retry
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEOHead 
        title="CV Analysis"
        description="Upload your CV or resume for AI-powered analysis and personalized recommendations to strengthen your graduate school applications."
        keywords="CV analysis, resume analysis, AI-powered CV review, graduate school applications"
      />
      <AuthenticatedHeader />
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">CV Analysis</h1>
            <p className="text-muted-foreground">
              Upload your CV or resume for AI-powered analysis and personalized recommendations
            </p>
          </div>

      {!analysisResult ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Your CV
            </CardTitle>
            <CardDescription>
              Supported formats: PDF, DOC, DOCX, TXT (max 10MB)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileSelect}
                className="hidden"
                id="cv-upload"
                disabled={isAnalyzing}
              />
              <label htmlFor="cv-upload" className="cursor-pointer">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2">
                  {selectedFile ? selectedFile.name : 'Click to upload your CV'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedFile 
                    ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`
                    : 'or drag and drop your file here'
                  }
                </p>
              </label>
            </div>

            {error && (
              <Alert className="border-red-200">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {(isUploading || isAnalyzing) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{processingStage}</span>
                  <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}

            <Button 
              onClick={handleUploadAndAnalyze}
              disabled={!selectedFile || isAnalyzing}
              className="w-full"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Analyze CV
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Analysis Complete
              </CardTitle>
              <CardDescription>
                Your CV has been successfully analyzed using AI technology
              </CardDescription>
            </CardHeader>
          </Card>

          {renderAnalysisResults()}

          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => {
                setAnalysisResult(null);
                setSelectedFile(null);
                setError(null);
              }}
            >
              Analyze Another CV
            </Button>
          </div>
        </div>
      )}
        </div>
      </div>
    </>
  );
}