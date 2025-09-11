import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import authService from '@/services/authService';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, ArrowRight, KeyRound } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface SignInFormProps {
  onSuccess?: () => void;
  onToggleForm?: () => void;
  showToggle?: boolean;
  selectedRole?: 'applicant' | 'mentor' | null;
}

interface SignInFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

const SignInForm: React.FC<SignInFormProps> = ({ onSuccess, onToggleForm, showToggle = true, selectedRole }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false);
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<SignInFormData>({
    defaultValues: {
      rememberMe: true
    }
  });

  const email = watch('email');

  const handleForgotPassword = async () => {
    const emailToReset = resetEmail || email;
    
    if (!emailToReset) {
      toast({
        variant: "destructive",
        title: "Email required",
        description: "Please enter your email address to reset your password.",
      });
      return;
    }

    try {
      setIsResettingPassword(true);
      const { error } = await supabase.auth.resetPasswordForEmail(emailToReset, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {throw error;}

      toast({
        title: "Password reset email sent! 📧",
        description: `Check your email (${emailToReset}) for the password reset link.`,
        duration: 6000,
      });
      
      setShowForgotPassword(false);
      setResetEmail('');
    } catch (error: unknown) {
      console.error('Password reset error:', error);
      let message = "Failed to send reset email. Please try again.";
      if (error instanceof Error) {
        message = error.message;
      }
      toast({
        variant: "destructive",
        title: "Password reset failed",
        description: message ,
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const onSubmit = async (data: SignInFormData) => {
    try {
      setIsSubmitting(true);
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      
      if (error) {
        // Handle specific error cases
        if (error.message.includes('Email not confirmed')) {
          toast({
            variant: "destructive",
            title: "Email not confirmed",
            description: "Please check your email and click the confirmation link before signing in.",
          });
          return;
        }
        
        if (error.message.includes('Invalid login credentials')) {
          toast({
            variant: "destructive",
            title: "Invalid credentials",
            description: "The email or password you entered is incorrect.",
          });
          return;
        }
        
        throw error;
      }
      
      // Save remember me preference
      if (data.rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberMe');
      }
      
      toast({
        title: "Welcome back! 👋",
        description: "You've successfully signed in to GradApp Ascend.",
      });
      
      if (onSuccess) {
        onSuccess();
      }
      
      // For sign in, use selected role or check existing user role
      if (authData.user) {
        let userRole = selectedRole;
        
        if (!userRole) {
          // If no role selected (existing flow), get from database
          try {
            const { role } = await authService.getUserRole(authData.user.id);
            userRole = role as 'applicant' | 'mentor';
          } catch (error) {
            console.warn('Could not fetch user role, defaulting to applicant:', error);
            userRole = 'applicant';
          }
        } else {
          // Create/update user profile if role was selected (don't wait for completion)
          authService.createUserProfile(authData.user.id, {
            full_name: authData.user.user_metadata?.full_name || '',
            role: userRole
          }).catch(error => {
            console.warn('Could not save user profile:', error);
          });
        }
        
        if (userRole === 'applicant') {
          // Check if applicant has completed onboarding
          try {
            const { completed } = await authService.hasCompletedOnboarding(authData.user.id);
            if (completed) {
              navigate('/dashboard');
            } else {
              navigate('/onboarding');
            }
          } catch (error) {
            console.warn('Could not check onboarding status, redirecting to onboarding:', error);
            navigate('/onboarding');
          }
        } else if (userRole === 'mentor') {
          // Check if mentor has completed onboarding
          try {
            const { completed } = await authService.hasCompletedOnboarding(authData.user.id);
            if (completed) {
              navigate('/mentor/dashboard');
            } else {
              navigate('/mentor/onboarding');
            }
          } catch (error) {
            console.warn('Could not check mentor onboarding status, redirecting to onboarding:', error);
            navigate('/mentor/onboarding');
          }
        } else {
          // Default fallback
          navigate('/dashboard');
        }
      }
    } catch (error: unknown) {
      console.error('Sign in error:', error);
      let message = "Please check your credentials and try again.";
      if (error instanceof Error) {
        message = error.message;
      }
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      const { error } = await authService.signInWithGoogle();
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Google sign in failed",
          description: error.message || "Failed to sign in with Google. Please try again.",
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Google sign in failed",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGithubSignIn = async () => {
    try {
      setIsGithubLoading(true);
      const { error } = await authService.signInWithGitHub();
      
      if (error) {
        toast({
          variant: "destructive",
          title: "GitHub sign in failed",
          description: error.message || "Failed to sign in with GitHub. Please try again.",
        });
      }
    } catch (_error: unknown) {
      toast({
        variant: "destructive",
        title: "GitHub sign in failed",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsGithubLoading(false);
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
          <KeyRound className="w-8 h-8 text-white" />
        </motion.div>
        <h3 className="text-2xl font-bold text-gray-900">Welcome Back</h3>
        <p className="text-sm text-gray-600 mt-2">
          Sign in to continue your application journey
        </p>
      </div>
      
      {!showForgotPassword ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <motion.div 
            className="space-y-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Label htmlFor="email" className="text-sm font-medium">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                id="email"
                type="email" 
                placeholder="you@example.com"
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
                className="text-xs text-red-500"
              >
                {errors.email.message}
              </motion.p>
            )}
          </motion.div>
          
          <motion.div 
            className="space-y-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <Button 
                type="button"
                variant="link" 
                size="sm" 
                className="text-xs text-gradapp-primary hover:text-gradapp-secondary p-0 h-auto font-medium"
                onClick={() => setShowForgotPassword(true)}
              >
                Forgot password?
              </Button>
            </div>
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-red-500"
              >
                {errors.password.message}
              </motion.p>
            )}
          </motion.div>

          <motion.div 
            className="flex items-center space-x-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Checkbox 
              id="rememberMe"
              defaultChecked={true}
              onCheckedChange={(checked) => setValue('rememberMe', checked as boolean)}
            />
            <Label 
              htmlFor="rememberMe" 
              className="text-sm text-gray-600 cursor-pointer select-none"
            >
              Remember me for 30 days
            </Label>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-gradapp-primary to-gradapp-secondary hover:opacity-90 transition-all duration-300 text-white font-medium py-6 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 group"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner variant="micro" size="xs" color="secondary" className="mr-2" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </motion.div>
        </form>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-4"
        >
          <div className="text-center">
            <h4 className="text-lg font-semibold text-gray-900">Reset Your Password</h4>
            <p className="text-sm text-gray-600 mt-1">
              Enter your email and we'll send you a reset link
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="resetEmail" className="text-sm font-medium">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                id="resetEmail"
                type="email" 
                placeholder="you@example.com"
                value={resetEmail || email}
                onChange={(e) => setResetEmail(e.target.value)}
                className="pl-10 transition-all duration-200 border-gray-300 focus:border-gradapp-primary focus:ring-gradapp-primary"
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowForgotPassword(false);
                setResetEmail('');
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="flex-1 bg-gradient-to-r from-gradapp-primary to-gradapp-secondary hover:opacity-90"
              onClick={handleForgotPassword}
              disabled={isResettingPassword}
            >
              {isResettingPassword ? (
                <>
                  <LoadingSpinner variant="micro" size="xs" color="secondary" className="mr-2" />
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </Button>
          </div>
        </motion.div>
      )}
      
      {!showForgotPassword && (
        <>
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
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isSubmitting}
              className="w-full hover:bg-gray-50 transition-colors duration-200 border-gray-300"
            >
              {isGoogleLoading ? (
                <LoadingSpinner variant="micro" size="xs" className="mr-2" />
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
              onClick={handleGithubSignIn}
              disabled={isGithubLoading || isSubmitting}
              className="w-full hover:bg-gray-50 transition-colors duration-200 border-gray-300"
            >
              {isGithubLoading ? (
                <LoadingSpinner variant="micro" size="xs" className="mr-2" />
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
              transition={{ delay: 0.5 }}
            >
              <span className="text-gray-600">Don't have an account? </span>
              <Button 
                variant="link" 
                onClick={onToggleForm} 
                className="p-0 h-auto text-gradapp-primary hover:text-gradapp-secondary font-medium"
              >
                Sign up now
              </Button>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
};

export default SignInForm;