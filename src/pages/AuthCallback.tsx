import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import authService from '@/services/authService';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    handleAuthCallback();
  }, []);

  const handleAuthCallback = async () => {
    try {
      // Helper: timeout wrapper to avoid hanging
      const withTimeout = async <T,>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
        return Promise.race([
          promise,
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms))
        ]) as Promise<T>;
      };

      // First, check if there are OAuth errors in the URL parameters (query or hash)
      const urlParams = new URLSearchParams(window.location.search);
      const hash = window.location.hash || '';
      const hashParams = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
      const urlError = urlParams.get('error') || hashParams.get('error');
      const errorCode = urlParams.get('error_code') || hashParams.get('error_code');
      const errorDescription = urlParams.get('error_description') || hashParams.get('error_description');

      if (urlError) {
        console.error('OAuth URL Error:', { urlError, errorCode, errorDescription });
        setStatus('error');
        
        let userFriendlyMessage = 'Authentication failed. Please try again.';
        
        if (urlError === 'invalid_request' && errorCode === 'bad_oauth_state') {
          userFriendlyMessage = 'OAuth session expired or invalid. This may happen if you\'re redirecting to the wrong domain. Please try signing in again.';
        } else if (urlError === 'access_denied') {
          userFriendlyMessage = 'You declined to authorize the application. Please try again if you want to sign in.';
        } else if (urlError === 'invalid_request') {
          userFriendlyMessage = 'Invalid OAuth request. This may be due to a configuration mismatch. Please try again.';
        } else if (errorDescription) {
          userFriendlyMessage = decodeURIComponent(errorDescription.replace(/\+/g, ' '));
        }
        
        setMessage(userFriendlyMessage);
        
        toast({
          variant: "destructive",
          title: "OAuth Error",
          description: userFriendlyMessage,
        });
        
        // Clear the error parameters from URL and redirect to sign-in
        setTimeout(() => {
          window.history.replaceState({}, document.title, window.location.pathname);
          navigate('/auth');
        }, 4000);
        return;
      }

      // Try to handle the OAuth callback by checking for auth code/token in URL
      // Prefer code exchange (PKCE) first, then fallback to hash parsing
      let callbackError: any = null;
      let processed = false;

      // 1) PKCE/code flow
      if (typeof (supabase.auth as any).exchangeCodeForSession === 'function') {
        try {
          const { error } = await withTimeout(
            (supabase.auth as any).exchangeCodeForSession(window.location.href),
            6000,
            'exchangeCodeForSession'
          );
          if (!error) {
            processed = true;
          } else {
            callbackError = error;
          }
        } catch (e) {
          callbackError = e;
        }
      }

      // 2) Fallback for legacy hash-based flows
      if (!processed) {
        const getSessionFromUrl = (supabase.auth as any).getSessionFromUrl;
        if (typeof getSessionFromUrl === 'function') {
          try {
            const { error } = await withTimeout(getSessionFromUrl(), 6000, 'getSessionFromUrl');
            if (!error) processed = true; else callbackError = error;
          } catch (e) {
            callbackError = e;
          }
        } else if (hashParams.get('access_token') && hashParams.get('refresh_token')) {
          try {
            const access_token = hashParams.get('access_token') as string;
            const refresh_token = hashParams.get('refresh_token') as string;
            const { error } = await withTimeout(
              supabase.auth.setSession({ access_token, refresh_token }),
              6000,
              'setSession'
            );
            if (!error) processed = true; else callbackError = error;
          } catch (e) {
            callbackError = e;
          }
        }
      }
      
      if (callbackError) {
        console.error('OAuth callback processing error:', callbackError);
        setStatus('error');
        setMessage('Failed to process authentication callback. Please try again.');
        
        toast({
          variant: "destructive",
          title: "Callback Processing Error",
          description: callbackError.message || "Failed to process OAuth response",
        });
        
        setTimeout(() => navigate('/auth'), 3000);
        return;
      }

      // Clean the URL of auth params to avoid re-processing on reload
      try {
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch {}

      // Get the current session
      const { data: { session }, error: sessionError } = await withTimeout(
        supabase.auth.getSession(),
        6000,
        'getSession'
      );
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        setStatus('error');
        setMessage('Authentication failed. Please try again.');
        
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: sessionError.message || "Failed to authenticate with Google",
        });
        
        // Redirect to sign-in after error
        setTimeout(() => navigate('/auth'), 3000);
        return;
      }

      if (!session || !session.user) {
        setStatus('error');
        setMessage('No authentication session found.');
        
        // Redirect to sign-in if no session
        setTimeout(() => navigate('/auth'), 2000);
        return;
      }

      // Authentication successful
      setStatus('success');
      setMessage('Authentication successful! Redirecting...');
      
      const user = session.user;
      
      // Create user profile if it doesn't exist (for OAuth users)
      try {
        const { profile } = await authService.getUserProfile(user.id);
        
        if (!profile) {
          // Create profile for new OAuth user
          const profileData = {
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
            email: user.email || '',
            profile_picture_url: user.user_metadata?.avatar_url || '',
            role: 'applicant' // Default role, can be changed later
          };
          
          await authService.createUserProfile(user.id, profileData);
        }
      } catch (error) {
        console.warn('Could not create/fetch user profile:', error);
        // Don't block the authentication flow for this
      }

      toast({
        title: "Welcome! 👋",
        description: "You've successfully signed in with Google.",
      });

      // Get appropriate redirect URL based on user status
      try {
        const redirectUrl = await authService.getPostAuthRedirect(user.id);
        navigate(redirectUrl);
      } catch (error) {
        console.warn('Could not determine redirect URL:', error);
        // Default fallback
        navigate('/dashboard');
      }

    } catch (error) {
      console.error('OAuth callback error:', error);
      setStatus('error');
      setMessage('An unexpected error occurred during authentication.');
      
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "An unexpected error occurred. Please try signing in again.",
      });
      
      // Redirect to sign-in after error
      setTimeout(() => navigate('/auth'), 3000);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-8 w-8 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'error':
        return <XCircle className="h-8 w-8 text-red-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'border-blue-200 bg-blue-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className={`bg-white rounded-lg shadow-lg border-2 ${getStatusColor()} p-8`}>
          <div className="text-center">
            <div className="flex justify-center mb-4">
              {getStatusIcon()}
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {status === 'loading' && 'Authenticating...'}
              {status === 'success' && 'Success!'}
              {status === 'error' && 'Authentication Failed'}
            </h2>
            
            <p className="text-gray-600 mb-6">
              {message}
            </p>
            
            {status === 'loading' && (
              <div className="flex justify-center">
                <LoadingSpinner size="sm" />
              </div>
            )}
            
            {status === 'error' && (
              <Alert className="mt-4 border-red-200 bg-red-50">
                <XCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  You'll be redirected to the sign-in page in a few seconds.
                </AlertDescription>
              </Alert>
            )}
            
            {status === 'success' && (
              <Alert className="mt-4 border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Taking you to your dashboard...
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;
