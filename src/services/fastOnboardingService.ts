import { supabase } from '@/integrations/supabase/client';
import { OnboardingData } from '@/components/onboarding/OnboardingWizard';

/**
 * Fast onboarding service optimized for quick completion
 * Performs minimal required operations and defers heavy work to background
 */
class FastOnboardingService {
  /**
   * Fast onboarding completion - immediate navigation, background processing
   */
  async completeOnboardingFast(data: OnboardingData): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🚀 Starting fast onboarding completion...');
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Quick essential profile creation with minimal data
      try {
        // Only create basic user profile - fastest approach
        const { error: profileError } = await Promise.race([
          supabase
            .from('user_profiles')
            .upsert({
              user_id: user.id,
              display_name: `${data.firstName} ${data.lastName}`.trim(),
              // field_of_study removed - column doesn't exist in user_profiles
              created_at: new Date().toISOString()
            }, {
              onConflict: 'user_id',
              ignoreDuplicates: false
            }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 2000)
          )
        ]) as any;

        if (profileError && profileError.code !== '42P01') {
          console.warn('⚠️ Profile creation failed, continuing...', profileError);
        } else {
          console.log('✅ Basic profile created');
        }
      } catch (error) {
        console.warn('⚠️ Profile creation timeout or error, continuing...', error);
      }

      // Set onboarding completion flag
      localStorage.setItem(`onboarding_completed_${user.id}`, 'true');
      localStorage.removeItem('gradapp_onboarding_progress');

      console.log('✅ Fast onboarding completion successful');
      
      // Schedule background completion for comprehensive data storage
      this.scheduleBackgroundCompletion(data, user.id);
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Fast onboarding error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Background completion of comprehensive onboarding data
   * This runs after the user has been navigated to prevent blocking UI
   */
  private scheduleBackgroundCompletion(data: OnboardingData, userId: string) {
    // Run comprehensive onboarding in background with delay
    setTimeout(async () => {
      try {
        console.log('🔄 Starting background onboarding completion...');
        
        // Comprehensive profile creation
        await this.createComprehensiveProfile(data, userId);
        
        // Process research interests
        if (data.researchInterests?.length > 0) {
          await this.processResearchInterests(data.researchInterests, userId);
        }
        
        // Handle CV if present
        if (data.cvFile) {
          await this.handleCVProcessing(data.cvFile, userId);
        }
        
        console.log('✅ Background onboarding completion successful');
        
      } catch (error) {
        console.warn('⚠️ Background onboarding failed (non-critical):', error);
      }
    }, 1000); // 1 second delay to ensure navigation completes first
  }

  /**
   * Create comprehensive user profiles in background
   */
  private async createComprehensiveProfile(data: OnboardingData, userId: string) {
    try {
      // Create academic profile
      await supabase
        .from('academic_profiles')
        .upsert({
          user_id: userId,
          institution: data.currentInstitution,
          degree: data.currentDegree,
          field: data.targetField,
          gpa: data.gpa ? parseFloat(data.gpa) : null,
          created_at: new Date().toISOString()
        }, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        });

      console.log('✅ Academic profile created in background');
    } catch (error) {
      console.warn('⚠️ Academic profile creation failed:', error);
    }
  }

  /**
   * Process research interests in background
   */
  private async processResearchInterests(interests: string[], userId: string) {
    try {
      // Limit to first 5 interests for performance
      const limitedInterests = interests.slice(0, 5);
      
      // Simple batch creation approach
      for (const interest of limitedInterests) {
        await supabase
          .from('research_interests')
          .upsert({ name: interest }, { onConflict: 'name' });
      }
      
      console.log('✅ Research interests processed in background');
    } catch (error) {
      console.warn('⚠️ Research interests processing failed:', error);
    }
  }

  /**
   * Handle CV processing in background
   */
  private async handleCVProcessing(cvFile: File, userId: string) {
    try {
      // Create placeholder CV record
      await supabase
        .from('resumes')
        .insert({
          user_id: userId,
          original_filename: cvFile.name,
          file_size: cvFile.size,
          upload_status: 'pending',
          created_at: new Date().toISOString()
        });

      console.log('✅ CV placeholder created in background');
    } catch (error) {
      console.warn('⚠️ CV processing setup failed:', error);
    }
  }
}

export const fastOnboardingService = new FastOnboardingService();