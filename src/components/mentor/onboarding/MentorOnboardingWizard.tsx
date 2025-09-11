import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Building, 
  Briefcase, 
  Brain, 
  FileText, 
  Calendar, 
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Database,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import GlassmorphicCard from '@/components/ui/GlassmorphicCard';
import AnimatedGradient from '@/components/ui/AnimatedGradient';
import StepIndicator from '@/components/ui/StepIndicator';
import MentorInstitutionForm from './MentorInstitutionForm';
import MentorProfessionalForm from './MentorProfessionalForm';
import MentorExpertiseForm from './MentorExpertiseForm';
import MentorAvailabilityForm from './MentorAvailabilityForm';
import MentorVerificationStep from './MentorVerificationStep';
import MentorErrorBoundary from '../MentorErrorBoundary';
import { MentorOnboardingData, MentorValidationResult } from '@/types/mentorTypes';
import { supabase } from '@/integrations/supabase/client';

const MentorOnboardingWizard: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [onboardingData, setOnboardingData] = useState<MentorOnboardingData>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  
  // Auth and database state management
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [databaseError, setDatabaseError] = useState<string | null>(null);
  const [allowContinueWithoutDB, setAllowContinueWithoutDB] = useState(false);
  const lastAuthCheckRef = useRef(0);
  const isMountedRef = useRef(true);

  const steps = [
    {
      id: 'institution',
      title: 'Institution',
      description: 'Connect your university',
      icon: Building,
      component: MentorInstitutionForm
    },
    {
      id: 'professional',
      title: 'Experience',
      description: 'Professional background',
      icon: Briefcase,
      component: MentorProfessionalForm
    },
    {
      id: 'expertise',
      title: 'Expertise',
      description: 'Areas of mentoring',
      icon: Brain,
      component: MentorExpertiseForm
    },
    {
      id: 'availability',
      title: 'Schedule',
      description: 'Set availability',
      icon: Calendar,
      component: MentorAvailabilityForm
    },
    {
      id: 'verification',
      title: 'Verify',
      description: 'Complete setup',
      icon: CheckCircle,
      component: MentorVerificationStep
    }
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleRetryAuth = () => {
    setAuthError(null);
    setDatabaseError(null);
    setIsCheckingAuth(true);
    lastAuthCheckRef.current = 0; // Reset cooldown
    
    // Small delay to ensure state updates
    setTimeout(() => {
      window.location.reload(); // Force fresh auth check
    }, 100);
  };

  const handleContinueAnyway = () => {
    setAllowContinueWithoutDB(true);
    setDatabaseError(null);
    setAuthError(null);
  };

  // Component cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // Resilient authentication check with database error handling
    const checkAuth = async () => {
      // Prevent rapid successive auth checks (cooldown)
      const now = Date.now();
      if (now - lastAuthCheckRef.current < 2000) {
        console.log('Auth check cooldown active, skipping');
        return;
      }
      lastAuthCheckRef.current = now;

      if (!isMountedRef.current) {return;}
      
      setIsCheckingAuth(true);
      setAuthError(null);
      setDatabaseError(null);

      try {
        // Step 1: Check basic authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          console.error('Auth error:', authError);
          setAuthError('Authentication failed. Please sign in again.');
          // Only redirect if it's a real auth error, not network issue
          if (authError.message?.includes('session_not_found')) {
            navigate('/auth');
          }
          return;
        }

        if (!user) {
          setAuthError('No authenticated user found.');
          navigate('/auth');
          return;
        }

        if (!isMountedRef.current) {return;}

        // Step 2: Check mentor role (with database error resilience)
        try {
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (profileError) {
            console.warn('Profile check failed:', profileError);
            
            // If it's a database connectivity issue, allow continuation with warning
            if (profileError.code === 'PGRST116' || profileError.message?.includes('connection')) {
              setDatabaseError(
                'Database connection issues detected. You can continue with limited functionality, ' +
                'but some features may not work properly until the database is fully set up.'
              );
              setAllowContinueWithoutDB(true);
            } else if (profileError.code === '42P01') {
              // Table doesn't exist
              setDatabaseError(
                'User profiles table not found. This suggests the database setup is incomplete. ' +
                'You can continue with the mentor onboarding, but please ensure the database is properly configured.'
              );
              setAllowContinueWithoutDB(true);
            } else {
              // Other errors - might be real auth issues
              setAuthError('Unable to verify mentor role. Please try again.');
              setTimeout(() => {
                if (isMountedRef.current) {
                  navigate('/auth');
                }
              }, 3000); // Delay redirect to avoid loops
            }
            return;
          }

          // If we have a profile but no mentor role, it's a real auth issue
          if (profile && profile.role !== 'mentor') {
            setAuthError('This page is only accessible to mentors. Please select the mentor role during sign-up.');
            setTimeout(() => {
              if (isMountedRef.current) {
                navigate('/auth');
              }
            }, 3000);
            return;
          }

          // If no profile exists, allow continuation (might be first-time mentor)
          if (!profile) {
            setDatabaseError(
              'No mentor profile found. This might be your first time setting up as a mentor. ' +
              'You can continue with the onboarding process.'
            );
            setAllowContinueWithoutDB(true);
          }

        } catch (profileCheckError: any) {
          console.error('Profile check exception:', profileCheckError);
          setDatabaseError(
            'Unable to verify mentor status due to database issues. ' +
            'You can continue with the onboarding, but please ensure your database is properly set up.'
          );
          setAllowContinueWithoutDB(true);
        }

      } catch (error: any) {
        console.error('Auth check failed:', error);
        setAuthError('Authentication check failed. Please try again.');
        // Don't immediately redirect on network errors
        if (error.message?.includes('network') || error.message?.includes('fetch')) {
          setDatabaseError('Network connectivity issues detected.');
        }
      } finally {
        if (isMountedRef.current) {
          setIsCheckingAuth(false);
        }
      }
    };

    checkAuth();
  }, [navigate]);

  const validateStep = (stepIndex: number, data: MentorOnboardingData): MentorValidationResult => {
    const errors: { field: string; message: string }[] = [];
    const warnings: string[] = [];

    switch (stepIndex) {
      case 0: // Institution
        if (!data.institution_id && !data.custom_institution) {
          errors.push({ field: 'institution', message: 'Please select or enter your institution' });
        }
        break;
      
      case 1: // Professional
        if (!data.current_position) {
          errors.push({ field: 'current_position', message: 'Current position is required' });
        }
        if (!data.years_of_experience || data.years_of_experience < 0) {
          errors.push({ field: 'years_of_experience', message: 'Please enter valid years of experience' });
        }
        break;
      
      case 2: // Expertise
        if (!data.mentoring_areas || data.mentoring_areas.length === 0) {
          errors.push({ field: 'mentoring_areas', message: 'Please select at least one mentoring area' });
        }
        if (!data.expertise_keywords || data.expertise_keywords.length === 0) {
          errors.push({ field: 'expertise_keywords', message: 'Please add at least one expertise keyword' });
        }
        break;
      
      
      case 3: // Availability
        if (!data.availability_schedule || data.availability_schedule.length === 0) {
          warnings.push('Setting availability helps mentees schedule sessions with you');
        }
        if (!data.timezone) {
          errors.push({ field: 'timezone', message: 'Please select your timezone' });
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  };

  const handleStepData = (stepData: Partial<MentorOnboardingData>) => {
    setOnboardingData(prev => ({ ...prev, ...stepData }));
    setValidationErrors({}); // Clear errors when data changes
  };

  const handleNext = () => {
    const validation = validateStep(currentStep, onboardingData);
    
    if (!validation.isValid) {
      const errorsByField = validation.errors.reduce((acc, error) => {
        if (!acc[error.field]) {acc[error.field] = [];}
        acc[error.field].push(error.message);
        return acc;
      }, {} as Record<string, string[]>);
      
      setValidationErrors(errorsByField);
      toast.error('Please fix the errors before continuing');
      return;
    }

    if (validation.warnings.length > 0) {
      validation.warnings.forEach(warning => toast.warning(warning));
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {throw new Error('User not authenticated');}

      // Create mentor profile with availability in JSONB field
      const profileData: any = {
        user_id: user.id,
        professional_title: onboardingData.current_position,
        current_position: onboardingData.current_position,
        current_employer: onboardingData.department, // Use department as employer for now
        industry: onboardingData.industry_experience,
        years_of_experience: onboardingData.years_of_experience,
        highest_degree: onboardingData.highest_degree,
        specializations: onboardingData.research_areas || [],
        expertise_areas: onboardingData.mentoring_areas || [],
        max_students: onboardingData.mentoring_capacity || 5,
        mentoring_style: onboardingData.mentoring_philosophy,
        communication_preferences: onboardingData.communication_preferences || [],
        response_time_hours: onboardingData.response_time_hours || 48,
        timezone: onboardingData.timezone || 'UTC',
        availability_schedule: onboardingData.availability_schedule || {},
        is_available: true,
        onboarding_completed: true,
        profile_completion_score: 100
      };

      const { error: profileError } = await (supabase as any)
        .from('mentor_profiles')
        .insert(profileData);

      if (profileError) {throw profileError;}

      // Update user_profiles to mark onboarding as completed
      await (supabase as any)
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          role: 'mentor',
          onboarding_completed: true,
          onboarding_step: 15,
          profile_completion_percentage: 100,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        });

      // Log successful onboarding
      await supabase
        .from('security_audit_log')
        .insert({
          user_id: user.id,
          action: 'mentor_onboarding_completed',
          resource_type: 'mentor_profile',
          compliance_relevant: true,
          metadata: {
            verification_tier: onboardingData.sso_provider ? 'university_verified' : 'pending',
            institution_id: onboardingData.institution_id
          }
        });

      toast.success('🎉 Welcome to the mentor community!');
      navigate('/mentor/dashboard');

    } catch (error: any) {
      console.error('Onboarding submission error:', error);
      toast.error('Failed to complete onboarding. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const CurrentStepComponent = steps[currentStep].component;
  const CurrentStepIcon = steps[currentStep].icon;

  return (
    <MentorErrorBoundary>
      <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <AnimatedGradient variant="dashboard" className="absolute inset-0" />
      
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

          {/* Authentication Loading State */}
          {isCheckingAuth && !authError && !databaseError && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto mb-8"
            >
              <GlassmorphicCard className="p-6 text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full mx-auto mb-3"
                />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Verifying Access
                </h3>
                <p className="text-gray-600">
                  Checking your authentication and mentor permissions...
                </p>
              </GlassmorphicCard>
            </motion.div>
          )}

          {/* Authentication Error */}
          {authError && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto mb-8"
            >
              <GlassmorphicCard className="p-6 bg-red-50/50 border-red-200">
                <div className="flex items-start gap-3 mb-4">
                  <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-800 mb-2">Authentication Issue</h3>
                    <p className="text-sm text-red-700 mb-4">{authError}</p>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleRetryAuth}
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Retry
                      </Button>
                      <Button
                        onClick={() => navigate('/auth')}
                        variant="outline"
                        size="sm"
                        className="border-red-600 text-red-700 hover:bg-red-50"
                      >
                        Go to Sign In
                      </Button>
                    </div>
                  </div>
                </div>
              </GlassmorphicCard>
            </motion.div>
          )}

          {/* Database Error Warning */}
          {databaseError && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto mb-8"
            >
              <GlassmorphicCard className="p-6 bg-amber-50/50 border-amber-200">
                <div className="flex items-start gap-3 mb-4">
                  <Database className="w-6 h-6 text-amber-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-amber-800 mb-2">Database Setup Notice</h3>
                    <p className="text-sm text-amber-700 mb-4">{databaseError}</p>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleContinueAnyway}
                        size="sm"
                        className="bg-amber-600 hover:bg-amber-700 text-white"
                      >
                        Continue Anyway
                      </Button>
                      <Button
                        onClick={handleRetryAuth}
                        variant="outline"
                        size="sm"
                        className="border-amber-600 text-amber-700 hover:bg-amber-50"
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Retry Check
                      </Button>
                    </div>
                  </div>
                </div>
              </GlassmorphicCard>
            </motion.div>
          )}

          {/* Step Indicators - Only show when auth is complete */}
          {!isCheckingAuth && !authError && (!databaseError || allowContinueWithoutDB) && (
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
          )}
        </div>
      </div>

      {/* Main Content - Only show when auth is complete */}
      {!isCheckingAuth && !authError && (!databaseError || allowContinueWithoutDB) && (
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
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                      <CurrentStepIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {steps[currentStep].title}
                      </h2>
                      <p className="text-gray-600">
                        {steps[currentStep].description}
                      </p>
                    </div>
                  </div>

                  {/* Current Step Form */}
                  <CurrentStepComponent
                    data={onboardingData}
                    onDataChange={handleStepData}
                    validationErrors={validationErrors}
                  />
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentStep === 0}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Previous
                  </Button>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>Step {currentStep + 1} of {steps.length}</span>
                  </div>

                  <Button
                    onClick={handleNext}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    {isSubmitting ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Sparkles className="w-4 h-4" />
                        </motion.div>
                        Creating Profile...
                      </>
                    ) : currentStep === steps.length - 1 ? (
                      <>
                        Complete Setup
                        <CheckCircle className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        </div>
      )}

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
    </MentorErrorBoundary>
  );
};

export default MentorOnboardingWizard;