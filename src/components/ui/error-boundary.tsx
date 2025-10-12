'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
}

interface ErrorFallbackProps {
  error?: Error;
  resetError: () => void;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return (
        <FallbackComponent
          error={this.state.error}
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

export function DefaultErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="min-h-[300px] sm:min-h-[400px] flex items-center justify-center p-4 sm:p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-red-900 dark:text-red-100 text-lg sm:text-xl">
            Something went wrong
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            An unexpected error occurred. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <details className="text-xs sm:text-sm">
              <summary className="cursor-pointer font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
                Error details
              </summary>
              <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-400 text-xs font-mono break-all">
                {error.message}
              </div>
            </details>
          )}
          <Button onClick={resetError} className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<ErrorFallbackProps>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Specific error fallbacks for different contexts
export function ApiErrorFallback({ resetError }: Pick<ErrorFallbackProps, 'resetError'>) {
  return (
    <div className="text-center p-4 sm:p-6">
      <AlertTriangle className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-yellow-500 mb-4" />
      <h3 className="text-base sm:text-lg font-semibold mb-2">API Error</h3>
      <p className="text-muted-foreground mb-4 text-sm sm:text-base">
        Failed to load data. Please check your connection and try again.
      </p>
      <Button onClick={resetError} variant="outline" className="w-full sm:w-auto">
        <RefreshCw className="mr-2 h-4 w-4" />
        Retry
      </Button>
    </div>
  );
}

export function DataErrorFallback({ resetError }: Pick<ErrorFallbackProps, 'resetError'>) {
  return (
    <div className="text-center p-4 sm:p-6">
      <AlertTriangle className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-red-500 mb-4" />
      <h3 className="text-base sm:text-lg font-semibold mb-2">Data Error</h3>
      <p className="text-muted-foreground mb-4 text-sm sm:text-base">
        There was a problem processing the data.
      </p>
      <Button onClick={resetError} variant="outline" className="w-full sm:w-auto">
        <RefreshCw className="mr-2 h-4 w-4" />
        Try again
      </Button>
    </div>
  );
}

// Network-specific error fallback
export function NetworkErrorFallback({ resetError }: Pick<ErrorFallbackProps, 'resetError'>) {
  return (
    <div className="text-center p-4 sm:p-6">
      <AlertTriangle className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-orange-500 mb-4" />
      <h3 className="text-base sm:text-lg font-semibold mb-2">Connection Error</h3>
      <p className="text-muted-foreground mb-4 text-sm sm:text-base">
        Unable to connect to the server. Please check your internet connection.
      </p>
      <Button onClick={resetError} variant="outline" className="w-full sm:w-auto">
        <RefreshCw className="mr-2 h-4 w-4" />
        Reconnect
      </Button>
    </div>
  );
}

// Authentication error fallback
export function AuthErrorFallback({ resetError }: Pick<ErrorFallbackProps, 'resetError'>) {
  return (
    <div className="text-center p-4 sm:p-6">
      <AlertTriangle className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-purple-500 mb-4" />
      <h3 className="text-base sm:text-lg font-semibold mb-2">Authentication Error</h3>
      <p className="text-muted-foreground mb-4 text-sm sm:text-base">
        Your session has expired. Please sign in again.
      </p>
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center">
        <Button onClick={resetError} variant="outline" className="w-full sm:w-auto">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try again
        </Button>
        <Button 
          onClick={() => window.location.href = '/auth/signin'} 
          className="w-full sm:w-auto"
        >
          Sign In
        </Button>
      </div>
    </div>
  );
}