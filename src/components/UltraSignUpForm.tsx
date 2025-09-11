import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Loader2, Mail, Lock, User, Sparkles, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UltraSignUpFormProps {
  onSuccess?: () => void;
  onToggleForm?: () => void;
  showToggle?: boolean;
  selectedRole?: 'applicant' | 'mentor' | null;
}

interface SignUpFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

interface DebugStep {
  step: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message: string;
  timestamp: number;
}

const UltraSignUpForm: React.FC<UltraSignUpFormProps> = ({ 
  onSuccess, 
  onToggleForm, 
  showToggle = true, 
  selectedRole 
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [debugSteps, setDebugSteps] = useState<DebugStep[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const { register, handleSubmit, formState: { errors } } = useForm<SignUpFormData>();

  const addDebugStep = (step: string, status: DebugStep['status'], message: string) => {
    const debugStep: DebugStep = {
      step,
      status,
      message,
      timestamp: Date.now()
    };
    
    setDebugSteps(prev => [...prev, debugStep]);
    console.log(`[SIGNUP DEBUG] ${step}: ${message}`, debugStep);
  };

  const updateLastDebugStep = (status: DebugStep['status'], message: string) => {
    setDebugSteps(prev => 
      prev.map((step, index) => 
        index === prev.length - 1 
          ? { ...step, status, message }
          : step
      )
    );
  };

  const resetForm = () => {
    setIsSubmitting(false);
    setDebugSteps([]);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const onSubmit = async (data: SignUpFormData) => {
    console.log('[ULTRA SIGNUP] Form submitted with data:', data);
    try {
      setIsSubmitting(true);
      setDebugSteps([]);
      setShowDebug(true);
      console.log('[ULTRA SIGNUP] Starting signup process...');
      
      addDebugStep('validation', 'running', 'Validating form data...');
      
      // Validate required fields
      if (!data.firstName || !data.lastName || !data.email || !data.password) {
        updateLastDebugStep('error', 'Missing required fields');
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Please fill in all required fields.",
        });
        resetForm();
        return;
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        updateLastDebugStep('error', 'Invalid email format');
        toast({
          variant: "destructive",
          title: "Invalid Email",
          description: "Please enter a valid email address.",
        });
        resetForm();
        return;
      }

      updateLastDebugStep('success', 'Form validation passed');
      
      addDebugStep('supabase-connection', 'running', 'Testing Supabase connection...');
      
      // Test Supabase connection first
      try {
        const { data: testData, error: testError } = await Promise.race([
          supabase.from('user_roles').select('id').limit(1),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Connection timeout')), 5000)
          )
        ]) as any;
        
        if (testError && !testError.message.includes('0 rows')) {
          updateLastDebugStep('error', `Connection test failed: ${testError.message}`);
          throw new Error(`Supabase connection failed: ${testError.message}`);
        }
        
        updateLastDebugStep('success', 'Supabase connection verified');
      } catch (connError) {
        updateLastDebugStep('error', `Connection failed: ${connError.message}`);
        toast({
          variant: "destructive",
          title: "Connection Error",
          description: "Unable to connect to the server. Please check your internet connection and try again.",
        });
        resetForm();
        return;
      }

      addDebugStep('signup-request', 'running', 'Sending signup request to Supabase...');
      
      // Set up timeout for the signup request
      timeoutRef.current = setTimeout(() => {
        updateLastDebugStep('error', 'Signup request timed out after 15 seconds');
        toast({
          variant: "destructive",
          title: "Request Timeout",
          description: "The signup request is taking too long. Please try again.",
        });
        resetForm();
      }, 15000);

      const signupPromise = supabase.auth.signUp({
        email: data.email.trim(),
        password: data.password,
        options: {
          data: {
            first_name: data.firstName.trim(),
            last_name: data.lastName.trim(),
            signup_source: 'web',
            role: selectedRole || 'applicant',
          }
        }
      });

      const { data: authData, error } = await signupPromise;
      
      // Clear timeout since request completed
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      if (error) {
        updateLastDebugStep('error', `Signup failed: ${error.message}`);
        
        let errorMessage = error.message;
        let errorTitle = "Signup Failed";
        
        // Handle specific error cases
        if (error.message.includes('email_address_invalid')) {
          errorMessage = "This email address is not supported. Please try a different email provider (Gmail, Outlook, etc.).";
          errorTitle = "Invalid Email Domain";
        } else if (error.message.includes('User already registered')) {
          errorMessage = "An account with this email already exists. Please sign in instead.";
          errorTitle = "Account Exists";
        } else if (error.message.includes('Password')) {
          errorMessage = "Password must be at least 6 characters long.";
          errorTitle = "Weak Password";
        } else if (error.message.includes('rate limit')) {
          errorMessage = "Too many signup attempts. Please wait a few minutes and try again.";
          errorTitle = "Rate Limited";
        }
        
        addDebugStep('error-handling', 'error', `Error: ${error.code || 'UNKNOWN'} - ${errorMessage}`);
        
        toast({
          variant: "destructive",
          title: errorTitle,
          description: errorMessage,
        });
        resetForm();
        return;
      }
      
      updateLastDebugStep('success', 'Signup request completed successfully');
      
      addDebugStep('response-processing', 'running', 'Processing signup response...');
      
      if (!authData) {
        updateLastDebugStep('error', 'No response data received');
        toast({
          variant: "destructive",
          title: "Unexpected Error",
          description: "No response received from the server. Please try again.",
        });
        resetForm();
        return;
      }

      // Check if user needs email confirmation
      if (authData.user && !authData.session) {
        updateLastDebugStep('success', 'Email confirmation required');
        addDebugStep('email-confirmation', 'success', 'Account created - email confirmation sent');
        
        toast({
          title: "Check your email! 📧",
          description: "We've sent you a confirmation link. Please check your email (including spam folder) and click the link to activate your account.",
          duration: 10000,
        });
        
        // Don't reset form state here - let user know what happened
        setIsSubmitting(false);
        return;
      }

      // If user is immediately authenticated
      if (authData.user && authData.session) {
        updateLastDebugStep('success', 'Account created and authenticated');
        addDebugStep('completion', 'success', 'Signup completed successfully');
        
        toast({
          title: "Account created! 🎉",
          description: "You've successfully signed up. Welcome to GradApp!",
        });
        
        if (onSuccess) {
          onSuccess();
        }
      }
      
    } catch (error: unknown) {
      console.error('Signup error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      addDebugStep('catch-error', 'error', `Caught error: ${errorMessage}`);
      
      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: "An unexpected error occurred. Please try again or contact support if the problem persists.",
      });
    } finally {
      resetForm();
    }
  };

  const DebugIcon = ({ status }: { status: DebugStep['status'] }) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'running':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <Sparkles className="w-8 h-8 text-white" />
        </motion.div>
        <h3 className="text-2xl font-bold text-gray-900">Create Your Account</h3>
        <p className="text-sm text-gray-600 mt-2">
          Join GradApp and start your journey
        </p>
      </div>

      {/* Debug Panel */}
      {showDebug && debugSteps.length > 0 && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-medium text-blue-800 mb-2">Signup Progress:</div>
              {debugSteps.map((step, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <DebugIcon status={step.status} />
                  <span className="font-medium">{step.step}:</span>
                  <span className={
                    step.status === 'error' ? 'text-red-600' :
                    step.status === 'success' ? 'text-green-600' : 
                    'text-blue-600'
                  }>
                    {step.message}
                  </span>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                id="firstName"
                type="text" 
                placeholder="Wuni"
                className="pl-10"
                disabled={isSubmitting}
                {...register("firstName", { required: "First name is required" })}
              />
            </div>
            {errors.firstName && (
              <p className="text-xs text-red-500">{errors.firstName.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                id="lastName"
                type="text" 
                placeholder="Abdulai"
                className="pl-10"
                disabled={isSubmitting}
                {...register("lastName", { required: "Last name is required" })}
              />
            </div>
            {errors.lastName && (
              <p className="text-xs text-red-500">{errors.lastName.message}</p>
            )}
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              id="email"
              type="email" 
              placeholder="wuniabdulai19@gmail.com"
              className="pl-10"
              disabled={isSubmitting}
              {...register("email", { 
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Please enter a valid email address",
                }
              })}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              id="password"
              type="password"
              className="pl-10"
              disabled={isSubmitting}
              {...register("password", { 
                required: "Password is required",
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters",
                }
              })}
            />
          </div>
          {errors.password && (
            <p className="text-xs text-red-500">{errors.password.message}</p>
          )}
        </div>

        <Button 
          type="submit" 
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            <>
              Create Account
              <Sparkles className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>

        {isSubmitting && (
          <div className="text-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetForm}
              className="text-red-600 hover:text-red-700"
            >
              Cancel
            </Button>
          </div>
        )}
      </form>
      
      {showToggle && (
        <div className="text-center text-sm">
          <span className="text-gray-600">Already have an account? </span>
          <Button 
            variant="link" 
            onClick={onToggleForm} 
            className="p-0 h-auto text-blue-600 hover:text-blue-800"
            disabled={isSubmitting}
          >
            Sign in here
          </Button>
        </div>
      )}
    </div>
  );
};

export default UltraSignUpForm;