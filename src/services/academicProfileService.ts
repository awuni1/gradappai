import { supabase } from '@/integrations/supabase/client';

// Academic Profile Interfaces
export interface AcademicProfile {
  id?: string;
  user_id: string;
  full_name?: string;
  current_position?: string;
  current_institution?: string;
  degree?: string;
  field_of_study?: string;
  graduation_year?: number;
  gpa?: number;
  publication_count?: number;
  h_index?: number;
  total_citations?: number;
  created_at?: string;
  updated_at?: string;
}

export interface EducationDetail {
  id?: string;
  user_id?: string;
  degree_type: string;
  major_field?: string;
  institution_name: string;
  graduation_date?: string;
  gpa?: number;
  honors?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface AcademicPublication {
  id?: string;
  user_id?: string;
  title: string;
  journal_name?: string;
  conference_name?: string;
  venue_type: 'journal' | 'conference' | 'workshop' | 'preprint' | 'other';
  publication_year?: number;
  doi?: string;
  authors?: string[];
  abstract?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AcademicAward {
  id?: string;
  user_id?: string;
  title: string;
  organization: string;
  award_type: 'fellowship' | 'grant' | 'scholarship' | 'honor' | 'prize' | 'other';
  award_date?: string;
  amount?: number;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ResearchInterest {
  id?: string;
  name: string;
  category?: string;
}

class AcademicProfileServiceClass {
  /**
   * Get complete academic profile for a user
   */
  async getAcademicProfile(userId: string): Promise<{
    profile: AcademicProfile | null;
    education: EducationDetail[];
    publications: AcademicPublication[];
    awards: AcademicAward[];
    researchInterests: ResearchInterest[];
    error?: string;
  }> {
    try {
      // Run all database calls in parallel for better performance
      const [
        profileResult,
        educationResult,
        publicationsResult,
        awardsResult,
        researchInterestsResult
      ] = await Promise.all([
        this.getBasicProfile(userId),
        this.getEducationDetails(userId),
        this.getPublications(userId),
        this.getAwards(userId),
        this.getResearchInterests(userId)
      ]);

      return {
        profile: profileResult.profile,
        education: educationResult.education,
        publications: publicationsResult.publications,
        awards: awardsResult.awards,
        researchInterests: researchInterestsResult.interests,
        error: profileResult.error || educationResult.error || publicationsResult.error || 
               awardsResult.error || researchInterestsResult.error
      };
    } catch (error) {
      console.error('Error getting academic profile:', error);
      return {
        profile: null,
        education: [],
        publications: [],
        awards: [],
        researchInterests: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get basic academic profile information
   */
  private async getBasicProfile(userId: string): Promise<{
    profile: AcademicProfile | null;
    error?: string;
  }> {
    try {
      // First try to get from academic_profiles table
      const { data: academicProfile, error: academicError } = await supabase
        .from('academic_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (academicProfile && !academicError) {
        // If we have academic profile data, format it using actual column names
        const profile: AcademicProfile = {
          id: academicProfile.id,
          user_id: academicProfile.user_id,
          full_name: academicProfile.full_name, // This field might not exist in actual schema
          current_position: academicProfile.current_degree,
          current_institution: academicProfile.current_institution,
          degree: academicProfile.current_degree,
          field_of_study: academicProfile.current_field_of_study,
          graduation_year: academicProfile.graduation_year,
          gpa: academicProfile.current_gpa ? parseFloat(academicProfile.current_gpa) : undefined,
          publication_count: academicProfile.publications ? academicProfile.publications.length : 0,
          h_index: 0, // Not in current schema
          total_citations: 0, // Not in current schema
          created_at: academicProfile.created_at,
          updated_at: academicProfile.updated_at
        };

        return { profile, error: undefined };
      }

      // If no academic profile found, try to get basic info from user profiles
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (userProfile) {
        const profile: AcademicProfile = {
          user_id: userId,
          full_name: userProfile.display_name || userProfile.first_name + ' ' + userProfile.last_name,
          current_institution: userProfile.current_institution,
          field_of_study: userProfile.field_of_study,
          graduation_year: userProfile.graduation_year,
          gpa: userProfile.gpa,
          publication_count: 0,
          total_citations: 0
        };

        return { profile, error: undefined };
      }

      // If neither table has data, return null
      return { profile: null, error: undefined };

    } catch (error) {
      console.error('Error fetching basic academic profile:', error);
      return { 
        profile: null, 
        error: error instanceof Error ? error.message : 'Failed to fetch academic profile' 
      };
    }
  }

  /**
   * Get education details from academic_profiles table (using actual schema)
   */
  private async getEducationDetails(userId: string): Promise<{
    education: EducationDetail[];
    error?: string;
  }> {
    try {
      // Get education data from academic_profiles table using actual column names
      const { data: academicProfile, error: profileError } = await supabase
        .from('academic_profiles')
        .select('previous_education, current_degree, current_institution, graduation_year, current_gpa, current_field_of_study')
        .eq('user_id', userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching academic profile for education:', profileError);
        return { education: [], error: profileError.message };
      }

      const education: EducationDetail[] = [];

      // Parse previous_education JSONB field if it exists
      if (academicProfile?.previous_education) {
        try {
          const educationData = Array.isArray(academicProfile.previous_education) 
            ? academicProfile.previous_education 
            : academicProfile.previous_education;
          
          if (Array.isArray(educationData)) {
            educationData.forEach((edu: any) => {
              education.push({
                degree_type: edu.degree || edu.degree_type || 'Unknown',
                major_field: edu.field || edu.major || edu.major_field,
                institution_name: edu.institution || edu.university || 'Unknown Institution',
                graduation_date: edu.graduation_date || edu.end_date,
                gpa: edu.gpa ? parseFloat(edu.gpa) : undefined,
                honors: edu.honors || []
              });
            });
          }
        } catch (parseError) {
          console.warn('Error parsing previous_education JSONB:', parseError);
        }
      }

      // Add current education from basic profile fields
      if (academicProfile) {
        if (academicProfile.current_degree || academicProfile.current_institution) {
          education.unshift({ // Add to beginning as most recent
            degree_type: academicProfile.current_degree || 'Current Degree',
            major_field: academicProfile.current_field_of_study,
            institution_name: academicProfile.current_institution || 'Current Institution',
            graduation_date: academicProfile.graduation_year ? `${academicProfile.graduation_year}-01-01` : undefined,
            gpa: academicProfile.current_gpa ? parseFloat(academicProfile.current_gpa.toString()) : undefined
          });
        }
      }

      return { education, error: undefined };

    } catch (error) {
      console.error('Error fetching education details:', error);
      return { 
        education: [], 
        error: error instanceof Error ? error.message : 'Failed to fetch education details' 
      };
    }
  }

  /**
   * Get publications from academic_profiles table (using actual schema)
   */
  private async getPublications(userId: string): Promise<{
    publications: AcademicPublication[];
    error?: string;
  }> {
    try {
      // Get publications data from academic_profiles table using actual column names
      const { data: academicProfile, error: profileError } = await supabase
        .from('academic_profiles')
        .select('publications, presentations_given, conferences_attended')
        .eq('user_id', userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching academic profile for publications:', profileError);
        return { publications: [], error: profileError.message };
      }

      const publications: AcademicPublication[] = [];

      // Process publications text array
      if (academicProfile?.publications && Array.isArray(academicProfile.publications)) {
        academicProfile.publications.forEach((pub: string, index: number) => {
          publications.push({
            title: pub,
            venue_type: 'journal' as const,
            publication_year: new Date().getFullYear(), // Default to current year
            authors: []
          });
        });
      }

      // Process presentations as publications
      if (academicProfile?.presentations_given && Array.isArray(academicProfile.presentations_given)) {
        academicProfile.presentations_given.forEach((presentation: string) => {
          publications.push({
            title: presentation,
            venue_type: 'conference' as const,
            publication_year: new Date().getFullYear(),
            authors: []
          });
        });
      }

      return { publications, error: undefined };

    } catch (error) {
      console.error('Error fetching publications:', error);
      return { 
        publications: [], 
        error: error instanceof Error ? error.message : 'Failed to fetch publications' 
      };
    }
  }

  /**
   * Get academic awards and recognition from academic_profiles table (using actual schema)
   */
  private async getAwards(userId: string): Promise<{
    awards: AcademicAward[];
    error?: string;
  }> {
    try {
      // Get awards data from academic_profiles table using actual column names
      const { data: academicProfile, error: profileError } = await supabase
        .from('academic_profiles')
        .select('honors_awards, scholarships, dean_list_semesters')
        .eq('user_id', userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching academic profile for awards:', profileError);
        return { awards: [], error: profileError.message };
      }

      const awards: AcademicAward[] = [];

      // Process honors_awards text array
      if (academicProfile?.honors_awards && Array.isArray(academicProfile.honors_awards)) {
        academicProfile.honors_awards.forEach((award: string) => {
          awards.push({
            title: award,
            organization: 'Academic Institution',
            award_type: 'honor' as const,
            award_date: new Date().getFullYear().toString()
          });
        });
      }

      // Process scholarships text array
      if (academicProfile?.scholarships && Array.isArray(academicProfile.scholarships)) {
        academicProfile.scholarships.forEach((scholarship: string) => {
          awards.push({
            title: scholarship,
            organization: 'Scholarship Provider',
            award_type: 'scholarship' as const,
            award_date: new Date().getFullYear().toString()
          });
        });
      }

      // Process dean_list_semesters text array
      if (academicProfile?.dean_list_semesters && Array.isArray(academicProfile.dean_list_semesters)) {
        academicProfile.dean_list_semesters.forEach((semester: string) => {
          awards.push({
            title: `Dean's List - ${semester}`,
            organization: 'Academic Institution',
            award_type: 'honor' as const,
            award_date: semester
          });
        });
      }

      return { awards, error: undefined };

    } catch (error) {
      console.error('Error fetching awards:', error);
      return { 
        awards: [], 
        error: error instanceof Error ? error.message : 'Failed to fetch awards' 
      };
    }
  }

  /**
   * Get research interests
   */
  private async getResearchInterests(userId: string): Promise<{
    interests: ResearchInterest[];
    error?: string;
  }> {
    try {
      const { data: userInterests, error: interestsError } = await supabase
        .from('user_research_interests')
        .select(`
          research_interests:research_interest_id (
            id, 
            name,
            category
          )
        `)
        .eq('user_id', userId)
        .order('priority', { ascending: true });

      if (interestsError) {
        console.error('Error fetching research interests:', interestsError);
        return { interests: [], error: interestsError.message };
      }

      const interests: ResearchInterest[] = userInterests?.map((item: any) => ({
        id: item.research_interests?.id,
        name: item.research_interests?.name || item.research_interests?.title,
        category: item.research_interests?.category
      })).filter((interest: ResearchInterest) => interest.name) || [];

      return { interests, error: undefined };

    } catch (error) {
      console.error('Error fetching research interests:', error);
      return { 
        interests: [], 
        error: error instanceof Error ? error.message : 'Failed to fetch research interests' 
      };
    }
  }

  /**
   * Update academic profile
   */
  async updateAcademicProfile(userId: string, profileData: Partial<AcademicProfile>): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { error } = await supabase
        .from('academic_profiles')
        .upsert({
          user_id: userId,
          ...profileData,
          updated_at: new Date().toISOString()
        });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating academic profile:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update academic profile' 
      };
    }
  }
}

// Export singleton instance
export const AcademicProfileService = new AcademicProfileServiceClass();