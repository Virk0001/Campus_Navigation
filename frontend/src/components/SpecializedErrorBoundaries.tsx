import React from 'react';
import ErrorBoundary from './ErrorBoundary';

/**
 * Props for RouteErrorBoundary component
 */
interface RouteErrorBoundaryProps {
  children: React.ReactNode;
  routeName?: string;
}

/**
 * Specialized Error Boundary for route-level error handling
 * @description Provides route-specific error handling with navigation options
 */
export const RouteErrorBoundary: React.FC<RouteErrorBoundaryProps> = ({ 
  children, 
  routeName = 'this page' 
}) => {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error(`Route error in ${routeName}:`, error, errorInfo);
    
    // Send route-specific error information
    // analytics.track('route_error', { routeName, error: error.message });
  };

  const fallback = (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 bg-white shadow-lg rounded-lg max-w-lg mx-4">
        <div className="text-yellow-600 text-4xl mb-4">🚧</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Page Unavailable
        </h1>
        <p className="text-gray-600 mb-6">
          Sorry, we're having trouble loading {routeName}. This is likely a temporary issue.
        </p>
        
        <div className="flex gap-4 justify-center">
          <button 
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Go Back
          </button>
          
          <button 
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <ErrorBoundary 
      componentName={`Route: ${routeName}`}
      onError={handleError}
      fallback={fallback}
    >
      {children}
    </ErrorBoundary>
  );
};

/**
 * Props for AsyncErrorBoundary component
 */
interface AsyncErrorBoundaryProps {
  children: React.ReactNode;
  onRetry?: () => void;
  isLoading?: boolean;
}

/**
 * Error Boundary for async operations with retry functionality
 * @description Handles errors from async operations like API calls
 */
export const AsyncErrorBoundary: React.FC<AsyncErrorBoundaryProps> = ({ 
  children, 
  onRetry,
  isLoading = false
}) => {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error('Async operation error:', error, errorInfo);
    
    // Track async errors
    // analytics.track('async_error', { error: error.message });
  };

  const fallback = (
    <div className="flex items-center justify-center p-8">
      <div className="text-center bg-white shadow rounded-lg p-6 max-w-md">
        <div className="text-orange-600 text-3xl mb-4">⚡</div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Connection Problem
        </h2>
        <p className="text-gray-600 mb-4">
          We couldn't load the latest data. Please check your connection and try again.
        </p>
        
        {onRetry && (
          <button 
            onClick={onRetry}
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            {isLoading ? 'Loading...' : 'Retry'}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <ErrorBoundary 
      componentName="Async Operation"
      onError={handleError}
      fallback={fallback}
    >
      {children}
    </ErrorBoundary>
  );
};

export default ErrorBoundary;
