import { toast } from '@/hooks/use-toast';

/**
 * Standardized Error Handling Service
 * Provides consistent error handling, user-friendly messages, and retry logic across the platform
 */

export type ErrorType = 
  | 'network_error'
  | 'validation_error'
  | 'authentication_error'
  | 'rate_limit_error'
  | 'timeout_error'
  | 'unknown_error';

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ErrorContext {
  service: string;
  operation: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface ErrorDetails {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  suggestedActions: string[];
  retryable: boolean;
  context: ErrorContext;
  timestamp: string;
  originalError?: Error;
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
  retryableErrors: ErrorType[];
}

export class ErrorHandlingService {
  private static readonly defaultRetryConfig: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    retryableErrors: ['network_error', 'timeout_error', 'rate_limit_error']
  };

  private static errorLog: ErrorDetails[] = [];

  /**
   * Handle and classify errors with user-friendly messaging
   */
  static handleError(
    error: Error | string,
    context: ErrorContext,
    showToast = true
  ): ErrorDetails {
    const errorDetails = this.classifyError(error, context);
    
    // Log error for debugging
    this.logError(errorDetails);
    
    // Show user-friendly toast notification
    if (showToast) {
      this.showErrorToast(errorDetails);
    }
    
    return errorDetails;
  }

  /**
   * Execute operation with automatic retry logic
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    retryConfig?: Partial<RetryConfig>
  ): Promise<T> {
    const config = { ...this.defaultRetryConfig, ...retryConfig };
    let lastError: ErrorDetails | null = null;
    
    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = this.classifyError(error, {
          ...context,
          metadata: { ...context.metadata, attempt }
        });
        
        // Check if error is retryable
        if (!config.retryableErrors.includes(lastError.type)) {
          console.warn(`Non-retryable error encountered in ${context.service}.${context.operation}:`, lastError);
          throw error;
        }
        
        // If this is the last attempt, throw the error
        if (attempt === config.maxAttempts) {
          console.error(`All retry attempts failed for ${context.service}.${context.operation}:`, lastError);
          throw error;
        }
        
        // Calculate delay with exponential backoff
        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1),
          config.maxDelay
        );
        
        console.warn(
          `Attempt ${attempt} failed for ${context.service}.${context.operation}, retrying in ${delay}ms:`,
          lastError.message
        );
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new Error('Retry loop completed without success or failure');
  }

  /**
   * Circuit breaker pattern for service protection
   */
  static createCircuitBreaker<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    options: {
      failureThreshold: number;
      resetTimeout: number;
      monitor: boolean;
    } = { failureThreshold: 5, resetTimeout: 60000, monitor: true }
  ) {
    let failures = 0;
    let lastFailureTime = 0;
    let state: 'closed' | 'open' | 'half-open' = 'closed';

    return async (): Promise<T> => {
      const now = Date.now();

      // Reset circuit breaker if enough time has passed
      if (state === 'open' && now - lastFailureTime >= options.resetTimeout) {
        state = 'half-open';
        failures = 0;
      }

      // Reject immediately if circuit is open
      if (state === 'open') {
        const error = new Error(`Circuit breaker is open for ${context.service}.${context.operation}`);
        throw this.handleError(error, context, false);
      }

      try {
        const result = await operation();
        
        // Reset failures on success
        if (state === 'half-open') {
          state = 'closed';
        }
        failures = 0;
        
        return result;
      } catch (error) {
        failures++;
        lastFailureTime = now;
        
        // Open circuit if failure threshold is reached
        if (failures >= options.failureThreshold) {
          state = 'open';
          console.warn(`Circuit breaker opened for ${context.service}.${context.operation} after ${failures} failures`);
        }
        
        throw error;
      }
    };
  }

  /**
   * Classify error type and create structured error details
   */
  private static classifyError(error: Error | string, context: ErrorContext): ErrorDetails {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const timestamp = new Date().toISOString();

    // Network errors
    if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('connection')) {
      return {
        type: 'network_error',
        severity: 'medium',
        message: errorMessage,
        userMessage: 'Network connection issue. Please check your internet connection.',
        suggestedActions: [
          'Check your internet connection',
          'Try again in a few moments',
          'Contact support if the issue persists'
        ],
        retryable: true,
        context,
        timestamp,
        originalError: typeof error === 'object' ? error : undefined
      };
    }

    // Authentication errors
    if (errorMessage.includes('auth') || errorMessage.includes('unauthorized') || errorMessage.includes('permission')) {
      return {
        type: 'authentication_error',
        severity: 'high',
        message: errorMessage,
        userMessage: 'Authentication required. Please sign in to continue.',
        suggestedActions: [
          'Sign in to your account',
          'Check your permissions',
          'Contact support if you believe this is an error'
        ],
        retryable: false,
        context,
        timestamp,
        originalError: typeof error === 'object' ? error : undefined
      };
    }

    // Rate limit errors
    if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
      return {
        type: 'rate_limit_error',
        severity: 'medium',
        message: errorMessage,
        userMessage: 'Too many requests. Please wait a moment before trying again.',
        suggestedActions: [
          'Wait a few minutes before retrying',
          'Reduce the frequency of your requests'
        ],
        retryable: true,
        context,
        timestamp,
        originalError: typeof error === 'object' ? error : undefined
      };
    }

    // Timeout errors
    if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
      return {
        type: 'timeout_error',
        severity: 'medium',
        message: errorMessage,
        userMessage: 'Request timed out. The operation took longer than expected.',
        suggestedActions: [
          'Try again with a smaller request',
          'Check your internet connection',
          'Contact support if timeouts persist'
        ],
        retryable: true,
        context,
        timestamp,
        originalError: typeof error === 'object' ? error : undefined
      };
    }

    // Validation errors
    if (errorMessage.includes('validation') || errorMessage.includes('invalid') || errorMessage.includes('required')) {
      return {
        type: 'validation_error',
        severity: 'low',
        message: errorMessage,
        userMessage: 'Please check your input and try again.',
        suggestedActions: [
          'Review the form for any missing or invalid fields',
          'Ensure all required fields are filled out',
          'Check that your input matches the expected format'
        ],
        retryable: false,
        context,
        timestamp,
        originalError: typeof error === 'object' ? error : undefined
      };
    }

    // Unknown errors
    return {
      type: 'unknown_error',
      severity: 'medium',
      message: errorMessage,
      userMessage: 'An unexpected error occurred. Please try again.',
      suggestedActions: [
        'Try the operation again',
        'Refresh the page if the issue persists',
        'Contact support with details about what you were doing'
      ],
      retryable: true,
      context,
      timestamp,
      originalError: typeof error === 'object' ? error : undefined
    };
  }

  /**
   * Log error details for debugging and monitoring
   */
  private static logError(errorDetails: ErrorDetails): void {
    // Add to in-memory log (limited to prevent memory leaks)
    this.errorLog.unshift(errorDetails);
    if (this.errorLog.length > 100) {
      this.errorLog = this.errorLog.slice(0, 100);
    }

    // Console logging based on severity
    const logMessage = `[${errorDetails.severity.toUpperCase()}] ${errorDetails.context.service}.${errorDetails.context.operation}: ${errorDetails.message}`;
    
    switch (errorDetails.severity) {
      case 'low':
        console.info(logMessage, errorDetails);
        break;
      case 'medium':
        console.warn(logMessage, errorDetails);
        break;
      case 'high':
      case 'critical':
        console.error(logMessage, errorDetails);
        break;
    }
  }

  /**
   * Show user-friendly error toast
   */
  private static showErrorToast(errorDetails: ErrorDetails): void {
    const variant = errorDetails.severity === 'critical' || errorDetails.severity === 'high' 
      ? 'destructive' 
      : 'default';

    toast({
      title: 'Error',
      description: errorDetails.userMessage,
      variant,
      duration: errorDetails.severity === 'low' ? 3000 : 5000
    });
  }

  /**
   * Get recent error logs for debugging
   */
  static getRecentErrors(limit = 20): ErrorDetails[] {
    return this.errorLog.slice(0, limit);
  }

  /**
   * Clear error logs
   */
  static clearErrorLogs(): void {
    this.errorLog = [];
  }

  /**
   * Get error statistics
   */
  static getErrorStats(): Record<ErrorType, number> {
    const stats: Record<ErrorType, number> = {
      network_error: 0,
      validation_error: 0,
      authentication_error: 0,
      rate_limit_error: 0,
      timeout_error: 0,
      unknown_error: 0
    };

    this.errorLog.forEach(error => {
      stats[error.type]++;
    });

    return stats;
  }
}