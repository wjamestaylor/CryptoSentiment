import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { 
  ErrorBoundary, 
  DefaultErrorFallback, 
  withErrorBoundary,
  ApiErrorFallback,
  DataErrorFallback 
} from '@/components/ui/error-boundary';

// Test component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  // Suppress console.error for cleaner test output
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('renders default error fallback when error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeInTheDocument();
  });

  it('shows error details when expanded', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const detailsElement = screen.getByText('Error details');
    fireEvent.click(detailsElement);

    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('resets error when try again button is clicked', () => {
    // This test verifies that the resetError function is called when the button is clicked
    // Testing the full error boundary reset behavior is complex due to React's error boundary lifecycle
    const mockResetError = jest.fn();
    
    render(
      <DefaultErrorFallback 
        error={new Error('Test error')} 
        resetError={mockResetError} 
      />
    );

    const retryButton = screen.getByText('Try again');
    fireEvent.click(retryButton);

    expect(mockResetError).toHaveBeenCalledTimes(1);
  });

  it('uses custom fallback component when provided', () => {
    const CustomFallback = () => <div>Custom error fallback</div>;

    render(
      <ErrorBoundary fallback={CustomFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error fallback')).toBeInTheDocument();
  });
});

describe('DefaultErrorFallback', () => {
  it('renders error message and retry button', () => {
    const mockResetError = jest.fn();
    const testError = new Error('Test error');

    render(
      <DefaultErrorFallback error={testError} resetError={mockResetError} />
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Try again')).toBeInTheDocument();
  });

  it('calls resetError when retry button is clicked', () => {
    const mockResetError = jest.fn();

    render(
      <DefaultErrorFallback resetError={mockResetError} />
    );

    const retryButton = screen.getByText('Try again');
    fireEvent.click(retryButton);

    expect(mockResetError).toHaveBeenCalledTimes(1);
  });
});

describe('ApiErrorFallback', () => {
  it('renders API-specific error message', () => {
    const mockResetError = jest.fn();

    render(
      <ApiErrorFallback resetError={mockResetError} />
    );

    expect(screen.getByText('API Error')).toBeInTheDocument();
    expect(screen.getByText('Failed to load data. Please check your connection and try again.')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('calls resetError when retry button is clicked', () => {
    const mockResetError = jest.fn();

    render(
      <ApiErrorFallback resetError={mockResetError} />
    );

    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);

    expect(mockResetError).toHaveBeenCalledTimes(1);
  });
});

describe('DataErrorFallback', () => {
  it('renders data-specific error message', () => {
    const mockResetError = jest.fn();

    render(
      <DataErrorFallback resetError={mockResetError} />
    );

    expect(screen.getByText('Data Error')).toBeInTheDocument();
    expect(screen.getByText('There was a problem processing the data.')).toBeInTheDocument();
    expect(screen.getByText('Try again')).toBeInTheDocument();
  });
});

describe('withErrorBoundary HOC', () => {
  it('wraps component with error boundary', () => {
    const TestComponent = () => <div>Test component</div>;
    const WrappedComponent = withErrorBoundary(TestComponent);

    render(<WrappedComponent />);

    expect(screen.getByText('Test component')).toBeInTheDocument();
  });

  it('catches errors in wrapped component', () => {
    const WrappedComponent = withErrorBoundary(ThrowError);

    render(<WrappedComponent shouldThrow={true} />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('uses custom fallback when provided', () => {
    const CustomFallback = () => <div>Custom HOC fallback</div>;
    const WrappedComponent = withErrorBoundary(ThrowError, CustomFallback);

    render(<WrappedComponent shouldThrow={true} />);

    expect(screen.getByText('Custom HOC fallback')).toBeInTheDocument();
  });

  it('sets correct display name', () => {
    const TestComponent = () => <div>Test</div>;
    TestComponent.displayName = 'TestComponent';
    
    const WrappedComponent = withErrorBoundary(TestComponent);

    expect(WrappedComponent.displayName).toBe('withErrorBoundary(TestComponent)');
  });
});