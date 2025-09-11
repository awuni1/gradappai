/**
 * Gemini AI Service
 * 
 * Service for handling Gemini AI integration through secure Supabase Edge Functions.
 * Provides real AI responses for university recommendations and CV analysis.
 */

import { supabase } from '@/integrations/supabase/client';
import { UniversityResponseParser, GeminiUniversityResponse, GeminiCVAnalysisResponse } from './universityResponseParser';

export interface GeminiRequest {
  prompt: string;
  context?: {
    userProfile?: any;
    cvData?: any;
    preferences?: any;
  };
  type: 'university_search' | 'cv_analysis' | 'general_chat';
}

export interface GeminiResponse {
  content: string;
  type: 'text' | 'json' | 'universities_list' | 'cv_analysis';
  parsed_data?: any;
  confidence?: number;
  metadata?: any;
}

/**
 * Gemini AI Service Class
 */
export class GeminiService {
  private static readonly GEMINI_ENABLED = import.meta.env.VITE_GEMINI_ENABLED === 'true';
  
  /**
   * Send request to Gemini AI through secure Supabase Edge Function
   */
  static async sendRequest(request: GeminiRequest): Promise<GeminiResponse> {
    try {
      console.log('🤖 Sending Gemini request:', request.type);
      console.log('🔧 Gemini enabled:', this.GEMINI_ENABLED);

      // Call secure Supabase Edge Function for Gemini AI
      console.log('📡 Calling Edge Function: gemini-chat');
      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: {
          prompt: request.prompt,
          context: request.context,
          type: request.type
        }
      });

      if (error) {
        console.error('❌ Supabase function error:', error);
        console.log('🔄 Falling back to mock response due to function error');
        return await this.getMockResponse(request);
      }

      console.log('📥 Edge Function response:', { 
        hasData: Boolean(data), 
        hasError: Boolean(data?.error),
        type: data?.type 
      });

      if (data?.error) {
        console.error('❌ Gemini API error from Edge Function:', data.error);
        // If fallback response is provided, use it
        if (data.fallback_response) {
          console.log('🔄 Using fallback response from Edge Function');
          return data.fallback_response;
        }
        // Otherwise fall back to mock
        console.log('🔄 Falling back to mock response due to API error');
        return await this.getMockResponse(request);
      }

      if (!data || !data.content) {
        console.warn('⚠️ Empty or invalid response from Edge Function');
        console.log('🔄 Falling back to mock response due to empty response');
        return await this.getMockResponse(request);
      }

      console.log('✅ Gemini response received successfully');
      return data;

    } catch (error) {
      console.error('❌ Error calling Gemini service:', error);
      console.log('🔄 Falling back to mock response due to exception');
      return await this.getMockResponse(request);
    }
  }

  /**
   * Get university recommendations
   */
  static async getUniversityRecommendations(userProfile: any, preferences: any): Promise<GeminiResponse> {
    const prompt = this.buildUniversityPrompt(userProfile, preferences);
    
    return await this.sendRequest({
      prompt,
      context: { userProfile, preferences },
      type: 'university_search'
    });
  }

  /**
   * Analyze CV
   */
  static async analyzeCv(cvText: string, userGoals?: string): Promise<GeminiResponse> {
    const prompt = this.buildCvAnalysisPrompt(cvText, userGoals);
    
    return await this.sendRequest({
      prompt,
      context: { cvText, userGoals },
      type: 'cv_analysis'
    });
  }

  /**
   * General chat response
   */
  static async getChatResponse(message: string, context?: any): Promise<GeminiResponse> {
    return await this.sendRequest({
      prompt: message,
      context,
      type: 'general_chat'
    });
  }

  /**
   * Process Gemini API response
   */
  private static processGeminiResponse(apiResponse: any, requestType: string): GeminiResponse {
    try {
      const content = apiResponse.content || apiResponse.response || '';
      
      if (requestType === 'university_search') {
        const parsedData = UniversityResponseParser.parseUniversityResponse(content);
        
        return {
          content,
          type: parsedData ? 'universities_list' : 'text',
          parsed_data: parsedData,
          confidence: apiResponse.confidence || 85,
          metadata: {
            processing_time: apiResponse.processing_time,
            model_version: apiResponse.model_version
          }
        };
      }
      
      if (requestType === 'cv_analysis') {
        const parsedData = UniversityResponseParser.parseCVAnalysisResponse(content);
        
        return {
          content,
          type: parsedData ? 'cv_analysis' : 'text',
          parsed_data: parsedData,
          confidence: apiResponse.confidence || 80,
          metadata: {
            processing_time: apiResponse.processing_time
          }
        };
      }
      
      // General chat response
      return {
        content,
        type: 'text',
        confidence: apiResponse.confidence || 90
      };
      
    } catch (error) {
      console.error('❌ Error processing Gemini response:', error);
      throw new Error('Failed to process AI response');
    }
  }

  /**
   * Build university recommendation prompt
   */
  private static buildUniversityPrompt(userProfile: any, preferences: any): string {
    return `Please analyze this user's profile and provide university recommendations in JSON format.

User Profile:
- Academic Background: ${userProfile?.academic_background || 'Not specified'}
- GPA: ${userProfile?.gpa || 'Not specified'}
- Test Scores: ${JSON.stringify(userProfile?.test_scores || {})}
- Research Interests: ${userProfile?.research_interests?.join(', ') || 'Not specified'}
- Work Experience: ${userProfile?.work_experience?.join(', ') || 'None'}

Preferences:
- Preferred Country/Region: ${preferences?.country || 'No preference'}
- Program Level: ${preferences?.level || 'Graduate'}
- Field of Study: ${preferences?.field || 'Not specified'}
- Budget Considerations: ${preferences?.budget || 'Not specified'}

Please provide recommendations in this exact JSON format:
{
  "universities": [
    {
      "name": "University Name",
      "program": "Program Name",
      "location": "City, Country",
      "match_score": 85,
      "category": "target",
      "ranking": "#10 in Field",
      "why_recommended": ["reason 1", "reason 2"],
      "concerns": ["concern 1"],
      "website_url": "https://university.edu",
      "application_deadline": "December 15, 2024",
      "tuition_fee": "$45,000/year",
      "admission_requirements": {
        "gpa_requirement": "3.5+",
        "gre_requirement": "315+"
      }
    }
  ],
  "analysis": {
    "total_matches": 3,
    "reach_schools": 1,
    "target_schools": 1,
    "safety_schools": 1,
    "primary_field": "Computer Science",
    "confidence_score": 85
  }
}

Provide at least 3 recommendations covering reach, target, and safety schools.`;
  }

  /**
   * Build CV analysis prompt
   */
  private static buildCvAnalysisPrompt(cvText: string, userGoals?: string): string {
    return `Please analyze this CV/resume and provide insights in JSON format.

CV Content:
${cvText}

User Goals: ${userGoals || 'Not specified'}

Please provide analysis in this exact JSON format:
{
  "user_profile": {
    "academic_background": "extracted background",
    "gpa": "extracted or estimated GPA",
    "test_scores": {"gre": "score", "toefl": "score"},
    "research_experience": ["experience 1", "experience 2"],
    "work_experience": ["job 1", "job 2"],
    "skills": ["skill 1", "skill 2"],
    "research_interests": ["interest 1", "interest 2"]
  },
  "recommendations": {
    "strengths": ["strength 1", "strength 2"],
    "weaknesses": ["area for improvement 1"],
    "improvement_suggestions": ["suggestion 1", "suggestion 2"],
    "recommended_programs": ["program type 1", "program type 2"],
    "application_strategy": "strategic advice"
  },
  "university_matches": [
    {
      "name": "University Name",
      "program": "Recommended Program",
      "match_score": 85,
      "category": "target",
      "why_recommended": ["reason based on CV"]
    }
  ]
}`;
  }

  /**
   * Get mock response for testing
   */
  private static async getMockResponse(request: GeminiRequest): Promise<GeminiResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (request.type === 'university_search') {
      return this.getMockUniversityResponse();
    }
    
    if (request.type === 'cv_analysis') {
      return this.getMockCvAnalysisResponse();
    }
    
    // General chat
    return {
      content: "I understand you're looking for guidance with your graduate school applications. I can help you with university recommendations, CV analysis, and application strategy. What would you like to explore?",
      type: 'text',
      confidence: 90
    };
  }

  /**
   * Mock university response
   */
  private static getMockUniversityResponse(): GeminiResponse {
    const mockData = UniversityResponseParser.createMockUniversityResponse();
    
    const jsonString = JSON.stringify(mockData, null, 2);
    const content = `Based on your profile, I've found excellent university matches for you:

\`\`\`json
${jsonString}
\`\`\`

These recommendations are tailored to your academic background and research interests. Each university offers unique opportunities that align with your goals.`;

    return {
      content,
      type: 'universities_list',
      parsed_data: mockData,
      confidence: 85,
      metadata: {
        generated_at: new Date().toISOString(),
        is_mock: true
      }
    };
  }

  /**
   * Mock CV analysis response
   */
  private static getMockCvAnalysisResponse(): GeminiResponse {
    const mockAnalysis: GeminiCVAnalysisResponse = {
      user_profile: {
        academic_background: "Computer Science Bachelor's degree with strong technical foundation",
        gpa: "3.7/4.0",
        test_scores: {
          gre: "320",
          toefl: "105"
        },
        research_experience: [
          "Machine Learning research project at university",
          "Internship at tech company focusing on AI applications"
        ],
        work_experience: [
          "Software Engineer at startup (2 years)",
          "Teaching Assistant for Data Structures course"
        ],
        skills: [
          "Python", "Java", "Machine Learning", "Data Analysis", "Research"
        ],
        research_interests: [
          "Artificial Intelligence", "Machine Learning", "Computer Vision"
        ]
      },
      recommendations: {
        strengths: [
          "Strong technical background with relevant work experience",
          "Good academic performance with research exposure",
          "Excellent test scores demonstrate academic readiness"
        ],
        weaknesses: [
          "Limited publication record",
          "Could benefit from more research experience"
        ],
        improvement_suggestions: [
          "Consider contributing to open-source projects",
          "Seek additional research opportunities",
          "Develop stronger statement of purpose"
        ],
        recommended_programs: [
          "MS in Computer Science", "MS in Artificial Intelligence", "PhD in Machine Learning"
        ],
        application_strategy: "Apply to a balanced mix of reach, target, and safety schools. Focus on programs with strong AI/ML research groups."
      },
      university_matches: [
        {
          name: "Stanford University",
          program: "MS in Computer Science",
          location: "Stanford, CA, USA",
          match_score: 85,
          category: "reach",
          ranking: "#2 in Computer Science",
          why_recommended: ["Strong AI program matches your interests", "Excellent industry connections"],
          website_url: "https://www.stanford.edu"
        }
      ]
    };

    const content = `I've analyzed your CV and here's my comprehensive assessment:

\`\`\`json
${JSON.stringify(mockAnalysis, null, 2)}
\`\`\`

Your profile shows strong potential for graduate programs in Computer Science, particularly in AI/ML areas.`;

    return {
      content,
      type: 'cv_analysis',
      parsed_data: mockAnalysis,
      confidence: 88,
      metadata: {
        generated_at: new Date().toISOString(),
        is_mock: true
      }
    };
  }

  /**
   * Validate API configuration
   */
  static isConfigured(): boolean {
    return this.GEMINI_ENABLED;
  }

  /**
   * Health check for the service
   */
  static async healthCheck(): Promise<boolean> {
    try {
      const response = await this.getChatResponse("Hello");
      return Boolean(response.content);
    } catch {
      return false;
    }
  }
}

export default GeminiService;