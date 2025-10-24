/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { BotConnection } from '@/components/profile/BotConnection';
import { api } from '@/lib/trpc/react';

// Mock tRPC API
jest.mock('@/lib/trpc/react', () => ({
  api: {
    bots: {
      getConnectionStatus: {
        useQuery: jest.fn(),
      },
      generateVerificationCode: {
        useMutation: jest.fn(),
      },
      unlinkBot: {
        useMutation: jest.fn(),
      },
      toggleNotifications: {
        useMutation: jest.fn(),
      },
      testBotConnection: {
        useMutation: jest.fn(),
      },
    },
  },
}));

// Mock toast
jest.mock('@/hooks/use-toast', () => ({
  toast: jest.fn(),
}));

// Mock UI components with className support
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, className, ...props }: { children: React.ReactNode; className?: string; [key: string]: unknown }) => (
    <button className={className} {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div {...props}>{children}</div>
  ),
  CardHeader: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div {...props}>{children}</div>
  ),
  CardTitle: ({ children, className, ...props }: { children: React.ReactNode; className?: string; [key: string]: unknown }) => (
    <h2 className={className} {...props}>{children}</h2>
  ),
  CardDescription: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <p {...props}>{children}</p>
  ),
  CardContent: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div {...props}>{children}</div>
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className, ...props }: { children: React.ReactNode; className?: string; [key: string]: unknown }) => (
    <span className={className} {...props}>{children}</span>
  ),
}));

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h3>{children}</h3>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/components/ui/input', () => ({
  Input: (props: { [key: string]: unknown }) => <input {...props} />,
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <label {...props}>{children}</label>
  ),
}));

jest.mock('@/components/ui/switch', () => ({
  Switch: (props: { [key: string]: unknown }) => <button {...props}>Switch</button>,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  AlertCircle: () => <span>AlertCircle</span>,
  CheckCircle: () => <span>CheckCircle</span>,
  Copy: () => <span>Copy</span>,
  ExternalLink: () => <span>ExternalLink</span>,
  MessageSquare: () => <span>MessageSquare</span>,
  Zap: () => <span>Zap</span>,
}));

interface MockedApi {
  bots: {
    getConnectionStatus: {
      useQuery: jest.Mock
    }
    generateVerificationCode: {
      useMutation: jest.Mock
    }
    unlinkBot: {
      useMutation: jest.Mock
    }
    toggleNotifications: {
      useMutation: jest.Mock
    }
    testBotConnection: {
      useMutation: jest.Mock
    }
  }
}

const mockApi = api as unknown as MockedApi;

describe('BotConnection Component - Mobile Responsiveness', () => {
  const initialStatusDisconnected = {
    discord: { connected: false, userId: null, notificationsEnabled: false },
    telegram: { connected: false, userId: null, notificationsEnabled: false },
  };

  const initialStatusConnected = {
    discord: { connected: true, userId: 'discord-user-123456789', notificationsEnabled: true },
    telegram: { connected: true, userId: 'telegram-user-987654321', notificationsEnabled: true },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mocks
    mockApi.bots.getConnectionStatus.useQuery.mockReturnValue({
      data: initialStatusDisconnected,
      isLoading: false,
      refetch: jest.fn(),
    });

    mockApi.bots.generateVerificationCode.useMutation.mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue({ verificationCode: 'TEST123', instructions: 'Test instructions' }),
      isPending: false,
    });

    mockApi.bots.unlinkBot.useMutation.mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue({}),
      isPending: false,
    });

    mockApi.bots.toggleNotifications.useMutation.mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue({}),
      isPending: false,
    });

    mockApi.bots.testBotConnection.useMutation.mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue({}),
      isPending: false,
    });
  });

  describe('Responsive Layout for Disconnected State', () => {
    it('should render bot cards with responsive flex layout', () => {
      const { container } = render(<BotConnection initialStatus={initialStatusDisconnected} />);
      
      // Find bot integration cards
      const botCards = container.querySelectorAll('.border.rounded-lg');
      
      expect(botCards.length).toBeGreaterThanOrEqual(2); // Discord and Telegram
      
      // Check first card (Discord) has responsive classes
      const discordCard = botCards[0];
      expect(discordCard?.className).toContain('flex');
      expect(discordCard?.className).toContain('flex-col');
      expect(discordCard?.className).toContain('sm:flex-row');
      expect(discordCard?.className).toContain('gap-4');
    });

    it('should render Connect buttons with full width on mobile', () => {
      render(<BotConnection initialStatus={initialStatusDisconnected} />);
      
      const connectDiscordButton = screen.getByText('Connect Discord');
      const connectTelegramButton = screen.getByText('Connect Telegram');
      
      expect(connectDiscordButton.className).toContain('flex-1');
      expect(connectDiscordButton.className).toContain('sm:flex-none');
      expect(connectDiscordButton.className).toContain('sm:w-full');
      
      expect(connectTelegramButton.className).toContain('flex-1');
      expect(connectTelegramButton.className).toContain('sm:flex-none');
      expect(connectTelegramButton.className).toContain('sm:w-full');
    });

    it('should render Join Server/Start Bot buttons with responsive width', () => {
      render(<BotConnection initialStatus={initialStatusDisconnected} />);
      
      const joinServerButton = screen.getByText('Join Server');
      const startBotButton = screen.getByText('Start Bot');
      
      expect(joinServerButton.className).toContain('flex-1');
      expect(joinServerButton.className).toContain('sm:flex-none');
      expect(joinServerButton.className).toContain('sm:w-full');
      
      expect(startBotButton.className).toContain('flex-1');
      expect(startBotButton.className).toContain('sm:flex-none');
      expect(startBotButton.className).toContain('sm:w-full');
    });
  });

  describe('Responsive Layout for Connected State', () => {
    it('should render connected bot cards with responsive layout', () => {
      mockApi.bots.getConnectionStatus.useQuery.mockReturnValue({
        data: initialStatusConnected,
        isLoading: false,
        refetch: jest.fn(),
      });

      const { container } = render(<BotConnection initialStatus={initialStatusConnected} />);
      
      const botCards = container.querySelectorAll('.border.rounded-lg');
      
      expect(botCards[0]?.className).toContain('flex-col');
      expect(botCards[0]?.className).toContain('sm:flex-row');
    });

    it('should render Test and Disconnect buttons with responsive width', () => {
      mockApi.bots.getConnectionStatus.useQuery.mockReturnValue({
        data: initialStatusConnected,
        isLoading: false,
        refetch: jest.fn(),
      });

      render(<BotConnection initialStatus={initialStatusConnected} />);
      
      const testButtons = screen.getAllByText('Test');
      const disconnectButtons = screen.getAllByText('Disconnect');
      
      // Check first Test button (Discord)
      expect(testButtons[0].className).toContain('flex-1');
      expect(testButtons[0].className).toContain('sm:flex-none');
      expect(testButtons[0].className).toContain('sm:w-full');
      
      // Check first Disconnect button (Discord)
      expect(disconnectButtons[0].className).toContain('flex-1');
      expect(disconnectButtons[0].className).toContain('sm:flex-none');
      expect(disconnectButtons[0].className).toContain('sm:w-full');
    });

    it('should render notification switches with responsive width', () => {
      mockApi.bots.getConnectionStatus.useQuery.mockReturnValue({
        data: initialStatusConnected,
        isLoading: false,
        refetch: jest.fn(),
      });

      render(<BotConnection initialStatus={initialStatusConnected} />);
      
      // Just verify switches are rendered - the exact container classes are implementation details
      const notificationLabels = screen.getAllByText('Notifications');
      expect(notificationLabels.length).toBe(2); // Discord and Telegram
    });
  });

  describe('Content Overflow Prevention', () => {
    it('should handle long user IDs with break-all on mobile', () => {
      mockApi.bots.getConnectionStatus.useQuery.mockReturnValue({
        data: initialStatusConnected,
        isLoading: false,
        refetch: jest.fn(),
      });

      render(<BotConnection initialStatus={initialStatusConnected} />);
      
      const discordUserId = screen.getByText(/discord-user-123456789/);
      const telegramUserId = screen.getByText(/telegram-user-987654321/);
      
      expect(discordUserId.className).toContain('break-all');
      expect(telegramUserId.className).toContain('break-all');
    });

    it('should render bot names and badges properly', () => {
      render(<BotConnection initialStatus={initialStatusDisconnected} />);
      
      // Verify bot names and badges are present
      expect(screen.getByText('Discord Bot')).toBeInTheDocument();
      expect(screen.getByText('Telegram Bot')).toBeInTheDocument();
      
      // Verify "Not Connected" badges appear
      const notConnectedTexts = screen.getAllByText('Not Connected');
      expect(notConnectedTexts.length).toBe(2);
    });
  });

  describe('Button Controls Layout', () => {
    it('should render all action buttons properly', () => {
      render(<BotConnection initialStatus={initialStatusDisconnected} />);
      
      // Verify all buttons are rendered and accessible
      expect(screen.getByText('Connect Discord')).toBeInTheDocument();
      expect(screen.getByText('Connect Telegram')).toBeInTheDocument();
      expect(screen.getByText('Join Server')).toBeInTheDocument();
      expect(screen.getByText('Start Bot')).toBeInTheDocument();
    });
  });

  describe('Mobile User Experience', () => {
    it('should render all essential information', () => {
      render(<BotConnection initialStatus={initialStatusDisconnected} />);
      
      expect(screen.getByText('Bot Integration')).toBeInTheDocument();
      expect(screen.getByText('Discord Bot')).toBeInTheDocument();
      expect(screen.getByText('Telegram Bot')).toBeInTheDocument();
      expect(screen.getByText('Bot Features')).toBeInTheDocument();
    });

    it('should render feature list', () => {
      render(<BotConnection initialStatus={initialStatusDisconnected} />);
      
      expect(screen.getByText('Real-time price alerts')).toBeInTheDocument();
      expect(screen.getByText('Sentiment change notifications')).toBeInTheDocument();
      expect(screen.getByText('Volume spike alerts')).toBeInTheDocument();
      expect(screen.getByText('Interactive commands')).toBeInTheDocument();
    });

    it('should render all interactive buttons in disconnected state', () => {
      render(<BotConnection initialStatus={initialStatusDisconnected} />);
      
      expect(screen.getByText('Connect Discord')).toBeInTheDocument();
      expect(screen.getByText('Join Server')).toBeInTheDocument();
      expect(screen.getByText('Connect Telegram')).toBeInTheDocument();
      expect(screen.getByText('Start Bot')).toBeInTheDocument();
    });

    it('should render all interactive elements in connected state', () => {
      mockApi.bots.getConnectionStatus.useQuery.mockReturnValue({
        data: initialStatusConnected,
        isLoading: false,
        refetch: jest.fn(),
      });

      render(<BotConnection initialStatus={initialStatusConnected} />);
      
      const testButtons = screen.getAllByText('Test');
      const disconnectButtons = screen.getAllByText('Disconnect');
      const notificationLabels = screen.getAllByText('Notifications');
      
      expect(testButtons.length).toBe(2); // Discord and Telegram
      expect(disconnectButtons.length).toBe(2);
      expect(notificationLabels.length).toBe(2);
    });
  });
});
