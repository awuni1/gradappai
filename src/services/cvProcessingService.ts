import { ChatGPTService } from './chatGptService';
import { supabase } from '@/integrations/supabase/client';

// CV Analysis Interface matching the database schema
export interface CVAnalysisResult {
  personal_info: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    portfolio?: string;
  };
  education: {
    institution: string;
    degree: string;
    field: string;
    start_date?: string;
    end_date?: string;
    gpa?: string;
    honors?: string;
  }[];
  work_experience: {
    company: string;
    position: string;
    start_date?: string;
    end_date?: string;
    location?: string;
    responsibilities: string[];
    achievements?: string[];
  }[];
  skills: {
    technical_skills: string[];
    soft_skills: string[];
    languages: {
      language: string;
      proficiency: string;
    }[];
  };
  research: {
    publications: {
      title: string;
      journal?: string;
      year?: string;
      authors?: string[];
    }[];
    research_projects: {
      title: string;
      description: string;
      duration?: string;
      role?: string;
    }[];
    conferences: {
      title: string;
      event: string;
      year?: string;
      type: 'presentation' | 'poster' | 'attendee';
    }[];
  };
  achievements: {
    title: string;
    organization?: string;
    year?: string;
    description?: string;
    type: 'award' | 'certification' | 'honor' | 'grant';
  }[];
  strengths: string[];
  areas_for_improvement: string[];
  match_score: number;
}

// CV Processing Service
export class CVProcessingService {
  constructor() {
    // Using ChatGPTService which has working Azure OpenAI API setup
  }

  // Check if service is available (for UI components)
  public isServiceAvailable(): boolean {
    return ChatGPTService.healthCheck !== undefined;
  }

  // Get service status for debugging
  public getServiceStatus(): { available: boolean; error?: string } {
    return {
      available: true,
      error: undefined
    };
  }

  // Extract text from PDF or Word document
  private async extractTextFromFile(file: File): Promise<string> {
    if (file.type === 'application/pdf') {
      return this.extractTextFromPDF(file);
    } else if (file.type.includes('word')) {
      return this.extractTextFromWord(file);
    } 
      throw new Error('Unsupported file type');
    
  }

  private async extractTextFromPDF(file: File): Promise<string> {
    try {
      // Extracting text from PDF using PDF.js
      const pdfJS = await import('pdfjs-dist');
      
      // Configure worker with proper CDN URL
      pdfJS.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfJS.version}/pdf.worker.min.js`;
      
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfJS.getDocument({ 
        data: arrayBuffer,
        disableFontFace: true, // Improve text extraction reliability
        useSystemFonts: false
      });
      
      const pdf = await loadingTask.promise;
      // PDF loaded successfully
      
      let fullText = '';
      const documentStructure: string[] = [];
      
      // Process each page
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          
          // Sort text items by position for better reading order
          const sortedItems = textContent.items
            .filter((item: any) => item.str && item.str.trim().length > 0)
            .sort((a: any, b: any) => {
              // Sort by Y position (top to bottom), then X position (left to right)
              const yDiff = Math.abs(a.transform[5] - b.transform[5]);
              if (yDiff > 5) { // Different lines
                return b.transform[5] - a.transform[5]; // Top to bottom
              }
              return a.transform[4] - b.transform[4]; // Left to right
            });
          
          // Extract text with better formatting
          let pageText = '';
          let currentLine = '';
          let lastY = 0;
          
          for (const item of sortedItems) {
            const itemText = item.str.trim();
            const itemY = item.transform[5];
            
            // Check if this is a new line based on Y position
            if (lastY !== 0 && Math.abs(itemY - lastY) > 5) {
              if (currentLine.trim()) {
                pageText += currentLine.trim() + '\n';
              }
              currentLine = itemText;
            } else {
              // Same line, add space if needed
              if (currentLine && !currentLine.endsWith(' ') && !itemText.startsWith(' ')) {
                currentLine += ' ';
              }
              currentLine += itemText;
            }
            lastY = itemY;
          }
          
          // Add the last line
          if (currentLine.trim()) {
            pageText += currentLine.trim() + '\n';
          }
          
          // Clean up the page text
          pageText = this.cleanExtractedText(pageText);
          
          if (pageText.trim()) {
            documentStructure.push(`=== PAGE ${pageNum} ===`);
            documentStructure.push(pageText);
            documentStructure.push(''); // Add spacing between pages
          }
          
          // Extracted text from page
          
        } catch (pageError) {
          // Failed to extract text from page - keep as critical warning
          documentStructure.push(`=== PAGE ${pageNum} (ERROR) ===`);
          documentStructure.push(`[Text extraction failed for this page]`);
        }
      }
      
      fullText = documentStructure.join('\n');
      
      if (!fullText.trim()) {
        throw new Error('No readable text found in PDF. The document may be image-based or corrupted.');
      }
      
      // PDF text extraction completed
      return fullText;
      
    } catch (error) {
      // Keep console.error for extraction failures
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('Invalid PDF')) {
          throw new Error('The uploaded file appears to be corrupted or is not a valid PDF.');
        } else if (error.message.includes('Password')) {
          throw new Error('This PDF is password-protected. Please upload an unprotected version.');
        } else if (error.message.includes('No readable text')) {
          throw new Error('This PDF appears to be image-based. Please upload a text-based PDF or convert it first.');
        }
      }
      
      throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Helper method to clean extracted text
  private cleanExtractedText(text: string): string {
    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove excessive newlines
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      // Clean up common PDF artifacts
      .replace(/[^\w\s\-.,;:!?()[\]{}@#$%^&*+=<>/\\|"'`~]/g, ' ')
      // Normalize whitespace around punctuation
      .replace(/\s+([.,;:!?])/g, '$1')
      .replace(/([.,;:!?])\s+/g, '$1 ')
      // Remove leading/trailing whitespace
      .trim();
  }

  private async extractTextFromWord(file: File): Promise<string> {
    try {
      // Extracting text from Word document using mammoth.js
      const mammoth = await import('mammoth');
      const arrayBuffer = await file.arrayBuffer();
      
      // Extract with both raw text and HTML for better structure
      const [rawResult, htmlResult] = await Promise.all([
        mammoth.extractRawText({ arrayBuffer }),
        mammoth.convertToHtml({ arrayBuffer })
      ]);
      
      // Check for extraction warnings
      if (rawResult.messages.length > 0) {
        // Word extraction warnings - keep as critical warning
      }
      
      let extractedText = rawResult.value;
      
      // If raw text is insufficient, try to extract better formatting from HTML
      if (extractedText.length < 100 && htmlResult.value.length > extractedText.length) {
        // Using HTML extraction for better content
        extractedText = this.convertHtmlToText(htmlResult.value);
      }
      
      // Clean and structure the text
      extractedText = this.cleanExtractedText(extractedText);
      
      // Add document structure markers
      const structuredText = this.addDocumentStructure(extractedText);
      
      if (!structuredText.trim()) {
        throw new Error('No readable text found in Word document. The document may be empty or corrupted.');
      }
      
      // Word text extraction completed
      // Extraction quality check completed
      
      return structuredText;
      
    } catch (error) {
      // Keep console.error for extraction failures
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('not supported')) {
          throw new Error('This Word document format is not supported. Please try saving as .docx format.');
        } else if (error.message.includes('corrupted')) {
          throw new Error('The Word document appears to be corrupted. Please try re-saving the file.');
        } else if (error.message.includes('No readable text')) {
          throw new Error('This Word document appears to be empty or contains only images.');
        }
      }
      
      throw new Error(`Failed to extract text from Word document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Helper method to convert HTML to clean text
  private convertHtmlToText(html: string): string {
    return html
      // Replace common HTML elements with appropriate formatting
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<\/h[1-6]>/gi, '\n\n')
      .replace(/<li>/gi, '• ')
      .replace(/<\/li>/gi, '\n')
      .replace(/<\/ul>/gi, '\n')
      .replace(/<\/ol>/gi, '\n')
      .replace(/<strong>|<b>/gi, '**')
      .replace(/<\/strong>|<\/b>/gi, '**')
      .replace(/<em>|<i>/gi, '*')
      .replace(/<\/em>|<\/i>/gi, '*')
      // Remove all other HTML tags
      .replace(/<[^>]*>/g, '')
      // Decode HTML entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      // Clean up spacing
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim();
  }

  // Helper method to add document structure markers
  private addDocumentStructure(text: string): string {
    const lines = text.split('\n');
    const structuredLines: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line) {
        structuredLines.push('');
        continue;
      }
      
      // Identify potential section headers (short lines, all caps, or followed by empty line)
      const isShortLine = line.length < 50;
      const isAllCaps = line === line.toUpperCase() && line.length > 3;
      const nextLineEmpty = i + 1 < lines.length && !lines[i + 1].trim();
      const isPotentialHeader = (isShortLine && nextLineEmpty) || isAllCaps;
      
      if (isPotentialHeader && !line.includes('@') && !line.includes('(')) {
        structuredLines.push(`\n=== ${line.toUpperCase()} ===`);
      } else {
        structuredLines.push(line);
      }
    }
    
    return structuredLines.join('\n');
  }

  // Generate the CV analysis prompt for Gemini
  private generateAnalysisPrompt(cvText: string): string {
    // Detect document characteristics
    const hasPageMarkers = cvText.includes('=== PAGE');
    const hasStructureMarkers = cvText.includes('===');
    const wordCount = cvText.split(/\s+/).length;
    const documentType = hasPageMarkers ? 'PDF' : (hasStructureMarkers ? 'Word' : 'Text');
    
    return `
You are an expert CV/Resume analyzer specializing in graduate school applications. 

DOCUMENT CONTEXT:
- Document Type: ${documentType}
- Word Count: ${wordCount}
- Structure Detected: ${hasStructureMarkers ? 'Yes' : 'No'}
- Multi-page: ${hasPageMarkers ? 'Yes' : 'No'}

ANALYSIS INSTRUCTIONS:
Analyze the following CV text and extract structured information with high attention to document formatting and structure. The text may contain page markers or section headers that indicate document organization.

CV Text:
${cvText}

EXTRACTION GUIDELINES:
1. Pay attention to section headers (marked with === or in ALL CAPS)
2. Identify chronological patterns in dates and experiences
3. Recognize standard CV sections: Contact, Education, Experience, Skills, Research, Publications, Awards
4. Extract email addresses, phone numbers, and URLs accurately
5. Preserve important formatting cues like bullet points and hierarchies
6. Handle multi-page content by combining related information across pages
7. Distinguish between different types of experiences (academic, professional, volunteer)
8. Identify research publications vs. conference presentations vs. projects

Please extract and analyze the CV according to this exact JSON schema:

{
  "personal_info": {
    "name": "Full name of the person",
    "email": "Email address if found",
    "phone": "Phone number if found", 
    "location": "Location/address if found",
    "linkedin": "LinkedIn URL if found",
    "portfolio": "Portfolio/website URL if found"
  },
  "education": [
    {
      "institution": "University/school name",
      "degree": "Degree type (e.g., Bachelor of Science)",
      "field": "Field of study",
      "start_date": "Start date if available",
      "end_date": "End date or 'Present'",
      "gpa": "GPA if mentioned",
      "honors": "Any honors or distinctions"
    }
  ],
  "work_experience": [
    {
      "company": "Company/organization name",
      "position": "Job title/role",
      "start_date": "Start date if available",
      "end_date": "End date or 'Present'",
      "location": "Work location if mentioned",
      "responsibilities": ["List of key responsibilities"],
      "achievements": ["List of achievements or accomplishments"]
    }
  ],
  "skills": {
    "technical_skills": ["List of technical skills, programming languages, tools"],
    "soft_skills": ["List of soft skills like leadership, communication"],
    "languages": [
      {
        "language": "Language name",
        "proficiency": "Proficiency level (native, fluent, intermediate, basic)"
      }
    ]
  },
  "research": {
    "publications": [
      {
        "title": "Publication title",
        "journal": "Journal name if academic paper",
        "year": "Publication year",
        "authors": ["List of authors if mentioned"]
      }
    ],
    "research_projects": [
      {
        "title": "Project title",
        "description": "Brief description",
        "duration": "Project duration",
        "role": "Role in the project"
      }
    ],
    "conferences": [
      {
        "title": "Presentation/paper title",
        "event": "Conference name",
        "year": "Year",
        "type": "presentation, poster, or attendee"
      }
    ]
  },
  "achievements": [
    {
      "title": "Achievement title",
      "organization": "Awarding organization",
      "year": "Year received",
      "description": "Brief description",
      "type": "award, certification, honor, or grant"
    }
  ],
  "strengths": [
    "List 3-5 key strengths identified from the CV"
  ],
  "areas_for_improvement": [
    "List 2-3 areas where the profile could be strengthened for graduate school applications"
  ],
  "match_score": 0.75
}

Analysis Guidelines:
1. Extract information accurately from the CV text
2. For strengths, focus on academic potential, research experience, technical skills
3. For areas of improvement, suggest specific enhancements for grad school competitiveness
4. Match score should be 0.0-1.0 representing overall strength for graduate applications
5. If information is not found, use empty strings/arrays rather than null
6. Ensure the JSON is valid and properly formatted
7. Be thorough but concise in descriptions

Return only the JSON response, no additional text.`;
  }

  // Process CV with real Azure OpenAI analysis
  public async processCVWithAI(cvText: string): Promise<CVAnalysisResult> {
    console.log('🔍 Starting real CV analysis with Azure OpenAI...');
    
    try {
      // Use ChatGPT service for CV analysis
      const analysisResult = await ChatGPTService.analyzeCVContent(cvText);
      
      console.log('✅ Received analysis from Azure OpenAI, converting format...');
      
      // The Azure OpenAI should return data in the correct format already
      // Just ensure it matches our expected structure
      const convertedResult: CVAnalysisResult = {
        personal_info: {
          name: analysisResult.personalInfo?.name || '',
          email: analysisResult.personalInfo?.email || '',
          phone: analysisResult.personalInfo?.phone || '',
          location: analysisResult.personalInfo?.location || '',
          linkedin: analysisResult.personalInfo?.linkedin || '',
          portfolio: analysisResult.personalInfo?.website || ''
        },
        education: analysisResult.education?.map(edu => ({
          institution: edu.institution || '',
          degree: edu.degree || '',
          field: edu.field || '',
          start_date: edu.startYear?.toString() || '',
          end_date: edu.graduationYear?.toString() || '',
          gpa: edu.gpa?.toString() || '',
          honors: Array.isArray(edu.honors) ? edu.honors.join(', ') : (edu.honors || '')
        })) || [],
        work_experience: analysisResult.experience?.map(exp => ({
          company: exp.company || '',
          position: exp.title || '',
          start_date: exp.startDate || '',
          end_date: exp.endDate || '',
          location: exp.location || '',
          responsibilities: [exp.description || ''],
          achievements: exp.achievements || []
        })) || [],
        skills: {
          technical_skills: analysisResult.skills?.technical || [],
          soft_skills: analysisResult.skills?.soft || [],
          languages: (analysisResult.skills?.languages || []).map(lang => ({
            language: typeof lang === 'string' ? lang : lang.language || 'Unknown',
            proficiency: typeof lang === 'object' ? lang.proficiency || 'Not specified' : 'Not specified'
          }))
        },
        research: {
          publications: analysisResult.publications?.map(pub => ({
            title: pub.title || '',
            journal: pub.venue || '',
            year: pub.year?.toString() || '',
            authors: pub.authors || []
          })) || [],
          research_projects: analysisResult.projects?.map(proj => ({
            title: proj.title || '',
            description: proj.description || '',
            duration: proj.duration || '',
            role: 'Not specified'
          })) || [],
          conferences: []
        },
        achievements: analysisResult.awards?.map(award => ({
          title: award.title || '',
          organization: award.issuer || '',
          year: award.year?.toString() || '',
          description: award.description || '',
          type: 'award' as const
        })) || [],
        strengths: analysisResult.recommendations?.strengthAreas || [],
        areas_for_improvement: analysisResult.recommendations?.suggestedImprovements || [],
        match_score: (analysisResult.metadata?.confidenceScore || 75) / 100
      };
      
      console.log('✅ CV analysis conversion completed successfully');
      
      // Validate the converted result
      this.validateAnalysisResult(convertedResult);
      
      return convertedResult;
    } catch (error) {
      console.error('❌ Real CV Analysis failed:', error);
      throw new Error(`Real AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Validate the analysis result structure
  private validateAnalysisResult(result: any): void {
    const requiredFields = [
      'personal_info', 'education', 'work_experience', 
      'skills', 'research', 'achievements', 
      'strengths', 'areas_for_improvement', 'match_score'
    ];
    
    for (const field of requiredFields) {
      if (!(field in result)) {
        throw new Error(`Missing required field in analysis: ${field}`);
      }
    }
    
    // Validate match_score is a number between 0 and 1
    if (typeof result.match_score !== 'number' || result.match_score < 0 || result.match_score > 1) {
      result.match_score = 0.5; // Default fallback
    }
  }

  // Process CV file end-to-end
  public async processCV(file: File, userId: string): Promise<string> {
    try {
      // Starting CV processing for user
      
      // Extract text from the file
      // Extracting text from CV file
      const cvText = await this.extractTextFromFile(file);
      
      if (!cvText.trim()) {
        throw new Error('No text could be extracted from the CV');
      }
      
      // Process with AI
      const analysis = await this.processCVWithAI(cvText);
      
      // Save analysis to database
      // Saving analysis to database
      const { data: savedAnalysis, error } = await supabase
        .from('cv_analysis')
        .update({
          processing_status: 'completed',
          personal_info: analysis.personal_info,
          education: analysis.education,
          work_experience: analysis.work_experience,
          skills: analysis.skills,
          research: analysis.research,
          achievements: analysis.achievements,
          strengths: analysis.strengths,
          areas_for_improvement: analysis.areas_for_improvement,
          match_score: analysis.match_score,
          processed_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        throw new Error(`Database update failed: ${error.message}`);
      }

      // Try to link the CV analysis to the onboarding profile
      if (savedAnalysis) {
        try {
          // Linking CV analysis to onboarding profile
          const { error: linkError } = await supabase.rpc(
            'link_cv_analysis_to_onboarding',
            {
              p_user_id: userId,
              p_cv_analysis_id: savedAnalysis.id
            }
          );

          if (linkError) {
            // Keep console.warn for linking failures as it's critical for debugging
            // Don't fail the entire process for linking issues
          } else {
            // CV analysis successfully linked to onboarding profile
          }
        } catch (linkingError) {
          // Keep console.warn for linking errors as it's critical for debugging
          // Continue with the process even if linking fails
        }
      }
      
      // CV processing completed successfully
      return savedAnalysis.id;
      
    } catch (error) {
      // Keep console.error for processing failures
      
      // Update status to failed in database
      await supabase
        .from('cv_analysis')
        .update({
          processing_status: 'failed',
          processing_error: error instanceof Error ? error.message : 'Processing failed'
        })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);
      
      throw error;
    }
  }

  // Get latest CV analysis for user
  public async getLatestCVAnalysis(userId: string): Promise<CVAnalysisResult | null> {
    try {
      const { data, error } = await supabase
        .from('cv_analysis')
        .select('id, user_id, personal_info, education, work_experience, skills, research, achievements, strengths, areas_for_improvement, recommendations, confidence_score, completeness_score, created_at, original_filename')
        .eq('user_id', userId)
        // Remove status filter to avoid 406 error with custom enum
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error || !data) {
        return null;
      }
      
      return {
        personal_info: data.personal_info || {},
        education: data.education || [],
        work_experience: data.work_experience || [],
        skills: data.skills || { technical_skills: [], soft_skills: [], languages: [] },
        research: data.research || { publications: [], research_projects: [], conferences: [] },
        achievements: data.achievements || [],
        strengths: data.strengths || [],
        areas_for_improvement: data.areas_for_improvement || [],
        match_score: data.match_score || 0.0
      };
    } catch (error) {
      // Keep console.error for data access failures
      return null;
    }
  }

  // Get CV analysis statistics for user
  public async getCVAnalysisStats(userId: string) {
    try {
      const { data, error } = await supabase
        .rpc('get_cv_analysis_stats', { p_user_id: userId });
      
      if (error) {
        // Keep console.error for stats access failures
        return null;
      }
      
      return data;
    } catch (error) {
      // Keep console.error for stats access failures
      return null;
    }
  }
}

// Export singleton instance
export const cvProcessingService = new CVProcessingService();