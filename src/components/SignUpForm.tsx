import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import authService from '@/services/authService';
import { motion } from 'framer-motion';
import { Eye, EyeOff, X, Loader2, Mail, Lock, User, Sparkles } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { getAppOrigin } from '@/utils/redirectHelper';

interface SignUpFormProps {
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
  confirmPassword: string;
}

const SignUpForm: React.FC<SignUpFormProps> = ({ onSuccess, onToggleForm, showToggle = true, selectedRole }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false);
  const { register, handleSubmit, formState: { errors }, watch } = useForm<SignUpFormData>();

  const password = watch('password');

  // Calculate password strength
  React.useEffect(() => {
    if (!password) {
      setPasswordStrength(0);
      return;
    }

    const strengthResult = authService.getPasswordStrength(password);
    setPasswordStrength(strengthResult.score);
  }, [password]);

  const _getPasswordStrengthColor = () => {
    if (passwordStrength <= 25) {return 'bg-red-500';}
    if (passwordStrength <= 50) {return 'bg-orange-500';}
    if (passwordStrength <= 75) {return 'bg-yellow-500';}
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 25) {return 'Weak';}
    if (passwordStrength <= 50) {return 'Fair';}
    if (passwordStrength <= 75) {return 'Good';}
    return 'Strong';
  };

  const handleGoogleSignUp = async () => {
    try {
      setIsGoogleLoading(true);
      const { error } = await authService.signInWithGoogle();
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Google sign up failed",
          description: error.message || "Failed to sign up with Google. Please try again.",
        });
      }
    } catch (_error: unknown) {
      toast({
        variant: "destructive",
        title: "Google sign up failed",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGithubSignUp = async () => {
    try {
      setIsGithubLoading(true);
      const { error } = await authService.signInWithGitHub();
      
      if (error) {
        toast({
          variant: "destructive",
          title: "GitHub sign up failed",
          description: error.message || "Failed to sign up with GitHub. Please try again.",
        });
      }
    } catch (_error: unknown) {
      toast({
        variant: "destructive",
        title: "GitHub sign up failed",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsGithubLoading(false);
    }
  };

  const onSubmit = async (data: SignUpFormData) => {
    try {
      setIsSubmitting(true);
      
      // Set up the redirect URL for email confirmation
      const redirectUrl = `${getAppOrigin()}/`;
      
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            signup_source: 'web',
            role: selectedRole || 'applicant',
          },
          emailRedirectTo: redirectUrl
        }
      });
      
      if (error) {
        // Handle specific error cases with better messaging
        if (error.message.includes('email_address_invalid')) {
          toast({
            variant: "destructive",
            title: "Invalid Email",
            description: "Please use a valid email address. Some domains (like example.com) are not supported.",
          });
          return;
        } else if (error.message.includes('User already registered')) {
          toast({
            variant: "destructive",
            title: "Account already exists",
            description: "An account with this email already exists. Please sign in instead.",
          });
          if (onToggleForm) {onToggleForm();}
          return;
        }
        throw error;
      }
      
      // Check if user needs email confirmation
      if (authData.user && !authData.session) {
        toast({
          title: "Check your email! 📧",
          description: "We've sent you a confirmation link. Please check your inbox and click the link to activate your account.",
          duration: 6000,
        });
        
        // Switch to sign-in form after showing the message
        if (onToggleForm) {
          setTimeout(() => {
            onToggleForm();
          }, 3000);
        }
        return;
      }

      // If user is immediately authenticated (email confirmation disabled)
      if (authData.user && authData.session) {
        // Create user profile based on selection
        const roleToAssign = selectedRole || 'applicant';
        const { error: roleError } = await authService.createUserProfile(authData.user.id, {
          full_name: `${data.firstName} ${data.lastName}`,
          role: roleToAssign,
          email: data.email
        });

        if (roleError) {
          console.error('Error creating user profile:', roleError);
        }

        toast({
          title: "Welcome to GradApp! 🎉",
          description: "Your account has been created successfully. Let's get you started!",
        });
        
        if (onSuccess) {
          onSuccess();
        }
      }
      
    } catch (_error: unknown) {
      console.error('Sign up error:', _error);
      
      let errorMessage = "Please check your information and try again.";
      
      if (typeof _error === 'object' && _error !== null && 'message' in _error && typeof (_error as any).message === 'string') {
        if ((_error as any).message.includes('Password')) {
          errorMessage = "Password must be at least 6 characters long.";
        } else if ((_error as any).message.includes('Email')) {
          errorMessage = "Please enter a valid email address.";
        }
      }
      
      toast({
        variant: "destructive",
        title: "Sign up failed",
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="w-16 h-16 bg-gradient-to-r from-gradapp-primary to-gradapp-secondary rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <Sparkles className="w-8 h-8 text-white" />
        </motion.div>
        <h3 className="text-2xl font-bold text-gray-900">Start Your Journey</h3>
        <p className="text-sm text-gray-600 mt-2">
          Join thousands of successful graduate applicants
        </p>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <motion.div 
            className="space-y-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Label htmlFor="firstName" className="text-sm font-medium">First Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                id="firstName"
                type="text" 
                placeholder="John"
                className="pl-10 transition-all duration-200 border-gray-300 focus:border-gradapp-primary focus:ring-gradapp-primary"
                {...register("firstName", { 
                  required: "First name is required",
                  minLength: {
                    value: 2,
                    message: "First name must be at least 2 characters",
                  }
                })}
              />
            </div>
            {errors.firstName && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-red-500 flex items-center gap-1"
              >
                <X className="h-3 w-3" />
                {errors.firstName.message}
              </motion.p>
            )}
          </motion.div>
          
          <motion.div 
            className="space-y-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                id="lastName"
                type="text" 
                placeholder="Doe"
                className="pl-10 transition-all duration-200 border-gray-300 focus:border-gradapp-primary focus:ring-gradapp-primary"
                {...register("lastName", { 
                  required: "Last name is required",
                  minLength: {
                    value: 2,
                    message: "Last name must be at least 2 characters",
                  }
                })}
              />
            </div>
            {errors.lastName && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-red-500 flex items-center gap-1"
              >
                <X className="h-3 w-3" />
                {errors.lastName.message}
              </motion.p>
            )}
          </motion.div>
        </div>
        
        <motion.div 
          className="space-y-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Label htmlFor="email" className="text-sm font-medium">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              id="email"
              type="email" 
              placeholder="you@gmail.com"
              className="pl-10 transition-all duration-200 border-gray-300 focus:border-gradapp-primary focus:ring-gradapp-primary"
              {...register("email", { 
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address",
                }
              })}
            />
          </div>
          {errors.email && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-red-500 flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              {errors.email.message}
            </motion.p>
          )}
        </motion.div>
        
        <motion.div 
          className="space-y-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Label htmlFor="password" className="text-sm font-medium">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              id="password"
              type={showPassword ? "text" : "password"}
              className="pl-10 pr-10 transition-all duration-200 border-gray-300 focus:border-gradapp-primary focus:ring-gradapp-primary"
              {...register("password", { 
                required: "Password is required",
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters",
                }
              })}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {password && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Password strength:</span>
                <span className={`font-medium ${passwordStrength > 75 ? 'text-green-600' : passwordStrength > 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {getPasswordStrengthText()}
                </span>
              </div>
              <Progress value={passwordStrength} className="h-2" />
            </div>
          )}
          {errors.password && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-red-500 flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              {errors.password.message}
            </motion.p>
          )}
        </motion.div>
        
        <motion.div 
          className="space-y-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              className="pl-10 pr-10 transition-all duration-200 border-gray-300 focus:border-gradapp-primary focus:ring-gradapp-primary"
              {...register("confirmPassword", { 
                required: "Please confirm your password",
                validate: value => 
                  value === password || "Passwords do not match"
              })}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-red-500 flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              {errors.confirmPassword.message}
            </motion.p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-gradapp-primary to-gradapp-secondary hover:opacity-90 transition-all duration-300 text-white font-medium py-6 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating your account...
              </>
            ) : (
              <>
                Create Account
                <Sparkles className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </motion.div>
      </form>
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-500">Or continue with</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <Button 
          variant="outline" 
          type="button" 
          onClick={handleGoogleSignUp}
          disabled={isGoogleLoading || isSubmitting}
          className="w-full hover:bg-gray-50 transition-colors duration-200 border-gray-300"
        >
          {isGoogleLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          )}
          {isGoogleLoading ? "Connecting..." : "Google"}
        </Button>
        <Button 
          variant="outline" 
          type="button" 
          onClick={handleGithubSignUp}
          disabled={isGithubLoading || isSubmitting}
          className="w-full hover:bg-gray-50 transition-colors duration-200 border-gray-300"
        >
          {isGithubLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          )}
          {isGithubLoading ? "Connecting..." : "GitHub"}
        </Button>
      </div>
      
      {showToggle && (
        <motion.div 
          className="text-center text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <span className="text-gray-600">Already have an account? </span>
          <Button 
            variant="link" 
            onClick={onToggleForm} 
            className="p-0 h-auto text-gradapp-primary hover:text-gradapp-secondary font-medium"
          >
            Sign in here
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default SignUpForm;