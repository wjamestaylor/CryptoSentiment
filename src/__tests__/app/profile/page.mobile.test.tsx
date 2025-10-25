/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react';
import ProfilePage from '@/app/profile/page';

// Mock next/navigation
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    replace: mockReplace,
  })),
}));

describe('Profile Page Mobile - Redirect', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should redirect to settings page on mobile', () => {
    render(<ProfilePage />);

    expect(mockReplace).toHaveBeenCalledWith('/settings');
  });
});
