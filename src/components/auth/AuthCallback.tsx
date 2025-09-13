import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { authService } from '@/services/authService';
import { Loader2 } from 'lucide-react';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          toast({
            variant: "destructive",
            title: "Authentication Failed",
            description: error.message || "Failed to complete authentication. Please try again.",
          });
          navigate('/');
          return;
        }

        if (data.session?.user) {
          const user = data.session.user;
          
          toast({
            title: "Welcome! 🎉",
            description: "You've successfully signed in with your social account.",
          });

          // Create or update user profile
          try {
            await authService.createUserProfile(user.id, {
              full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
              email: user.email || '',
              profile_picture_url: user.user_metadata?.avatar_url || '',
              role: 'applicant' // Default role, can be updated later
            });
          } catch (profileError) {
            console.warn('Could not save user profile:', profileError);
          }

          // Check if user has completed onboarding
          try {
            const { completed } = await authService.hasCompletedOnboarding(user.id);
            if (completed) {
              navigate('/dashboard');
            } else {
              navigate('/onboarding');
            }
          } catch (onboardingError) {
            console.warn('Could not check onboarding status, redirecting to onboarding:', onboardingError);
            navigate('/onboarding');
          }
        } else {
          // No session found, redirect to homepage
          navigate('/');
        }
      } catch (error) {
        console.error('Unexpected auth callback error:', error);
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "An unexpected error occurred during authentication. Please try signing in again.",
        });
        navigate('/');
      }
    };

    handleAuthCallback();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-gradapp-primary" />
        <h2 className="text-xl font-semibold text-gray-900">Completing sign in...</h2>
        <p className="text-gray-600">Please wait while we set up your account.</p>
      </div>
    </div>
  );
};

export default AuthCallback;
