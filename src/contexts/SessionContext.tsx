import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { sessionPersistenceService, UserSessionData } from '@/services/sessionPersistenceService';
import { errorHandlingEnhancedService } from '@/services/errorHandlingEnhancedService';
import { loadingStateService, LoadingKeys } from '@/services/loadingStateService';
import { toast } from 'sonner';

interface SessionContextType {
  // Core session data
  user: User | null;
  sessionData: UserSessionData | null;
  loading: boolean;
  error: string | null;

  // Convenience getters for frequently used data
  userProfile: any;
  academicProfile: any;
  researchInterests: any[];
  cvAnalysis: any;
  onboardingComplete: boolean;
  universityRecommendations: any[];
  selectedUniversities: any[];

  // Actions
  refreshSessionData: () => Promise<void>;
  updateUserData: (dataType: keyof UserSessionData, data: any) => Promise<boolean>;
  invalidateSession: () => void;
  
  // Utilities
  hasData: (dataType: keyof UserSessionData) => boolean;
  isDataLoading: boolean;
}

const SessionContext = createContext<SessionContextType | null>(null);

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

interface SessionProviderProps {
  children: React.ReactNode;
}

export const SessionProvider: React.FC<SessionProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [sessionData, setSessionData] = useState<UserSessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize session - simplified to prevent infinite loading
  const initializeSession = useCallback(async (currentUser: User | null) => {
    console.log('🔄 SessionContext: Initializing session for user:', currentUser?.id || 'null');
    
    setUser(currentUser);
    setError(null);
    
    if (currentUser) {
      // Don't block the UI - load data in background
      setIsDataLoading(true);
      
      // Set loading to false immediately to unblock auth flow
      setLoading(false);
      
      // Load session data in background without blocking
      setTimeout(async () => {
        try {
          console.log('🔄 Background: Loading session data for user:', currentUser.id);
          const data = await sessionPersistenceService.getUserSessionData(currentUser.id);
          setSessionData(data);
          console.log('✅ Background: Session data loaded successfully');
        } catch (err) {
          console.warn('⚠️ Background: Session data loading failed (non-blocking):', err);
          
          // Check localStorage for onboarding completion before defaulting to false
          const cachedOnboarding = localStorage.getItem(`onboarding_completed_${currentUser.id}`);
          const onboardingComplete = cachedOnboarding === 'true';
          
          console.log('🔄 Using cached onboarding status:', onboardingComplete);
          
          // Set empty session data with cached onboarding status
          setSessionData({
            user: currentUser,
            profile: null,
            academicProfile: null,
            researchInterests: [],
            cvAnalysis: null,
            onboardingComplete, // Use cached value instead of false
            selectedUniversities: [],
            universityRecommendations: [],
            lastUpdated: new Date().toISOString()
          });
        } finally {
          setIsDataLoading(false);
        }
      }, 100); // Small delay to let auth complete first
    } else {
      setSessionData(null);
      setLoading(false);
    }
  }, []);

  // Refresh session data
  const refreshSessionData = useCallback(async () => {
    if (!user) {return;}
    
    const safeRefreshSession = errorHandlingEnhancedService.createSafeOperation(
      sessionPersistenceService.getUserSessionData.bind(sessionPersistenceService),
      { component: 'SessionContext', action: 'refreshSession', userId: user.id }
    );
    
    setIsDataLoading(true);
    setError(null);
    loadingStateService.startLoading(LoadingKeys.SESSION_REFRESH, 'Refreshing your data...');
    
    try {
      console.log('🔄 Refreshing session data...');
      const data = await safeRefreshSession(user.id);
      setSessionData(data);
      console.log('✅ Session data refreshed');
    } catch (err) {
      const errorResponse = errorHandlingEnhancedService.handleError(err, {
        component: 'SessionContext',
        action: 'refreshSession',
        userId: user.id
      });
      
      setError(errorResponse.message);
      errorHandlingEnhancedService.showErrorToast(errorResponse, {
        component: 'SessionContext',
        action: 'refreshSession'
      });
    } finally {
      setIsDataLoading(false);
      loadingStateService.stopLoading(LoadingKeys.SESSION_REFRESH);
    }
  }, [user]);

  // Update specific user data
  const updateUserData = useCallback(async (dataType: keyof UserSessionData, data: any): Promise<boolean> => {
    if (!user) {
      const errorResponse = errorHandlingEnhancedService.handleError(
        new Error('User not authenticated'),
        { component: 'SessionContext', action: 'updateUserData' }
      );
      errorHandlingEnhancedService.showErrorToast(errorResponse);
      return false;
    }

    const safeUpdateData = errorHandlingEnhancedService.createSafeOperation(
      sessionPersistenceService.updateUserData.bind(sessionPersistenceService),
      { component: 'SessionContext', action: 'updateUserData', userId: user.id }
    );
    
    setIsDataLoading(true);
    loadingStateService.startLoading(LoadingKeys.PROFILE_UPDATE, `Updating ${dataType}...`);
    
    try {
      console.log(`🔄 Updating ${dataType} for user:`, user.id);
      const success = await safeUpdateData(user.id, dataType, data);
      
      if (success) {
        // Refresh session data to reflect changes
        await refreshSessionData();
        toast.success('Data updated successfully');
        return true;
      } 
        toast.error(`Failed to update ${dataType}`);
        return false;
      
    } catch (err) {
      const errorResponse = errorHandlingEnhancedService.handleError(err, {
        component: 'SessionContext',
        action: 'updateUserData',
        userId: user.id,
        metadata: { dataType }
      });
      
      errorHandlingEnhancedService.showErrorToast(errorResponse, {
        component: 'SessionContext',
        action: 'updateUserData'
      });
      return false;
    } finally {
      setIsDataLoading(false);
      loadingStateService.stopLoading(LoadingKeys.PROFILE_UPDATE);
    }
  }, [user, refreshSessionData]);

  // Invalidate session
  const invalidateSession = useCallback(() => {
    if (user) {
      sessionPersistenceService.invalidateUserCache(user.id);
    }
    setSessionData(null);
    setError(null);
    console.log('🗑️ Session invalidated');
  }, [user]);

  // Check if specific data exists
  const hasData = useCallback((dataType: keyof UserSessionData): boolean => {
    if (!sessionData) {return false;}
    
    const data = sessionData[dataType];
    if (Array.isArray(data)) {
      return data.length > 0;
    }
    return data != null;
  }, [sessionData]);

  // Auth state listener
  useEffect(() => {
    let mounted = true;

    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) {
        await initializeSession(session?.user || null);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) {return;}

      console.log('🔐 Auth state changed:', event);
      
      if (event === 'SIGNED_IN' && session?.user) {
        await initializeSession(session.user);
        // Pre-warm cache for better UX
        sessionPersistenceService.preWarmCache(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        sessionPersistenceService.clearAllCache();
        await initializeSession(null);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // Refresh session data when token is refreshed
        if (session.user.id === user?.id) {
          refreshSessionData();
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Memoized convenience getters
  const contextValue = useMemo<SessionContextType>(() => ({
    // Core session data
    user,
    sessionData,
    loading,
    error,

    // Convenience getters
    userProfile: sessionData?.profile || null,
    academicProfile: sessionData?.academicProfile || null,
    researchInterests: sessionData?.researchInterests || [],
    cvAnalysis: sessionData?.cvAnalysis || null,
    onboardingComplete: sessionData?.onboardingComplete || false,
    universityRecommendations: sessionData?.universityRecommendations || [],
    selectedUniversities: sessionData?.selectedUniversities || [],

    // Actions
    refreshSessionData,
    updateUserData,
    invalidateSession,
    
    // Utilities
    hasData,
    isDataLoading
  }), [
    user,
    sessionData,
    loading,
    error,
    refreshSessionData,
    updateUserData,
    invalidateSession,
    hasData,
    isDataLoading
  ]);

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
};

// Hook for components that need specific session data
export const useSessionData = <T extends keyof UserSessionData>(requiredData: T[]): Partial<Pick<UserSessionData, T>> => {
  const { user, sessionData } = useSession();
  
  return useMemo(() => {
    if (!sessionData || !user) {return {};}
    
    const result: Partial<Pick<UserSessionData, T>> = {};
    requiredData.forEach(key => {
      result[key] = sessionData[key];
    });
    
    return result;
  }, [sessionData, user, requiredData]);
};

// Hook for checking if user has completed specific setup steps
export const useSetupStatus = () => {
  const { sessionData } = useSession();
  
  return useMemo(() => ({
    hasProfile: Boolean(sessionData?.profile),
    hasAcademicProfile: Boolean(sessionData?.academicProfile),
    hasResearchInterests: (sessionData?.researchInterests?.length || 0) > 0,
    hasCVAnalysis: Boolean(sessionData?.cvAnalysis),
    hasOnboardingComplete: Boolean(sessionData?.onboardingComplete),
    hasUniversityRecommendations: (sessionData?.universityRecommendations?.length || 0) > 0,
    setupComplete: sessionData?.onboardingComplete && 
                  Boolean(sessionData?.academicProfile) && 
                  (sessionData?.researchInterests?.length || 0) > 0
  }), [sessionData]);
};