import { supabase } from '@/integrations/supabase/client';
import { AuthError, AuthResponse, User } from '@supabase/supabase-js';
import { 
  checkPasswordStrength, 
  checkRateLimit, 
  recordFailedAttempt, 
  resetRateLimit,
  validateEmail,
  sanitizeInput,
  PasswordStrengthResult
} from '@/utils/security';

export interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'applicant' | 'mentor';
  displayName?: string;
  bio?: string;
  location?: string;
  dateOfBirth?: string;
  nationality?: string;
  phone?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
  githubUrl?: string;
  twitterUrl?: string;
}

export interface SignInData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResult {
  user: User | null;
  error: AuthError | null;
  needsEmailConfirmation?: boolean;
}

export interface UserProfile {
  id: string;
  user_id: string;
  role: 'applicant' | 'mentor' | 'admin' | 'university_admin';
  full_name: string;
  display_name?: string;
  bio?: string;
  profile_picture_url?: string;
  cover_photo_url?: string;
  location?: string;
  timezone?: string;
  date_of_birth?: string;
  nationality?: string;
  email?: string;
  phone?: string;
  alternate_email?: string;
  linkedin_url?: string;
  website_url?: string;
  github_url?: string;
  twitter_url?: string;
  orcid_id?: string;
  google_scholar_url?: string;
  researchgate_url?: string;
  email_notifications?: boolean;
  push_notifications?: boolean;
  sms_notifications?: boolean;
  profile_visibility?: 'public' | 'private' | 'contacts_only';
  search_visibility?: boolean;
  language_preference?: string;
  theme_preference?: string;
  notification_frequency?: string;
  is_verified?: boolean;
  verification_status?: 'unverified' | 'pending' | 'verified' | 'rejected';
  verification_documents?: any[];
  verification_notes?: string;
  last_active_at?: string;
  onboarding_completed?: boolean;
  onboarding_step?: number;
  profile_completion_percentage?: number;
  two_factor_enabled?: boolean;
  account_locked?: boolean;
  login_attempts?: number;
  last_password_change?: string;
  privacy_settings?: any;
  total_posts?: number;
  total_comments?: number;
  total_likes?: number;
  reputation_score?: number;
  created_at?: string;
  updated_at?: string;
  last_login?: string;
}

class AuthService {
  /**
   * Sign up a new user with email and password
   */
  async signUp(data: SignUpData): Promise<AuthResult> {
    try {
      // Validate email
      const emailValidation = validateEmail(data.email);
      if (!emailValidation.isValid) {
        return { 
          user: null, 
          error: { message: emailValidation.reason || 'Invalid email' } as AuthError 
        };
      }

      // Check password strength
      const passwordCheck = checkPasswordStrength(data.password);
      if (!passwordCheck.isStrong) {
        return { 
          user: null, 
          error: { 
            message: `Password is too weak. ${passwordCheck.feedback.join('. ')}.` 
          } as AuthError 
        };
      }

      // Check rate limiting
      const emailKey = sanitizeInput(data.email.toLowerCase());
      if (!checkRateLimit(emailKey)) {
        return { 
          user: null, 
          error: { message: 'Too many attempts. Please try again later.' } as AuthError 
        };
      }
      
      const redirectUrl = `${window.location.origin}/`;
      
      const { data: authData, error } = await supabase.auth.signUp({
        email: sanitizeInput(data.email),
        password: data.password,
        options: {
          data: {
            first_name: sanitizeInput(data.firstName),
            last_name: sanitizeInput(data.lastName),
            signup_source: 'web',
            role: data.role || 'applicant',
          },
          emailRedirectTo: redirectUrl
        }
      });

      if (error) {
        // Record failed attempt for rate limiting
        recordFailedAttempt(emailKey);
        return { user: null, error };
      }

      // Reset rate limit on successful signup
      resetRateLimit(emailKey);

      // Check if user needs email confirmation
      if (authData.user && !authData.session) {
        return { 
          user: authData.user, 
          error: null, 
          needsEmailConfirmation: true 
        };
      }

      // If user is immediately authenticated, create user profile
      if (authData.user && authData.session) {
        await this.createUserProfile(authData.user.id, {
          full_name: `${data.firstName} ${data.lastName}`,
          role: data.role || 'applicant',
          display_name: data.displayName,
          bio: data.bio,
          location: data.location,
          email: data.email,
          phone: data.phone,
          linkedin_url: data.linkedinUrl,
          website_url: data.websiteUrl
        });
      }

      return { user: authData.user, error: null };
    } catch (error) {
      // Record failed attempt for rate limiting
      const emailKey = sanitizeInput(data.email.toLowerCase());
      recordFailedAttempt(emailKey);
      return { user: null, error: error as AuthError };
    }
  }

  /**
   * Sign in an existing user
   */
  async signIn(data: SignInData): Promise<AuthResult> {
    try {
      // Validate email format
      const emailValidation = validateEmail(data.email);
      if (!emailValidation.isValid) {
        return { 
          user: null, 
          error: { message: 'Invalid email format' } as AuthError 
        };
      }

      // Check rate limiting
      const emailKey = sanitizeInput(data.email.toLowerCase());
      if (!checkRateLimit(emailKey)) {
        return { 
          user: null, 
          error: { message: 'Too many failed attempts. Please try again later.' } as AuthError 
        };
      }

      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: sanitizeInput(data.email),
        password: data.password,
      });

      if (error) {
        // Record failed attempt for rate limiting
        recordFailedAttempt(emailKey);
        return { user: null, error };
      }

      // Reset rate limit on successful signin
      resetRateLimit(emailKey);

      // Handle remember me functionality
      if (data.rememberMe) {
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('userEmail', sanitizeInput(data.email));
      } else {
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('userEmail');
      }

      return { user: authData.user, error: null };
    } catch (error) {
      // Record failed attempt for rate limiting
      const emailKey = sanitizeInput(data.email.toLowerCase());
      recordFailedAttempt(emailKey);
      return { user: null, error: error as AuthError };
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      
      // Clear local storage
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('userEmail');
      
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  }

  /**
   * Send password reset email
   */
  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  }

  /**
   * Update user password (for authenticated users)
   */
  async updatePassword(newPassword: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<{ user: User | null; error: AuthError | null }> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      return { user, error };
    } catch (error) {
      return { user: null, error: error as AuthError };
    }
  }

  /**
   * Get current session
   */
  async getCurrentSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      return { session, error };
    } catch (error) {
      return { session: null, error: error as AuthError };
    }
  }

  /**
   * Create user profile
   */
  async createUserProfile(userId: string, profileData: Partial<UserProfile>): Promise<{ error: unknown }> {
    try {
      const insertData: any = {
        user_id: userId,
        full_name: profileData.full_name || '',
        role: profileData.role || 'applicant',
        display_name: profileData.display_name,
        bio: profileData.bio,
        location: profileData.location,
        email: profileData.email,
        phone: profileData.phone,
        linkedin_url: profileData.linkedin_url,
        website_url: profileData.website_url
      };

      const result: any = await supabase
        .from('user_profiles')
        .insert(insertData);

      return { error: result.error };
    } catch (error) {
      return { error };
    }
  }

  /**
   * Get user role from user_profiles table with fallback to user_roles and auth metadata
   */
  async getUserRole(userId: string): Promise<{ role: string | null; error: unknown }> {
    try {
      // First, try to get role from current user's metadata
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.id === userId && user.user_metadata?.role) {
        return { role: user.user_metadata.role, error: null };
      }

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database query timeout')), 5000)
      );

      // Try user_profiles table first
      const profileQueryPromise = supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', userId)
        .single();

      const profileResult: any = await Promise.race([profileQueryPromise, timeoutPromise]);
      const profileData = profileResult.data;
      const profileError = profileResult.error;

      if (!profileError && profileData?.role) {
        return { role: profileData.role, error: null };
      }

      // If user_profiles query fails, try user_roles table as fallback
      if (profileError?.code === 'PGRST116' || profileError?.code === '42P01') {
        const rolesQueryPromise = (supabase as any)
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .single();

        const rolesResult: any = await Promise.race([rolesQueryPromise, timeoutPromise]);
        const rolesData = rolesResult.data;
        const rolesError = rolesResult.error;

        if (!rolesError && rolesData?.role) {
          return { role: rolesData.role, error: null };
        }

        if (rolesError?.code === 'PGRST116') {
          // No rows found in either table - check auth metadata again
          if (user && user.id === userId && user.user_metadata?.role) {
            return { role: user.user_metadata.role, error: null };
          }
          return { role: null, error: null };
        }
      }
      
      // For other errors, still try to return metadata role if available
      if (user && user.id === userId && user.user_metadata?.role) {
        console.warn('Database error, using auth metadata role:', profileError || 'unknown error');
        return { role: user.user_metadata.role, error: profileError };
      }

      return { role: null, error: profileError };
    } catch (error: unknown) {
      console.warn('getUserRole failed:', error);
      
      // Last resort: try to get from auth metadata
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.id === userId && user.user_metadata?.role) {
          return { role: user.user_metadata.role, error };
        }
      } catch {
        // Ignore errors when getting user role
      }
      
      return { role: null, error };
    }
  }

  /**
   * Clear cached onboarding status for a user
   */
  clearOnboardingCache(userId: string): void {
    try {
      localStorage.removeItem(`onboarding_completed_${userId}`);
    } catch (error) {
      console.warn('Failed to clear onboarding cache:', error);
    }
  }

  /**
   * Check if user has completed onboarding using user_profiles table
   */
  async hasCompletedOnboarding(userId: string): Promise<{ completed: boolean; error: unknown }> {
    try {
      // Check localStorage first for cached onboarding status
      const cachedStatus = localStorage.getItem(`onboarding_completed_${userId}`);
      if (cachedStatus === 'true') {
        return { completed: true, error: null };
      }

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database query timeout')), 5000)
      );

      // Check user_profiles table for onboarding_completed status
      const profileQuery = supabase
        .from('user_profiles')
        .select('onboarding_completed')
        .eq('user_id', userId)
        .single();

      const result: any = await Promise.race([profileQuery, timeoutPromise]);
      const data = result.data;
      const error = result.error;

      if (error) {
        // If user_profiles query fails, try fallback approaches
        if (error.code === 'PGRST116') {
          // User profile not found - definitely haven't completed onboarding
          return { completed: false, error: null };
        }
        
        if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          // Table doesn't exist, try academic_profiles fallback
          console.log('user_profiles table not found, trying academic_profiles fallback...');
          
          try {
            const fallbackQuery = supabase
              .from('academic_profiles')
              .select('id')
              .eq('user_id', userId)
              .single();
              
            const fallbackResult: any = await Promise.race([fallbackQuery, timeoutPromise]);
            const fallbackData = fallbackResult.data;
            const fallbackError = fallbackResult.error;
            
            if (fallbackError) {
              if (fallbackError.code === 'PGRST116') {
                return { completed: false, error: null };
              }
              return { completed: false, error: fallbackError };
            }
            
            // If user has academic profile, they've completed onboarding
            if (fallbackData) {
              localStorage.setItem(`onboarding_completed_${userId}`, 'true');
              return { completed: true, error: null };
            }
            
            return { completed: false, error: null };
          } catch (fallbackErr) {
            console.warn('Fallback onboarding check failed:', fallbackErr);
            return { completed: false, error: fallbackErr };
          }
        }
        
        // For timeout or connection errors, return false but include error
        if (error.message?.includes('timeout') || error.message?.includes('connection')) {
          console.warn('Database connection issue while checking onboarding:', error);
          return { completed: false, error };
        }
        
        return { completed: false, error };
      }

      const completed = Boolean(data?.onboarding_completed);

      // Cache successful result if completed
      if (completed) {
        localStorage.setItem(`onboarding_completed_${userId}`, 'true');
      }

      return { completed, error: null };
    } catch (error: unknown) {
      console.warn('hasCompletedOnboarding failed:', error);
      
      // For timeout errors, don't block user
      if ((error as Error)?.message?.includes('timeout')) {
        return { completed: false, error };
      }
      
      return { completed: false, error };
    }
  }

  /**
   * OAuth sign in with Google
   */
  async signInWithGoogle(): Promise<{ error: AuthError | null }> {
    try {
    // Always use current site origin (works for prod and local)
    const redirectTo = `${window.location.origin}/auth/callback`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
      redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  }

  /**
   * OAuth sign in with GitHub
   */
  async signInWithGitHub(): Promise<{ error: AuthError | null }> {
    try {
    // Always use current site origin (works for prod and local)
    const redirectTo = `${window.location.origin}/auth/callback`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
      redirectTo,
        },
      });

      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: unknown) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }

  /**
   * Get error message in user-friendly format
   */
  getErrorMessage(error: AuthError): string {
    switch (error.message) {
      case 'Invalid login credentials':
        return 'The email or password you entered is incorrect.';
      case 'Email not confirmed':
        return 'Please check your email and click the confirmation link before signing in.';
      case 'User already registered':
        return 'An account with this email already exists. Please sign in instead.';
      case 'Password should be at least 6 characters':
        return 'Password must be at least 6 characters long.';
      case 'Invalid email':
        return 'Please enter a valid email address.';
      case 'Signup is disabled':
        return 'Account registration is temporarily disabled. Please try again later.';
      case 'Email rate limit exceeded':
        return 'Too many emails sent. Please wait before requesting another.';
      default:
        return error.message || 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Validate email format
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   */
  getPasswordStrength(password: string): PasswordStrengthResult {
    return checkPasswordStrength(password);
  }

  /**
   * Get complete user status including role and onboarding completion
   */
  async getUserStatusComplete(userId: string): Promise<{
    role: string | null;
    onboardingCompleted: boolean;
    error?: unknown;
  }> {
    try {
      // Get user role and onboarding status in parallel
      const [roleResult, onboardingResult] = await Promise.all([
        this.getUserRole(userId),
        this.hasCompletedOnboarding(userId)
      ]);

      return {
        role: roleResult.role,
        onboardingCompleted: onboardingResult.completed,
        error: roleResult.error || onboardingResult.error
      };
    } catch (error) {
      console.warn('getUserStatusComplete failed:', error);
      return {
        role: null,
        onboardingCompleted: false,
        error
      };
    }
  }

  /**
   * Validate if user can access a specific route
   */
  async validateRouteAccess(pathname: string, userId: string): Promise<{
    allowed: boolean;
    redirectTo?: string;
    reason?: string;
  }> {
    try {
      const status = await this.getUserStatusComplete(userId);
      
      // Define route patterns and their requirements
      const routeConfig = {
        // Public routes - always allowed
        public: ['/', '/auth', '/about', '/contact', '/auth/student', '/auth/mentor', '/mentor/auth'],
        
        // Onboarding routes - only for users who haven't completed onboarding
        onboarding: {
          applicant: ['/onboarding'],
          mentor: ['/mentor/onboarding']
        },
        
        // Protected routes - require completed onboarding
        protected: {
          applicant: ['/dashboard', '/applications', '/universities', '/professors', '/gradnet', '/settings'],
          mentor: ['/mentor/dashboard', '/mentor/students', '/mentor/schedule', '/mentor/resources', '/gradnet', '/settings']
        }
      };

      // Allow public routes
      if (routeConfig.public.includes(pathname)) {
        return { allowed: true };
      }

      // Check onboarding routes
      if (status.role === 'applicant' && routeConfig.onboarding.applicant.some(route => pathname.startsWith(route))) {
        if (status.onboardingCompleted) {
          return {
            allowed: false,
            redirectTo: '/dashboard',
            reason: 'You have already completed onboarding.'
          };
        }
        return { allowed: true };
      }

      if (status.role === 'mentor' && routeConfig.onboarding.mentor.some(route => pathname.startsWith(route))) {
        if (status.onboardingCompleted) {
          return {
            allowed: false,
            redirectTo: '/mentor/dashboard',
            reason: 'You have already completed onboarding.'
          };
        }
        return { allowed: true };
      }

      // Check protected routes
      if (status.role === 'applicant' && routeConfig.protected.applicant.some(route => pathname.startsWith(route))) {
        if (!status.onboardingCompleted) {
          return {
            allowed: false,
            redirectTo: '/onboarding',
            reason: 'Please complete your onboarding first.'
          };
        }
        return { allowed: true };
      }

      if (status.role === 'mentor' && routeConfig.protected.mentor.some(route => pathname.startsWith(route))) {
        if (!status.onboardingCompleted) {
          return {
            allowed: false,
            redirectTo: '/mentor/onboarding',
            reason: 'Please complete your onboarding first.'
          };
        }
        return { allowed: true };
      }

      // Check for role mismatch
      if (status.role === 'applicant' && routeConfig.protected.mentor.some(route => pathname.startsWith(route))) {
        return {
          allowed: false,
          redirectTo: '/dashboard',
          reason: 'Access denied. Redirecting to your dashboard.'
        };
      }

      if (status.role === 'mentor' && routeConfig.protected.applicant.some(route => pathname.startsWith(route))) {
        return {
          allowed: false,
          redirectTo: '/mentor/dashboard',
          reason: 'Access denied. Redirecting to your dashboard.'
        };
      }

      // Default to requiring authentication
      return {
        allowed: false,
        redirectTo: status.role === 'mentor' ? '/mentor/auth' : '/auth/student',
        reason: 'Authentication required.'
      };

    } catch (error) {
      console.warn('validateRouteAccess failed:', error);
      return {
        allowed: false,
        redirectTo: '/auth',
        reason: 'Authentication check failed.'
      };
    }
  }

  /**
   * Get the appropriate post-authentication redirect URL
   */
  async getPostAuthRedirect(userId: string): Promise<string> {
    try {
      const status = await this.getUserStatusComplete(userId);
      
      // If no role determined, redirect to role selection or general auth
      if (!status.role) {
        return '/auth';
      }

      // If onboarding not completed, redirect to onboarding
      if (!status.onboardingCompleted) {
        return status.role === 'mentor' ? '/mentor/onboarding' : '/onboarding';
      }

      // If fully set up, redirect to dashboard
      return status.role === 'mentor' ? '/mentor/dashboard' : '/dashboard';

    } catch (error) {
      console.warn('getPostAuthRedirect failed:', error);
      return '/auth';
    }
  }

  /**
   * Get user profile from user_profiles table
   */
  async getUserProfile(userId: string): Promise<{ profile: UserProfile | null; error: unknown }> {
    try {
      const result: any = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      return { profile: result.data, error: result.error };
    } catch (error) {
      return { profile: null, error };
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, profileData: Partial<UserProfile>): Promise<{ error: unknown }> {
    try {
      const updateData: any = {
        ...profileData,
        updated_at: new Date().toISOString()
      };

      const result: any = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('user_id', userId);

      return { error: result.error };
    } catch (error) {
      return { error };
    }
  }

  /**
   * Update onboarding status
   */
  async updateOnboardingStatus(userId: string, completed: boolean, step?: number): Promise<{ error: unknown }> {
    try {
      const updateData: any = {
        onboarding_completed: completed,
        updated_at: new Date().toISOString()
      };

      if (step !== undefined) {
        updateData.onboarding_step = step;
      }

      const result: any = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('user_id', userId);

      const error = result.error;

      // Clear cache if onboarding is completed
      if (completed) {
        localStorage.setItem(`onboarding_completed_${userId}`, 'true');
      } else {
        localStorage.removeItem(`onboarding_completed_${userId}`);
      }

      return { error };
    } catch (error) {
      return { error };
    }
  }

  /**
   * Update profile completion percentage
   */
  async updateProfileCompletion(userId: string, percentage: number): Promise<{ error: unknown }> {
    try {
      const updateData: any = {
        profile_completion_percentage: percentage,
        updated_at: new Date().toISOString()
      };

      const result: any = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('user_id', userId);

      const error = result.error;

      return { error };
    } catch (error) {
      return { error };
    }
  }

  /**
   * Update last active timestamp
   */
  async updateLastActive(userId: string): Promise<{ error: unknown }> {
    try {
      const updateData: any = {
        last_active_at: new Date().toISOString()
      };

      const result: any = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('user_id', userId);

      const error = result.error;

      return { error };
    } catch (error) {
      return { error };
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;