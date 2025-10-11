import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthProvider } from '@/components/providers/auth-provider';

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="session-provider">{children}</div>
  ),
}));

describe('AuthProvider Component', () => {
  it('should render children within SessionProvider', () => {
    render(
      <AuthProvider>
        <div data-testid="test-child">Test Content</div>
      </AuthProvider>
    );

    expect(screen.getByTestId('session-provider')).toBeInTheDocument();
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should wrap multiple children', () => {
    render(
      <AuthProvider>
        <div data-testid="child-1">First Child</div>
        <div data-testid="child-2">Second Child</div>
        <span data-testid="child-3">Third Child</span>
      </AuthProvider>
    );

    expect(screen.getByTestId('session-provider')).toBeInTheDocument();
    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
    expect(screen.getByTestId('child-3')).toBeInTheDocument();
  });

  it('should render even with no children', () => {
    render(<AuthProvider>{null}</AuthProvider>);
    expect(screen.getByTestId('session-provider')).toBeInTheDocument();
  });

  it('should handle string children', () => {
    render(<AuthProvider>Plain text content</AuthProvider>);
    expect(screen.getByTestId('session-provider')).toBeInTheDocument();
    expect(screen.getByText('Plain text content')).toBeInTheDocument();
  });

  it('should handle nested components', () => {
    const NestedComponent = () => (
      <div data-testid="nested-component">
        <h1>Nested Title</h1>
        <p>Nested content</p>
      </div>
    );

    render(
      <AuthProvider>
        <NestedComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('session-provider')).toBeInTheDocument();
    expect(screen.getByTestId('nested-component')).toBeInTheDocument();
    expect(screen.getByText('Nested Title')).toBeInTheDocument();
    expect(screen.getByText('Nested content')).toBeInTheDocument();
  });

  it('should preserve component structure', () => {
    render(
      <AuthProvider>
        <div className="wrapper">
          <header data-testid="header">Header</header>
          <main data-testid="main">Main Content</main>
          <footer data-testid="footer">Footer</footer>
        </div>
      </AuthProvider>
    );

    const sessionProvider = screen.getByTestId('session-provider');
    expect(sessionProvider).toBeInTheDocument();
    
    // Check that all children are properly nested
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('main')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    
    // Verify the structure is maintained
    const wrapper = sessionProvider.querySelector('.wrapper');
    expect(wrapper).toBeInTheDocument();
  });

  it('should handle React fragment children', () => {
    render(
      <AuthProvider>
        <>
          <div data-testid="fragment-child-1">Fragment Child 1</div>
          <div data-testid="fragment-child-2">Fragment Child 2</div>
        </>
      </AuthProvider>
    );

    expect(screen.getByTestId('session-provider')).toBeInTheDocument();
    expect(screen.getByTestId('fragment-child-1')).toBeInTheDocument();
    expect(screen.getByTestId('fragment-child-2')).toBeInTheDocument();
  });

  it('should handle conditional children', () => {
    const shouldRender = true;
    
    render(
      <AuthProvider>
        {shouldRender && <div data-testid="conditional-child">Conditional Content</div>}
        <div data-testid="always-child">Always Rendered</div>
      </AuthProvider>
    );

    expect(screen.getByTestId('session-provider')).toBeInTheDocument();
    expect(screen.getByTestId('conditional-child')).toBeInTheDocument();
    expect(screen.getByTestId('always-child')).toBeInTheDocument();
  });
});