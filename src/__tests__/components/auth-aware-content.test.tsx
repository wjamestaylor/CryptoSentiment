import { render, screen } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { AuthAwareContent, AuthAwareCTA } from '@/components';

// Mock next-auth
jest.mock('next-auth/react');
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

// Mock next/link
jest.mock('next/link', () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});

describe('AuthAwareContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state when session is loading', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
      update: jest.fn(),
    });

    render(<AuthAwareContent />);
    
    expect(screen.getAllByText('Loading...')).toHaveLength(2);
  });

  it('shows upgrade options for authenticated users', () => {
    mockUseSession.mockReturnValue({
      data: { 
        user: { id: '1', email: 'test@example.com' },
        expires: new Date().toISOString(),
      },
      status: 'authenticated',
      update: jest.fn(),
    });

    render(<AuthAwareContent />);
    
    expect(screen.getByText('Try AI Analysis')).toBeInTheDocument();
    expect(screen.getByText('Upgrade to Pro')).toBeInTheDocument();
    expect(screen.queryByText('Get Started Free')).not.toBeInTheDocument();
  });

  it('shows signup options for unauthenticated users', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    });

    render(<AuthAwareContent />);
    
    expect(screen.getByText('Try AI Analysis')).toBeInTheDocument();
    expect(screen.getByText('Get Started Free')).toBeInTheDocument();
    expect(screen.queryByText('Upgrade to Pro')).not.toBeInTheDocument();
  });
});

describe('AuthAwareCTA', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state when session is loading', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
      update: jest.fn(),
    });

    render(<AuthAwareCTA />);
    
    expect(screen.getAllByText('Loading...')).toHaveLength(2);
  });

  it('shows upgrade options for authenticated users', () => {
    mockUseSession.mockReturnValue({
      data: { 
        user: { id: '1', email: 'test@example.com' },
        expires: new Date().toISOString(),
      },
      status: 'authenticated',
      update: jest.fn(),
    });

    render(<AuthAwareCTA />);
    
    expect(screen.getByText('View All Plans')).toBeInTheDocument();
    expect(screen.getByText('Upgrade to Pro')).toBeInTheDocument();
    expect(screen.queryByText('Start Free Trial')).not.toBeInTheDocument();
  });

  it('shows signup options for unauthenticated users', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    });

    render(<AuthAwareCTA />);
    
    expect(screen.getByText('View All Plans')).toBeInTheDocument();
    expect(screen.getByText('Start Free Trial')).toBeInTheDocument();
    expect(screen.queryByText('Upgrade to Pro')).not.toBeInTheDocument();
  });
});