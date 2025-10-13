/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';

// Mock all dependencies to avoid import issues
jest.mock('@/lib/trpc/react', () => ({
  api: {
    bots: {
      getConnectionStatus: {
        useQuery: () => ({
          data: {
            discord: { connected: false, userId: null, notificationsEnabled: false },
            telegram: { connected: false, userId: null, notificationsEnabled: false }
          },
          refetch: jest.fn(),
          isLoading: false,
          error: null,
        }),
      },
      generateVerificationCode: {
        useMutation: () => ({
          mutateAsync: jest.fn(),
          isPending: false,
        }),
      },
      unlinkBot: {
        useMutation: () => ({
          mutateAsync: jest.fn(),
          isPending: false,
        }),
      },
      toggleNotifications: {
        useMutation: () => ({
          mutateAsync: jest.fn(),
          isPending: false,
        }),
      },
      testBotConnection: {
        useMutation: () => ({
          mutateAsync: jest.fn(),
          isPending: false,
        }),
      },
    },
  },
}));

jest.mock('@/hooks/use-toast', () => ({
  toast: jest.fn(),
}));

// Import the component after mocking
import { BotConnection } from '@/components/profile/BotConnection';

// Test wrapper with providers
const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('BotConnection Component', () => {
  const mockInitialStatus = {
    discord: {
      connected: false,
      userId: null,
      notificationsEnabled: false,
    },
    telegram: {
      connected: false,
      userId: null,
      notificationsEnabled: false,
    },
  };

  const mockConnectedStatus = {
    discord: {
      connected: true,
      userId: 'discord123',
      notificationsEnabled: true,
    },
    telegram: {
      connected: true,
      userId: 'telegram456',
      notificationsEnabled: false,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockApi.bots.getConnectionStatus.useQuery.mockReturnValue({
      data: mockInitialStatus,
      refetch: jest.fn(),
      isLoading: false,
      error: null,
    } as any);

    mockApi.bots.generateVerificationCode.useMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    } as any);

    mockApi.bots.unlinkBot.useMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    } as any);

    mockApi.bots.toggleNotifications.useMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    } as any);

    mockApi.bots.testBotConnection.useMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    } as any);
  });

  describe('Disconnected State', () => {
    it('should render disconnected status for both bots', () => {
      render(
        <TestWrapper>
          <BotConnection initialStatus={mockInitialStatus} />
        </TestWrapper>
      );

      expect(screen.getByText('Discord Bot')).toBeInTheDocument();
      expect(screen.getByText('Telegram Bot')).toBeInTheDocument();
      expect(screen.getAllByText('Not Connected')).toHaveLength(2);
      expect(screen.getByText('Connect Discord')).toBeInTheDocument();
      expect(screen.getByText('Connect Telegram')).toBeInTheDocument();
    });

    it('should show bot features section', () => {
      render(
        <TestWrapper>
          <BotConnection initialStatus={mockInitialStatus} />
        </TestWrapper>
      );

      expect(screen.getByText('Bot Features')).toBeInTheDocument();
      expect(screen.getByText('Real-time price alerts')).toBeInTheDocument();
      expect(screen.getByText('Sentiment change notifications')).toBeInTheDocument();
      expect(screen.getByText('Volume spike alerts')).toBeInTheDocument();
      expect(screen.getByText('Interactive commands')).toBeInTheDocument();
    });

    it('should open external links for bot setup', () => {
      const mockOpen = jest.spyOn(window, 'open').mockImplementation(() => null);
      
      render(
        <TestWrapper>
          <BotConnection initialStatus={mockInitialStatus} />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Join Server'));
      expect(mockOpen).toHaveBeenCalledWith('https://discord.gg/cryptosentiment', '_blank');

      fireEvent.click(screen.getByText('Start Bot'));
      expect(mockOpen).toHaveBeenCalledWith('https://t.me/CryptoSentimentBot', '_blank');

      mockOpen.mockRestore();
    });
  });

  describe('Connected State', () => {
    beforeEach(() => {
      mockApi.bots.getConnectionStatus.useQuery.mockReturnValue({
        data: mockConnectedStatus,
        refetch: jest.fn(),
        isLoading: false,
        error: null,
      } as any);
    });

    it('should render connected status for both bots', () => {
      render(
        <TestWrapper>
          <BotConnection initialStatus={mockConnectedStatus} />
        </TestWrapper>
      );

      expect(screen.getAllByText('Connected')).toHaveLength(2);
      expect(screen.getByText('discord123')).toBeInTheDocument();
      expect(screen.getByText('telegram456')).toBeInTheDocument();
      expect(screen.getAllByText('Test')).toHaveLength(2);
      expect(screen.getAllByText('Disconnect')).toHaveLength(2);
    });

    it('should show notification toggles for connected bots', () => {
      render(
        <TestWrapper>
          <BotConnection initialStatus={mockConnectedStatus} />
        </TestWrapper>
      );

      const switches = screen.getAllByRole('switch');
      expect(switches).toHaveLength(2);
      
      // Discord notifications should be enabled
      expect(switches[0]).toBeChecked();
      // Telegram notifications should be disabled
      expect(switches[1]).not.toBeChecked();
    });
  });

  describe('Verification Flow', () => {
    it('should generate verification code for Discord', async () => {
      const mockGenerateCode = jest.fn().mockResolvedValue({
        verificationCode: 'ABC123XY',
        instructions: 'Go to our Discord server and use the command: `/verify ABC123XY`',
        expiresIn: 300,
      });

      mockApi.bots.generateVerificationCode.useMutation.mockReturnValue({
        mutateAsync: mockGenerateCode,
        isPending: false,
      } as any);

      render(
        <TestWrapper>
          <BotConnection initialStatus={mockInitialStatus} />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Connect Discord'));

      await waitFor(() => {
        expect(mockGenerateCode).toHaveBeenCalledWith({ botType: 'discord' });
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Verification Code Generated',
        description: 'Go to our Discord server and use the command: `/verify ABC123XY`',
      });
    });

    it('should generate verification code for Telegram', async () => {
      const mockGenerateCode = jest.fn().mockResolvedValue({
        verificationCode: 'XYZ789AB',
        instructions: 'Start a chat with @CryptoSentimentBot and send: `/verify XYZ789AB`',
        expiresIn: 300,
      });

      mockApi.bots.generateVerificationCode.useMutation.mockReturnValue({
        mutateAsync: mockGenerateCode,
        isPending: false,
      } as any);

      render(
        <TestWrapper>
          <BotConnection initialStatus={mockInitialStatus} />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Connect Telegram'));

      await waitFor(() => {
        expect(mockGenerateCode).toHaveBeenCalledWith({ botType: 'telegram' });
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Verification Code Generated',
        description: 'Start a chat with @CryptoSentimentBot and send: `/verify XYZ789AB`',
      });
    });

    it('should handle verification code generation error', async () => {
      const mockGenerateCode = jest.fn().mockRejectedValue(new Error('Network error'));

      mockApi.bots.generateVerificationCode.useMutation.mockReturnValue({
        mutateAsync: mockGenerateCode,
        isPending: false,
      } as any);

      render(
        <TestWrapper>
          <BotConnection initialStatus={mockInitialStatus} />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Connect Discord'));

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Failed to generate verification code. Please try again.',
          variant: 'destructive',
        });
      });
    });

    it('should copy verification code to clipboard', async () => {
      const mockWriteText = jest.fn();
      Object.assign(navigator, {
        clipboard: { writeText: mockWriteText },
      });

      const mockGenerateCode = jest.fn().mockResolvedValue({
        verificationCode: 'ABC123XY',
        instructions: 'Test instructions',
        expiresIn: 300,
      });

      mockApi.bots.generateVerificationCode.useMutation.mockReturnValue({
        mutateAsync: mockGenerateCode,
        isPending: false,
      } as any);

      render(
        <TestWrapper>
          <BotConnection initialStatus={mockInitialStatus} />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Connect Discord'));

      // Wait for dialog to open and code to be generated
      await waitFor(() => {
        expect(screen.getByText('Connect Discord Bot')).toBeInTheDocument();
      });

      // Click copy button
      const copyButton = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyButton);

      expect(mockWriteText).toHaveBeenCalledWith('ABC123XY');
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Copied!',
        description: 'Verification code copied to clipboard.',
      });
    });
  });

  describe('Bot Management', () => {
    beforeEach(() => {
      mockApi.bots.getConnectionStatus.useQuery.mockReturnValue({
        data: mockConnectedStatus,
        refetch: jest.fn(),
        isLoading: false,
        error: null,
      } as any);
    });

    it('should unlink Discord bot', async () => {
      const mockUnlinkBot = jest.fn().mockResolvedValue({
        success: true,
        message: 'discord account successfully unlinked!',
      });
      const mockRefetch = jest.fn();

      mockApi.bots.unlinkBot.useMutation.mockReturnValue({
        mutateAsync: mockUnlinkBot,
        isPending: false,
      } as any);

      mockApi.bots.getConnectionStatus.useQuery.mockReturnValue({
        data: mockConnectedStatus,
        refetch: mockRefetch,
        isLoading: false,
        error: null,
      } as any);

      render(
        <TestWrapper>
          <BotConnection initialStatus={mockConnectedStatus} />
        </TestWrapper>
      );

      const disconnectButtons = screen.getAllByText('Disconnect');
      fireEvent.click(disconnectButtons[0]); // Discord disconnect

      await waitFor(() => {
        expect(mockUnlinkBot).toHaveBeenCalledWith({ botType: 'discord' });
        expect(mockRefetch).toHaveBeenCalled();
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Account Unlinked',
        description: 'Your discord account has been unlinked successfully.',
      });
    });

    it('should toggle notification settings', async () => {
      const mockToggleNotifications = jest.fn().mockResolvedValue({
        success: true,
        message: 'telegram notifications enabled!',
      });
      const mockRefetch = jest.fn();

      mockApi.bots.toggleNotifications.useMutation.mockReturnValue({
        mutateAsync: mockToggleNotifications,
        isPending: false,
      } as any);

      mockApi.bots.getConnectionStatus.useQuery.mockReturnValue({
        data: mockConnectedStatus,
        refetch: mockRefetch,
        isLoading: false,
        error: null,
      } as any);

      render(
        <TestWrapper>
          <BotConnection initialStatus={mockConnectedStatus} />
        </TestWrapper>
      );

      const switches = screen.getAllByRole('switch');
      fireEvent.click(switches[1]); // Toggle Telegram notifications

      await waitFor(() => {
        expect(mockToggleNotifications).toHaveBeenCalledWith({
          botType: 'telegram',
          enabled: true,
        });
        expect(mockRefetch).toHaveBeenCalled();
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: 'telegram Notifications',
        description: 'Notifications have been enabled.',
      });
    });

    it('should test bot connection', async () => {
      const mockTestConnection = jest.fn().mockResolvedValue({
        success: true,
        message: 'Test message sent to your discord account!',
      });

      mockApi.bots.testBotConnection.useMutation.mockReturnValue({
        mutateAsync: mockTestConnection,
        isPending: false,
      } as any);

      render(
        <TestWrapper>
          <BotConnection initialStatus={mockConnectedStatus} />
        </TestWrapper>
      );

      const testButtons = screen.getAllByText('Test');
      fireEvent.click(testButtons[0]); // Test Discord connection

      await waitFor(() => {
        expect(mockTestConnection).toHaveBeenCalledWith({ botType: 'discord' });
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Test Message Sent',
        description: 'Check your discord for a test message!',
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockApi.bots.getConnectionStatus.useQuery.mockReturnValue({
        data: mockConnectedStatus,
        refetch: jest.fn(),
        isLoading: false,
        error: null,
      } as any);
    });

    it('should handle unlink bot error', async () => {
      const mockUnlinkBot = jest.fn().mockRejectedValue(new Error('Network error'));

      mockApi.bots.unlinkBot.useMutation.mockReturnValue({
        mutateAsync: mockUnlinkBot,
        isPending: false,
      } as any);

      render(
        <TestWrapper>
          <BotConnection initialStatus={mockConnectedStatus} />
        </TestWrapper>
      );

      const disconnectButtons = screen.getAllByText('Disconnect');
      fireEvent.click(disconnectButtons[0]);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Failed to unlink discord account. Please try again.',
          variant: 'destructive',
        });
      });
    });

    it('should handle toggle notifications error', async () => {
      const mockToggleNotifications = jest.fn().mockRejectedValue(new Error('Network error'));

      mockApi.bots.toggleNotifications.useMutation.mockReturnValue({
        mutateAsync: mockToggleNotifications,
        isPending: false,
      } as any);

      render(
        <TestWrapper>
          <BotConnection initialStatus={mockConnectedStatus} />
        </TestWrapper>
      );

      const switches = screen.getAllByRole('switch');
      fireEvent.click(switches[0]);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Failed to update notification settings. Please try again.',
          variant: 'destructive',
        });
      });
    });

    it('should handle test connection error', async () => {
      const mockTestConnection = jest.fn().mockRejectedValue(new Error('Bot not available'));

      mockApi.bots.testBotConnection.useMutation.mockReturnValue({
        mutateAsync: mockTestConnection,
        isPending: false,
      } as any);

      render(
        <TestWrapper>
          <BotConnection initialStatus={mockConnectedStatus} />
        </TestWrapper>
      );

      const testButtons = screen.getAllByText('Test');
      fireEvent.click(testButtons[0]);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Failed to send test message to discord.',
          variant: 'destructive',
        });
      });
    });
  });
});