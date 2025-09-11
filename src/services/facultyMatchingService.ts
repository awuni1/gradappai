import { supabase } from "@/integrations/supabase/client";

// Types for faculty matching system
export interface ResearchProfile {
  primaryInterests: string[];
  keywords: string[];
  applicationAreas: string[];
  methodologies: string[];
}

export interface FacultyProfile {
  id: string;
  name: string;
  university: string;
  department?: string;
  email?: string;
  researchKeywords: string[];
  researchDescription?: string;
  publicationsCount?: number;
  hIndex?: number;
  acceptingStudents: boolean;
  contactPreference?: string;
  officeLocation?: string;
  websiteUrl?: string;
  profileImageUrl?: string;
}

export interface FacultyMatch {
  professor: FacultyProfile;
  matchScore: number;
  matchingKeywords: string[];
  researchAlignment: {
    primaryMatch: number;
    secondaryMatch: number;
    methodologyMatch: number;
    applicationMatch: number;
  };
  contactStatus: 'not_contacted' | 'interested' | 'contacted' | 'responded' | 'rejected';
  availability: 'accepting' | 'not_accepting' | 'unknown';
  relevantPublications?: string[];
}

export interface ContactStatus {
  facultyId: string;
  status: 'not_contacted' | 'interested' | 'contacted' | 'responded' | 'rejected';
  contactDate?: string;
  responseDate?: string;
  notes?: string;
}

class FacultyMatchingService {
  
  /**
   * Find faculty members at a specific university that match user's research interests
   */
  async findMatchedFaculty(
    university: string, 
    userResearchProfile: ResearchProfile
  ): Promise<FacultyMatch[]> {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) {
        throw new Error("Not authenticated");
      }

      // Get faculty data from matched_professors table filtered by university
      const { data: facultyData, error } = await supabase
        .from('matched_professors')
        .select('*')
        .eq('university', university)
        .eq('user_id', user.user.id);

      if (error) {
        console.error('Error fetching faculty:', error);
        return [];
      }

      if (!facultyData || facultyData.length === 0) {
        // Generate mock faculty data if none exists
        return this.generateMockFacultyMatches(university, userResearchProfile);
      }

      // Convert to FacultyProfile and calculate matches
      const facultyProfiles: FacultyProfile[] = facultyData.map(faculty => ({
        id: faculty.id,
        name: faculty.professor_name,
        university: faculty.university,
        email: faculty.email,
        researchKeywords: this.extractKeywordsFromResearchAreas(faculty.research_areas || ''),
        researchDescription: faculty.research_areas,
        acceptingStudents: true, // Default assumption
        contactPreference: 'email'
      }));

      // Calculate match scores for each faculty
      const matches: FacultyMatch[] = facultyProfiles.map(professor => {
        const matchResult = this.calculateResearchAlignment(
          professor.researchKeywords,
          userResearchProfile
        );

        return {
          professor,
          matchScore: matchResult.overallScore,
          matchingKeywords: matchResult.matchingKeywords,
          researchAlignment: matchResult.alignment,
          contactStatus: 'not_contacted',
          availability: professor.acceptingStudents ? 'accepting' : 'unknown'
        };
      });

      // Sort by match score and return top matches
      return matches
        .filter(match => match.matchScore > 0.3) // Only return relevant matches
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 10);

    } catch (error) {
      console.error('Error in findMatchedFaculty:', error);
      return [];
    }
  }

  /**
   * Calculate research alignment between faculty keywords and user research profile
   */
  calculateResearchAlignment(
    facultyKeywords: string[],
    userProfile: ResearchProfile
  ): {
    overallScore: number;
    matchingKeywords: string[];
    alignment: {
      primaryMatch: number;
      secondaryMatch: number;
      methodologyMatch: number;
      applicationMatch: number;
    };
  } {
    const userKeywords = [
      ...(userProfile.primaryInterests || []),
      ...(userProfile.keywords || []),
      ...(userProfile.applicationAreas || []),
      ...(userProfile.methodologies || [])
    ].filter(k => k && typeof k === 'string').map(k => k.toLowerCase());

    const facultyKeywordsLower = facultyKeywords.filter(k => k && typeof k === 'string').map(k => k.toLowerCase());

    // Find exact matches
    const exactMatches = facultyKeywordsLower.filter(fk => 
      userKeywords.some(uk => uk.includes(fk) || fk.includes(uk))
    );

    // Calculate different types of matches
    const primaryMatch = this.calculateKeywordOverlap(
      facultyKeywordsLower, 
      userProfile.primaryInterests.filter(i => i && typeof i === 'string').map(i => i.toLowerCase())
    );

    const secondaryMatch = this.calculateKeywordOverlap(
      facultyKeywordsLower,
      userProfile.keywords.filter(k => k && typeof k === 'string').map(k => k.toLowerCase())
    );

    const methodologyMatch = this.calculateKeywordOverlap(
      facultyKeywordsLower,
      userProfile.methodologies.filter(m => m && typeof m === 'string').map(m => m.toLowerCase())
    );

    const applicationMatch = this.calculateKeywordOverlap(
      facultyKeywordsLower,
      userProfile.applicationAreas.filter(a => a && typeof a === 'string').map(a => a.toLowerCase())
    );

    // Weighted overall score
    const overallScore = (
      primaryMatch * 0.4 +
      secondaryMatch * 0.3 +
      applicationMatch * 0.2 +
      methodologyMatch * 0.1
    );

    return {
      overallScore: Math.min(overallScore, 1.0),
      matchingKeywords: exactMatches,
      alignment: {
        primaryMatch,
        secondaryMatch,
        methodologyMatch,
        applicationMatch
      }
    };
  }

  /**
   * Calculate keyword overlap between two arrays
   */
  private calculateKeywordOverlap(keywords1: string[], keywords2: string[]): number {
    if (keywords1.length === 0 || keywords2.length === 0) {return 0;}

    let matches = 0;
    keywords1.forEach(k1 => {
      keywords2.forEach(k2 => {
        if (k1.includes(k2) || k2.includes(k1) || this.calculateSimilarity(k1, k2) > 0.8) {
          matches++;
        }
      });
    });

    return Math.min(matches / Math.max(keywords1.length, keywords2.length), 1.0);
  }

  /**
   * Simple string similarity calculation (Jaccard similarity)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const set1 = new Set(str1.toLowerCase().split(' '));
    const set2 = new Set(str2.toLowerCase().split(' '));
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  /**
   * Extract keywords from research areas text
   */
  private extractKeywordsFromResearchAreas(researchAreas: string): string[] {
    if (!researchAreas) {return [];}

    // Simple keyword extraction - can be enhanced with NLP
    const keywords = researchAreas
      .toLowerCase()
      .split(/[,;.]/)
      .map(area => area.trim())
      .filter(area => area.length > 2)
      .flatMap(area => area.split(/\s+/))
      .filter(word => word.length > 3);

    return [...new Set(keywords)]; // Remove duplicates
  }

  /**
   * Generate mock faculty data for demonstration purposes
   */
  private generateMockFacultyMatches(
    university: string, 
    userProfile: ResearchProfile
  ): FacultyMatch[] {
    const mockFaculty: FacultyProfile[] = [
      {
        id: 'mock-1',
        name: 'Dr. Sarah Chen',
        university,
        department: 'Computer Science',
        email: 's.chen@university.edu',
        researchKeywords: ['artificial intelligence', 'machine learning', 'robotics', 'computer vision'],
        researchDescription: 'AI applications in robotics and automation systems',
        acceptingStudents: true,
        contactPreference: 'email'
      },
      {
        id: 'mock-2',
        name: 'Dr. Michael Rodriguez',
        university,
        department: 'Civil Engineering',
        email: 'm.rodriguez@university.edu',
        researchKeywords: ['construction automation', 'robotics', 'smart buildings', 'IoT'],
        researchDescription: 'Robotics and automation in construction industry',
        acceptingStudents: true,
        contactPreference: 'email'
      },
      {
        id: 'mock-3',
        name: 'Dr. Emily Watson',
        university,
        department: 'Mechanical Engineering',
        email: 'e.watson@university.edu',
        researchKeywords: ['robotics', 'automation', 'manufacturing', 'AI'],
        researchDescription: 'AI-driven manufacturing and industrial robotics',
        acceptingStudents: false,
        contactPreference: 'website'
      }
    ];

    return mockFaculty.map(professor => {
      const matchResult = this.calculateResearchAlignment(
        professor.researchKeywords,
        userProfile
      );

      return {
        professor,
        matchScore: matchResult.overallScore,
        matchingKeywords: matchResult.matchingKeywords,
        researchAlignment: matchResult.alignment,
        contactStatus: 'not_contacted' as const,
        availability: professor.acceptingStudents ? 'accepting' as const : 'not_accepting' as const
      };
    }).sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Update faculty contact status
   */
  async updateFacultyContactStatus(
    facultyId: string, 
    status: ContactStatus['status'],
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) {
        return { success: false, error: "Not authenticated" };
      }

      // Update in the matched_professors table or create a separate contact tracking table
      const { error } = await supabase
        .from('matched_professors')
        .update({
          contact_status: status,
          contact_notes: notes,
          last_contact_date: new Date().toISOString()
        })
        .eq('id', facultyId)
        .eq('user_id', user.user.id);

      if (error) {
        console.error('Error updating contact status:', error);
        return { success: false, error: error.message };
      }

      return { success: true };

    } catch (error) {
      console.error('Error in updateFacultyContactStatus:', error);
      return { success: false, error: 'Failed to update contact status' };
    }
  }

  /**
   * Get user's research profile from their stored research interests
   */
  async getUserResearchProfile(userId: string): Promise<ResearchProfile> {
    try {
      const { data: userInterests, error } = await supabase
        .from('user_research_interests')
        .select(`
          research_interests:research_interest_id (
            id, name, category
          )
        `)
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user research interests:', error);
        return this.getDefaultResearchProfile();
      }

      if (!userInterests || userInterests.length === 0) {
        return this.getDefaultResearchProfile();
      }

      // Extract research interests and convert to research profile
      const interests = userInterests
        .map(item => item.research_interests)
        .filter(Boolean)
        .map(interest => interest.name);

      return {
        primaryInterests: interests.slice(0, 3), // Top 3 as primary
        keywords: this.extractKeywordsFromInterests(interests),
        applicationAreas: this.inferApplicationAreas(interests),
        methodologies: this.inferMethodologies(interests)
      };

    } catch (error) {
      console.error('Error getting user research profile:', error);
      return this.getDefaultResearchProfile();
    }
  }

  private getDefaultResearchProfile(): ResearchProfile {
    return {
      primaryInterests: ['artificial intelligence', 'machine learning'],
      keywords: ['AI', 'ML', 'data science', 'algorithms'],
      applicationAreas: ['technology', 'research'],
      methodologies: ['computational', 'experimental']
    };
  }

  private extractKeywordsFromInterests(interests: string[]): string[] {
    return interests
      .flatMap(interest => interest.toLowerCase().split(/[\s,]+/))
      .filter(word => word.length > 2);
  }

  private inferApplicationAreas(interests: string[]): string[] {
    const areas: string[] = [];
    const interestText = interests.join(' ').toLowerCase();

    if (interestText.includes('construction') || interestText.includes('building')) {
      areas.push('construction', 'civil engineering');
    }
    if (interestText.includes('medical') || interestText.includes('health')) {
      areas.push('healthcare', 'biomedical');
    }
    if (interestText.includes('finance') || interestText.includes('business')) {
      areas.push('fintech', 'business analytics');
    }

    return areas.length > 0 ? areas : ['technology', 'research'];
  }

  private inferMethodologies(interests: string[]): string[] {
    const methods: string[] = [];
    const interestText = interests.join(' ').toLowerCase();

    if (interestText.includes('machine learning') || interestText.includes('ai')) {
      methods.push('computational', 'data-driven');
    }
    if (interestText.includes('robotics') || interestText.includes('automation')) {
      methods.push('experimental', 'prototyping');
    }
    if (interestText.includes('theory') || interestText.includes('mathematical')) {
      methods.push('theoretical', 'mathematical modeling');
    }

    return methods.length > 0 ? methods : ['computational', 'analytical'];
  }
}

export const facultyMatchingService = new FacultyMatchingService();