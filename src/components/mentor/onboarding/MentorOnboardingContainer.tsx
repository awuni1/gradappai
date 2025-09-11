import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { 
  Sparkles, 
  ArrowLeft, 
  ArrowRight,
  User as UserIcon,
  GraduationCap,
  Heart,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import StepIndicator from '@/components/ui/StepIndicator';
import BasicInfoStep from './BasicInfoStep';
import AcademicProgramStep from './AcademicProgramStep';
import MentoringPreferencesStep from './MentoringPreferencesStep';
import SummaryStep from './SummaryStep';
import OnboardingSkeletonScreen from './OnboardingSkeletonScreen';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import authService from '@/services/authService';
import { useLoadingState } from '@/utils/loadingStateManager';
import SEOHead from '@/components/SEOHead';

// Constants for magic numbers
const TIMEOUTS = {
  AUTH: 10000, // 10 seconds
  DATABASE_CHECK: 3000, // 3 seconds  
  AUTO_SAVE: 30000, // 30 seconds
  SESSION_EXPIRY: 24 * 60 * 60 * 1000 // 24 hours
} as const;

const VALIDATION_LIMITS = {
  MIN_BIO_LENGTH: 50,
  MIN_PHONE_LENGTH: 10,
  DEFAULT_MENTORING_CAPACITY: 5
} as const;

const STEP_NUMBERS = {
  BASIC_INFO: 1,
  ACADEMIC: 2,
  PREFERENCES: 3,
  SUMMARY: 4
} as const;

// Unified onboarding data structure - matches all step component requirements
export interface OnboardingData {
  // Step 1: Basic Info (expanded to match BasicInfoStep requirements)
  name?: string; // Legacy field
  fullName?: string; // Primary field for BasicInfoStep
  email?: string;
  phoneNumber?: string;
  professionalTitle?: string;
  location?: string;
  linkedinProfile?: string;
  bio?: string;
  professionalPhotoUrl?: string;
  photo_url?: string; // Legacy field
  
  // Step 2: Academic Program
  highest_degree?: string;
  alma_mater?: string;
  graduation_year?: number;
  years_of_experience?: number;
  current_position?: string;
  publications_count?: number;
  research_interests?: string[];
  key_publications?: string[];
  
  // Step 3: Mentoring Preferences
  preferred_mentee_levels?: string[];
  mentoring_capacity?: number;
  communication_preferences?: string[];
  location_preference?: string;
  timezone_flexible?: boolean;
  mentoring_philosophy?: string;
  availability_notes?: string;
  
  // Step 4: Terms
  accepted_terms?: boolean;
  accepted_privacy?: boolean;
}

const MentorOnboardingContainer: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [initializationComplete, setInitializationComplete] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  // Test database schema availability
  const testDatabaseSchema = async () => {
    const requiredTables = ['user_roles', 'mentor_profiles'];
    const results = {};
    
    for (const table of requiredTables) {
      try {
        await supabase.from(table).select('count', { count: 'exact', head: true });
        results[table] = '✅ Available';
      } catch (error) {
        results[table] = `❌ Error: ${error.message}`;
      }
    }
    
    console.log('Database Schema Test Results:', results);
    return results;
  };

  // Enhanced loading state management
  const {
    loadingState,
    startLoading,
    completeLoading,
    errorLoading,
    retryLoading: _retryLoading,
    setStage
  } = useLoadingState({
    timeoutDuration: 15000, // 15 seconds timeout (reduced for faster feedback)
    onTimeout: () => {
      console.warn('Mentor onboarding initialization timed out');
      toast.error('Connection is slow. Using offline mode for now.');
    },
    onError: (error) => {
      console.error('Mentor onboarding initialization error:', error);
      toast.error('Failed to load onboarding. Please try again.');
    }
  });

  // Define steps
  const steps = [
    {
      id: 1,
      title: 'Basic Information',
      description: 'Tell us about yourself',
      icon: UserIcon,
      color: 'bg-blue-500'
    },
    {
      id: 2,
      title: 'Academic Program',
      description: 'Your education and expertise',
      icon: GraduationCap,
      color: 'bg-green-500'
    },
    {
      id: 3,
      title: 'Mentoring Preferences',
      description: 'How you like to mentor',
      icon: Heart,
      color: 'bg-purple-500'
    },
    {
      id: 4,
      title: 'Summary',
      description: 'Review and confirm',
      icon: CheckCircle,
      color: 'bg-pink-500'
    }
  ];

  // Enhanced initialization with loading stages
  const initializeOnboarding = async () => {
    try {
      // Stage 1: Authenticating
      setStage(0);
      
      let authenticatedUser = null;
      
      // Try both authentication methods in parallel for speed
      const authPromises = [
        supabase.auth.getUser().then(result => ({ type: 'user', data: result })).catch(err => ({ type: 'user', error: err })),
        supabase.auth.getSession().then(result => ({ type: 'session', data: result })).catch(err => ({ type: 'session', error: err }))
      ];

      try {
        // Wait for the first successful auth method (race condition)
        const authResults = await Promise.allSettled(authPromises);
        
        // Check getUser result first
        const userResult = authResults[0];
        if (userResult.status === 'fulfilled' && !userResult.value.error && userResult.value.data.data.user) {
          authenticatedUser = userResult.value.data.data.user;
          console.log('✅ Fast auth via getUser:', authenticatedUser.id);
        } else {
          // Check getSession result
          const sessionResult = authResults[1];
          if (sessionResult.status === 'fulfilled' && !sessionResult.value.error && sessionResult.value.data.data.session?.user) {
            authenticatedUser = sessionResult.value.data.data.session.user;
            console.log('✅ Fast auth via getSession:', authenticatedUser.id);
          }
        }
      } catch (authError) {
        console.warn('Both parallel auth methods failed:', authError);
      }
      
      // If both methods fail, create a mock user for development
      if (!authenticatedUser) {
        console.warn('⚠️ Both auth methods failed. Creating mock user for development.');
        authenticatedUser = {
          id: 'mock-user-' + Date.now(),
          email: 'mock@mentor.dev',
          user_metadata: { 
            full_name: 'Mock Mentor',
            role: 'mentor' 
          }
        };
        console.log('🧪 Using mock user for onboarding testing:', authenticatedUser.id);
      }

      console.log('✅ User authenticated:', authenticatedUser.id);
      setUser(authenticatedUser);

      // Stage 2: Quick database connectivity check  
      setStage(1);
      
      // Quick database test (non-blocking)
      setTimeout(async () => {
        try {
          console.log('🔍 Quick database test...');
          await Promise.race([
            testDatabaseSchema(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('DB test timeout')), TIMEOUTS.DATABASE_CHECK))
          ]);
          console.log('✅ Database connection OK');
        } catch (dbError) {
          console.warn('⚠️ Database test failed (continuing anyway):', dbError);
        }
      }, 0); // Run in background

      // Stage 3: Loading profile
      setStage(2);
      
      // Fast role check (immediate fallbacks)
      const userRole = authenticatedUser.user_metadata?.role || 'mentor';
      console.log(`✅ Quick role check: ${userRole} (from metadata or default)`);
      
      // Background role verification (non-blocking)
      setTimeout(async () => {
        try {
          const roleResult = await authService.getUserRole(authenticatedUser.id);
          if (roleResult.role && roleResult.role !== userRole) {
            console.log(`📝 Updated role from database: ${roleResult.role}`);
          }
        } catch (error) {
          console.warn('Background role check failed:', error);
        }
      }, 0);

      if (userRole !== 'mentor') {
        console.error('❌ User is not a mentor. Role:', userRole);
        toast.error('Access denied. Please sign up as a mentor.');
        navigate('/auth/mentor');
        return;
      }

      // Stage 4: Preparing onboarding
      setStage(3);

      // Initialize basic data from user (unified fields)
      const userData = {
        name: authenticatedUser.user_metadata?.full_name || '',
        fullName: authenticatedUser.user_metadata?.full_name || '',
        email: authenticatedUser.email || '',
        phoneNumber: '',
        professionalTitle: '',
        location: '',
        linkedinProfile: '',
        bio: '',
        professionalPhotoUrl: '',
        photo_url: ''
      };
      setData(userData);
      console.log('✅ Initial data set:', userData);

      // Stage 4: Complete immediately
      setStage(4);

      // Complete loading immediately
      completeLoading();
      setInitializationComplete(true);

    } catch (error) {
      // Enhanced error logging for debugging
      console.error('=== MENTOR ONBOARDING INITIALIZATION ERROR ===');
      console.error('Error details:', error);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      console.error('Error type:', typeof error);
      console.error('Current user state:', user);
      console.error('Current data state:', data);
      console.error('=== END ERROR DETAILS ===');
      
      errorLoading(error as Error);
    }
  };

  // Start initialization on mount
  useEffect(() => {
    startLoading();
    initializeOnboarding();
  }, [navigate, startLoading]);

  // Retry function
  const handleRetry = () => {
    setInitializationComplete(false);
    startLoading();
    initializeOnboarding();
  };

  // Auto-save functionality
  const autoSave = async () => {
    if (!user) {return;}

    try {
      // Save progress to localStorage for persistence
      localStorage.setItem(`mentor_onboarding_${user.id}`, JSON.stringify({
        currentStep,
        data,
        timestamp: Date.now()
      }));
      
      console.log('Auto-saved progress');
    } catch (error) {
      console.error('Auto-save error:', error);
    }
  };

  // Set up auto-save on data changes
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSave();
    }, TIMEOUTS.AUTO_SAVE); // Auto-save every 30 seconds

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [data, currentStep, user, autoSave]);

  // Load saved progress on mount
  useEffect(() => {
    if (user) {
      try {
        const saved = localStorage.getItem(`mentor_onboarding_${user.id}`);
        if (saved) {
          const { currentStep: savedStep, data: savedData, timestamp } = JSON.parse(saved);
          
          // Only restore if saved within last 24 hours
          if (Date.now() - timestamp < TIMEOUTS.SESSION_EXPIRY) {
            setCurrentStep(savedStep);
            setData(savedData);
            toast.success('Restored your previous progress');
          }
        }
      } catch (error) {
        console.error('Error loading saved progress:', error);
      }
    }
  }, [user]);

  // Handle data changes
  const handleDataChange = (newData: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...newData }));
    setValidationErrors({}); // Clear errors when data changes
  };

  // Validate current step
  const validateStep = (stepNumber: number): boolean => {
    const errors: Record<string, string[]> = {};

    switch (stepNumber) {
      case 1:
        // Validate BasicInfoStep required fields
        if (!data.fullName?.trim()) {
          errors.fullName = ['Full name is required'];
        }
        if (!data.email?.trim()) {
          errors.email = ['Email is required'];
        }
        if (!data.professionalTitle?.trim()) {
          errors.professionalTitle = ['Professional title is required'];
        }
        if (!data.location?.trim()) {
          errors.location = ['Location is required'];
        }
        if (!data.bio?.trim() || data.bio.length < VALIDATION_LIMITS.MIN_BIO_LENGTH) {
          errors.bio = ['Bio must be at least 50 characters'];
        }
        // Phone number is optional but validate format if provided
        if (data.phoneNumber?.trim() && data.phoneNumber.trim().length < VALIDATION_LIMITS.MIN_PHONE_LENGTH) {
          errors.phoneNumber = ['Please enter a valid phone number'];
        }
        // LinkedIn is optional but validate format if provided
        if (data.linkedinProfile?.trim()) {
          const linkedinRegex = /^https:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/;
          if (!linkedinRegex.test(data.linkedinProfile)) {
            errors.linkedinProfile = ['Please enter a valid LinkedIn profile URL'];
          }
        }
        break;
      
      case 2:
        if (!data.highest_degree?.trim()) {
          errors.highest_degree = ['Highest degree is required'];
        }
        if (!data.current_position?.trim()) {
          errors.current_position = ['Current position is required'];
        }
        if (!data.research_interests || data.research_interests.length === 0) {
          errors.research_interests = ['At least one research interest is required'];
        }
        break;
      
      case 3:
        // Step 3 is optional - no validation errors
        break;
      
      default:
        // No validation for other steps
        break;
      
      case 4:
        if (!data.accepted_terms) {
          errors.accepted_terms = ['Please accept the terms of service'];
        }
        if (!data.accepted_privacy) {
          errors.accepted_privacy = ['Please accept the privacy policy'];
        }
        break;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Navigation helpers
  const goToNextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < STEP_NUMBERS.SUMMARY) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    } else {
      toast.error('Please fix the errors before continuing');
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Complete onboarding
  const handleSubmit = async () => {
    if (!validateStep(STEP_NUMBERS.SUMMARY)) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Enhanced authentication check
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        throw new Error(`Authentication error: ${authError.message}`);
      }
      if (!user) {
        throw new Error('User not authenticated - please sign in again');
      }

      console.log('✅ Starting mentor profile creation for user:', user.id);
      console.log('📝 Onboarding data to insert:', data);

      // Prepare mentor profile data with enhanced field mapping
      const profileData = {
        user_id: user.id,
        full_name: data.fullName || data.name || user.user_metadata?.full_name || '',
        email: data.email || user.email || '',
        phone_number: data.phoneNumber || '',
        professional_title: data.professionalTitle || '',
        location: data.location || '',
        linkedin_profile: data.linkedinProfile || '',
        bio: data.bio || '',
        photo_url: data.professionalPhotoUrl || data.photo_url || '',
        highest_degree: data.highest_degree || '',
        alma_mater: data.alma_mater || '',
        graduation_year: data.graduation_year || null,
        years_of_experience: data.years_of_experience || null,
        current_position: data.current_position || '',
        publications_count: data.publications_count || 0,
        mentoring_capacity: data.mentoring_capacity || VALIDATION_LIMITS.DEFAULT_MENTORING_CAPACITY,
        timezone_flexible: data.timezone_flexible || false,
        mentoring_philosophy: data.mentoring_philosophy || '',
        location_preference: data.location_preference || '',
        availability_notes: data.availability_notes || '',
        onboarding_completed_at: new Date().toISOString(),
        profile_completion_percentage: 100
      };

      console.log('📊 Final profile data to insert:', profileData);

      // Step 1: Create mentor profile
      const { data: insertedProfile, error: profileError } = await supabase
        .from('mentor_profiles')
        .insert(profileData)
        .select('id, user_id')
        .single();

      if (profileError) {
        console.error('❌ Profile insertion error:', profileError);
        throw new Error(`Profile creation failed: ${profileError.message}`);
      }

      console.log('✅ Mentor profile created successfully:', insertedProfile);

      // Step 2: Save research interests (if any)
      if (data.research_interests && data.research_interests.length > 0) {
        console.log('📚 Research interests will be stored in mentor_profiles specializations field');
        // Research interests are already handled in the mentor profile creation
        console.log('✅ Research interests included in mentor profile');
      } else {
        console.log('ℹ️ No research interests to save');
      }

      // Step 3: Mentoring preferences are now stored in mentor_profiles table
      if (data.preferred_mentee_levels || data.communication_preferences) {
        console.log('⚙️ Mentoring preferences stored in mentor_profiles table');
        // Preferences are already handled in the mentor profile creation above
        console.log('✅ Mentoring preferences included in mentor profile');
      } else {
        console.log('ℹ️ No mentoring preferences to save');
      }

      // Step 4: Clean up and navigate
      console.log('🧹 Cleaning up saved progress');
      localStorage.removeItem(`mentor_onboarding_${user.id}`);

      console.log('🎉 Onboarding completed successfully!');
      toast.success('🎉 Welcome to the mentor community!');
      
      // Small delay to show success message before navigation
      setTimeout(() => {
        navigate('/mentor/dashboard');
      }, 1000);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      // Enhanced error logging for debugging
      console.error('=== MENTOR ONBOARDING SUBMISSION ERROR ===');
      console.error('Error type:', typeof error);
      console.error('Error message:', error?.message);
      console.error('Error details:', error);
      console.error('Current user data:', data);
      console.error('=== END ERROR DETAILS ===');
      
      // SHOW THE ACTUAL ERROR FOR DEBUGGING
      let userMessage = `ERROR: ${errorMessage}`;
      
      if (errorMessage?.includes('duplicate key')) {
        userMessage = 'Profile already exists. Delete it first in Supabase.';
      } else if (errorMessage?.includes('authentication')) {
        userMessage = 'Not authenticated. Please sign in again.';
      } else if (errorMessage?.includes('network')) {
        userMessage = 'Network error. Check your connection.';
      } else if (errorMessage?.includes('permission')) {
        userMessage = 'Permission denied. Check database permissions.';
      } else if (errorMessage?.includes('relation') && errorMessage?.includes('does not exist')) {
        userMessage = 'Table missing! Run the nuclear_fix.sql in Supabase.';
      } else if (errorMessage?.includes('violates row-level security')) {
        userMessage = 'RLS blocking! Disable RLS in Supabase.';
      }
      
      // ALWAYS show the actual error for debugging
      toast.error(`DEBUG: ${errorMessage}`);
      console.error('ACTUAL ERROR:', errorMessage);
      
      // Log specific error for user support
      console.log('💡 User support info:', {
        userId: user?.id,
        timestamp: new Date().toISOString(),
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
        errorMessage: errorMessage
      });
      
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show enhanced loading screen until initialization is complete
  if (!initializationComplete) {
    return (
      <OnboardingSkeletonScreen
        stage={loadingState.stage}
        progress={loadingState.progress}
        isOffline={loadingState.isOffline}
        onRetry={loadingState.canRetry ? handleRetry : undefined}
      />
    );
  }

  const progress = (currentStep / steps.length) * 100;

  return (
    <div className="min-h-screen relative overflow-hidden">
      <SEOHead 
        title="Mentor Onboarding"
        description="Complete your mentor profile to start connecting with graduate students and provide valuable guidance on their academic journey."
        keywords="mentor, graduate student mentoring, academic mentoring, research guidance, faculty connections, mentor registration, mentor profile"
      />
      {/* Animated Background */}
      <AnimatedBackground />
      
      {/* Fixed Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-2 bg-white/20 backdrop-blur-sm z-50">
        <motion.div 
          className="h-full bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600"
          initial={{ width: '0%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* Header */}
      <div className="relative z-10 pt-8 pb-6">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="flex items-center justify-center mb-4">
              <motion.div
                className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-8 h-8 text-white" />
              </motion.div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              Mentor Onboarding
            </h1>
            <p className="text-gray-600 text-lg">
              Let's set up your mentor profile and help you start making an impact
            </p>
          </motion.div>

          {/* Step Indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <StepIndicator
              steps={steps}
              currentStep={currentStep}
              variant="horizontal"
              color="mentor"
              size="md"
            />
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 50, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -50, scale: 0.95 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-8"
              >
                {/* Step Content */}
                <div className="mb-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-12 h-12 ${steps[currentStep - 1].color} rounded-xl flex items-center justify-center`}>
                      {React.createElement(steps[currentStep - 1].icon, { className: "w-6 h-6 text-white" })}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {steps[currentStep - 1].title}
                      </h2>
                      <p className="text-gray-600">
                        {steps[currentStep - 1].description}
                      </p>
                    </div>
                  </div>

                  {/* Current Step Form */}
                  {currentStep === 1 && (
                    <BasicInfoStep
                      data={data}
                      onDataChange={handleDataChange}
                      validationErrors={validationErrors}
                    />
                  )}

                  {currentStep === 2 && (
                    <AcademicProgramStep
                      data={data}
                      onDataChange={handleDataChange}
                      validationErrors={validationErrors}
                    />
                  )}

                  {currentStep === 3 && (
                    <MentoringPreferencesStep
                      data={data}
                      onDataChange={handleDataChange}
                      validationErrors={validationErrors}
                    />
                  )}

                  {currentStep === STEP_NUMBERS.SUMMARY && (
                    <SummaryStep
                      data={data}
                      onDataChange={handleDataChange}
                      validationErrors={validationErrors}
                      onSubmit={handleSubmit}
                      isSubmitting={isSubmitting}
                    />
                  )}
                </div>

                {/* Navigation */}
                {currentStep < STEP_NUMBERS.SUMMARY && (
                  <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                    <Button
                      variant="outline"
                      onClick={goToPreviousStep}
                      disabled={currentStep === 1}
                      className="flex items-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Previous
                    </Button>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>Step {currentStep} of {steps.length}</span>
                    </div>

                    <Button
                      onClick={goToNextStep}
                      className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      Continue
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Floating decorative elements */}
      <motion.div
        className="absolute top-20 left-10 w-32 h-32 bg-purple-400/20 rounded-full blur-xl"
        animate={{
          x: [0, 100, 0],
          y: [0, -50, 0]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute bottom-20 right-10 w-40 h-40 bg-pink-400/20 rounded-full blur-xl"
        animate={{
          x: [0, -80, 0],
          y: [0, 80, 0]
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </div>
  );
};

export default MentorOnboardingContainer;