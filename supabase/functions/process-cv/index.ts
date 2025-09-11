import { serve } from 'std/http/server.ts';
import { createClient } from 'supabase';

// CV Analysis Result Interface
interface CVAnalysisResult {
  personal_info: any;
  education: any[];
  work_experience: any[];
  skills: any;
  research: any;
  achievements: any[];
  strengths: string[];
  areas_for_improvement: string[];
  match_score: number;
}

console.log('🚀 CV Processing Edge Function started');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  let requestBody: any = {};
  let userId: string | undefined;
  let cvFilePath: string | undefined;

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Gemini API configuration
    console.log('🔧 Using Gemini API for CV processing...');

    // Extract parameters with better error handling
    try {
      requestBody = await req.json();
      console.log('📝 Received request body:', JSON.stringify(requestBody));
    } catch (parseError) {
      console.error('❌ Failed to parse request JSON:', parseError);
      throw new Error('Invalid JSON in request body');
    }

    userId = requestBody.userId;
    cvFilePath = requestBody.cvFilePath;

    console.log('📥 Extracted parameters:', { userId, cvFilePath });

    if (!userId || !cvFilePath) {
      console.error('❌ Missing parameters:', { userId: Boolean(userId), cvFilePath: Boolean(cvFilePath) });
      throw new Error('Missing required parameters: userId and cvFilePath');
    }

    console.log(`🔄 Processing CV for user ${userId}: ${cvFilePath}`);

    // Update status to processing
    console.log('🔄 Updating status to processing...');
    const { error: statusError } = await supabase
      .from('cv_analysis')
      .update({ processing_status: 'processing' })
      .eq('user_id', userId)
      .eq('cv_file_path', cvFilePath);

    if (statusError) {
      console.error('❌ Failed to update status:', statusError);
      throw new Error(`Status update failed: ${statusError.message}`);
    }
    console.log('✅ Status updated to processing');

    // Download CV file from storage
    console.log('📥 Downloading CV file from storage...');
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('cv-uploads')
      .download(cvFilePath);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download CV: ${downloadError?.message}`);
    }

    // Extract text from the file
    console.log('📄 Extracting text from CV...');
    const cvText = await extractTextFromFile(fileData, cvFilePath);

    if (!cvText.trim()) {
      throw new Error('No readable text found in CV');
    }

    console.log(`✅ Extracted ${cvText.length} characters from CV`);

    // Process with Gemini API
    console.log('🤖 Analyzing CV with Gemini API...');
    const analysis = await processWithGemini(cvText);

    // Save analysis results to database
    console.log('💾 Saving analysis results...');
    console.log('📊 Analysis data preview:', {
      personal_info_keys: Object.keys(analysis.personal_info || {}),
      education_count: analysis.education?.length || 0,
      work_experience_count: analysis.work_experience?.length || 0,
      match_score: analysis.match_score
    });

    const { error: updateError } = await supabase
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
      .eq('cv_file_path', cvFilePath);

    if (updateError) {
      console.error('❌ Database update error:', updateError);
      throw new Error(`Failed to save analysis: ${updateError.message}`);
    }

    console.log('✅ CV processing completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'CV processed successfully',
        analysisId: `${userId}-${Date.now()}`
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );

  } catch (error) {
    console.error('❌ CV processing failed:', error);

    // Try to update status to failed if we have the necessary info
    if (userId && cvFilePath) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        console.log('📝 Updating error status for:', { userId, cvFilePath });
        await supabase
          .from('cv_analysis')
          .update({
            processing_status: 'failed',
            processing_error: error instanceof Error ? error.message : 'Processing failed'
          })
          .eq('user_id', userId)
          .eq('cv_file_path', cvFilePath);
        
        console.log('✅ Error status updated successfully');
      } catch (updateError) {
        console.warn('⚠️ Failed to update error status:', updateError);
      }
    } else {
      console.warn('⚠️ Cannot update error status - missing userId or cvFilePath');
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'CV processing failed'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});

// Extract text from CV file
async function extractTextFromFile(fileData: Blob, fileName: string): Promise<string> {
  const fileExtension = fileName.toLowerCase().split('.').pop();
  
  if (fileExtension === 'pdf') {
    return await extractTextFromPDF(fileData);
  } else if (fileExtension === 'doc' || fileExtension === 'docx') {
    return await extractTextFromWord(fileData);
  } 
    throw new Error(`Unsupported file format: ${fileExtension}`);
  
}

// Enhanced PDF text extraction for Deno environment
async function extractTextFromPDF(fileData: Blob): Promise<string> {
  try {
    console.log('📄 Starting enhanced PDF text extraction...');
    const arrayBuffer = await fileData.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Convert to text and look for PDF text patterns
    const text = new TextDecoder('latin1').decode(uint8Array);
    
    // Enhanced regex patterns for PDF text extraction
    const extractedContent: string[] = [];
    
    // Pattern 1: Text in parentheses (most common PDF text storage)
    const parenthesesMatches = text.match(/\((.*?)\)/g);
    if (parenthesesMatches) {
      parenthesesMatches.forEach(match => {
        const content = match.slice(1, -1)
          .replace(/\\n/g, '\n')
          .replace(/\\t/g, ' ')
          .replace(/\\r/g, '\r')
          .replace(/\\\\/g, '\\')
          .replace(/\\(/g, '(')
          .replace(/\\)/g, ')')
          .trim();
        if (content.length > 2) {
          extractedContent.push(content);
        }
      });
    }
    
    // Pattern 2: Look for text objects and streams
    const textObjectPattern = /BT\s+(.*?)\s+ET/gs;
    const textObjectMatches = text.match(textObjectPattern);
    if (textObjectMatches) {
      textObjectMatches.forEach(match => {
        // Extract text from text objects
        const innerText = match.replace(/BT|ET/g, '').trim();
        const textCommands = innerText.match(/\((.*?)\)/g);
        if (textCommands) {
          textCommands.forEach(cmd => {
            const content = cmd.slice(1, -1).trim();
            if (content.length > 2) {
              extractedContent.push(content);
            }
          });
        }
      });
    }
    
    // Pattern 3: Look for readable ASCII strings (fallback)
    if (extractedContent.length === 0) {
      console.log('📄 Using fallback ASCII extraction...');
      const asciiPattern = /[\x20-\x7E]{4,}/g;
      const asciiMatches = text.match(asciiPattern);
      if (asciiMatches) {
        asciiMatches.forEach(match => {
          // Filter out non-text content
          if (!match.match(/^[0-9\s.]+$/) && // Not just numbers
              !match.includes('obj') && // Not PDF objects
              !match.includes('>>') && // Not PDF syntax
              !match.includes('<<') &&
              match.length > 5) {
            extractedContent.push(match.trim());
          }
        });
      }
    }
    
    // Clean and join extracted content
    let finalText = extractedContent
      .filter(content => content.length > 2)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Post-processing cleanup
    finalText = finalText
      .replace(/([a-z])([A-Z])/g, '$1 $2') // Add spaces between camelCase
      .replace(/(\w)(\d)/g, '$1 $2') // Add spaces between words and numbers
      .replace(/(\d)(\w)/g, '$1 $2') // Add spaces between numbers and words
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    if (finalText.length < 50) {
      console.log('⚠️ PDF text extraction yielded minimal content');
      return 'PDF text extraction found limited readable content. The PDF may be image-based or have complex formatting.';
    }
    
    console.log(`✅ PDF text extraction completed: ${finalText.length} characters`);
    return finalText;
    
  } catch (error) {
    console.error('❌ PDF text extraction failed:', error);
    return 'PDF text extraction encountered an error. The document may be corrupted or password-protected.';
  }
}

// Enhanced Word document text extraction for Deno environment
async function extractTextFromWord(fileData: Blob): Promise<string> {
  try {
    console.log('📄 Starting enhanced Word document text extraction...');
    const arrayBuffer = await fileData.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Check if it's a DOCX file (ZIP-based)
    const isDocx = uint8Array[0] === 0x50 && uint8Array[1] === 0x4B; // PK signature
    
    if (isDocx) {
      return await extractTextFromDocx(uint8Array);
    } 
      return await extractTextFromDoc(uint8Array);
    
    
  } catch (error) {
    console.error('❌ Word document text extraction failed:', error);
    return 'Word document text extraction encountered an error. The document may be corrupted or in an unsupported format.';
  }
}

// Extract text from DOCX files (ZIP-based XML)
async function extractTextFromDocx(uint8Array: Uint8Array): Promise<string> {
  try {
    // Convert to text and look for XML content
    const text = new TextDecoder('utf-8').decode(uint8Array);
    
    // Look for document.xml content (where text is stored in DOCX)
    const xmlContent: string[] = [];
    
    // Pattern 1: Extract text from <w:t> tags (Word text elements)
    const textElementPattern = /<w:t[^>]*>(.*?)<\/w:t>/gs;
    const textMatches = text.match(textElementPattern);
    if (textMatches) {
      textMatches.forEach(match => {
        const content = match.replace(/<\/?w:t[^>]*>/g, '')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'")
          .trim();
        if (content.length > 0) {
          xmlContent.push(content);
        }
      });
    }
    
    // Pattern 2: Look for any text between angle brackets (general XML text)
    if (xmlContent.length === 0) {
      const generalTextPattern = />([^<>{]+)</g;
      let match;
      while ((match = generalTextPattern.exec(text)) !== null) {
        const content = match[1].trim();
        if (content.length > 2 && 
            !content.match(/^[0-9\s.]+$/) && // Not just numbers
            !content.includes('xml') &&
            !content.includes('docx') &&
            !content.includes('word/')) {
          xmlContent.push(content);
        }
      }
    }
    
    // Pattern 3: Fallback - look for readable text strings
    if (xmlContent.length === 0) {
      console.log('📄 Using fallback text extraction for DOCX...');
      const readablePattern = /[A-Za-z][A-Za-z0-9\s.,;:!?()-]{10,}/g;
      const readableMatches = text.match(readablePattern);
      if (readableMatches) {
        readableMatches.forEach(match => {
          const content = match.trim();
          if (content.length > 10) {
            xmlContent.push(content);
          }
        });
      }
    }
    
    const finalText = xmlContent
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (finalText.length < 50) {
      console.log('⚠️ DOCX text extraction yielded minimal content');
      return 'DOCX text extraction found limited readable content. The document may be mostly formatting or images.';
    }
    
    console.log(`✅ DOCX text extraction completed: ${finalText.length} characters`);
    return finalText;
    
  } catch (error) {
    console.error('❌ DOCX text extraction failed:', error);
    return 'DOCX text extraction encountered an error during XML parsing.';
  }
}

// Extract text from legacy DOC files (binary format)
async function extractTextFromDoc(uint8Array: Uint8Array): Promise<string> {
  try {
    console.log('📄 Extracting text from legacy DOC file...');
    
    // Convert to text using various encodings
    const decoders = ['utf-8', 'latin1', 'windows-1252'];
    const extractedContent: string[] = [];
    
    for (const encoding of decoders) {
      try {
        const text = new TextDecoder(encoding).decode(uint8Array);
        
        // Look for readable text patterns in DOC binary
        const readablePattern = /[A-Za-z][A-Za-z0-9\s.,;:!?()-]{8,}/g;
        const matches = text.match(readablePattern);
        
        if (matches) {
          matches.forEach(match => {
            const content = match.trim();
            // Filter out binary noise
            if (content.length > 8 && 
                !content.includes('\x00') &&
                !content.includes('\xFF') &&
                content.match(/[a-zA-Z]/g)?.length > content.length * 0.7) {
              extractedContent.push(content);
            }
          });
        }
      } catch (decodingError) {
        // Continue with next encoding
        continue;
      }
    }
    
    // Remove duplicates and sort by length (longer strings likely to be real content)
    const uniqueContent = [...new Set(extractedContent)]
      .sort((a, b) => b.length - a.length)
      .slice(0, 100); // Take top 100 strings
    
    const finalText = uniqueContent
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (finalText.length < 50) {
      console.log('⚠️ DOC text extraction yielded minimal content');
      return 'DOC text extraction found limited readable content. The document may be corrupted or heavily formatted.';
    }
    
    console.log(`✅ DOC text extraction completed: ${finalText.length} characters`);
    return finalText;
    
  } catch (error) {
    console.error('❌ DOC text extraction failed:', error);
    return 'DOC text extraction encountered an error. Legacy DOC format may not be fully supported.';
  }
}

// Process CV text with Gemini API
async function processWithGemini(cvText: string): Promise<CVAnalysisResult> {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  
  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }

  const prompt = generateAnalysisPrompt(cvText);
  
  console.log('🤖 Calling Gemini API...');
  
  // Call Gemini API
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          maxOutputTokens: 65535,
          temperature: 1,
          topP: 1
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_NONE'
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_NONE'
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_NONE'
          },
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_NONE'
          }
        ]
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  
  if (!result.candidates || !result.candidates[0] || !result.candidates[0].content) {
    throw new Error('Invalid response from Gemini API');
  }

  const aiResponse = result.candidates[0].content.parts[0].text;
  
  // Parse JSON response
  try {
    const cleanedText = aiResponse.trim().replace(/```json\n?|\n?```/g, '');
    const analysis = JSON.parse(cleanedText);
    
    // Validate and set defaults
    return {
      personal_info: analysis.personal_info || {},
      education: analysis.education || [],
      work_experience: analysis.work_experience || [],
      skills: analysis.skills || { technical_skills: [], soft_skills: [], languages: [] },
      research: analysis.research || { publications: [], research_projects: [], conferences: [] },
      achievements: analysis.achievements || [],
      strengths: analysis.strengths || [],
      areas_for_improvement: analysis.areas_for_improvement || [],
      match_score: typeof analysis.match_score === 'number' ? analysis.match_score : 0.5
    };
  } catch (parseError) {
    console.error('Failed to parse Gemini response:', parseError);
    throw new Error('Invalid JSON response from AI analysis');
  }
}

// Generate analysis prompt for Gemini
function generateAnalysisPrompt(cvText: string): string {
  const wordCount = cvText.split(/\s+/).length;
  
  return `
You are an expert CV/Resume analyzer specializing in graduate school applications.

DOCUMENT CONTEXT:
- Word Count: ${wordCount}
- Document Type: CV/Resume

ANALYSIS INSTRUCTIONS:
Analyze the following CV text and extract structured information with high attention to detail.

CV Text:
${cvText}

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

Return only the JSON response, no additional text.`;
}