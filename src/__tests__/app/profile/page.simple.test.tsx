/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: { id: 'test-user', email: 'test@example.com' },
      expires: '2025-01-01',
    },
  }),
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/profile',
  }),
}));

// Mock BotConnection component to avoid tRPC issues
jest.mock('@/components/profile/BotConnection', () => ({
  BotConnection: () => <div data-testid="bot-connection">Bot Connection Component</div>,
}));

import ProfilePage from '@/app/profile/page';

describe('Profile Page', () => {
  it('should render profile page with bot connection component', () => {
    render(<ProfilePage />);
    
    expect(screen.getByTestId('bot-connection')).toBeInTheDocument();
  });

  it('should render account information section', () => {
    render(<ProfilePage />);
    
    // Check for common profile elements
    expect(screen.getByText('Account Information')).toBeInTheDocument();
  });

  it('should render preferences section', () => {
    render(<ProfilePage />);
    
    expect(screen.getByText('Preferences')).toBeInTheDocument();
  });
});