import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '@/services/authService';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireRole?: 'applicant' | 'mentor';
  requireOnboarding?: boolean;
  blockIfOnboarded?: boolean;
}

/**
 * Enhanced protected route component that handles:
 * - Authentication requirement
 * - Role-based access control  
 * - Onboarding completion checks
 * - Automatic redirects based on user status
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requireRole,
  requireOnboarding = true,
  blockIfOnboarded = false
}) => {
  const [loading, setLoading] = useState(true);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const checkAccess = async () => {
      try {
        // Get current user
        const { user } = await authService.getCurrentUser();
        
        // If authentication is required but user is not logged in
        if (requireAuth && !user) {
          // Role-aware authentication redirects
          if (requireRole === 'mentor') {
            setRedirectTo('/mentor/auth');
          } else if (requireRole === 'applicant') {
            setRedirectTo('/auth/student');
          } else {
            setRedirectTo('/auth');
          }
          setLoading(false);
          return;
        }

        // If user is logged in, check their complete status
        if (user) {
          const status = await authService.getUserStatusComplete(user.id);
          
          // Check role requirement
          if (requireRole && status.role !== requireRole) {
            const correctRedirect = status.role === 'mentor' ? '/mentor/dashboard' : '/dashboard';
            toast.warning(`Access denied. Redirecting to ${status.role || 'user'} area.`);
            setRedirectTo(correctRedirect);
            setLoading(false);
            return;
          }

          // Check onboarding requirement - only enforce for mentors
          if (requireOnboarding && !status.onboardingCompleted && status.role === 'mentor') {
            toast.info('Please complete your mentor onboarding first.');
            setRedirectTo('/mentor/onboarding');
            setLoading(false);
            return;
          }
          
          // For students, we're more lenient since onboarding is being redesigned
          if (requireOnboarding && !status.onboardingCompleted && status.role === 'applicant') {
            // Check if they have any existing academic profile data
            try {
              const hasExistingData = await authService.hasCompletedOnboarding(user.id);
              if (!hasExistingData.completed) {
                // New users go to placeholder onboarding page
                toast.info('Welcome! Let\'s get you started.');
                setRedirectTo('/onboarding');
                setLoading(false);
                return;
              }
              // Existing users with data can proceed to dashboard
            } catch (error) {
              console.warn('Could not check existing data, allowing access');
            }
          }

          // Check if should block already onboarded users (for onboarding routes)
          if (blockIfOnboarded && status.onboardingCompleted) {
            const dashboardPath = status.role === 'mentor' ? '/mentor/dashboard' : '/dashboard';
            toast.info('You have already completed onboarding.');
            setRedirectTo(dashboardPath);
            setLoading(false);
            return;
          }

          // Validate current route access
          const routeValidation = await authService.validateRouteAccess(location.pathname, user.id);
          if (!routeValidation.allowed && routeValidation.redirectTo) {
            if (routeValidation.reason) {
              toast.info(routeValidation.reason);
            }
            
            // Ensure role-aware redirects
            let finalRedirect = routeValidation.redirectTo;
            if (finalRedirect === '/auth' && status.role === 'mentor') {
              finalRedirect = '/mentor/auth';
            } else if (finalRedirect === '/auth' && status.role === 'applicant') {
              finalRedirect = '/auth/student';
            }
            
            setRedirectTo(finalRedirect);
            setLoading(false);
            return;
          }
        }

        // All checks passed
        setLoading(false);
      } catch (error) {
        console.error('Route protection check failed:', error);
        toast.error('Authentication check failed. Please try again.');
        setRedirectTo('/auth');
        setLoading(false);
      }
    };

    checkAccess();
  }, [location.pathname, requireAuth, requireRole, requireOnboarding, blockIfOnboarded]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Checking access...</span>
      </div>
    );
  }

  if (redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

/**
 * Specific route protection components for common use cases
 */

// Requires authentication only
export const AuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requireAuth={true} requireOnboarding={false}>
    {children}
  </ProtectedRoute>
);

// Requires authentication + completed onboarding
export const CompleteRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requireAuth={true} requireOnboarding={true}>
    {children}
  </ProtectedRoute>
);

// For onboarding routes - blocks if already completed
export const OnboardingRoute: React.FC<{ children: React.ReactNode; role?: 'applicant' | 'mentor' }> = ({ 
  children, 
  role 
}) => (
  <ProtectedRoute 
    requireAuth={true} 
    requireRole={role}
    requireOnboarding={false}
    blockIfOnboarded={true}
  >
    {children}
  </ProtectedRoute>
);

// For mentor-only routes
export const MentorRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requireAuth={true} requireRole="mentor" requireOnboarding={true}>
    {children}
  </ProtectedRoute>
);

// For applicant-only routes  
export const ApplicantRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requireAuth={true} requireRole="applicant" requireOnboarding={true}>
    {children}
  </ProtectedRoute>
);

export default ProtectedRoute;