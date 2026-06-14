import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LocalePreferences } from '@/components/settings/LocalePreferences';

// Mock toast first
jest.mock('@/hooks/use-toast', () => ({
  toast: jest.fn(),
}));

// Mock the tRPC hooks
const mockGetPreferences = jest.fn();
const mockUpdatePreferences = jest.fn();

jest.mock('@/lib/trpc/provider', () => ({
  api: {
    auth: {
      getPreferences: {
        useQuery: () => mockGetPreferences(),
      },
      updatePreferences: {
        useMutation: () => mockUpdatePreferences(),
      },
    },
  },
}));

describe('LocalePreferences', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockGetPreferences.mockReturnValue({
      data: {
        currency: 'USD',
        timezone: 'UTC',
      },
      isLoading: false,
    });
    
    mockUpdatePreferences.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });
  });

  it('renders trigger button', () => {
    render(<LocalePreferences />);
    
    const button = screen.getByRole('button', { name: /configure/i });
    expect(button).toBeInTheDocument();
  });

  it('opens dialog when trigger is clicked', async () => {
    render(<LocalePreferences />);
    
    const button = screen.getByRole('button', { name: /configure/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Locale Preferences')).toBeInTheDocument();
      expect(screen.getByText(/Set your preferred currency and timezone/i)).toBeInTheDocument();
    });
  });

  it('displays currency select', async () => {
    render(<LocalePreferences />);
    
    const button = screen.getByRole('button', { name: /configure/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Currency')).toBeInTheDocument();
    });
  });

  it('displays timezone select', async () => {
    render(<LocalePreferences />);
    
    const button = screen.getByRole('button', { name: /configure/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Timezone')).toBeInTheDocument();
    });
  });

  it('shows loading state', async () => {
    mockGetPreferences.mockReturnValue({
      data: undefined,
      isLoading: true,
    });
    
    render(<LocalePreferences />);
    
    const button = screen.getByRole('button', { name: /configure/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      const loadingElements = screen.getAllByRole('generic').filter(
        el => el.className.includes('animate-pulse')
      );
      expect(loadingElements.length).toBeGreaterThan(0);
    });
  });

  it('uses default values when preferences are not loaded', () => {
    mockGetPreferences.mockReturnValue({
      data: undefined,
      isLoading: false,
    });
    
    render(<LocalePreferences />);
    
    // Component should render without errors even with no data
    const button = screen.getByRole('button', { name: /configure/i });
    expect(button).toBeInTheDocument();
  });

  it('displays save and cancel buttons', async () => {
    render(<LocalePreferences />);
    
    const button = screen.getByRole('button', { name: /configure/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    });
  });

  it('shows saving state when mutation is pending', async () => {
    mockUpdatePreferences.mockReturnValue({
      mutate: jest.fn(),
      isPending: true,
    });
    
    render(<LocalePreferences />);
    
    const button = screen.getByRole('button', { name: /configure/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      const saveButton = screen.getByRole('button', { name: /saving/i });
      expect(saveButton).toBeDisabled();
    });
  });

  it('closes dialog when cancel is clicked', async () => {
    render(<LocalePreferences />);
    
    const openButton = screen.getByRole('button', { name: /configure/i });
    fireEvent.click(openButton);
    
    await waitFor(() => {
      expect(screen.getByText('Locale Preferences')).toBeInTheDocument();
    });
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);
    
    await waitFor(() => {
      expect(screen.queryByText('Locale Preferences')).not.toBeInTheDocument();
    });
  });
});
