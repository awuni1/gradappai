/**
 * University Response Parser Service
 * 
 * Handles parsing of AI responses (particularly Gemini API) and converts them
 * to the university card format for inline rendering in chat.
 */

export interface GeminiUniversityResponse {
  name: string;
  program: string;
  location: string;
  match_score: number;
  category: 'reach' | 'target' | 'safety';
  ranking?: string;
  why_recommended: string[];
  concerns?: string[];
  logo_url?: string;
  website_url?: string;
  application_deadline?: string;
  tuition_fee?: string;
  admission_requirements?: {
    gpa_requirement?: string;
    gre_requirement?: string;
    toefl_requirement?: string;
    ielts_requirement?: string;
  };
  research_areas?: string[];
  faculty_highlights?: string[];
}

export interface GeminiCVAnalysisResponse {
  user_profile: {
    academic_background: string;
    gpa: string;
    test_scores: {
      gre?: string;
      toefl?: string;
      ielts?: string;
    };
    research_experience: string[];
    work_experience: string[];
    skills: string[];
    research_interests: string[];
  };
  recommendations: {
    strengths: string[];
    weaknesses: string[];
    improvement_suggestions: string[];
    recommended_programs: string[];
    application_strategy: string;
  };
  university_matches: GeminiUniversityResponse[];
}

export interface ParsedUniversityData {
  universities: GeminiUniversityResponse[];
  analysis?: {
    total_matches: number;
    reach_schools: number;
    target_schools: number;
    safety_schools: number;
    primary_field: string;
    confidence_score: number;
  };
}

/**
 * University Response Parser Service
 */
export class UniversityResponseParser {
  /**
   * Parse Gemini API response for university recommendations
   */
  static parseUniversityResponse(response: string | object): ParsedUniversityData | null {
    try {
      console.log('🔍 Parsing university response:', typeof response, response);

      let parsedData: any;

      // Handle string responses (JSON strings)
      if (typeof response === 'string') {
        // Try to extract JSON from markdown code blocks
        const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[1]);
        } else {
          // Try to parse as direct JSON
          parsedData = JSON.parse(response);
        }
      } else {
        // Handle object responses
        parsedData = response;
      }

      // Validate and normalize the data structure
      return this.normalizeUniversityData(parsedData);

    } catch (error) {
      console.error('❌ Error parsing university response:', error);
      return null;
    }
  }

  /**
   * Parse CV analysis response from Gemini API
   */
  static parseCVAnalysisResponse(response: string | object): GeminiCVAnalysisResponse | null {
    try {
      console.log('🎓 Parsing CV analysis response:', typeof response);

      let parsedData: any;

      if (typeof response === 'string') {
        const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[1]);
        } else {
          parsedData = JSON.parse(response);
        }
      } else {
        parsedData = response;
      }

      // Validate CV analysis structure
      if (!parsedData.user_profile || !parsedData.recommendations) {
        console.warn('⚠️ Invalid CV analysis structure');
        return null;
      }

      return parsedData as GeminiCVAnalysisResponse;

    } catch (error) {
      console.error('❌ Error parsing CV analysis response:', error);
      return null;
    }
  }

  /**
   * Normalize university data to ensure consistent structure
   */
  private static normalizeUniversityData(data: any): ParsedUniversityData | null {
    try {
      let universities: GeminiUniversityResponse[] = [];

      // Handle different response structures
      if (data.universities && Array.isArray(data.universities)) {
        universities = data.universities;
      } else if (data.university_matches && Array.isArray(data.university_matches)) {
        universities = data.university_matches;
      } else if (Array.isArray(data)) {
        universities = data;
      } else if (data.recommendations && Array.isArray(data.recommendations)) {
        universities = data.recommendations;
      } else {
        console.warn('⚠️ No universities array found in response');
        return null;
      }

      // Normalize each university entry
      const normalizedUniversities = universities.map(uni => this.normalizeUniversityEntry(uni));

      // Generate analysis if not provided
      const analysis = data.analysis || this.generateAnalysis(normalizedUniversities);

      return {
        universities: normalizedUniversities,
        analysis
      };

    } catch (error) {
      console.error('❌ Error normalizing university data:', error);
      return null;
    }
  }

  /**
   * Normalize individual university entry
   */
  private static normalizeUniversityEntry(uni: any): GeminiUniversityResponse {
    return {
      name: uni.name || uni.university_name || uni.institution || 'Unknown University',
      program: uni.program || uni.program_name || uni.degree || 'Unknown Program',
      location: uni.location || uni.city_country || uni.address || 'Unknown Location',
      match_score: this.normalizeMatchScore(uni.match_score || uni.compatibility || uni.fit_score || 75),
      category: this.normalizeCategory(uni.category || uni.type || uni.school_type || 'target'),
      ranking: uni.ranking || uni.rank || uni.university_ranking,
      why_recommended: Array.isArray(uni.why_recommended) 
        ? uni.why_recommended 
        : (uni.strengths || uni.reasons || [uni.why_recommended || 'Good academic fit']).filter(Boolean),
      concerns: Array.isArray(uni.concerns) 
        ? uni.concerns 
        : (uni.weaknesses || uni.challenges || [uni.concerns]).filter(Boolean),
      logo_url: uni.logo_url || uni.image_url || uni.logo,
      website_url: uni.website_url || uni.website || uni.url,
      application_deadline: uni.application_deadline || uni.deadline,
      tuition_fee: uni.tuition_fee || uni.tuition || uni.cost,
      admission_requirements: {
        gpa_requirement: uni.admission_requirements?.gpa_requirement || uni.gpa_requirement,
        gre_requirement: uni.admission_requirements?.gre_requirement || uni.gre_requirement,
        toefl_requirement: uni.admission_requirements?.toefl_requirement || uni.toefl_requirement,
        ielts_requirement: uni.admission_requirements?.ielts_requirement || uni.ielts_requirement,
      },
      research_areas: Array.isArray(uni.research_areas) ? uni.research_areas : [],
      faculty_highlights: Array.isArray(uni.faculty_highlights) ? uni.faculty_highlights : []
    };
  }

  /**
   * Normalize match score to percentage (0-100)
   */
  private static normalizeMatchScore(score: any): number {
    const numScore = parseFloat(score);
    if (isNaN(numScore)) {return 75;} // Default score
    
    // If score is between 0-1, convert to percentage
    if (numScore <= 1) {return Math.round(numScore * 100);}
    
    // If score is already percentage, clamp to 0-100
    return Math.min(Math.max(Math.round(numScore), 0), 100);
  }

  /**
   * Normalize category to valid options
   */
  private static normalizeCategory(category: any): 'reach' | 'target' | 'safety' {
    const cat = String(category).toLowerCase();
    if (cat.includes('reach') || cat.includes('stretch') || cat.includes('ambitious')) {return 'reach';}
    if (cat.includes('safety') || cat.includes('safe') || cat.includes('backup')) {return 'safety';}
    return 'target'; // Default
  }

  /**
   * Generate analysis from university data
   */
  private static generateAnalysis(universities: GeminiUniversityResponse[]): any {
    const reach_schools = universities.filter(uni => uni.category === 'reach').length;
    const target_schools = universities.filter(uni => uni.category === 'target').length;
    const safety_schools = universities.filter(uni => uni.category === 'safety').length;

    // Extract primary field from programs
    const programs = universities.map(uni => uni.program);
    const primaryField = this.extractPrimaryField(programs);

    // Calculate confidence score based on distribution
    const totalSchools = universities.length;
    const hasBalancedDistribution = reach_schools > 0 && target_schools > 0 && safety_schools > 0;
    const confidence_score = hasBalancedDistribution ? 85 : 70;

    return {
      total_matches: totalSchools,
      reach_schools,
      target_schools,
      safety_schools,
      primary_field: primaryField,
      confidence_score
    };
  }

  /**
   * Extract primary field from program names
   */
  private static extractPrimaryField(programs: string[]): string {
    const fieldCounts: Record<string, number> = {};
    
    programs.forEach(program => {
      const field = this.extractFieldFromProgram(program);
      fieldCounts[field] = (fieldCounts[field] || 0) + 1;
    });

    // Return most common field
    return Object.entries(fieldCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Graduate Studies';
  }

  /**
   * Extract field from program name
   */
  private static extractFieldFromProgram(program: string): string {
    const lower = program.toLowerCase();
    
    if (lower.includes('computer science') || lower.includes('cs')) {return 'Computer Science';}
    if (lower.includes('engineering')) {return 'Engineering';}
    if (lower.includes('business') || lower.includes('mba')) {return 'Business';}
    if (lower.includes('medicine') || lower.includes('medical')) {return 'Medicine';}
    if (lower.includes('law')) {return 'Law';}
    if (lower.includes('psychology')) {return 'Psychology';}
    if (lower.includes('biology') || lower.includes('bio')) {return 'Biology';}
    if (lower.includes('physics')) {return 'Physics';}
    if (lower.includes('chemistry')) {return 'Chemistry';}
    if (lower.includes('mathematics') || lower.includes('math')) {return 'Mathematics';}
    
    return 'Graduate Studies';
  }

  /**
   * Create mock university data for testing
   */
  static createMockUniversityResponse(): ParsedUniversityData {
    return {
      universities: [
        {
          name: 'Stanford University',
          program: 'MS in Computer Science',
          location: 'Stanford, CA, USA',
          match_score: 98,
          category: 'reach',
          ranking: '#2 in Computer Science',
          why_recommended: [
            'Your strong academic background aligns with their requirements',
            'Excellent research opportunities in AI/ML',
            'Strong industry connections in Silicon Valley'
          ],
          concerns: [
            'Highly competitive (5% acceptance rate)',
            'Very expensive tuition'
          ],
          logo_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=200&fit=crop',
          website_url: 'https://www.stanford.edu',
          application_deadline: 'December 15, 2024',
          tuition_fee: '$58,080/year',
          admission_requirements: {
            gpa_requirement: '3.7+',
            gre_requirement: '320+',
            toefl_requirement: '100+',
            ielts_requirement: '7.0+'
          },
          research_areas: ['Artificial Intelligence', 'Machine Learning', 'Computer Vision'],
          faculty_highlights: ['Prof. Andrew Ng', 'Prof. Fei-Fei Li']
        },
        {
          name: 'University of Washington',
          program: 'MS in Computer Science',
          location: 'Seattle, WA, USA',
          match_score: 85,
          category: 'target',
          ranking: '#8 in Computer Science',
          why_recommended: [
            'Good match for your GPA range',
            'Strong industry connections with Microsoft, Amazon',
            'Excellent research in systems and theory'
          ],
          concerns: [
            'Competitive for out-of-state students'
          ],
          logo_url: 'https://images.unsplash.com/photo-1564981797816-1043664bf78d?w=400&h=200&fit=crop',
          website_url: 'https://www.washington.edu',
          application_deadline: 'December 31, 2024',
          tuition_fee: '$42,000/year',
          admission_requirements: {
            gpa_requirement: '3.5+',
            gre_requirement: '315+',
            toefl_requirement: '92+',
            ielts_requirement: '6.5+'
          },
          research_areas: ['Systems', 'Programming Languages', 'Database Systems'],
          faculty_highlights: ['Prof. Ed Lazowska', 'Prof. Magdalena Balazinska']
        },
        {
          name: 'University of California, Irvine',
          program: 'MS in Computer Science',
          location: 'Irvine, CA, USA',
          match_score: 78,
          category: 'safety',
          ranking: '#25 in Computer Science',
          why_recommended: [
            'Your profile exceeds their typical requirements',
            'Good funding opportunities for research assistantships',
            'Strong program in software engineering'
          ],
          concerns: [
            'Lower research ranking than other choices'
          ],
          logo_url: 'https://images.unsplash.com/photo-1562774053-701939374585?w=400&h=200&fit=crop',
          website_url: 'https://www.uci.edu',
          application_deadline: 'January 15, 2025',
          tuition_fee: '$28,000/year',
          admission_requirements: {
            gpa_requirement: '3.2+',
            gre_requirement: '310+',
            toefl_requirement: '80+',
            ielts_requirement: '6.0+'
          },
          research_areas: ['Software Engineering', 'Human-Computer Interaction', 'Security'],
          faculty_highlights: ['Prof. Andre van der Hoek', 'Prof. Crista Lopes']
        }
      ],
      analysis: {
        total_matches: 3,
        reach_schools: 1,
        target_schools: 1,
        safety_schools: 1,
        primary_field: 'Computer Science',
        confidence_score: 85
      }
    };
  }
}

/**
 * Utility functions for response parsing
 */
export const universityResponseUtils = {
  /**
   * Convert university data to database format
   */
  convertToDbFormat: (universities: GeminiUniversityResponse[], conversationId: string, messageId: string) => {
    return {
      conversation_id: conversationId,
      message_id: messageId,
      country: 'Multiple', // Extract from location data
      universities: universities,
      filters_applied: {
        field: universityResponseUtils.extractPrimaryField(universities),
        level: universityResponseUtils.extractProgramLevel(universities)
      },
      recommendation_type: 'ai_generated'
    };
  },

  /**
   * Extract primary field from universities
   */
  extractPrimaryField: (universities: GeminiUniversityResponse[]): string => {
    const programs = universities.map(uni => uni.program);
    return UniversityResponseParser.extractPrimaryField(programs);
  },

  /**
   * Extract program level (MS, PhD, etc.)
   */
  extractProgramLevel: (universities: GeminiUniversityResponse[]): string => {
    const programs = universities.map(uni => uni.program.toLowerCase());
    
    if (programs.some(p => p.includes('phd') || p.includes('ph.d'))) {return 'PhD';}
    if (programs.some(p => p.includes('masters') || p.includes('ms') || p.includes('m.s'))) {return 'MS';}
    if (programs.some(p => p.includes('mba'))) {return 'MBA';}
    
    return 'Graduate';
  },

  /**
   * Validate university response structure
   */
  validateResponse: (data: any): boolean => {
    try {
      if (!data) {return false;}
      
      const universities = data.universities || data.university_matches || data;
      if (!Array.isArray(universities)) {return false;}
      
      return universities.every(uni => 
        uni.name && uni.program && uni.location && typeof uni.match_score === 'number'
      );
    } catch {
      return false;
    }
  }
};

export default UniversityResponseParser;