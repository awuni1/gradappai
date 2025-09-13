import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Loader2, Mail, Lock, User, Sparkles } from 'lucide-react';
import authService from '@/services/authService';

interface SimpleSignUpFormProps {
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

const SimpleSignUpForm: React.FC<SimpleSignUpFormProps> = ({ onSuccess, onToggleForm, showToggle = true, selectedRole }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState<'google' | 'github' | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<SignUpFormData>();

  const onSubmit = async (data: SignUpFormData) => {
    try {
      setIsSubmitting(true);
      
      console.log('Attempting signup with:', { email: data.email, role: selectedRole || 'applicant' });
      
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
          emailRedirectTo: `${(() => {
            if (typeof window === 'undefined') return 'https://www.gradappai.com';
            const host = window.location.hostname;
            return (host === 'localhost' || host === '127.0.0.1') ? window.location.origin : 'https://www.gradappai.com';
          })()}/auth`
        }
      });
      
      if (error) {
        console.error('Signup error:', error);
        
        let errorMessage = error.message;
        
        // Handle specific error cases with better messaging
        if (error.message.includes('email_address_invalid')) {
          errorMessage = "Please use a valid email address. Some domains (like example.com) are not supported.";
        } else if (error.message.includes('User already registered')) {
          errorMessage = "An account with this email already exists. Please sign in instead.";
        } else if (error.message.includes('Password')) {
          errorMessage = "Password must be at least 6 characters long.";
        }
        
        toast({
          variant: "destructive",
          title: "Signup failed",
          description: errorMessage,
        });
        setIsSubmitting(false);
        return;
      }
      
      console.log('Signup successful:', authData);
      
      // Check if user needs email confirmation
      if (authData.user && !authData.session) {
        toast({
          title: "Check your email! 📧",
          description: "We've sent you a confirmation link. Please check your email (including spam folder) and click the link to activate your account. You can close this page - the confirmation link will bring you back.",
          duration: 10000,
        });
        setIsSubmitting(false);
        return;
      }
      
      toast({
        title: "Account created! 🎉",
        description: "You've successfully signed up. Welcome to GradApp!",
      });
      
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error: unknown) {
      console.error('Signup error:', error);
      toast({
        variant: "destructive",
        title: "Signup failed",
        description: (error as Error)?.message || "Something went wrong. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOAuthSignUp = async (provider: 'google' | 'github') => {
    try {
      setIsOAuthLoading(provider);
      
      const { error } = provider === 'google' 
        ? await authService.signInWithGoogle()
        : await authService.signInWithGitHub();
      
      if (error) {
        console.error(`${provider} OAuth error:`, error);
        toast({
          variant: "destructive",
          title: `${provider === 'google' ? 'Google' : 'GitHub'} signup failed`,
          description: error.message,
        });
      }
      // If successful, the auth state change will handle navigation
    } catch (error) {
      console.error(`${provider} OAuth error:`, error);
      toast({
        variant: "destructive",
        title: `${provider === 'google' ? 'Google' : 'GitHub'} signup failed`,
        description: (error as Error)?.message || "Something went wrong. Please try again.",
      });
    } finally {
      setIsOAuthLoading(null);
    }
  };

  return (
    <div className="space-y-6">
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

      {/* OAuth Providers */}
      <div className="space-y-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">Continue with</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOAuthSignUp('google')}
            disabled={isOAuthLoading !== null || isSubmitting}
            className="relative"
          >
            {isOAuthLoading === 'google' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </>
            )}
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOAuthSignUp('github')}
            disabled={isOAuthLoading !== null || isSubmitting}
            className="relative"
          >
            {isOAuthLoading === 'github' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub
              </>
            )}
          </Button>
        </div>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">Or with email</span>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                id="firstName"
                type="text" 
                placeholder="John"
                className="pl-10"
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
                placeholder="Doe"
                className="pl-10"
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
              placeholder="you@gmail.com"
              className="pl-10"
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
      </form>
      
      {showToggle && (
        <div className="text-center text-sm">
          <span className="text-gray-600">Already have an account? </span>
          <Button 
            variant="link" 
            onClick={onToggleForm} 
            className="p-0 h-auto text-blue-600 hover:text-blue-800"
          >
            Sign in here
          </Button>
        </div>
      )}
    </div>
  );
};

export default SimpleSignUpForm;