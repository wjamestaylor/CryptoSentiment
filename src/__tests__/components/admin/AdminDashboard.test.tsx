import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Create a simple loading state mock
const createMockQuery = (overrides = {}) => ({
  isLoading: false,
  error: null,
  data: null,
  ...overrides,
});

// Mock the tRPC provider before importing the component
jest.mock('@/lib/trpc/provider', () => ({
  api: {
    admin: {
      getOverviewStats: {
        useQuery: jest.fn(() => createMockQuery()),
      },
      getUserActivationFunnel: {
        useQuery: jest.fn(() => createMockQuery()),
      },
      getConversionRates: {
        useQuery: jest.fn(() => createMockQuery()),
      },
      getRetentionMetrics: {
        useQuery: jest.fn(() => createMockQuery()),
      },
      getFeatureUsage: {
        useQuery: jest.fn(() => createMockQuery()),
      },
      getUserGrowth: {
        useQuery: jest.fn(() => createMockQuery()),
      },
    },
  },
}));

import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { api } from '@/lib/trpc/provider';

describe('AdminDashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading state', () => {
    (api.admin.getOverviewStats.useQuery as jest.Mock).mockReturnValue(
      createMockQuery({ isLoading: true })
    );

    render(<AdminDashboard />);
    expect(screen.getByText(/Loading metrics/i)).toBeInTheDocument();
  });

  it('should show error state', () => {
    (api.admin.getOverviewStats.useQuery as jest.Mock).mockReturnValue(
      createMockQuery({ error: { message: 'Failed to load data' } })
    );

    render(<AdminDashboard />);
    expect(screen.getByText(/Error loading admin dashboard/i)).toBeInTheDocument();
  });

  it('should render dashboard with overview metrics', () => {
    const mockData = {
      success: true,
      data: {
        totalUsers: 100,
        activeUsers: 50,
        totalSubscriptions: 30,
        totalAlerts: 200,
        totalUsageLogs: 1000,
        subscriptionBreakdown: {
          FREE: 70,
          PRO: 25,
          BUSINESS: 5,
        },
      },
    };

    (api.admin.getOverviewStats.useQuery as jest.Mock).mockReturnValue(
      createMockQuery({ data: mockData })
    );
    (api.admin.getUserActivationFunnel.useQuery as jest.Mock).mockReturnValue(createMockQuery());
    (api.admin.getConversionRates.useQuery as jest.Mock).mockReturnValue(createMockQuery());
    (api.admin.getRetentionMetrics.useQuery as jest.Mock).mockReturnValue(createMockQuery());
    (api.admin.getFeatureUsage.useQuery as jest.Mock).mockReturnValue(createMockQuery());
    (api.admin.getUserGrowth.useQuery as jest.Mock).mockReturnValue(createMockQuery());

    render(<AdminDashboard />);
    
    expect(screen.getByText('Admin Analytics Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('Active Users (30d)')).toBeInTheDocument();
    expect(screen.getByText('Active Subscriptions')).toBeInTheDocument();
  });

  it('should display subscription breakdown when available', () => {
    const mockData = {
      success: true,
      data: {
        totalUsers: 100,
        activeUsers: 50,
        totalSubscriptions: 30,
        totalAlerts: 200,
        totalUsageLogs: 1000,
        subscriptionBreakdown: {
          FREE: 70,
          PRO: 25,
          BUSINESS: 5,
        },
      },
    };

    (api.admin.getOverviewStats.useQuery as jest.Mock).mockReturnValue(
      createMockQuery({ data: mockData })
    );
    (api.admin.getUserActivationFunnel.useQuery as jest.Mock).mockReturnValue(createMockQuery());
    (api.admin.getConversionRates.useQuery as jest.Mock).mockReturnValue(createMockQuery());
    (api.admin.getRetentionMetrics.useQuery as jest.Mock).mockReturnValue(createMockQuery());
    (api.admin.getFeatureUsage.useQuery as jest.Mock).mockReturnValue(createMockQuery());
    (api.admin.getUserGrowth.useQuery as jest.Mock).mockReturnValue(createMockQuery());

    render(<AdminDashboard />);
    
    expect(screen.getByText('Subscription Breakdown')).toBeInTheDocument();
    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByText('Pro')).toBeInTheDocument();
    expect(screen.getByText('Business')).toBeInTheDocument();
  });

  it('should display metrics correctly', () => {
    const mockData = {
      success: true,
      data: {
        totalUsers: 1234,
        activeUsers: 567,
        totalSubscriptions: 89,
        totalAlerts: 456,
        totalUsageLogs: 7890,
        subscriptionBreakdown: {},
      },
    };

    (api.admin.getOverviewStats.useQuery as jest.Mock).mockReturnValue(
      createMockQuery({ data: mockData })
    );
    (api.admin.getUserActivationFunnel.useQuery as jest.Mock).mockReturnValue(createMockQuery());
    (api.admin.getConversionRates.useQuery as jest.Mock).mockReturnValue(createMockQuery());
    (api.admin.getRetentionMetrics.useQuery as jest.Mock).mockReturnValue(createMockQuery());
    (api.admin.getFeatureUsage.useQuery as jest.Mock).mockReturnValue(createMockQuery());
    (api.admin.getUserGrowth.useQuery as jest.Mock).mockReturnValue(createMockQuery());

    render(<AdminDashboard />);
    
    // Check if numbers are formatted correctly
    expect(screen.getByText('1,234')).toBeInTheDocument();
    expect(screen.getByText('567')).toBeInTheDocument();
    expect(screen.getByText('89')).toBeInTheDocument();
    expect(screen.getByText('456')).toBeInTheDocument();
  });
});
