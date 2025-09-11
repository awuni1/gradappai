import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export interface UserSessionData {
  user: User;
  profile: any;
  academicProfile: any;
  researchInterests: any[];
  cvAnalysis: any;
  onboardingComplete: boolean;
  selectedUniversities: any[];
  universityRecommendations: any[];
  lastUpdated: string;
}

class SessionPersistenceService {
  private sessionCache = new Map<string, UserSessionData>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get comprehensive user session data with caching and timeout
   */
  async getUserSessionData(userId?: string): Promise<UserSessionData | null> {
    try {
      // Get current user if not provided - use cached session first
      let user: User | null = null;
      if (userId) {
        // Try to get user from existing session first (faster)
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id === userId) {
          user = session.user;
        } else {
          // Fallback to getUser() without timeout race
          try {
            const { data } = await supabase.auth.getUser();
            if (data.user?.id !== userId) {
              console.warn('Requested user ID does not match authenticated user');
              return null;
            }
            user = data.user;
          } catch (error) {
            console.warn('Failed to get user, using session fallback');
            return null;
          }
        }
      } else {
        // Try session first, then getUser
        const { data: { session } } = await supabase.auth.getSession();
        user = session?.user || null;
        userId = user?.id;
        
        if (!user) {
          try {
            const { data } = await supabase.auth.getUser();
            user = data.user;
            userId = user?.id;
          } catch (error) {
            console.warn('Failed to get user from both session and getUser');
            return null;
          }
        }
      }

      if (!user || !userId) {
        console.log('❌ No authenticated user found');
        return null;
      }

      // Check cache first
      const cachedData = this.sessionCache.get(userId);
      if (cachedData && Date.now() - new Date(cachedData.lastUpdated).getTime() < this.CACHE_DURATION) {
        console.log('📦 Using cached session data for user:', userId);
        return cachedData;
      }

      console.log('🔄 Refreshing session data for user:', userId);

      // Fetch data with timeout protection - use different timeouts for different operations
      const fetchWithTimeout = <T>(promise: Promise<T>, timeout = 2000): Promise<T> => {
        return Promise.race([
          promise,
          new Promise<T>((_, reject) => 
            setTimeout(() => reject(new Error('Operation timeout')), timeout)
          )
        ]);
      };

      // Fetch all user data in parallel with appropriate timeouts for each operation
      const [
        profileResult,
        academicResult,
        researchResult,
        onboardingResult,
        cvAnalysisResult,
        universitiesResult,
        recommendationsResult
      ] = await Promise.allSettled([
        fetchWithTimeout(this.getUserProfile(userId), 3000), // Profile data - 3s
        fetchWithTimeout(this.getAcademicProfile(userId), 3000), // Academic data - 3s
        fetchWithTimeout(this.getResearchInterests(userId), 3000), // Research interests - 3s
        fetchWithTimeout(this.checkOnboardingStatus(userId), 2000), // Quick check - 2s
        fetchWithTimeout(this.getCVAnalysis(userId), 4000), // CV analysis - 4s (can be slow)
        fetchWithTimeout(this.getSelectedUniversities(userId), 4000), // Universities - 4s
        fetchWithTimeout(this.getUniversityRecommendations(userId), 6000) // Recommendations - 6s (most complex)
      ]);

      // Extract data with safe fallbacks and improved logging
      const profile = profileResult.status === 'fulfilled' ? profileResult.value : null;
      const academicProfile = academicResult.status === 'fulfilled' ? academicResult.value : null;
      const researchInterests = researchResult.status === 'fulfilled' ? researchResult.value : [];
      const onboardingComplete = onboardingResult.status === 'fulfilled' ? onboardingResult.value : false;
      const cvAnalysis = cvAnalysisResult.status === 'fulfilled' ? cvAnalysisResult.value : null;
      const selectedUniversities = universitiesResult.status === 'fulfilled' ? universitiesResult.value : [];
      const universityRecommendations = recommendationsResult.status === 'fulfilled' ? recommendationsResult.value : [];

      // Log failed operations with more detail for debugging
      if (profileResult.status === 'rejected') {
        console.warn('⚠️ Profile fetch failed:', profileResult.reason?.message);
      }
      if (academicResult.status === 'rejected') {
        console.warn('⚠️ Academic profile fetch failed:', academicResult.reason?.message);
      }
      if (researchResult.status === 'rejected') {
        console.warn('⚠️ Research interests fetch failed:', researchResult.reason?.message);
      }
      if (onboardingResult.status === 'rejected') {
        console.warn('⚠️ Onboarding status check failed:', onboardingResult.reason?.message);
      }
      if (cvAnalysisResult.status === 'rejected') {
        console.warn('⚠️ CV analysis fetch failed:', cvAnalysisResult.reason?.message);
      }
      if (universitiesResult.status === 'rejected') {
        console.warn('⚠️ Selected universities fetch failed:', universitiesResult.reason?.message);
      }
      if (recommendationsResult.status === 'rejected') {
        console.warn('⚠️ University recommendations fetch failed:', recommendationsResult.reason?.message, 'This might cause empty university matches on dashboard');
      }

      // Log success counts for monitoring
      console.log(`📊 Session data loaded - Recommendations: ${Array.isArray(universityRecommendations) ? universityRecommendations.length : 0}, Selected: ${Array.isArray(selectedUniversities) ? selectedUniversities.length : 0}`);

      const sessionData: UserSessionData = {
        user,
        profile,
        academicProfile,
        researchInterests,
        cvAnalysis,
        onboardingComplete,
        selectedUniversities,
        universityRecommendations,
        lastUpdated: new Date().toISOString()
      };

      // Cache the data
      this.sessionCache.set(userId, sessionData);

      console.log('✅ Session data refreshed and cached for user:', userId);
      return sessionData;

    } catch (error) {
      console.error('❌ Error fetching user session data (will return fallback):', error);
      
      // Return minimal fallback data to prevent app from hanging
      const { data } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
      if (data.user) {
        return {
          user: data.user,
          profile: null,
          academicProfile: null,
          researchInterests: [],
          cvAnalysis: null,
          onboardingComplete: false,
          selectedUniversities: [],
          universityRecommendations: [],
          lastUpdated: new Date().toISOString()
        };
      }
      
      return null;
    }
  }

  /**
   * Invalidate cache for a user (call when data is updated)
   */
  invalidateUserCache(userId: string): void {
    this.sessionCache.delete(userId);
    console.log('🗑️ Cache invalidated for user:', userId);
  }

  /**
   * Clear all cached data
   */
  clearAllCache(): void {
    this.sessionCache.clear();
    console.log('🧹 All session cache cleared');
  }

  /**
   * Get user profile with error handling
   */
  private async getUserProfile(userId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
        console.warn('Error fetching user profile:', error);
      }

      return data;
    } catch (error) {
      console.warn('Failed to fetch user profile:', error);
      return null;
    }
  }

  /**
   * Get academic profile with error handling - from onboarding data
   */
  private async getAcademicProfile(userId: string): Promise<any> {
    try {
      console.log('🔍 Loading academic profile from academic_profiles for user:', userId);
      const { data, error } = await supabase
        .from('academic_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      console.log('🔍 Query result - data:', data);
      console.log('🔍 Query result - error:', error);

      if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
        console.warn('Error fetching academic profile:', error);
        return null;
      }

      // Transform onboarding data to academic profile format
      if (data) {
        return {
          // Keep original onboarding fields
          ...data,
          // Add mapped fields for compatibility
          gpa: data.current_gpa || data.gpa,
          institution: data.current_institution || data.institution,
          degree: data.current_degree || data.degree,
          field_of_study: data.current_field_of_study || data.field_of_study,
          target_degree: data.target_field,
          target_degree_level: data.target_degree_level,
          name: data.first_name && data.last_name ? `${data.first_name} ${data.last_name}`.trim() : null,
          // Additional fields from onboarding
          firstName: data.first_name,
          lastName: data.last_name,
          currentDegree: data.current_degree,
          currentInstitution: data.current_institution,
          targetDegreeLevel: data.target_degree_level,
          targetField: data.target_field,
          careerGoals: data.career_goals
        };
      }

      return data;
    } catch (error) {
      console.warn('Failed to fetch academic profile:', error);
      return null;
    }
  }

  /**
   * Get research interests with error handling
   */
  private async getResearchInterests(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('user_research_interests')
        .select(`
          research_interests:research_interest_id (
            id, name, category
          )
        `)
        .eq('user_id', userId);

      if (error && error.code !== '42P01') {
        console.warn('Error fetching research interests:', error);
        return [];
      }

      return data?.map(item => item.research_interests).filter(Boolean) || [];
    } catch (error) {
      console.warn('Failed to fetch research interests:', error);
      return [];
    }
  }

  /**
   * Check onboarding completion status
   */
  private async checkOnboardingStatus(userId: string): Promise<boolean> {
    try {
      // Check onboarding service
      const { onboardingService } = await import('./onboardingService');
      return await onboardingService.hasCompletedOnboarding();
    } catch (error) {
      console.warn('Failed to check onboarding status:', error);
      return false;
    }
  }

  /**
   * Get latest CV analysis
   */
  private async getCVAnalysis(userId: string): Promise<any> {
    try {
      const { cvAnalysisService } = await import('./cvAnalysisService');
      return await cvAnalysisService.getStoredAnalysis(userId);
    } catch (error) {
      console.warn('Failed to fetch CV analysis:', error);
      return null;
    }
  }

  /**
   * Get selected universities
   */
  private async getSelectedUniversities(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('selected_universities')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error && error.code !== '42P01') {
        console.warn('Error fetching selected universities:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.warn('Failed to fetch selected universities:', error);
      return [];
    }
  }

  /**
   * Get university recommendations from CV analysis and database
   */
  private async getUniversityRecommendations(userId: string): Promise<any[]> {
    try {
      const { dashboardService } = await import('./dashboardService');
      const result = await dashboardService.getMatchedUniversities();
      return result.data || [];
    } catch (error) {
      console.warn('Failed to fetch university recommendations:', error);
      return [];
    }
  }

  /**
   * Update specific data in session and database
   */
  async updateUserData(userId: string, dataType: keyof UserSessionData, data: any): Promise<boolean> {
    try {
      // Update database first
      let updateSuccess = false;
      
      switch (dataType) {
        case 'academicProfile':
          updateSuccess = await this.updateAcademicProfile(userId, data);
          break;
        case 'researchInterests':
          updateSuccess = await this.updateResearchInterests(userId, data);
          break;
        case 'profile':
          updateSuccess = await this.updateUserProfile(userId, data);
          break;
        default:
          console.warn('Unsupported data type for update:', dataType);
          return false;
      }

      if (updateSuccess) {
        // Invalidate cache to force refresh on next access
        this.invalidateUserCache(userId);
        console.log(`✅ Updated ${dataType} for user:`, userId);
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Error updating ${dataType}:`, error);
      return false;
    }
  }

  /**
   * Update academic profile in database
   */
  private async updateAcademicProfile(userId: string, data: any): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('academic_profiles')
        .upsert({
          user_id: userId,
          ...data,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      return !error;
    } catch (error) {
      console.error('Failed to update academic profile:', error);
      return false;
    }
  }

  /**
   * Update research interests in database
   */
  private async updateResearchInterests(userId: string, interests: string[]): Promise<boolean> {
    try {
      // Delete existing interests
      await supabase
        .from('user_research_interests')
        .delete()
        .eq('user_id', userId);

      // Add new interests
      if (interests.length > 0) {
        const interestData = interests.map(interest => ({
          user_id: userId,
          research_interest_id: interest // Assuming interest IDs are passed
        }));

        const { error } = await supabase
          .from('user_research_interests')
          .insert(interestData);

        return !error;
      }

      return true;
    } catch (error) {
      console.error('Failed to update research interests:', error);
      return false;
    }
  }

  /**
   * Update user profile in database
   */
  private async updateUserProfile(userId: string, data: any): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      return !error;
    } catch (error) {
      console.error('Failed to update user profile:', error);
      return false;
    }
  }

  /**
   * Get cached data without database fetch (for performance)
   */
  getCachedData(userId: string): UserSessionData | null {
    return this.sessionCache.get(userId) || null;
  }

  /**
   * Pre-warm cache with data (useful after login)
   */
  async preWarmCache(userId: string): Promise<void> {
    // Fire and forget - load data in background
    this.getUserSessionData(userId).catch(error => {
      console.warn('Failed to pre-warm cache:', error);
    });
  }

  /**
   * Get user data for specific component needs
   */
  async getDataForComponent(userId: string, requiredData: (keyof UserSessionData)[]): Promise<Partial<UserSessionData>> {
    const sessionData = await this.getUserSessionData(userId);
    
    if (!sessionData) {
      return {};
    }

    const componentData: Partial<UserSessionData> = {};
    requiredData.forEach(key => {
      componentData[key] = sessionData[key];
    });

    return componentData;
  }
}

// Export singleton instance
export const sessionPersistenceService = new SessionPersistenceService();
export default sessionPersistenceService;