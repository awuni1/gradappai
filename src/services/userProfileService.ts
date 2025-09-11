import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';

export interface UserProfile {
  id?: string;
  user_id: string;
  display_name?: string;
  bio?: string;
  field_of_study?: string;
  academic_level?: string;
  target_degree?: string;
  current_institution?: string;
  profile_image_url?: string;
  banner_image_url?: string;
  verified_status?: boolean;
  timezone?: string;
  availability_hours?: any;
  linkedin_url?: string;
  website_url?: string;
  research_interests?: string[];
  skills?: string[];
  languages?: string[];
  location?: string;
  graduation_year?: number;
  gpa?: number;
  created_at?: string;
  updated_at?: string;
}

export interface OnboardingData {
  institution: string;
  degree: string;
  field: string;
  graduationYear: string;
  gpa?: string;
  targetPrograms?: any[];
  researchInterests?: any[];
  parsedResumeData?: any;
}

class UserProfileService {
  /**
   * Create or update user profile from onboarding data
   */
  async createUserProfileFromOnboarding(user: User, onboardingData: OnboardingData): Promise<UserProfile | null> {
    try {
      const profileData: UserProfile = {
        user_id: user.id,
        display_name: user.user_metadata?.full_name || 
                     user.user_metadata?.name || 
                     user.email?.split('@')[0] || 
                     'User',
        field_of_study: onboardingData.field,
        academic_level: this.determineAcademicLevel(onboardingData.degree),
        target_degree: onboardingData.degree,
        current_institution: onboardingData.institution,
        graduation_year: onboardingData.graduationYear ? parseInt(onboardingData.graduationYear) : undefined,
        gpa: onboardingData.gpa ? parseFloat(onboardingData.gpa) : undefined,
        research_interests: onboardingData.researchInterests?.map(interest => 
          typeof interest === 'string' ? interest : interest.name
        ) || [],
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        verified_status: false
      };

      // Try to upsert the profile
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert(profileData, { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (error) {
        // If table doesn't exist, handle gracefully
        if (error.code === '42P01') {
          console.warn('user_profiles table does not exist yet. Please deploy the database schema first.');
          toast.warning('Database setup required. Please contact support.');
          return null;
        }
        throw error;
      }

      console.log('User profile created/updated:', data);
      return data;
    } catch (error) {
      console.error('Error creating user profile:', error);
      toast.error('Failed to save user profile');
      return null;
    }
  }

  /**
   * Get user profile by user ID
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No profile found
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {throw error;}

      toast.success('Profile updated successfully');
      return data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      toast.error('Failed to update profile');
      return null;
    }
  }

  /**
   * Create user profile with basic info (for new users)
   */
  async createBasicUserProfile(user: User): Promise<UserProfile | null> {
    try {
      // Check if profile already exists
      const existingProfile = await this.getUserProfile(user.id);
      if (existingProfile) {
        return existingProfile;
      }

      const profileData: UserProfile = {
        user_id: user.id,
        display_name: user.user_metadata?.full_name || 
                     user.user_metadata?.name || 
                     user.email?.split('@')[0] || 
                     'User',
        profile_image_url: user.user_metadata?.avatar_url,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        verified_status: false
      };

      const { data, error } = await supabase
        .from('user_profiles')
        .insert(profileData)
        .select()
        .single();

      if (error) {
        // If table doesn't exist, handle gracefully
        if (error.code === '42P01') {
          console.warn('user_profiles table does not exist yet.');
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error creating basic user profile:', error);
      return null;
    }
  }

  /**
   * Upload profile image
   */
  async uploadProfileImage(userId: string, file: File): Promise<string | null> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/profile.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('profiles')
        .upload(fileName, file, { upsert: true });

      if (error) {throw error;}

      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(data.path);

      // Update user profile with new image URL
      await this.updateUserProfile(userId, {
        profile_image_url: publicUrl
      });

      return publicUrl;
    } catch (error) {
      console.error('Error uploading profile image:', error);
      toast.error('Failed to upload profile image');
      return null;
    }
  }

  /**
   * Search user profiles
   */
  async searchUserProfiles(query: string, limit = 20): Promise<UserProfile[]> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .or(`display_name.ilike.%${query}%,field_of_study.ilike.%${query}%,current_institution.ilike.%${query}%`)
        .limit(limit);

      if (error) {throw error;}
      return data || [];
    } catch (error) {
      console.error('Error searching user profiles:', error);
      return [];
    }
  }

  /**
   * Get user profiles by field of study
   */
  async getUserProfilesByField(fieldOfStudy: string, limit = 20): Promise<UserProfile[]> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('field_of_study', fieldOfStudy)
        .limit(limit);

      if (error) {throw error;}
      return data || [];
    } catch (error) {
      console.error('Error fetching user profiles by field:', error);
      return [];
    }
  }

  /**
   * Determine academic level from degree
   */
  private determineAcademicLevel(degree: string): string {
    const degreeUpper = degree.toUpperCase();
    
    if (degreeUpper.includes('PHD') || degreeUpper.includes('DOCTORATE')) {
      return 'phd';
    } else if (degreeUpper.includes('MASTER') || degreeUpper.includes('MS') || degreeUpper.includes('MA')) {
      return 'masters';
    } else if (degreeUpper.includes('BACHELOR') || degreeUpper.includes('BS') || degreeUpper.includes('BA')) {
      return 'undergraduate';
    } else if (degreeUpper.includes('POSTDOC')) {
      return 'postdoc';
    }
    
    return 'undergraduate'; // Default
  }

  /**
   * Check if user has completed profile setup
   */
  async hasCompletedProfile(userId: string): Promise<boolean> {
    try {
      const profile = await this.getUserProfile(userId);
      
      if (!profile) {return false;}
      
      // Check if essential fields are filled
      return Boolean(profile.display_name &&
        profile.field_of_study &&
        profile.academic_level);
    } catch (error) {
      console.error('Error checking profile completion:', error);
      return false;
    }
  }

  /**
   * Get user role (applicant or mentor)
   */
  async getUserRole(userId: string): Promise<'applicant' | 'mentor' | null> {
    try {
      // Check if user has mentor profile
      const { data: mentorProfile, error } = await supabase
        .from('mentor_profiles')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!error && mentorProfile) {
        return 'mentor';
      }

      // Default to applicant for users with user profiles
      const userProfile = await this.getUserProfile(userId);
      return userProfile ? 'applicant' : null;
    } catch (error) {
      console.error('Error getting user role:', error);
      return 'applicant'; // Default
    }
  }
}

// Export singleton instance
export const userProfileService = new UserProfileService();