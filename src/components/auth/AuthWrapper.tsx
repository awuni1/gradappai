import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '@/services/authService';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { toast } from 'sonner';

interface AuthWrapperProps {
  children: React.ReactNode;
}

/**
 * Authentication wrapper that handles automatic redirects based on user status
 * Used to wrap the entire app to provide smart routing on page load/refresh
 */
export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const [isInitializing, setIsInitializing] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if user is authenticated
        const { user } = await authService.getCurrentUser();
        
        // If user is on public routes or already correctly placed, don't redirect
        const publicRoutes = ['/', '/auth', '/about', '/contact', '/auth/student', '/auth/mentor', '/mentor/auth'];
        if (publicRoutes.includes(location.pathname)) {
          setIsInitializing(false);
          return;
        }

        // If user is authenticated, check their status and redirect if needed
        if (user) {
          const _status = await authService.getUserStatusComplete(user.id);
          
          // If user is on wrong route, redirect them
          const routeValidation = await authService.validateRouteAccess(location.pathname, user.id);
          if (!routeValidation.allowed && routeValidation.redirectTo) {
            console.log(`Redirecting user from ${location.pathname} to ${routeValidation.redirectTo}: ${routeValidation.reason}`);
            
            // Show user-friendly message
            if (routeValidation.reason) {
              toast.info(routeValidation.reason);
            }
            
            navigate(routeValidation.redirectTo, { replace: true });
          }
        } else {
          // User not authenticated and trying to access protected route
          console.log(`Unauthenticated user trying to access ${location.pathname}, redirecting to auth`);
          navigate('/auth', { replace: true });
        }
        
      } catch (error) {
        console.error('Auth initialization failed:', error);
        // On error, don't redirect unless it's a clear auth failure
        if ((error as Error)?.message?.includes('not authenticated')) {
          navigate('/auth', { replace: true });
        }
      } finally {
        setIsInitializing(false);
      }
    };

    // Only run initialization if we're not already on a public route
    const publicRoutes = ['/', '/auth', '/about', '/contact', '/auth/student', '/auth/mentor', '/mentor/auth'];
    if (!publicRoutes.includes(location.pathname)) {
      initializeAuth();
    } else {
      setIsInitializing(false);
    }
  }, [location.pathname, navigate]); // Include required dependencies

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = authService.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      
      if (event === 'SIGNED_IN' && session?.user) {
        // User just signed in, redirect to appropriate location
        const redirectTo = await authService.getPostAuthRedirect(session.user.id);
        console.log(`User signed in, redirecting to: ${redirectTo}`);
        navigate(redirectTo, { replace: true });
      } else if (event === 'SIGNED_OUT') {
        // User signed out, redirect to home
        console.log('User signed out, redirecting to home');
        navigate('/', { replace: true });
        toast.info('You have been signed out');
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [navigate]);

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 animate-pulse">Initializing GradApp...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthWrapper;