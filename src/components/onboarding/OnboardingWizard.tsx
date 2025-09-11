import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StepIndicator } from './StepIndicator';
import { AcademicBackgroundStep } from './steps/AcademicBackgroundStep';
import { TargetProgramStep } from './steps/TargetProgramStep';
import { OnboardingComplete } from './OnboardingComplete';
import { useToast } from '@/hooks/use-toast';
import { useSession } from '@/contexts/SessionContext';
import { onboardingService } from '@/services/onboardingService';
import { fastOnboardingService } from '@/services/fastOnboardingService';

export interface OnboardingData {
  // Stage 1: Academic Background
  firstName: string;
  lastName: string;
  currentDegree: string;
  currentInstitution: string;
  gpa: string;
  cvFile: File | null;
  
  // Stage 2: Target Program
  targetDegreeLevel: string;
  targetField: string;
  researchInterests: string[];
  careerGoals: string;
}

const initialData: OnboardingData = {
  firstName: '',
  lastName: '',
  currentDegree: '',
  currentInstitution: '',
  gpa: '',
  cvFile: null,
  targetDegreeLevel: '',
  targetField: '',
  researchInterests: [],
  careerGoals: ''
};

export const OnboardingWizard: React.FC = () => {
  const { 
    user, 
    sessionData, 
    loading, 
    academicProfile, 
    researchInterests, 
    cvAnalysis,
    refreshSessionData 
  } = useSession();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAutoSaved, setHasAutoSaved] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if onboarding is already completed and redirect
  useEffect(() => {
    if (!loading && user) {
      // Quick check if onboarding is already completed
      const checkAndRedirect = async () => {
        try {
          const { onboardingService } = await import('@/services/onboardingService');
          const hasCompleted = await Promise.race([
            onboardingService.hasCompletedOnboarding(),
            new Promise(resolve => setTimeout(() => resolve(false), 2000)) // 2 second timeout
          ]);
          
          if (hasCompleted) {
            console.log('✅ Onboarding already completed, redirecting to dashboard');
            navigate('/dashboard', { replace: true });
            
          } else {
            console.log('⚠️ Onboarding not completed, staying on onboarding page');
          }
        } catch (error) {
          console.warn('Could not check onboarding status quickly, staying on page:', error);
        }
      };

      // Small delay to let auth settle
      setTimeout(checkAndRedirect, 500);
    }
  }, [loading, user, navigate]);

  const totalSteps = 3;
  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1:
        return Boolean(data.firstName && data.lastName && data.currentDegree && data.currentInstitution);
      case 2:
        return Boolean(data.targetDegreeLevel && data.targetField && data.researchInterests.length > 0);
      case 3:
        return true;
      default:
        return false;
    }
  };

  // Auto-save functionality - debounced and non-blocking
  useEffect(() => {
    // Skip auto-save during initialization
    if (isInitializing) {return;}
    
    const saveData = async () => {
      if (currentStep <= 2 && (data.firstName || data.lastName || data.currentDegree)) {
        try {
          // Use timeout to prevent hanging on slow operations
          const savePromise = onboardingService.saveProgress(data);
          const timeoutPromise = new Promise(resolve => setTimeout(() => resolve(null), 2000));
          
          await Promise.race([savePromise, timeoutPromise]);
          setHasAutoSaved(true);
          setTimeout(() => setHasAutoSaved(false), 2000);
        } catch (error) {
          console.warn('Auto-save failed (non-critical):', error);
        }
      }
    };

    const timeoutId = setTimeout(saveData, 1500); // Increased debounce time
    return () => clearTimeout(timeoutId);
  }, [data, currentStep, isInitializing]);

  // Load data from session context and saved progress
  useEffect(() => {
    const loadProgress = async () => {
      try {
        // First, pre-populate from session data if available
        let preFilledData = { ...initialData };
        
        // Use academic profile data from session
        if (academicProfile) {
          preFilledData = {
            ...preFilledData,
            currentDegree: academicProfile.degree || academicProfile.current_degree || '',
            currentInstitution: academicProfile.institution || academicProfile.current_institution || '',
            gpa: academicProfile.gpa?.toString() || '',
            targetDegreeLevel: academicProfile.target_degree_level || '',
            targetField: academicProfile.target_field || academicProfile.field_of_study || ''
          };
        }
        
        // Use CV analysis data if available
        if (cvAnalysis?.personal_info) {
          const personalInfo = cvAnalysis.personal_info;
          const nameParts = personalInfo.name?.split(' ') || [];
          preFilledData = {
            ...preFilledData,
            firstName: nameParts[0] || preFilledData.firstName,
            lastName: nameParts.slice(1).join(' ') || preFilledData.lastName
          };
        }
        
        // Use research interests from session
        if (researchInterests && researchInterests.length > 0) {
          preFilledData.researchInterests = researchInterests.map(
            interest => interest.title || interest.name || interest
          ).filter(Boolean);
        }
        
        // Then try to load saved progress which overrides session data
        const loadPromise = onboardingService.loadProgress();
        const timeoutPromise = new Promise(resolve => setTimeout(() => resolve(null), 1000));
        
        const savedData = await Promise.race([loadPromise, timeoutPromise]);
        if (savedData && typeof savedData === 'object') {
          preFilledData = { ...preFilledData, ...savedData };
        }
        
        setData(preFilledData);
        console.log('📋 Onboarding pre-filled with session and saved data');
      } catch (error) {
        console.warn('Failed to load progress (non-critical):', error);
      } finally {
        setIsInitializing(false);
      }
    };
    
    // Only load progress when session data is available or after timeout
    if (!loading) {
      requestAnimationFrame(() => {
        loadProgress();
      });
    }
  }, [loading, academicProfile, researchInterests, cvAnalysis]);

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };


  const handleNext = async () => {
    if (!isStepValid(currentStep)) {
      toast({
        title: 'Please complete all required fields',
        description: 'Fill in all the required information before proceeding.',
        variant: 'destructive'
      });
      return;
    }

    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      // Use user from session context
      if (!user) {
        console.error('User not authenticated during onboarding');
        throw new Error('You must be signed in to complete onboarding. Please sign in and try again.');
      }
      
      console.log('User authenticated, proceeding with onboarding:', user.id);
      
      // Show success message immediately for better UX
      toast({
        title: 'Welcome to GradApp!',
        description: 'Completing your setup...',
      });
      
      // CRITICAL: Call the onboarding service to mark completion in database
      console.log('🚀 Calling onboarding completion service...');
      const completionResult = await onboardingService.completeOnboarding(data);
      
      if (!completionResult.success) {
        throw new Error(completionResult.error || 'Failed to complete onboarding');
      }
      
      console.log('✅ Onboarding marked as completed in database');
      
      // Update success message
      toast({
        title: 'Welcome to GradApp!',
        description: 'Setting up your dashboard...',
      });
      
      // Refresh session data to ensure it includes onboarding completion
      try {
        await refreshSessionData();
        console.log('✅ Session data refreshed after onboarding completion');
      } catch (error) {
        console.warn('Failed to refresh session data:', error);
      }
      
      // Store onboarding completion status before navigation
      try {
        localStorage.setItem('onboarding_just_completed', 'true');
        localStorage.setItem('onboarding_data', JSON.stringify(data));
      } catch (error) {
        console.warn('Failed to store onboarding status:', error);
      }
      
      // Wait a bit for database updates to propagate and session to refresh
      console.log('⏳ Waiting for database updates to propagate...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('🚀 Navigating to dashboard...');
      
      // Use React Router navigation instead of window.location for better state management
      navigate('/dashboard', { replace: true });
      
    } catch (error) {
      console.error('Onboarding completion error:', error);
      
      // Provide more specific error message if available
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // If it's an authentication error, suggest signing in again
      const isAuthError = errorMessage.includes('authenticated') || errorMessage.includes('Authentication');
      const actionMessage = isAuthError 
        ? 'Please sign out and sign in again, then try completing onboarding.'
        : 'Please check the console for more details and try again.';
      
      toast({
        title: 'Onboarding Failed',
        description: `${errorMessage}. ${actionMessage}`,
        variant: 'destructive'
      });
      
      // If it's an auth error, redirect to sign in
      if (isAuthError) {
        setTimeout(() => {
          navigate('/auth');
        }, 1500);
      } else {
        setCurrentStep(2); // Go back to allow retry
      }
      setIsLoading(false);
    }
  };

  const stepVariants = {
    hidden: { opacity: 0, x: 20 }, // Reduced movement for performance
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  const renderStepContent = () => {
    // Show loading while session is loading or user is not available
    if (loading || !user) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Setting up your account...</p>
          </div>
        </div>
      );
    }

    switch (currentStep) {
      case 1:
        return (
          <AcademicBackgroundStep
            data={data}
            updateData={updateData}
            onNext={handleNext}
          />
        );
      case 2:
        return (
          <TargetProgramStep
            data={data}
            updateData={updateData}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 3:
        return (
          <OnboardingComplete
            data={data}
            isLoading={isLoading}
            onComplete={handleComplete}
          />
        );
      default:
        return null;
    }
  };

  // Show loading screen while initializing
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Loading GradApp</h2>
          <p className="text-gray-500">Setting up your onboarding experience...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center items-center space-x-3 mb-4"
          >
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Welcome to GradApp
            </h1>
          </motion.div>
          <p className="text-gray-600 text-lg">Let's set up your profile to get you started</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <StepIndicator
            currentStep={currentStep}
            totalSteps={totalSteps}
            stepLabels={['Academic Background', 'Target Program', 'Complete']}
          />
        </div>

        {/* Auto-save Indicator */}
        <AnimatePresence>
          {hasAutoSaved && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="fixed top-4 right-4 bg-green-100 border border-green-300 text-green-800 px-4 py-2 rounded-lg shadow-lg z-50"
            >
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Progress saved</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.2, ease: 'easeOut' }} // Faster transitions
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Navigation */}
        {currentStep < 3 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 flex justify-between items-center"
          >
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="flex items-center space-x-2"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </Button>

            <div className="flex-1 text-center text-sm text-gray-500">
              Step {currentStep} of {totalSteps}
            </div>

            <Button
              onClick={handleNext}
              disabled={!isStepValid(currentStep)}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <span>
                {currentStep === totalSteps - 1 ? 'Complete Setup' : 'Continue'}
              </span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};