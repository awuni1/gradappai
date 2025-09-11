interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
  startTime: number;
}

// Simple loading state manager without external dependencies
class LoadingStateManager {
  private loadingStates = new Map<string, LoadingState>();
  private listeners = new Set<() => void>();
  
  setLoading(key: string, loading: boolean, message?: string, progress?: number): void {
    if (loading) {
      this.loadingStates.set(key, {
        isLoading: true,
        message,
        progress,
        startTime: Date.now()
      });
    } else {
      this.loadingStates.delete(key);
    }
    this.notifyListeners();
  }
  
  getLoadingState(key: string): { isLoading: boolean; message?: string; progress?: number } {
    const state = this.loadingStates.get(key);
    return {
      isLoading: Boolean(state),
      message: state?.message,
      progress: state?.progress
    };
  }
  
  isAnyLoading(): boolean {
    return this.loadingStates.size > 0;
  }
  
  clearAll(): void {
    this.loadingStates.clear();
    this.notifyListeners();
  }
  
  getActiveTasks(): string[] {
    return Array.from(this.loadingStates.keys());
  }
  
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }
}

const loadingStateManager = new LoadingStateManager();

class LoadingStateService {
  private static instance: LoadingStateService;
  
  static getInstance(): LoadingStateService {
    if (!LoadingStateService.instance) {
      LoadingStateService.instance = new LoadingStateService();
    }
    return LoadingStateService.instance;
  }

  /**
   * Start a loading operation
   */
  startLoading(key: string, message?: string, progress?: number): void {
    console.log(`🔄 Starting: ${key}${message ? ` - ${message}` : ''}`);
    loadingStateManager.setLoading(key, true, message, progress);
  }

  /**
   * Stop a loading operation
   */
  stopLoading(key: string): void {
    const state = loadingStateManager.getLoadingState(key);
    if (state.isLoading) {
      console.log(`✅ Completed: ${key}`);
    }
    loadingStateManager.setLoading(key, false);
  }

  /**
   * Update loading progress
   */
  updateProgress(key: string, progress: number, message?: string): void {
    const currentState = loadingStateManager.getLoadingState(key);
    if (currentState.isLoading) {
      loadingStateManager.setLoading(key, true, message || currentState.message, progress);
    }
  }

  /**
   * Check if a specific operation is loading
   */
  isLoading(key: string): boolean {
    return loadingStateManager.getLoadingState(key).isLoading;
  }

  /**
   * Get loading details for a specific operation
   */
  getLoadingDetails(key: string): { isLoading: boolean; message?: string; progress?: number } {
    return loadingStateManager.getLoadingState(key);
  }

  /**
   * Check if any operation is currently loading
   */
  isAnyLoading(): boolean {
    return loadingStateManager.isAnyLoading();
  }

  /**
   * Get list of active loading operations
   */
  getActiveTasks(): string[] {
    return loadingStateManager.getActiveTasks();
  }

  /**
   * Clear all loading states
   */
  clearAll(): void {
    console.log('🧹 Clearing all loading states');
    loadingStateManager.clearAll();
  }

  /**
   * Create a loading wrapper for async operations
   */
  withLoading<T extends any[], R>(
    key: string,
    operation: (...args: T) => Promise<R>,
    message?: string
  ) {
    return async (...args: T): Promise<R> => {
      this.startLoading(key, message);
      try {
        const result = await operation(...args);
        this.stopLoading(key);
        return result;
      } catch (error) {
        this.stopLoading(key);
        throw error;
      }
    };
  }

  /**
   * Create a loading wrapper with progress updates
   */
  withProgressLoading<T extends any[], R>(
    key: string,
    operation: (...args: T) => Promise<R>,
    progressCallback?: (progress: number, message?: string) => void,
    initialMessage?: string
  ) {
    return async (...args: T): Promise<R> => {
      this.startLoading(key, initialMessage);
      
      // Create progress updater
      const updateProgress = (progress: number, message?: string) => {
        this.updateProgress(key, progress, message);
        if (progressCallback) {
          progressCallback(progress, message);
        }
      };
      
      try {
        const result = await operation(...args);
        this.updateProgress(key, 100, 'Completed');
        setTimeout(() => this.stopLoading(key), 500);
        return result;
      } catch (error) {
        this.stopLoading(key);
        throw error;
      }
    };
  }

  /**
   * Batch operations with a single loading state
   */
  async withBatchLoading<T>(
    key: string,
    operations: (() => Promise<any>)[],
    message = 'Processing...'
  ): Promise<T[]> {
    this.startLoading(key, message);
    
    try {
      const total = operations.length;
      const results = [];
      
      for (let i = 0; i < total; i++) {
        const progress = Math.round(((i + 1) / total) * 100);
        this.updateProgress(key, progress, `${message} (${i + 1}/${total})`);
        
        const result = await operations[i]();
        results.push(result);
      }
      
      this.stopLoading(key);
      return results;
    } catch (error) {
      this.stopLoading(key);
      throw error;
    }
  }

  /**
   * Debounced loading state (useful for search/filter operations)
   */
  withDebouncedLoading<T extends any[], R>(
    key: string,
    operation: (...args: T) => Promise<R>,
    delay = 300,
    message?: string
  ) {
    let timeoutId: NodeJS.Timeout;
    
    return async (...args: T): Promise<R> => {
      // Clear previous timeout
      clearTimeout(timeoutId);
      
      return new Promise((resolve, reject) => {
        timeoutId = setTimeout(async () => {
          this.startLoading(key, message);
          try {
            const result = await operation(...args);
            this.stopLoading(key);
            resolve(result);
          } catch (error) {
            this.stopLoading(key);
            reject(error);
          }
        }, delay);
      });
    };
  }
}

// Export singleton instance
export const loadingStateService = LoadingStateService.getInstance();

// Export common loading keys as constants
export const LoadingKeys = {
  // Authentication
  AUTH_LOGIN: 'auth.login',
  AUTH_SIGNUP: 'auth.signup',
  AUTH_LOGOUT: 'auth.logout',
  
  // Onboarding
  ONBOARDING_SAVE: 'onboarding.save',
  ONBOARDING_COMPLETE: 'onboarding.complete',
  ONBOARDING_LOAD: 'onboarding.load',
  
  // CV Analysis
  CV_UPLOAD: 'cv.upload',
  CV_ANALYZE: 'cv.analyze',
  CV_PROCESS: 'cv.process',
  
  // Dashboard
  DASHBOARD_LOAD: 'dashboard.load',
  DASHBOARD_REFRESH: 'dashboard.refresh',
  
  // University Matching
  UNIVERSITY_MATCH: 'university.match',
  UNIVERSITY_SEARCH: 'university.search',
  UNIVERSITY_SAVE: 'university.save',
  
  // Profile
  PROFILE_UPDATE: 'profile.update',
  PROFILE_LOAD: 'profile.load',
  
  // Session
  SESSION_REFRESH: 'session.refresh',
  SESSION_INIT: 'session.init'
} as const;

export type LoadingKey = typeof LoadingKeys[keyof typeof LoadingKeys];

// React hook for component usage (simplified without zustand)
export function useLoading(key: string) {
  return loadingStateManager.getLoadingState(key);
}

// React hook for multiple loading states
export function useLoadingStates(keys: string[]) {
  return keys.map(key => ({ key, ...loadingStateManager.getLoadingState(key) }));
}

// React hook to check if any operation is loading
export function useAnyLoading() {
  return loadingStateManager.isAnyLoading();
}