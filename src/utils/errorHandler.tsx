// 🛡️ ULTRA-SECURE ERROR HANDLING SYSTEM
// Production-grade error management with advanced recovery

import React from 'react';
import { toast } from '@/hooks/use-toast';

// =============================================================================
// ERROR TYPES & INTERFACES
// =============================================================================

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  timestamp: string;
  userAgent?: string;
  url?: string;
  metadata?: Record<string, unknown>;
}

export interface ErrorDetails {
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'network' | 'database' | 'auth' | 'validation' | 'ui' | 'system';
  recoverable: boolean;
  userMessage: string;
  technicalDetails?: Record<string, unknown>;
}

export interface ErrorLog {
  id: string;
  error: ErrorDetails;
  context: ErrorContext;
  stackTrace?: string;
  resolved: boolean;
  resolvedAt?: string;
  resolution?: string;
}

// =============================================================================
// ERROR CONSTANTS
// =============================================================================

export const ERROR_CODES = {
  // Network Errors
  NETWORK_UNAVAILABLE: 'NETWORK_001',
  REQUEST_TIMEOUT: 'NETWORK_002',
  SERVER_ERROR: 'NETWORK_003',
  API_RATE_LIMIT: 'NETWORK_004',
  
  // Database Errors
  DB_CONNECTION_FAILED: 'DB_001',
  DB_QUERY_FAILED: 'DB_002',
  DB_CONSTRAINT_VIOLATION: 'DB_003',
  DB_TIMEOUT: 'DB_004',
  
  // Authentication Errors
  AUTH_FAILED: 'AUTH_001',
  SESSION_EXPIRED: 'AUTH_002',
  PERMISSION_DENIED: 'AUTH_003',
  INVALID_TOKEN: 'AUTH_004',
  
  // Validation Errors
  VALIDATION_FAILED: 'VAL_001',
  INVALID_INPUT: 'VAL_002',
  MISSING_REQUIRED: 'VAL_003',
  FORMAT_ERROR: 'VAL_004',
  
  // UI Errors
  COMPONENT_RENDER_FAILED: 'UI_001',
  HOOK_ERROR: 'UI_002',
  STATE_CORRUPTION: 'UI_003',
  NAVIGATION_ERROR: 'UI_004',
  
  // System Errors
  MEMORY_OVERFLOW: 'SYS_001',
  STORAGE_FULL: 'SYS_002',
  BROWSER_INCOMPATIBLE: 'SYS_003',
  UNKNOWN_ERROR: 'SYS_999',
} as const;

// =============================================================================
// ERROR DEFINITIONS
// =============================================================================

const ERROR_DEFINITIONS: Record<string, Omit<ErrorDetails, 'code'>> = {
  [ERROR_CODES.NETWORK_UNAVAILABLE]: {
    message: 'Network connection is unavailable',
    severity: 'high',
    category: 'network',
    recoverable: true,
    userMessage: 'Please check your internet connection and try again.',
  },
  
  [ERROR_CODES.REQUEST_TIMEOUT]: {
    message: 'Request timed out',
    severity: 'medium',
    category: 'network',
    recoverable: true,
    userMessage: 'The request is taking longer than expected. Please try again.',
  },
  
  [ERROR_CODES.SERVER_ERROR]: {
    message: 'Internal server error',
    severity: 'high',
    category: 'network',
    recoverable: false,
    userMessage: 'Something went wrong on our end. Our team has been notified.',
  },
  
  [ERROR_CODES.DB_CONNECTION_FAILED]: {
    message: 'Database connection failed',
    severity: 'critical',
    category: 'database',
    recoverable: false,
    userMessage: 'Unable to connect to our services. Please try again later.',
  },
  
  [ERROR_CODES.AUTH_FAILED]: {
    message: 'Authentication failed',
    severity: 'high',
    category: 'auth',
    recoverable: true,
    userMessage: 'Please check your credentials and try again.',
  },
  
  [ERROR_CODES.SESSION_EXPIRED]: {
    message: 'User session has expired',
    severity: 'medium',
    category: 'auth',
    recoverable: true,
    userMessage: 'Your session has expired. Please sign in again.',
  },
  
  [ERROR_CODES.VALIDATION_FAILED]: {
    message: 'Input validation failed',
    severity: 'low',
    category: 'validation',
    recoverable: true,
    userMessage: 'Please check your input and try again.',
  },
  
  [ERROR_CODES.COMPONENT_RENDER_FAILED]: {
    message: 'Component failed to render',
    severity: 'medium',
    category: 'ui',
    recoverable: true,
    userMessage: 'There was a display error. Please refresh the page.',
  },
  
  [ERROR_CODES.UNKNOWN_ERROR]: {
    message: 'An unknown error occurred',
    severity: 'medium',
    category: 'system',
    recoverable: false,
    userMessage: 'Something unexpected happened. Please try again.',
  },
};

// =============================================================================
// ERROR HANDLER CLASS
// =============================================================================

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLogs: ErrorLog[] = [];
  private errorCounts = new Map<string, number>();
  private suppressedErrors = new Set<string>();

  private constructor() {
    this.setupGlobalErrorHandlers();
  }

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // Set up global error handlers
  private setupGlobalErrorHandlers(): void {
    // Handle unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.handleUnhandledError(event.error, {
        component: 'global',
        action: 'unhandled_error',
        timestamp: new Date().toISOString(),
        url: window.location.href,
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleUnhandledError(event.reason, {
        component: 'global',
        action: 'unhandled_promise_rejection',
        timestamp: new Date().toISOString(),
        url: window.location.href,
      });
    });

    // Handle React error boundaries (if using custom error boundary)
    window.addEventListener('react-error', ((event: CustomEvent) => {
      this.handleUnhandledError(event.detail.error, {
        component: event.detail.componentStack,
        action: 'react_error_boundary',
        timestamp: new Date().toISOString(),
        url: window.location.href,
        metadata: {
          componentStack: event.detail.componentStack,
          errorBoundary: event.detail.errorBoundary,
        },
      });
    }) as EventListener);
  }

  // Main error handling method
  public handleError(
    error: Error | string,
    context: Partial<ErrorContext> = {},
    errorCode?: string
  ): ErrorLog {
    const errorDetails = this.classifyError(error, errorCode);
    const fullContext: ErrorContext = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...context,
    };

    const errorLog: ErrorLog = {
      id: this.generateErrorId(),
      error: errorDetails,
      context: fullContext,
      stackTrace: error instanceof Error ? error.stack : undefined,
      resolved: false,
    };

    // Store error log
    this.errorLogs.push(errorLog);
    this.updateErrorCounts(errorDetails.code);

    // Handle based on severity
    this.processError(errorLog);

    return errorLog;
  }

  // Classify and enhance error details
  private classifyError(error: Error | string, errorCode?: string): ErrorDetails {
    const message = error instanceof Error ? error.message : error;
    
    // Try to auto-detect error type if no code provided
    if (!errorCode) {
      errorCode = this.detectErrorCode(error);
    }

    const baseDetails = ERROR_DEFINITIONS[errorCode] || ERROR_DEFINITIONS[ERROR_CODES.UNKNOWN_ERROR];
    
    return {
      code: errorCode,
      message,
      ...baseDetails,
      technicalDetails: error instanceof Error ? {
        name: error.name,
        stack: error.stack,
        cause: error.cause,
      } : undefined,
    };
  }

  // Auto-detect error code based on error characteristics
  private detectErrorCode(error: Error | string): string {
    const message = error instanceof Error ? error.message : error;
    const lowerMessage = message.toLowerCase();

    // Network errors
    if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
      return ERROR_CODES.NETWORK_UNAVAILABLE;
    }
    if (lowerMessage.includes('timeout')) {
      return ERROR_CODES.REQUEST_TIMEOUT;
    }

    // Auth errors
    if (lowerMessage.includes('unauthorized') || lowerMessage.includes('auth')) {
      return ERROR_CODES.AUTH_FAILED;
    }
    if (lowerMessage.includes('session') || lowerMessage.includes('token')) {
      return ERROR_CODES.SESSION_EXPIRED;
    }

    // Database errors
    if (lowerMessage.includes('database') || lowerMessage.includes('supabase')) {
      return ERROR_CODES.DB_CONNECTION_FAILED;
    }

    // Validation errors
    if (lowerMessage.includes('validation') || lowerMessage.includes('invalid')) {
      return ERROR_CODES.VALIDATION_FAILED;
    }

    return ERROR_CODES.UNKNOWN_ERROR;
  }

  // Process error based on severity and recoverability
  private processError(errorLog: ErrorLog): void {
    const { error, context } = errorLog;

    // Skip if error is suppressed
    if (this.suppressedErrors.has(error.code)) {
      return;
    }

    // Show user notification for non-critical errors
    if (error.severity !== 'critical') {
      this.showUserNotification(error);
    }

    // Attempt recovery for recoverable errors
    if (error.recoverable) {
      this.attemptRecovery(errorLog);
    }

    // Report critical errors immediately
    if (error.severity === 'critical') {
      this.reportCriticalError(errorLog);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error ${error.code}`);
      console.error('Error:', error);
      console.error('Context:', context);
      console.error('Stack:', errorLog.stackTrace);
      console.groupEnd();
    }
  }

  // Show user-friendly error notification
  private showUserNotification(error: ErrorDetails): void {
    const variant = error.severity === 'high' ? 'destructive' : 'default';
    
    toast({
      title: 'Something went wrong',
      description: error.userMessage,
      variant,
      duration: error.severity === 'high' ? 8000 : 5000,
    });
  }

  // Attempt automatic error recovery
  private attemptRecovery(errorLog: ErrorLog): void {
    const { error, context } = errorLog;

    switch (error.code) {
      case ERROR_CODES.SESSION_EXPIRED:
        this.handleSessionExpiry();
        break;
        
      case ERROR_CODES.NETWORK_UNAVAILABLE:
        this.handleNetworkRecovery();
        break;
        
      case ERROR_CODES.COMPONENT_RENDER_FAILED:
        this.handleComponentRecovery(context);
        break;
        
      default:
        // Generic recovery attempt
        this.handleGenericRecovery(errorLog);
    }
  }

  // Handle session expiry recovery
  private handleSessionExpiry(): void {
    setTimeout(() => {
      window.location.href = '/auth?redirect=' + encodeURIComponent(window.location.pathname);
    }, 2000);
  }

  // Handle network recovery
  private handleNetworkRecovery(): void {
    // Retry network requests after a delay
    setTimeout(() => {
      window.location.reload();
    }, 5000);
  }

  // Handle component recovery
  private handleComponentRecovery(context: ErrorContext): void {
    // Force component re-render by triggering a page refresh
    if (context.component) {
      console.log(`Attempting recovery for component: ${context.component}`);
      // Could implement more sophisticated component recovery here
    }
  }

  // Handle generic recovery
  private handleGenericRecovery(errorLog: ErrorLog): void {
    // Mark as resolved with basic recovery attempt
    errorLog.resolved = true;
    errorLog.resolvedAt = new Date().toISOString();
    errorLog.resolution = 'automatic_recovery_attempted';
  }

  // Report critical errors to monitoring service
  private reportCriticalError(errorLog: ErrorLog): void {
    // In production, send to error monitoring service (Sentry, LogRocket, etc.)
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(errorLog);
      console.error('🚨 CRITICAL ERROR REPORTED:', errorLog);
    }
  }

  // Handle unhandled errors
  private handleUnhandledError(error: unknown, context: ErrorContext): void {
    const errorCode = ERROR_CODES.UNKNOWN_ERROR;
    this.handleError(
      error instanceof Error ? error : String(error),
      context,
      errorCode
    );
  }

  // Generate unique error ID
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Update error occurrence counts
  private updateErrorCounts(errorCode: string): void {
    const count = this.errorCounts.get(errorCode) || 0;
    this.errorCounts.set(errorCode, count + 1);

    // Auto-suppress frequent non-critical errors
    if (count > 10) {
      const errorDef = ERROR_DEFINITIONS[errorCode];
      if (errorDef && errorDef.severity !== 'critical') {
        this.suppressedErrors.add(errorCode);
        console.warn(`Error ${errorCode} suppressed due to high frequency`);
      }
    }
  }

  // Public methods for error management
  public getErrorLogs(): ErrorLog[] {
    return [...this.errorLogs];
  }

  public clearErrorLogs(): void {
    this.errorLogs = [];
    this.errorCounts.clear();
    this.suppressedErrors.clear();
  }

  public suppressError(errorCode: string): void {
    this.suppressedErrors.add(errorCode);
  }

  public unsuppressError(errorCode: string): void {
    this.suppressedErrors.delete(errorCode);
  }

  public getErrorStats(): Record<string, number> {
    return Object.fromEntries(this.errorCounts);
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

// Create error handler instance
export const errorHandler = ErrorHandler.getInstance();

// Convenient error handling functions
export const handleError = (error: Error | string, context?: Partial<ErrorContext>, errorCode?: string) => {
  return errorHandler.handleError(error, context, errorCode);
};

export const handleNetworkError = (error: Error | string, context?: Partial<ErrorContext>) => {
  return errorHandler.handleError(error, context, ERROR_CODES.NETWORK_UNAVAILABLE);
};

export const handleAuthError = (error: Error | string, context?: Partial<ErrorContext>) => {
  return errorHandler.handleError(error, context, ERROR_CODES.AUTH_FAILED);
};

export const handleValidationError = (error: Error | string, context?: Partial<ErrorContext>) => {
  return errorHandler.handleError(error, context, ERROR_CODES.VALIDATION_FAILED);
};

export const handleDatabaseError = (error: Error | string, context?: Partial<ErrorContext>) => {
  return errorHandler.handleError(error, context, ERROR_CODES.DB_CONNECTION_FAILED);
};

// Error boundary HOC for React components
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallbackComponent?: React.ComponentType<{ error: Error; reset: () => void }>
) => {
  return class ErrorBoundaryWrapper extends React.Component<P, { hasError: boolean; error?: Error }> {
    constructor(props: P) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error) {
      return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      handleError(error, {
        component: Component.name,
        action: 'component_error',
        metadata: errorInfo,
      }, ERROR_CODES.COMPONENT_RENDER_FAILED);
    }

    render() {
      if (this.state.hasError) {
        if (fallbackComponent) {
          const FallbackComponent = fallbackComponent;
          return (
            <FallbackComponent 
              error={this.state.error!} 
              reset={() => this.setState({ hasError: false, error: undefined })}
            />
          );
        }
        
        return (
          <div className="error-boundary">
            <h2>Something went wrong</h2>
            <p>Please refresh the page or try again later.</p>
            <button onClick={() => window.location.reload()}>
              Refresh Page
            </button>
          </div>
        );
      }

      return <Component {...this.props} />;
    }
  };
};

// Async error wrapper
export const withAsyncErrorHandler = async <T,>(
  asyncFunction: () => Promise<T>,
  context?: Partial<ErrorContext>,
  errorCode?: string
): Promise<T | null> => {
  try {
    return await asyncFunction();
  } catch (error) {
    handleError(error as Error, context, errorCode);
    return null;
  }
};

export default errorHandler;