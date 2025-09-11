import { supabase } from '@/integrations/supabase/client';
import { OnboardingData } from '@/components/onboarding/OnboardingWizard';
import { cvAnalysisService } from './cvAnalysisService';

export interface OnboardingProgress {
  firstName?: string;
  lastName?: string;
  currentDegree?: string;
  currentInstitution?: string;
  gpa?: string;
  targetDegreeLevel?: string;
  targetField?: string;
  researchInterests?: string[];
  careerGoals?: string;
  currentStep?: number;
}

class OnboardingService {
  private readonly PROGRESS_KEY = 'gradapp_onboarding_progress';

  /**
   * Save onboarding progress to local storage for auto-save functionality - optimized
   */
  async saveProgress(data: Partial<OnboardingData>): Promise<void> {
    try {
      // Use requestIdleCallback for non-blocking localStorage operations
      const saveOperation = () => {
        const progressData: OnboardingProgress = {
          firstName: data.firstName,
          lastName: data.lastName,
          currentDegree: data.currentDegree,
          currentInstitution: data.currentInstitution,
          gpa: data.gpa,
          targetDegreeLevel: data.targetDegreeLevel,
          targetField: data.targetField,
          researchInterests: data.researchInterests,
          careerGoals: data.careerGoals
        };

        localStorage.setItem(this.PROGRESS_KEY, JSON.stringify(progressData));
      };

      // Use requestIdleCallback if available, otherwise setTimeout
      if ('requestIdleCallback' in window) {
        requestIdleCallback(saveOperation);
      } else {
        setTimeout(saveOperation, 0);
      }
    } catch (error) {
      console.warn('Failed to save onboarding progress (non-critical):', error);
    }
  }

  /**
   * Load saved onboarding progress from local storage and CV analysis - optimized
   */
  async loadProgress(): Promise<OnboardingProgress | null> {
    try {
      // First try to load from localStorage
      const localProgress = await new Promise<OnboardingProgress | null>((resolve) => {
        const loadOperation = () => {
          try {
            const saved = localStorage.getItem(this.PROGRESS_KEY);
            resolve(saved ? JSON.parse(saved) : null);
          } catch (error) {
            console.warn('Failed to parse saved progress:', error);
            resolve(null);
          }
        };
        
        // Use requestIdleCallback for non-blocking operation
        if ('requestIdleCallback' in window) {
          requestIdleCallback(loadOperation);
        } else {
          setTimeout(loadOperation, 0);
        }
      });

      // If no local progress, try to populate from CV analysis
      if (!localProgress) {
        const cvProgress = await this.loadProgressFromCV();
        if (cvProgress) {
          console.log('📋 Pre-populating onboarding from CV analysis');
          return cvProgress;
        }
      }

      return localProgress;
    } catch (error) {
      console.warn('Failed to load onboarding progress:', error);
      return null;
    }
  }

  /**
   * Load onboarding progress from stored CV analysis
   */
  private async loadProgressFromCV(): Promise<OnboardingProgress | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {return null;}

      // Import CV analysis service
      const { cvAnalysisService } = await import('./cvAnalysisService');
      const enhancedProfile = await cvAnalysisService.getEnhancedUserProfile(user.id);
      
      if (!enhancedProfile?.cvAnalysis) {return null;}

      const cvData = enhancedProfile.cvAnalysis;
      const personalInfo = cvData.personal_info;
      const education = cvData.education?.[0]; // Latest education
      const researchAreas = cvData.research_areas || [];

      // Map CV data to onboarding format
      const progress: OnboardingProgress = {
        firstName: personalInfo?.name?.split(' ')?.[0] || '',
        lastName: personalInfo?.name?.split(' ').slice(1).join(' ') || '',
        currentDegree: education?.degree || '',
        currentInstitution: education?.institution || '',
        gpa: education?.gpa?.toString() || '',
        targetField: education?.field || '',
        researchInterests: researchAreas,
        currentStep: 1
      };

      // Only return if we have meaningful data
      if (progress.firstName || progress.currentInstitution || researchAreas.length > 0) {
        return progress;
      }

      return null;
    } catch (error) {
      console.warn('Failed to load progress from CV:', error);
      return null;
    }
  }

  /**
   * Clear saved onboarding progress
   */
  async clearProgress(): Promise<void> {
    try {
      localStorage.removeItem(this.PROGRESS_KEY);
    } catch (error) {
      console.error('Failed to clear onboarding progress:', error);
    }
  }

  /**
   * Get current user's stored profile data from user_profiles and academic_profiles
   */
  async getStoredProfile(): Promise<OnboardingProgress | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {return null;}

      // Get from user_profiles and academic_profiles tables
      const [userProfileResult, academicProfileResult] = await Promise.all([
        supabase
          .from('user_profiles')
          .select('full_name')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('academic_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()
      ]);

      const userProfile = userProfileResult.data;
      const academicProfile = academicProfileResult.data;

      if (userProfile || academicProfile) {
        const fullName = userProfile?.full_name || '';
        const nameParts = fullName.split(' ');
        return {
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          currentDegree: academicProfile?.current_degree,
          currentInstitution: academicProfile?.current_institution,
          gpa: academicProfile?.current_gpa?.toString(),
          targetField: academicProfile?.current_field_of_study,
          careerGoals: academicProfile?.career_goals
        };
      }

      return null;
    } catch (error) {
      console.warn('Failed to get stored profile:', error);
      return null;
    }
  }

  /**
   * Complete onboarding and save data to database using comprehensive schema
   */
  async completeOnboarding(data: OnboardingData): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🚀 Starting onboarding completion process...', data);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('❌ User not authenticated');
        return { success: false, error: 'User not authenticated' };
      }

      console.log('✅ User authenticated:', user.id);

      // Step 1: Update user profile with onboarding completion
      console.log('📝 Updating user profile with onboarding data...');
      const { error: userProfileError } = await (supabase as any)
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          full_name: `${data.firstName} ${data.lastName}`.trim(),
          email: user.email,
          onboarding_completed: true,
          onboarding_step: 15, // Final step
          profile_completion_percentage: 100,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        });

      if (userProfileError) {
        console.error('❌ User profile update error:', userProfileError);
        return { success: false, error: `Failed to update user profile: ${userProfileError.message}` };
      }
      console.log('✅ User profile updated successfully');

      // Step 2: Update academic profiles table
      console.log('🎓 Updating academic profile...');
      const { error: academicError } = await supabase
        .from('academic_profiles')
        .upsert({
          user_id: user.id,
          current_institution: data.currentInstitution,
          current_degree: data.currentDegree,
          current_field_of_study: data.targetField,
          graduation_year: new Date().getFullYear() + 2, // Estimate
          current_gpa: data.gpa ? parseFloat(data.gpa) : null,
          career_goals: data.careerGoals,
          // Add target degree level to a relevant field (use target_industries as array)
          target_industries: data.targetDegreeLevel ? [data.targetDegreeLevel] : [],
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (academicError) {
        console.error('❌ Academic profile error:', academicError);
        // Don't fail onboarding for academic profile issues
      } else {
        console.log('✅ Academic profile updated successfully');
      }

      // Step 3: Save research interests using existing user_research_interests table
      if (data.researchInterests && data.researchInterests.length > 0) {
        console.log('🔬 Processing research interests...', data.researchInterests);
        
        try {
          // First, remove existing research interests for this user
          const { error: deleteError } = await supabase
            .from('user_research_interests')
            .delete()
            .eq('user_id', user.id);

          if (deleteError) {
            console.error('❌ Error deleting existing research interests:', deleteError);
          }

          // Add new research interests
          const researchInterestPromises = data.researchInterests.map(async (interest, index) => {
            try {
              // First check if the research interest exists
              let { data: existingInterest, error: selectError } = await supabase
                .from('research_interests')
                .select('id')
                .eq('name', interest)
                .maybeSingle();

              if (selectError) {
                console.error('Error checking existing research interest:', selectError);
                return null;
              }

              // If it doesn't exist, create it
              if (!existingInterest) {
                const { data: newInterest, error: createError } = await supabase
                  .from('research_interests')
                  .insert({ name: interest })
                  .select('id')
                  .single();

                if (createError) {
                  console.error('Failed to create research interest:', createError);
                  return null;
                }
                existingInterest = newInterest;
              }

              // Link user to research interest using existing table
              const { error: linkError } = await supabase
                .from('user_research_interests')
                .insert({
                  user_id: user.id,
                  research_interest_id: existingInterest.id,
                  priority: index + 1,
                  proficiency_level: 'beginner' // Default level
                });

              if (linkError) {
                console.error('Failed to link research interest:', linkError);
                return null;
              }

              return existingInterest.id;
            } catch (error) {
              console.error('Error processing research interest:', interest, error);
              return null;
            }
          });

          const results = await Promise.all(researchInterestPromises);
          const successCount = results.filter(r => r !== null).length;
          console.log(`✅ Successfully processed ${successCount}/${data.researchInterests.length} research interests`);
          
        } catch (error) {
          console.error('❌ Error processing research interests:', error);
          // Don't fail the entire onboarding for research interests
        }
      }

      // Step 4: Handle CV file storage using CV analysis service
      if (data.cvFile) {
        console.log('📄 CV file present in onboarding data...', data.cvFile.name);
        
        try {
          // Check if the CV has already been uploaded and analyzed
          const { data: existingCV, error: cvCheckError } = await supabase
            .from('cv_analysis')
            .select('id, user_id, original_filename, created_at')
            .eq('user_id', user.id)
            .eq('original_filename', data.cvFile.name)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (cvCheckError && cvCheckError.code !== 'PGRST116') {
            console.error('❌ Error checking existing CV:', cvCheckError);
          }

          if (existingCV) {
            console.log('✅ CV already processed:', existingCV.id);
            // Update academic profile with CV upload date
            await supabase
              .from('academic_profiles')
              .upsert({
                user_id: user.id,
                last_cv_upload: new Date().toISOString().split('T')[0],
                cv_analysis_score: existingCV.confidence_score || 75,
                updated_at: new Date().toISOString()
              }, { onConflict: 'user_id' });
          } else {
            console.log('🔄 CV file will be processed during CV processing step');
            // CV processing will be handled in Step 6
          }
        } catch (error) {
          console.error('❌ Error handling CV file:', error);
          // Don't fail onboarding for CV issues
        }
      }

      // Step 5: Set user role if not already set
      try {
        console.log('👤 Setting user role...');
        const { error: roleError } = await (supabase as any)
          .from('user_roles')
          .upsert({
            user_id: user.id,
            role: 'applicant'
          }, {
            onConflict: 'user_id',
            ignoreDuplicates: false
          });

        if (roleError) {
          console.error('❌ Error setting user role:', roleError);
          // Don't fail onboarding for role setting
        } else {
          console.log('✅ User role set to applicant');
        }
      } catch (error) {
        console.error('❌ Error in role setting:', error);
      }

      // Step 6: Trigger CV analysis if CV was uploaded
      let cvProcessingInitiated = false;
      if (data.cvFile) {
        try {
          console.log('🤖 Initiating CV analysis with AI...');
          
          // Use the main CV analysis service
          const analysisResult = await cvAnalysisService.uploadAndAnalyzeCV(data.cvFile, user.id);
          
          if (analysisResult.success) {
            cvProcessingInitiated = true;
            console.log('✅ CV analysis completed successfully');
            
            // Update academic profile with CV data immediately
            await supabase
              .from('academic_profiles')
              .upsert({
                user_id: user.id,
                last_cv_upload: new Date().toISOString().split('T')[0],
                cv_analysis_score: analysisResult.confidence || 75,
                updated_at: new Date().toISOString()
              }, { onConflict: 'user_id' });
            
          } else {
            console.warn('⚠️ CV analysis failed:', analysisResult.error);
            cvProcessingInitiated = false;
          }
        } catch (error) {
          console.error('❌ CV analysis failed (non-critical):', error);
          // Don't fail onboarding for CV processing issues
          cvProcessingInitiated = false;
        }
      }

      // Step 7: Clear saved progress
      console.log('🧹 Clearing saved progress...');
      await this.clearProgress();

      console.log('🎉 Onboarding completed successfully with comprehensive data storage!');
      if (cvProcessingInitiated) {
        console.log('🔬 CV analysis is now processing in the background');
      }

      // Clear any cached onboarding status and set new one
      console.log('🔄 Clearing onboarding cache and setting completion status...');
      localStorage.removeItem(`onboarding_completed_${user.id}`);
      localStorage.setItem(`onboarding_completed_${user.id}`, 'true');
      
      // Invalidate session cache to force refresh of onboarding status
      try {
        const { sessionPersistenceService } = await import('./sessionPersistenceService');
        sessionPersistenceService.invalidateUserCache(user.id);
        console.log('🔄 Session cache invalidated');
      } catch (error) {
        console.warn('Could not invalidate session cache:', error);
      }
      
      // Clear progress data since onboarding is complete
      await this.clearProgress();
      
      return { 
        success: true,
        cvAnalysis: cvProcessingInitiated
      };

    } catch (error) {
      console.error('❌ Onboarding completion error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Check if user has completed onboarding using user_profiles table
   */
  async hasCompletedOnboarding(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {return false;}

      // Check both user_profiles flag AND verify that academic profile data exists
      const [profileResult, academicResult] = await Promise.all([
        supabase
          .from('user_profiles')
          .select('onboarding_completed')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('academic_profiles')
          .select('id, current_degree, current_institution')
          .eq('user_id', user.id)
          .maybeSingle()
      ]);

      const profileData = profileResult.data;
      const profileError = profileResult.error;
      const academicData = academicResult.data;
      const academicError = academicResult.error;

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error checking onboarding status:', profileError);
        return false;
      }

      if (academicError && academicError.code !== 'PGRST116') {
        console.error('Error checking academic profile:', academicError);
      }

      // Onboarding is complete only if:
      // 1. user_profiles.onboarding_completed is true
      // 2. AND academic profile exists with required data
      const hasOnboardingFlag = Boolean(profileData?.onboarding_completed);
      const hasAcademicData = Boolean(academicData?.current_degree && academicData?.current_institution);
      
      const isComplete = hasOnboardingFlag && hasAcademicData;
      
      console.log('🔍 Onboarding completion check:', {
        userId: user.id,
        hasOnboardingFlag,
        hasAcademicData,
        isComplete,
        academicDataPreview: academicData ? {
          hasDegree: Boolean(academicData.current_degree),
          hasInstitution: Boolean(academicData.current_institution)
        } : null
      });

      return isComplete;
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
      return false;
    }
  }

  /**
   * Get user's onboarding data for pre-filling forms
   */
  async getOnboardingData(): Promise<OnboardingData | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {return null;}

      // Get profile data
      const profileResult: any = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single();

      // Get academic data
      const academicResult: any = await supabase
        .from('academic_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Get research interests
      const interestsResult: any = await supabase
        .from('user_research_interests')
        .select(`
          research_interests (name)
        `)
        .eq('user_id', user.id)
        .order('priority');

      const profile = profileResult.data;
      const academic = academicResult.data;
      const interests = interestsResult.data;

      const researchInterests = interests?.map((item: any) => 
        item.research_interests?.name
      ).filter(Boolean) || [];

      if (!profile && !academic) {return null;}

      const fullName = profile?.full_name || '';
      const nameParts = fullName.split(' ');

      return {
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        currentDegree: academic?.current_degree || '',
        currentInstitution: academic?.current_institution || '',
        gpa: academic?.current_gpa?.toString() || '',
        cvFile: null, // File objects can't be persisted
        targetDegreeLevel: '', // Not in current schema
        targetField: academic?.current_field_of_study || '',
        researchInterests: researchInterests as string[],
        careerGoals: academic?.career_goals || ''
      };

    } catch (error) {
      console.error('Failed to get onboarding data:', error);
      return null;
    }
  }

}

export const onboardingService = new OnboardingService();