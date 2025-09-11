import React, { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Loader2, UserCheck, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ProtectedRouteProps {
  children: ReactNode;
  requireOnboarding?: boolean;
  requireAuth?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireOnboarding = true,
  requireAuth = true
}) => {
  const { user, loading, onboardingComplete, sessionData } = useSession();
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(false);
  const [onboardingStatus, setOnboardingStatus] = useState<boolean | null>(null);
  const location = useLocation();

  // Double-check onboarding completion from database
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user || !requireOnboarding) {
        setOnboardingStatus(null);
        return;
      }

      // Always trust the session data if it indicates onboarding is complete
      if (onboardingComplete && sessionData) {
        setOnboardingStatus(true);
        return;
      }

      // Check localStorage cache before doing expensive database check
      const cachedStatus = localStorage.getItem(`onboarding_completed_${user.id}`);
      if (cachedStatus === 'true') {
        console.log('🔄 Using cached onboarding status: true');
        setOnboardingStatus(true);
        return;
      }

      // Only do additional check if session indicates incomplete or no session data
      if (!onboardingComplete || !sessionData) {
        setIsCheckingOnboarding(true);
        
        try {
          // Import and check onboarding service directly
          const { onboardingService } = await import('@/services/onboardingService');
          const hasCompleted = await Promise.race([
            onboardingService.hasCompletedOnboarding(),
            new Promise<boolean>(resolve => setTimeout(() => resolve(false), 3000))
          ]);
          
          setOnboardingStatus(hasCompleted);
        } catch (error) {
          console.warn('Error checking onboarding status:', error);
          setOnboardingStatus(false);
        } finally {
          setIsCheckingOnboarding(false);
        }
      } else {
        setOnboardingStatus(onboardingComplete);
      }
    };

    checkOnboardingStatus();
  }, [user, loading, onboardingComplete, sessionData, requireOnboarding]);

  // Show loading while authentication is loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96 bg-white shadow-lg">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Authenticating</h3>
            <p className="text-sm text-gray-600">Please wait while we verify your session...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Redirect to auth if authentication is required and user is not logged in
  if (requireAuth && !user) {
    const redirectPath = location.pathname !== '/' ? location.pathname + location.search : undefined;
    const authUrl = redirectPath ? `/auth?redirect=${encodeURIComponent(redirectPath)}` : '/auth';
    return <Navigate to={authUrl} replace />;
  }

  // Show loading while checking onboarding status
  if (requireOnboarding && user && (isCheckingOnboarding || onboardingStatus === null)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96 bg-white shadow-lg">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <UserCheck className="h-6 w-6 text-green-600 animate-pulse" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Checking Your Profile</h3>
            <p className="text-sm text-gray-600">Verifying your onboarding completion status...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Redirect to onboarding if required and not completed
  if (requireOnboarding && user && onboardingStatus === false) {
    console.log('🚫 Onboarding not completed, redirecting to onboarding');
    return <Navigate to="/onboarding" replace />;
  }

  // Show error state if there's an authentication issue
  if (requireAuth && user && requireOnboarding && onboardingStatus === null && !isCheckingOnboarding) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96 bg-white shadow-lg border-orange-200">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Setup Required</h3>
            <p className="text-sm text-gray-600 mb-4">
              We couldn't verify your profile setup. Please complete the onboarding process.
            </p>
            <button
              onClick={() => window.location.href = '/onboarding'}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              Complete Setup
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // All checks passed, render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;