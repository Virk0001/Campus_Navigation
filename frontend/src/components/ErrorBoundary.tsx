import React from 'react';

/**
 * Props for ErrorBoundary component
 */
interface ErrorBoundaryProps {
  /** Child components to render when no error occurs */
  children: React.ReactNode;
  /** Optional custom fallback UI to render when error occurs */
  fallback?: React.ReactNode;
  /** Optional callback function called when error occurs */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Optional error message override */
  errorMessage?: string;
  /** Optional component name for better error identification */
  componentName?: string;
}

/**
 * State for ErrorBoundary component
 */
interface ErrorBoundaryState {
  /** Whether an error has occurred */
  hasError: boolean;
  /** The error object if one occurred */
  error?: Error;
  /** Additional error information from React */
  errorInfo?: React.ErrorInfo;
  /** Error ID for tracking */
  errorId?: string;
}

/**
 * Enhanced Error Boundary component that catches JavaScript errors in React component tree
 * @class ErrorBoundary
 * @extends React.Component
 * @description Provides comprehensive error handling with logging, user feedback, and recovery options
 * 
 * @example
 * ```tsx
 * <ErrorBoundary 
 *   componentName="Dashboard"
 *   onError={(error, errorInfo) => logError(error, errorInfo)}
 * >
 *   <DashboardComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
    this.handleRetry = this.handleRetry.bind(this);
  }

  /**
   * React lifecycle method called when an error occurs during rendering
   * @param error - The error that was thrown
   * @returns New state object with error information
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return { 
      hasError: true, 
      error,
      errorId
    };
  }

  /**
   * React lifecycle method called after an error is caught
   * @param error - The error that was thrown
   * @param errorInfo - Additional information about the error
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Update state with error info
    this.setState({ errorInfo });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error details in development
    if (import.meta.env.DEV) {
      console.group('🚨 ErrorBoundary caught error');
      console.error('Component:', this.props.componentName || 'Unknown');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Stack Trace:', error.stack);
      console.groupEnd();
    }

    // In production, send error to monitoring service
    if (import.meta.env.PROD) {
      this.reportError(error, errorInfo);
    }
  }

  /**
   * Reports error to external monitoring service
   * @private
   * @param error - The error that occurred
   * @param errorInfo - Additional error information
   */
  private reportError(error: Error, errorInfo: React.ErrorInfo) {
    try {
      // This would typically send to a service like Sentry, LogRocket, etc.
      const errorReport = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        componentName: this.props.componentName,
        errorId: this.state.errorId,
      };

      // Example: Send to monitoring service
      // monitoringService.captureException(errorReport);
      
      console.info('Error reported:', errorReport);
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
    }
  }

  /**
   * Handles retry button click to attempt recovery
   * @private
   */
  private handleRetry() {
    // Clear any existing timeout
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }

    // Reset error state
    this.setState({ hasError: false, error: undefined, errorInfo: undefined, errorId: undefined });

    // Optional: Add small delay to prevent rapid retry attempts
    this.retryTimeoutId = setTimeout(() => {
      // Force re-render of children
      this.forceUpdate();
    }, 100);
  }

  /**
   * Cleanup method to clear timeouts
   */
  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  /**
   * Renders either the children or error fallback UI
   */
  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50" role="alert">
          <div className="text-center p-8 bg-white shadow-lg rounded-lg max-w-md mx-4">
            <div className="text-red-600 text-4xl mb-4" aria-hidden="true">⚠️</div>
            
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Something went wrong
            </h1>
            
            <p className="text-gray-600 mb-4">
              {this.props.errorMessage || 
               "We encountered an unexpected error. Don't worry, your data is safe."}
            </p>

            {/* Error details in development */}
            {import.meta.env.DEV && this.state.error && (
              <details className="text-left mb-4 text-xs">
                <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                  Show Error Details
                </summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-red-600 overflow-auto max-h-32">
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
                {this.state.errorInfo && (
                  <pre className="mt-2 p-2 bg-gray-100 rounded text-orange-600 overflow-auto max-h-32">
                    Component Stack:
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </details>
            )}

            {/* Error ID for support */}
            {this.state.errorId && (
              <p className="text-xs text-gray-400 mb-4">
                Error ID: {this.state.errorId}
              </p>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 justify-center">
              <button 
                onClick={this.handleRetry}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Try again"
              >
                Try Again
              </button>
              
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                aria-label="Refresh the page"
              >
                Refresh Page
              </button>
            </div>

            {/* Help text */}
            <p className="text-xs text-gray-500 mt-4">
              If the problem persists, please contact support with the error ID above.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
