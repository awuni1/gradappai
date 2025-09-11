import { supabase } from '@/integrations/supabase/client';

/**
 * Data Integrity Service - Ensures all user data is properly stored and retrieved
 */
class DataIntegrityService {
  
  /**
   * Verify all user data is stored correctly after CV upload
   */
  async verifyDataAfterCVUpload(userId: string): Promise<{
    cvAnalysis: boolean;
    academicProfile: boolean;
    researchInterests: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];
    
    try {
      // Check CV analysis storage
      const { data: cvAnalysis } = await supabase
        .from('cv_analyses')
        .select('id, analysis_status')
        .eq('user_id', userId)
        .eq('analysis_status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Check academic profile
      const { data: academicProfile } = await supabase
        .from('academic_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      // Check research interests
      const { data: researchInterests } = await supabase
        .from('user_research_interests')
        .select('research_interest_id')
        .eq('user_id', userId);

      if (!cvAnalysis) {
        issues.push('CV analysis not found or not completed');
      }

      if (!academicProfile) {
        issues.push('Academic profile not created from CV data');
      }

      if (!researchInterests || researchInterests.length === 0) {
        issues.push('Research interests not extracted from CV');
      }

      return {
        cvAnalysis: Boolean(cvAnalysis),
        academicProfile: Boolean(academicProfile),
        researchInterests: Boolean(researchInterests && researchInterests.length > 0),
        issues
      };

    } catch (error) {
      console.error('Error verifying data integrity:', error);
      return {
        cvAnalysis: false,
        academicProfile: false,
        researchInterests: false,
        issues: ['Error checking data integrity']
      };
    }
  }

  /**
   * Verify university matches are using stored user data
   */
  async verifyUniversityMatchingData(userId: string): Promise<{
    hasMatches: boolean;
    usingCVData: boolean;
    matchesCount: number;
    facultyCount: number;
    issues: string[];
  }> {
    const issues: string[] = [];
    
    try {
      // Check university matches
      const { data: matches } = await supabase
        .from('university_matches')
        .select('id, match_factors, ai_model_version')
        .eq('user_id', userId);

      // Check matched professors
      const { data: professors } = await supabase
        .from('matched_professors')
        .select('id')
        .eq('user_id', userId);

      // Check if matches are using CV data (indicated by newer AI model version)
      const usingCVData = matches?.some(match => 
        match.ai_model_version?.includes('cv-enhanced') || 
        match.match_factors?.cv_alignment !== undefined
      ) || false;

      if (!matches || matches.length === 0) {
        issues.push('No university matches generated');
      }

      if (!professors || professors.length === 0) {
        issues.push('No faculty recommendations generated');
      }

      if (matches && matches.length > 0 && !usingCVData) {
        issues.push('University matches not using CV analysis data');
      }

      return {
        hasMatches: Boolean(matches && matches.length > 0),
        usingCVData,
        matchesCount: matches?.length || 0,
        facultyCount: professors?.length || 0,
        issues
      };

    } catch (error) {
      console.error('Error verifying matching data:', error);
      return {
        hasMatches: false,
        usingCVData: false,
        matchesCount: 0,
        facultyCount: 0,
        issues: ['Error checking matching data']
      };
    }
  }

  /**
   * Verify onboarding data persistence
   */
  async verifyOnboardingData(userId: string): Promise<{
    hasOnboardingProfile: boolean;
    hasAcademicProfile: boolean;
    hasResearchInterests: boolean;
    dataComplete: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];
    
    try {
      // Check onboarding profile
      const { data: onboardingProfile } = await supabase
        .from('applicant_onboarding_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      // Check academic profile
      const { data: academicProfile } = await supabase
        .from('academic_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      // Check research interests
      const { data: researchInterests } = await supabase
        .from('user_research_interests')
        .select('research_interest_id')
        .eq('user_id', userId);

      const hasOnboardingProfile = Boolean(onboardingProfile);
      const hasAcademicProfile = Boolean(academicProfile);
      const hasResearchInterests = Boolean(researchInterests && researchInterests.length > 0);

      if (!hasOnboardingProfile) {
        issues.push('Onboarding profile not saved');
      }

      if (!hasAcademicProfile) {
        issues.push('Academic profile not created');
      }

      if (!hasResearchInterests) {
        issues.push('Research interests not saved');
      }

      const dataComplete = hasOnboardingProfile && hasAcademicProfile && hasResearchInterests;

      return {
        hasOnboardingProfile,
        hasAcademicProfile,
        hasResearchInterests,
        dataComplete,
        issues
      };

    } catch (error) {
      console.error('Error verifying onboarding data:', error);
      return {
        hasOnboardingProfile: false,
        hasAcademicProfile: false,
        hasResearchInterests: false,
        dataComplete: false,
        issues: ['Error checking onboarding data']
      };
    }
  }

  /**
   * Comprehensive data flow test
   */
  async testCompleteDataFlow(userId: string): Promise<{
    cvData: any;
    onboardingData: any;
    matchingData: any;
    overallHealth: 'excellent' | 'good' | 'poor';
    recommendations: string[];
  }> {
    const cvData = await this.verifyDataAfterCVUpload(userId);
    const onboardingData = await this.verifyOnboardingData(userId);
    const matchingData = await this.verifyUniversityMatchingData(userId);

    const totalIssues = cvData.issues.length + onboardingData.issues.length + matchingData.issues.length;
    
    let overallHealth: 'excellent' | 'good' | 'poor';
    if (totalIssues === 0) {
      overallHealth = 'excellent';
    } else if (totalIssues <= 2) {
      overallHealth = 'good';
    } else {
      overallHealth = 'poor';
    }

    const recommendations: string[] = [];
    
    if (!cvData.cvAnalysis) {
      recommendations.push('Upload and analyze CV to populate profile data');
    }
    
    if (!onboardingData.dataComplete) {
      recommendations.push('Complete onboarding process to ensure all data is saved');
    }
    
    if (!matchingData.hasMatches) {
      recommendations.push('Generate university matches to get personalized recommendations');
    }
    
    if (matchingData.hasMatches && !matchingData.usingCVData) {
      recommendations.push('Regenerate matches to use latest CV analysis data');
    }

    return {
      cvData,
      onboardingData,
      matchingData,
      overallHealth,
      recommendations
    };
  }

  /**
   * Fix common data integrity issues
   */
  async fixDataIntegrityIssues(userId: string): Promise<{
    fixed: string[];
    stillBroken: string[];
  }> {
    const fixed: string[] = [];
    const stillBroken: string[] = [];

    try {
      // Check if user has CV analysis but no academic profile
      const { data: cvAnalysis } = await supabase
        .from('cv_analyses')
        .select('*')
        .eq('user_id', userId)
        .eq('analysis_status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: academicProfile } = await supabase
        .from('academic_profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (cvAnalysis && !academicProfile) {
        // Create academic profile from CV data
        const education = cvAnalysis.education?.[0];
        if (education) {
          await supabase
            .from('academic_profiles')
            .insert({
              user_id: userId,
              institution: education.institution,
              degree: education.degree,
              field_of_study: education.field,
              graduation_year: education.graduationYear,
              gpa: education.gpa,
              updated_at: new Date().toISOString()
            });
          fixed.push('Created academic profile from CV data');
        }
      }

      // Check if user has CV research areas but no research interests
      const { data: researchInterests } = await supabase
        .from('user_research_interests')
        .select('id')
        .eq('user_id', userId);

      if (cvAnalysis && cvAnalysis.research_areas && cvAnalysis.research_areas.length > 0 && 
          (!researchInterests || researchInterests.length === 0)) {
        
        // Create research interests from CV
        for (const area of cvAnalysis.research_areas) {
          // Ensure the research interest exists
          const { data: existingInterest } = await supabase
            .from('research_interests')
            .select('id')
            .eq('title', area)
            .maybeSingle();

          let interestId;
          if (existingInterest) {
            interestId = existingInterest.id;
          } else {
            const { data: newInterest } = await supabase
              .from('research_interests')
              .insert({ title: area, category: 'cv_extracted' })
              .select('id')
              .single();
            interestId = newInterest?.id;
          }

          if (interestId) {
            await supabase
              .from('user_research_interests')
              .insert({
                user_id: userId,
                research_interest_id: interestId
              });
          }
        }
        fixed.push('Created research interests from CV data');
      }

    } catch (error) {
      console.error('Error fixing data integrity issues:', error);
      stillBroken.push('Failed to fix data integrity issues');
    }

    return { fixed, stillBroken };
  }

  /**
   * Get user data summary for debugging
   */
  async getUserDataSummary(userId: string): Promise<any> {
    try {
      const [
        cvAnalysis,
        academicProfile, 
        researchInterests,
        onboardingProfile,
        universityMatches,
        professors
      ] = await Promise.all([
        supabase.from('cv_analyses').select('id, analysis_status, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('academic_profiles').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('user_research_interests').select('research_interest_id, research_interests(title)').eq('user_id', userId),
        supabase.from('applicant_onboarding_profiles').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('university_matches').select('id, match_score, ai_model_version').eq('user_id', userId),
        supabase.from('matched_professors').select('id, professor_name').eq('user_id', userId)
      ]);

      return {
        userId,
        cvAnalysis: cvAnalysis.data,
        academicProfile: academicProfile.data,
        researchInterests: researchInterests.data?.map(ri => ri.research_interests?.title) || [],
        onboardingProfile: onboardingProfile.data,
        universityMatches: universityMatches.data?.length || 0,
        professors: professors.data?.length || 0,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error getting user data summary:', error);
      return { error: 'Failed to get user data summary' };
    }
  }
}

// Export singleton instance
export const dataIntegrityService = new DataIntegrityService();
export default dataIntegrityService;