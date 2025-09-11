import { toast } from 'sonner';

export interface ErrorContext {
  userId?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
}

export interface ErrorResponse {
  message: string;
  userMessage: string;
  shouldRetry: boolean;
  requiresAuth: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class ErrorHandlingEnhancedService {
  private errorCounts = new Map<string, number>();
  private readonly MAX_RETRY_COUNT = 3;

  /**
   * Handle and classify errors with user-friendly responses
   */
  handleError(error: any, context: ErrorContext = {}): ErrorResponse {
    const errorKey = `${context.component}-${context.action}`;
    const count = this.errorCounts.get(errorKey) || 0;
    this.errorCounts.set(errorKey, count + 1);

    // Log error for debugging
    console.error('🚨 Error occurred:', {
      error,
      context,
      count: count + 1,
      timestamp: new Date().toISOString()
    });

    // Classify error type
    if (this.isAuthError(error)) {
      return this.handleAuthError(error, context);
    }

    if (this.isNetworkError(error)) {
      return this.handleNetworkError(error, context, count);
    }

    if (this.isDatabaseError(error)) {
      return this.handleDatabaseError(error, context, count);
    }

    if (this.isValidationError(error)) {
      return this.handleValidationError(error, context);
    }

    // Default error handling
    return this.handleGenericError(error, context, count);
  }

  /**
   * Handle authentication errors
   */
  private handleAuthError(error: any, context: ErrorContext): ErrorResponse {
    const errorMessage = error?.message || 'Authentication error';
    
    if (errorMessage.includes('session')) {
      return {
        message: 'Session expired',
        userMessage: 'Your session has expired. Please sign in again.',
        shouldRetry: false,
        requiresAuth: true,
        severity: 'medium'
      };
    }

    if (errorMessage.includes('credentials') || errorMessage.includes('password')) {
      return {
        message: 'Invalid credentials',
        userMessage: 'Invalid email or password. Please check your credentials.',
        shouldRetry: false,
        requiresAuth: false,
        severity: 'low'
      };
    }

    return {
      message: errorMessage,
      userMessage: 'Authentication failed. Please try signing in again.',
      shouldRetry: false,
      requiresAuth: true,
      severity: 'medium'
    };
  }

  /**
   * Handle network-related errors
   */
  private handleNetworkError(error: any, context: ErrorContext, retryCount: number): ErrorResponse {
    const isTimeout = error?.message?.includes('timeout') || error?.code === 'ECONNABORTED';
    const shouldRetry = retryCount < this.MAX_RETRY_COUNT;

    if (isTimeout) {
      return {
        message: 'Request timeout',
        userMessage: shouldRetry 
          ? 'Request is taking longer than expected. Retrying...' 
          : 'Request timed out. Please check your internet connection.',
        shouldRetry,
        requiresAuth: false,
        severity: shouldRetry ? 'low' : 'medium'
      };
    }

    if (!navigator.onLine) {
      return {
        message: 'No internet connection',
        userMessage: 'You appear to be offline. Please check your internet connection.',
        shouldRetry: false,
        requiresAuth: false,
        severity: 'high'
      };
    }

    return {
      message: 'Network error',
      userMessage: shouldRetry 
        ? 'Connection issue detected. Retrying...' 
        : 'Network error. Please try again later.',
      shouldRetry,
      requiresAuth: false,
      severity: 'medium'
    };
  }

  /**
   * Handle database-related errors
   */
  private handleDatabaseError(error: any, context: ErrorContext, retryCount: number): ErrorResponse {
    const errorCode = error?.code;
    const shouldRetry = retryCount < this.MAX_RETRY_COUNT && !this.isPermanentDBError(errorCode);

    // Table doesn't exist
    if (errorCode === '42P01') {
      return {
        message: 'Database table missing',
        userMessage: 'System is being set up. Please try again in a moment.',
        shouldRetry: false,
        requiresAuth: false,
        severity: 'critical'
      };
    }

    // Permission denied
    if (errorCode === '42501') {
      return {
        message: 'Database permission denied',
        userMessage: 'Access denied. Please contact support if this persists.',
        shouldRetry: false,
        requiresAuth: true,
        severity: 'high'
      };
    }

    // Connection error
    if (errorCode === 'PGRST301' || error?.message?.includes('connection')) {
      return {
        message: 'Database connection error',
        userMessage: shouldRetry 
          ? 'Database connection issue. Retrying...' 
          : 'Database temporarily unavailable. Please try again later.',
        shouldRetry,
        requiresAuth: false,
        severity: 'medium'
      };
    }

    return {
      message: 'Database error',
      userMessage: shouldRetry 
        ? 'Database operation failed. Retrying...' 
        : 'Database error occurred. Please try again later.',
      shouldRetry,
      requiresAuth: false,
      severity: 'medium'
    };
  }

  /**
   * Handle validation errors
   */
  private handleValidationError(error: any, context: ErrorContext): ErrorResponse {
    const message = error?.message || 'Validation failed';
    
    return {
      message,
      userMessage: `Please check your input: ${message}`,
      shouldRetry: false,
      requiresAuth: false,
      severity: 'low'
    };
  }

  /**
   * Handle generic errors
   */
  private handleGenericError(error: any, context: ErrorContext, retryCount: number): ErrorResponse {
    const message = error?.message || 'Unknown error occurred';
    const shouldRetry = retryCount < this.MAX_RETRY_COUNT && !this.isPermanentError(error);

    return {
      message,
      userMessage: shouldRetry 
        ? 'Something went wrong. Retrying...' 
        : 'Something went wrong. Please try again later.',
      shouldRetry,
      requiresAuth: false,
      severity: 'medium'
    };
  }

  /**
   * Show user-friendly error toast
   */
  showErrorToast(errorResponse: ErrorResponse, context: ErrorContext = {}): void {
    const title = this.getErrorTitle(errorResponse.severity);
    
    toast.error(title, {
      description: errorResponse.userMessage,
      duration: this.getToastDuration(errorResponse.severity),
      action: errorResponse.requiresAuth ? {
        label: 'Sign In',
        onClick: () => {
          window.location.href = '/auth';
        }
      } : undefined
    });
  }

  /**
   * Retry an operation with exponential backoff
   */
  async retryOperation<T>(
    operation: () => Promise<T>,
    context: ErrorContext = {},
    maxRetries = 3
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        
        // Clear error count on success
        const errorKey = `${context.component}-${context.action}`;
        this.errorCounts.delete(errorKey);
        
        return result;
      } catch (error) {
        lastError = error;
        
        const errorResponse = this.handleError(error, {
          ...context,
          metadata: { ...context.metadata, attempt }
        });
        
        if (!errorResponse.shouldRetry || attempt === maxRetries) {
          this.showErrorToast(errorResponse, context);
          throw error;
        }
        
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        console.log(`🔄 Retrying operation (${attempt}/${maxRetries}) after ${delay}ms`);
      }
    }
    
    throw lastError;
  }

  /**
   * Create a safe wrapper for async operations
   */
  createSafeOperation<T extends any[], R>(
    operation: (...args: T) => Promise<R>,
    context: ErrorContext = {}
  ) {
    return async (...args: T): Promise<R | null> => {
      try {
        return await this.retryOperation(() => operation(...args), context);
      } catch (error) {
        console.error(`Safe operation failed in ${context.component}:`, error);
        return null;
      }
    };
  }

  /**
   * Clear error counts for a specific context
   */
  clearErrorCounts(component?: string, action?: string): void {
    if (component && action) {
      this.errorCounts.delete(`${component}-${action}`);
    } else if (component) {
      // Clear all errors for a component
      Array.from(this.errorCounts.keys())
        .filter(key => key.startsWith(component))
        .forEach(key => this.errorCounts.delete(key));
    } else {
      // Clear all errors
      this.errorCounts.clear();
    }
  }

  /**
   * Get error statistics
   */
  getErrorStats(): Record<string, number> {
    return Object.fromEntries(this.errorCounts);
  }

  // Private utility methods
  private isAuthError(error: any): boolean {
    const message = error?.message?.toLowerCase() || '';
    const code = error?.code || '';
    
    return message.includes('auth') || 
           message.includes('unauthorized') || 
           message.includes('forbidden') ||
           message.includes('session') ||
           code === '401' ||
           code === '403';
  }

  private isNetworkError(error: any): boolean {
    const message = error?.message?.toLowerCase() || '';
    
    return message.includes('network') || 
           message.includes('timeout') ||
           message.includes('fetch') ||
           message.includes('connection') ||
           error?.code === 'ECONNABORTED' ||
           !navigator.onLine;
  }

  private isDatabaseError(error: any): boolean {
    const code = error?.code || '';
    
    return code.startsWith('42') || // PostgreSQL error codes
           code.startsWith('PGRST') || // PostgREST error codes
           error?.message?.includes('database') ||
           error?.message?.includes('relation') ||
           error?.message?.includes('column');
  }

  private isValidationError(error: any): boolean {
    const message = error?.message?.toLowerCase() || '';
    
    return message.includes('validation') ||
           message.includes('invalid') ||
           message.includes('required') ||
           message.includes('format');
  }

  private isPermanentDBError(code: string): boolean {
    // Errors that shouldn't be retried
    return ['42P01', '42501', '23505'].includes(code);
  }

  private isPermanentError(error: any): boolean {
    const code = error?.code || '';
    return this.isPermanentDBError(code) || 
           code === '404' || 
           code === '400';
  }

  private getErrorTitle(severity: 'low' | 'medium' | 'high' | 'critical'): string {
    switch (severity) {
      case 'critical': return 'System Error';
      case 'high': return 'Important Error';
      case 'medium': return 'Error';
      case 'low': return 'Notice';
      default: return 'Error';
    }
  }

  private getToastDuration(severity: 'low' | 'medium' | 'high' | 'critical'): number {
    switch (severity) {
      case 'critical': return 10000; // 10 seconds
      case 'high': return 7000; // 7 seconds
      case 'medium': return 5000; // 5 seconds
      case 'low': return 3000; // 3 seconds
      default: return 5000;
    }
  }
}

// Export singleton instance
export const errorHandlingEnhancedService = new ErrorHandlingEnhancedService();
export default errorHandlingEnhancedService;