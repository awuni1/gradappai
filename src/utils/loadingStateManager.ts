import { useState, useEffect, useCallback, useRef } from 'react';

export type LoadingStage = 
  | 'authenticating' 
  | 'loading_profile' 
  | 'preparing' 
  | 'almost_ready' 
  | 'error' 
  | 'timeout' 
  | 'success';

export interface LoadingState {
  stage: LoadingStage;
  progress: number;
  message: string;
  isOffline: boolean;
  timeElapsed: number;
  canRetry: boolean;
}

export interface LoadingStageConfig {
  stage: LoadingStage;
  duration: number; // in milliseconds
  progress: number; // 0-100
  message: string;
}

// Default loading stages configuration
const DEFAULT_STAGES: LoadingStageConfig[] = [
  {
    stage: 'authenticating',
    duration: 2000,
    progress: 25,
    message: 'Authenticating your account...'
  },
  {
    stage: 'loading_profile',
    duration: 2000,
    progress: 50,
    message: 'Loading your mentor profile...'
  },
  {
    stage: 'preparing',
    duration: 2000,
    progress: 75,
    message: 'Preparing your onboarding...'
  },
  {
    stage: 'almost_ready',
    duration: 2000,
    progress: 90,
    message: 'Almost ready!'
  }
];

export class LoadingStateManager {
  private currentStageIndex = 0;
  private startTime = Date.now();
  private stages: LoadingStageConfig[];
  private timeoutDuration: number;
  private onStateChange: (state: LoadingState) => void;
  private onTimeout: () => void;
  private onError: (error: Error) => void;
  private timeoutId?: NodeJS.Timeout;
  private stageTimeoutId?: NodeJS.Timeout;
  private progressInterval?: NodeJS.Timeout;
  private isComplete = false;

  constructor(
    onStateChange: (state: LoadingState) => void,
    onTimeout: () => void,
    onError: (error: Error) => void,
    options: {
      stages?: LoadingStageConfig[];
      timeoutDuration?: number;
    } = {}
  ) {
    this.stages = options.stages || DEFAULT_STAGES;
    this.timeoutDuration = options.timeoutDuration || 8000; // 8 seconds default
    this.onStateChange = onStateChange;
    this.onTimeout = onTimeout;
    this.onError = onError;
  }

  /**
   * Start the loading process
   */
  start(): void {
    this.startTime = Date.now();
    this.currentStageIndex = 0;
    this.isComplete = false;
    
    // Set overall timeout
    this.timeoutId = setTimeout(() => {
      if (!this.isComplete) {
        this.handleTimeout();
      }
    }, this.timeoutDuration);

    // Start with first stage
    this.progressToStage(0);
    
    // Start progress updates
    this.startProgressUpdates();
  }

  /**
   * Complete the loading process successfully
   */
  complete(): void {
    this.isComplete = true;
    this.cleanup();
    
    this.onStateChange({
      stage: 'success',
      progress: 100,
      message: 'Ready!',
      isOffline: !navigator.onLine,
      timeElapsed: this.getTimeElapsed(),
      canRetry: false
    });
  }

  /**
   * Handle an error during loading
   */
  error(error: Error): void {
    this.isComplete = true;
    this.cleanup();
    
    this.onStateChange({
      stage: 'error',
      progress: this.getCurrentProgress(),
      message: error.message || 'Something went wrong',
      isOffline: !navigator.onLine,
      timeElapsed: this.getTimeElapsed(),
      canRetry: true
    });
    
    this.onError(error);
  }

  /**
   * Force progress to a specific stage
   */
  setStage(stageIndex: number): void {
    if (stageIndex >= 0 && stageIndex < this.stages.length && !this.isComplete) {
      this.currentStageIndex = stageIndex;
      this.progressToStage(stageIndex);
    }
  }

  /**
   * Retry the loading process
   */
  retry(): void {
    this.cleanup();
    this.start();
  }

  /**
   * Stop and cleanup the loading process
   */
  stop(): void {
    this.isComplete = true;
    this.cleanup();
  }

  private progressToStage(stageIndex: number): void {
    if (stageIndex >= this.stages.length || this.isComplete) {return;}

    const stage = this.stages[stageIndex];
    
    this.onStateChange({
      stage: stage.stage,
      progress: stage.progress,
      message: stage.message,
      isOffline: !navigator.onLine,
      timeElapsed: this.getTimeElapsed(),
      canRetry: false
    });

    // Auto-progress to next stage after duration
    this.stageTimeoutId = setTimeout(() => {
      if (!this.isComplete) {
        this.currentStageIndex++;
        this.progressToStage(this.currentStageIndex);
      }
    }, stage.duration);
  }

  private startProgressUpdates(): void {
    this.progressInterval = setInterval(() => {
      if (!this.isComplete) {
        const currentStage = this.stages[this.currentStageIndex];
        if (currentStage) {
          this.onStateChange({
            stage: currentStage.stage,
            progress: currentStage.progress,
            message: currentStage.message,
            isOffline: !navigator.onLine,
            timeElapsed: this.getTimeElapsed(),
            canRetry: false
          });
        }
      }
    }, 500); // Update every 500ms
  }

  private handleTimeout(): void {
    this.isComplete = true;
    this.cleanup();
    
    this.onStateChange({
      stage: 'timeout',
      progress: this.getCurrentProgress(),
      message: 'This is taking longer than expected',
      isOffline: !navigator.onLine,
      timeElapsed: this.getTimeElapsed(),
      canRetry: true
    });
    
    this.onTimeout();
  }

  private getCurrentProgress(): number {
    if (this.currentStageIndex >= this.stages.length) {
      return 90;
    }
    return this.stages[this.currentStageIndex].progress;
  }

  private getTimeElapsed(): number {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  private cleanup(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    if (this.stageTimeoutId) {
      clearTimeout(this.stageTimeoutId);
    }
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }
  }
}

/**
 * React hook for managing loading states
 */
export const useLoadingState = (
  options: {
    stages?: LoadingStageConfig[];
    timeoutDuration?: number;
    onTimeout?: () => void;
    onError?: (error: Error) => void;
  } = {}
) => {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    stage: 'authenticating',
    progress: 0,
    message: 'Initializing...',
    isOffline: false,
    timeElapsed: 0,
    canRetry: false
  });

  const managerRef = useRef<LoadingStateManager | null>(null);

  const handleTimeout = useCallback(() => {
    options.onTimeout?.();
  }, [options.onTimeout]);

  const handleError = useCallback((error: Error) => {
    options.onError?.(error);
  }, [options.onError]);

  // Initialize manager
  useEffect(() => {
    managerRef.current = new LoadingStateManager(
      setLoadingState,
      handleTimeout,
      handleError,
      {
        stages: options.stages,
        timeoutDuration: options.timeoutDuration
      }
    );

    return () => {
      if (managerRef.current) {
        managerRef.current.stop();
      }
    };
  }, [handleTimeout, handleError, options.stages, options.timeoutDuration]);

  const startLoading = useCallback(() => {
    managerRef.current?.start();
  }, []);

  const completeLoading = useCallback(() => {
    managerRef.current?.complete();
  }, []);

  const errorLoading = useCallback((error: Error) => {
    managerRef.current?.error(error);
  }, []);

  const setStage = useCallback((stageIndex: number) => {
    managerRef.current?.setStage(stageIndex);
  }, []);

  const retryLoading = useCallback(() => {
    managerRef.current?.retry();
  }, []);

  const stopLoading = useCallback(() => {
    managerRef.current?.stop();
  }, []);

  return {
    loadingState,
    startLoading,
    completeLoading,
    errorLoading,
    setStage,
    retryLoading,
    stopLoading
  };
};

/**
 * Network utilities for loading states
 */
export const networkUtils = {
  /**
   * Check if the user is online
   */
  isOnline: (): boolean => navigator.onLine,

  /**
   * Listen for online/offline changes
   */
  onNetworkChange: (callback: (isOnline: boolean) => void): () => void => {
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  },

  /**
   * Test network speed by attempting a small request
   */
  testNetworkSpeed: async (): Promise<'fast' | 'slow' | 'offline'> => {
    if (!navigator.onLine) {return 'offline';}

    try {
      const start = Date.now();
      await fetch('/favicon.ico?' + Date.now(), { 
        method: 'HEAD',
        cache: 'no-cache' 
      });
      const duration = Date.now() - start;

      return duration < 1000 ? 'fast' : 'slow';
    } catch {
      return 'offline';
    }
  }
};

/**
 * Timeout utilities
 */
export const timeoutUtils = {
  /**
   * Create a promise that rejects after a timeout
   */
  withTimeout: <T>(
    promise: Promise<T>, 
    timeoutMs: number, 
    timeoutMessage = 'Operation timed out'
  ): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
      )
    ]);
  },

  /**
   * Retry a function with exponential backoff
   */
  retryWithBackoff: async <T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000
  ): Promise<T> => {
    let lastError: Error;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (i === maxRetries - 1) {
          throw lastError;
        }

        // Exponential backoff: 1s, 2s, 4s, etc.
        const delay = baseDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }
};