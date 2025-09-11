/**
 * ChatGPT Service (Azure OpenAI)
 * 
 * Unified service for all AI functionality using ChatGPT API
 * Based on your existing Azure OpenAI configuration
 */

interface ChatGPTConfig {
  apiKey: string;
  endpoint: string;
  model: string;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class ChatGPTService {
  private static getConfig(): ChatGPTConfig {
    const apiKey = import.meta.env.VITE_AZURE_OPENAI_API_KEY || import.meta.env.VITE_OPENAI_API_KEY;
    const endpoint = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT || import.meta.env.VITE_OPENAI_ENDPOINT;
    
    if (!apiKey || !endpoint) {
      throw new Error('AI API configuration is required. Please set VITE_AZURE_OPENAI_API_KEY and VITE_AZURE_OPENAI_ENDPOINT in your environment variables.');
    }
    
    return {
      apiKey,
      endpoint,
      model: 'gpt-4o-mini'
    };
  }

  /**
   * Make AI API call - requires proper configuration
   */
  private static async callAPI(messages: ChatMessage[], maxTokens = 500, temperature = 0.1): Promise<string> {
    const config = this.getConfig(); // Will throw error if not configured
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // Increased timeout

    try {
      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': config.apiKey,
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          messages,
          temperature,
          top_p: 0.95,
          max_tokens: maxTokens,
          model: config.model
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content received from API response');
      }
      
      return content;

    } catch (error) {
      clearTimeout(timeoutId);
      
      // Provide more specific error messages
      if (error.name === 'AbortError') {
        const timeoutError = new Error('ChatGPT analysis timed out after 30 seconds. This may be due to high server load. Please try again.');
        console.error('❌ AI API call timed out:', timeoutError.message);
        throw timeoutError;
      }
      
      if (error.message.includes('fetch')) {
        const networkError = new Error('Unable to connect to AI service. Please check your internet connection and try again.');
        console.error('❌ AI API network error:', networkError.message);
        throw networkError;
      }
      
      console.error('❌ AI API call failed:', error);
      throw error;
    }
  }

  /**
   * Fast University Matching (10 second max)
   */
  static async getUniversityMatches(userProfile: any): Promise<any[]> {
    console.log('🎯 AI-powered university matching...');
    
    const prompt = `Based on this student profile, recommend 5-8 universities with specific programs:

STUDENT PROFILE:
- GPA: ${userProfile.gpa || 'Not specified'}
- Field: ${userProfile.targetDegree || 'Not specified'}
- Research Interests: ${(userProfile.researchInterests || []).join(', ') || 'Not specified'}
- Experience: ${userProfile.experience || 'General background'}
- Location Preference: ${userProfile.locationPreference || 'Open to all locations'}

Return ONLY a JSON array with detailed university matches:
[
  {
    "university": "Stanford University",
    "program": "MS in Computer Science",
    "score": 85,
    "category": "reach",
    "reason": "Detailed explanation of fit",
    "requirements": ["GRE: 320+", "GPA: 3.7+", "Research experience"],
    "location": "Stanford, CA",
    "tuition": "$58,000/year",
    "admissionRate": "6%"
  }
]`;

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are a graduate school admissions expert. Analyze the student profile and recommend universities with detailed reasoning. Return only valid JSON array with no additional text.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    const response = await this.callAPI(messages, 1500, 0.1);
    
    // Extract and parse JSON
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    throw new Error('Failed to parse university recommendations from AI response');
  }

  /**
   * Comprehensive CV Analysis - requires real AI API
   */
  static async analyzeCVContent(cvText: string): Promise<any> {
    console.log('🤖 Starting AI-powered CV analysis...');
    console.log(`📊 CV Text Length: ${cvText.length} characters`);
    
    if (cvText.length < 100) {
      throw new Error('CV text is too short for meaningful analysis. Please ensure the PDF was properly parsed.');
    }
    
    const prompt = `Analyze this CV/Resume comprehensively and extract ALL information. Provide detailed recommendations for graduate school applications.

IMPORTANT: Extract ONLY the information that is actually present in the CV. Do not make up or assume information that is not explicitly stated.

CV CONTENT:
${cvText}

Return a comprehensive JSON object with ALL data extracted exactly as it appears in the CV:
{
  "personalInfo": {
    "name": "Extract full name from CV",
    "email": "Extract email address",
    "phone": "Extract phone number", 
    "location": "Extract address/location",
    "linkedin": "Extract LinkedIn URL if present",
    "website": "Extract personal website if present",
    "github": "Extract GitHub profile if present",
    "summary": "Extract professional summary or objective if present"
  },
  "education": [
    {
      "institution": "Extract university/school name",
      "degree": "Extract degree type (BS, MS, PhD, etc.)",
      "field": "Extract field of study/major",
      "gpa": "Extract GPA if mentioned (as number)",
      "graduationYear": "Extract graduation year (as number)",
      "startYear": "Extract start year if mentioned (as number)",
      "location": "Extract school location if mentioned",
      "honors": ["Extract any honors, dean's list, cum laude, etc."],
      "coursework": ["Extract relevant coursework if listed"],
      "thesis": "Extract thesis title if mentioned"
    }
  ],
  "experience": [
    {
      "title": "Extract job title/position",
      "company": "Extract company/organization name",
      "location": "Extract work location if mentioned",
      "duration": "Extract duration as written (e.g., 'Jan 2023 - Present')",
      "startDate": "Extract start date",
      "endDate": "Extract end date or 'Present'",
      "description": "Extract job description/responsibilities",
      "achievements": ["Extract quantified achievements and accomplishments"],
      "technologies": ["Extract technologies/tools used if mentioned"],
      "type": "Determine if full-time, part-time, internship, etc."
    }
  ],
  "skills": {
    "technical": ["Extract technical skills, programming languages, software"],
    "tools": ["Extract tools, IDE, frameworks mentioned"],
    "languages": ["Extract spoken languages with proficiency if mentioned"],
    "soft": ["Extract soft skills if explicitly mentioned"],
    "certifications": ["Extract certifications, licenses if mentioned"]
  },
  "projects": [
    {
      "name": "Extract project name",
      "description": "Extract project description",
      "technologies": ["Extract technologies used"],
      "duration": "Extract project duration if mentioned",
      "url": "Extract project URL/GitHub if mentioned",
      "achievements": ["Extract project outcomes, users, impact if mentioned"]
    }
  ],
  "publications": [
    {
      "title": "Extract publication title",
      "authors": ["Extract author names"],
      "venue": "Extract journal/conference name",
      "year": "Extract publication year",
      "url": "Extract DOI/URL if present"
    }
  ],
  "researchAreas": ["Extract research interests/areas mentioned"],
  "awards": ["Extract awards, scholarships, recognition mentioned"],
  "extracurricular": ["Extract clubs, organizations, volunteer work"],
  "recommendations": {
    "strengthAreas": [
      "Analyze and identify 3-5 key strengths based on the CV content"
    ],
    "weaknessAreas": [
      "Identify 2-3 areas that could be improved for graduate applications"
    ],
    "suggestedImprovements": [
      "Provide 3-5 specific, actionable recommendations for improvement"
    ],
    "careerAdvice": [
      "Provide 3-4 pieces of career advice based on their background"
    ],
    "universityRecommendations": [
      {
        "universityName": "Recommend specific universities based on their profile",
        "program": "Recommend specific programs that fit",
        "matchReason": "Explain why this university/program is a good fit",
        "category": "reach/target/safety classification",
        "requirements": ["List specific requirements for this program"]
      }
    ]
  },
  "metadata": {
    "confidenceScore": "Rate 1-100 how confident you are in the extraction accuracy",
    "completenessScore": "Rate 1-100 how complete their CV appears",
    "qualityIssues": ["List any issues or missing elements you notice"]
  }
}

CRITICAL: Return ONLY the JSON object. No additional text, explanations, or formatting.`;

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are an expert CV analyzer for graduate school applications. Extract ONLY the information explicitly present in the CV text. Do not fabricate or assume information. Return only valid JSON with no additional text.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    const response = await this.callAPI(messages, 4000, 0.1);
    
    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI did not return valid JSON format');
    }

    try {
      const analysisResult = JSON.parse(jsonMatch[0]);
      console.log('✅ CV analysis completed successfully');
      return analysisResult;
    } catch (parseError) {
      throw new Error('Failed to parse AI response as JSON: ' + parseError);
    }
  }


  /**
   * Chat Response for general queries
   */
  static async getChatResponse(message: string, context?: any): Promise<string> {
    console.log('💬 AI chat response...');
    
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are a knowledgeable graduate school advisor. Provide helpful, accurate, and practical advice based on current admissions trends and requirements.'
      },
      {
        role: 'user',
        content: message
      }
    ];

    return await this.callAPI(messages, 500, 0.3);
  }

  /**
   * Generate detailed match reasoning
   */
  static async generateMatchReasoning(university: string, program: string, userProfile: any): Promise<string> {
    const prompt = `Explain why ${university}'s ${program} program would be a good match for a student with:
- GPA: ${userProfile.gpa || 'Not specified'}
- Research Interests: ${userProfile.researchInterests?.join(', ') || 'Not specified'}
- Background: ${userProfile.field || 'General'}

Provide a detailed 2-3 sentence explanation focusing on program strengths, research opportunities, and admission requirements.`;
    
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are a graduate admissions expert. Provide specific, accurate information about university programs and their fit for students.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    return await this.callAPI(messages, 300, 0.2);
  }

  /**
   * Application recommendations
   */
  static async getApplicationRecommendations(userProfile: any): Promise<string[]> {
    const prompt = `Provide 5 specific application tips for a graduate school applicant with:
- GPA: ${userProfile.gpa || 'Not specified'}
- Field: ${userProfile.targetDegree || 'Not specified'}
- Background: ${userProfile.experience || 'General'}

Return ONLY a JSON array of strings with actionable advice.
Example: ["Tip 1", "Tip 2", "Tip 3", "Tip 4", "Tip 5"]`;
    
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are a graduate admissions consultant. Provide specific, actionable advice. Return only a JSON array of strings.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    const response = await this.callAPI(messages, 400, 0.2);
    
    // Parse JSON response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // If JSON parsing fails, split by common delimiters
    return response.split(/[,\n]/).map(tip => tip.trim()).filter(tip => tip.length > 0).slice(0, 5);
  }

  /**
   * Health check - verify API connectivity
   */
  static async healthCheck(): Promise<boolean> {
    try {
      const response = await this.getChatResponse("Hello");
      return response.length > 10; // Expect meaningful response
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}

export default ChatGPTService;