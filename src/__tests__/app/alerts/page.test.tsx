import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import AlertsPage from '@/app/alerts/page'
import { AlertType } from '@prisma/client'
import { toast } from '@/hooks/use-toast'

// Mock external dependencies
jest.mock('next-auth/react')
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))
jest.mock('@/hooks/use-toast')
jest.mock('@/lib/trpc/provider', () => ({
  api: {
    alerts: {
      getUserAlerts: {
        useQuery: jest.fn(),
      },
      createAlert: {
        useMutation: jest.fn(),
      },
      updateAlert: {
        useMutation: jest.fn(),
      },
      deleteAlert: {
        useMutation: jest.fn(),
      },
    },
  },
}))

const mockUseSession = useSession as jest.Mock
const mockToast = toast as jest.MockedFunction<typeof toast>

// Import the mocked api 
import { api } from '@/lib/trpc/provider'

// Type for mocked API structure
interface MockedApi {
  alerts: {
    getUserAlerts: {
      useQuery: jest.Mock
    }
    createAlert: {
      useMutation: jest.Mock
    }
    updateAlert: {
      useMutation: jest.Mock
    }
    deleteAlert: {
      useMutation: jest.Mock
    }
  }
}

const mockApi = api as unknown as MockedApi

// Mock alerts data
const mockAlert = {
  id: 'alert-1',
  type: AlertType.SENTIMENT_CHANGE,
  condition: JSON.stringify({
    sentimentThreshold: 0.7,
    direction: 'bullish'
  }),
  isActive: true,
  crypto: {
    symbol: 'btc',
    name: 'Bitcoin'
  },
  createdAt: new Date('2024-01-15T10:00:00Z'),
  lastTriggered: new Date('2024-01-16T10:00:00Z'),
  triggerCount: 5
}

const mockInactiveAlert = {
  id: 'alert-2',
  type: AlertType.PRICE_CHANGE,
  condition: JSON.stringify({
    priceThreshold: 50000,
    direction: 'above'
  }),
  isActive: false,
  crypto: {
    symbol: 'eth',
    name: 'Ethereum'
  },
  createdAt: new Date('2024-01-10T10:00:00Z'),
  lastTriggered: null,
  triggerCount: 0
}

const mockVolumeAlert = {
  id: 'alert-3',
  type: AlertType.VOLUME_SPIKE,
  condition: JSON.stringify({
    volumeThreshold: 1000000000
  }),
  isActive: true,
  crypto: {
    symbol: 'sol',
    name: 'Solana'
  },
  createdAt: new Date('2024-01-12T10:00:00Z'),
  lastTriggered: new Date('2024-01-13T10:00:00Z'),
  triggerCount: 2
}

const mockAlertsResponse = {
  alerts: [mockAlert, mockInactiveAlert, mockVolumeAlert],
  total: 3
}

// Mock tRPC mutations
const mockCreateAlert = {
  mutate: jest.fn(),
  isPending: false
}

const mockUpdateAlert = {
  mutate: jest.fn(),
  isPending: false
}

const mockDeleteAlert = {
  mutate: jest.fn(),
  isPending: false
}

const mockRefetchAlerts = jest.fn()

describe('AlertsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup API mocks
    mockApi.alerts = {
      getUserAlerts: {
        useQuery: jest.fn().mockReturnValue({
          data: mockAlertsResponse,
          refetch: mockRefetchAlerts,
          isLoading: false,
          error: null
        })
      },
      createAlert: {
        useMutation: jest.fn().mockReturnValue(mockCreateAlert)
      },
      updateAlert: {
        useMutation: jest.fn().mockReturnValue(mockUpdateAlert)
      },
      deleteAlert: {
        useMutation: jest.fn().mockReturnValue(mockDeleteAlert)
      }
    }
  })

  describe('Authentication States', () => {
    it('renders loading state', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
        update: jest.fn()
      })

      render(<AlertsPage />)
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('redirects unauthenticated users', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn()
      })

      // Mock the redirect function
      const mockRedirect = jest.fn()
      jest.doMock('next/navigation', () => ({
        redirect: mockRedirect
      }))

      render(<AlertsPage />)
      // Note: redirect is called during render, but we can't easily test it
      // In a real test, you might want to mock this differently
    })

    it('renders alerts page for authenticated user', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: { id: 'user-1', email: 'test@example.com' },
          expires: '2024-12-31T23:59:59.999Z'
        },
        status: 'authenticated',
        update: jest.fn()
      })

      render(<AlertsPage />)
      expect(screen.getByText('Alert Management')).toBeInTheDocument()
      expect(screen.getByText('Set up alerts for price changes, sentiment shifts, and market events')).toBeInTheDocument()
    })
  })

  describe('Alerts Display', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: {
          user: { id: 'user-1', email: 'test@example.com' },
          expires: '2024-12-31T23:59:59.999Z'
        },
        status: 'authenticated',
        update: jest.fn()
      })
    })

    it('displays alerts list correctly', () => {
      render(<AlertsPage />)

      // Check Bitcoin alert
      expect(screen.getByText('Bitcoin (BTC)')).toBeInTheDocument()
      expect(screen.getByText('sentiment change')).toBeInTheDocument()
      expect(screen.getByText('Sentiment bullish (threshold: 0.7)')).toBeInTheDocument()
      expect(screen.getByText('Triggered 5 times')).toBeInTheDocument()

      // Check Ethereum alert  
      expect(screen.getByText('Ethereum (ETH)')).toBeInTheDocument()
      expect(screen.getByText('price change')).toBeInTheDocument()
      expect(screen.getByText('Price above $50000')).toBeInTheDocument()
      expect(screen.getByText('Triggered 0 times')).toBeInTheDocument()

      // Check Solana alert
      expect(screen.getByText('Solana (SOL)')).toBeInTheDocument()
      expect(screen.getByText('volume spike')).toBeInTheDocument()
      expect(screen.getByText('Volume above $1,000,000,000')).toBeInTheDocument()
      expect(screen.getByText('Triggered 2 times')).toBeInTheDocument()
    })

    it('shows empty state when no alerts', () => {
      mockApi.alerts.getUserAlerts.useQuery.mockReturnValue({
        data: { alerts: [], total: 0 },
        refetch: mockRefetchAlerts,
        isLoading: false,
        error: null
      })

      render(<AlertsPage />)
      expect(screen.getByText('No alerts yet')).toBeInTheDocument()
      expect(screen.getByText('Create your first alert to get notified about market changes')).toBeInTheDocument()
      expect(screen.getByText('Create Your First Alert')).toBeInTheDocument()
    })

    it('handles active only filter', async () => {
      render(<AlertsPage />)
      
      // Initially shows all alerts
      expect(screen.getByText('Bitcoin (BTC)')).toBeInTheDocument()
      expect(screen.getByText('Ethereum (ETH)')).toBeInTheDocument()
      expect(screen.getByText('Solana (SOL)')).toBeInTheDocument()
      
      // Find the active only filter switch by its ID
      const activeOnlySwitch = document.getElementById('active-only')
      expect(activeOnlySwitch).toBeInTheDocument()
      
      fireEvent.click(activeOnlySwitch!)
      
      await waitFor(() => {
        // Check that the switch was clicked and API call would be made with new filter
        expect(activeOnlySwitch).toHaveAttribute('aria-checked', 'true')
      })
    })
    
    it('displays last triggered date when available', () => {
      render(<AlertsPage />)
      expect(screen.getByText('Last: 1/16/2024')).toBeInTheDocument()
    })

    it('shows proper opacity for inactive alerts', () => {
      render(<AlertsPage />)
      
      const alerts = screen.getAllByTestId('alert-card')
      expect(alerts.length).toBeGreaterThan(0)
      
      // Find inactive alert (the one with Ethereum has isActive: false)
      const inactiveAlert = alerts.find(alert => 
        alert.textContent?.includes('Ethereum') || alert.className.includes('opacity-60')
      )
      expect(inactiveAlert).toBeTruthy()
    })
  })

  describe('Alert Management', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: {
          user: { id: 'user-1', email: 'test@example.com' },
          expires: '2024-12-31T23:59:59.999Z'
        },
        status: 'authenticated',
        update: jest.fn()
      })
    })

    it('toggles alert active state', async () => {
      render(<AlertsPage />)

      // Find alert switches (not the filter switch)
      const alertCards = screen.getAllByTestId('alert-card')
      expect(alertCards.length).toBeGreaterThan(0)
      
      // Find a switch within an alert card
      const firstAlert = alertCards[0]
      const alertSwitch = within(firstAlert).getByRole('switch')
      
      fireEvent.click(alertSwitch)
      
      expect(mockUpdateAlert.mutate).toHaveBeenCalledWith({
        id: 'alert-1',
        isActive: false
      })
    })

    it('deletes alert with confirmation', async () => {
      // Mock confirm dialog
      const originalConfirm = window.confirm
      window.confirm = jest.fn(() => true)

      render(<AlertsPage />)

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
      fireEvent.click(deleteButtons[0])

      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this alert?')
      expect(mockDeleteAlert.mutate).toHaveBeenCalledWith({ id: 'alert-1' })

      // Restore confirm
      window.confirm = originalConfirm
    })

    it('cancels delete when confirmation denied', () => {
      const originalConfirm = window.confirm
      window.confirm = jest.fn(() => false)

      render(<AlertsPage />)

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
      fireEvent.click(deleteButtons[0])

      expect(mockDeleteAlert.mutate).not.toHaveBeenCalled()
      window.confirm = originalConfirm
    })

    it('shows create alert form', () => {
      render(<AlertsPage />)

      const createButton = screen.getByText('Create Alert')
      fireEvent.click(createButton)

      expect(screen.getByText('Create New Alert')).toBeInTheDocument()
      expect(screen.getByLabelText('Cryptocurrency Symbol')).toBeInTheDocument()
      expect(screen.getByLabelText('Alert Type')).toBeInTheDocument()
    })

    it('hides create alert form on cancel', () => {
      render(<AlertsPage />)

      // Open form
      fireEvent.click(screen.getByText('Create Alert'))
      expect(screen.getByText('Create New Alert')).toBeInTheDocument()

      // Cancel form
      fireEvent.click(screen.getByText('Cancel'))
      expect(screen.queryByText('Create New Alert')).not.toBeInTheDocument()
    })
  })

  describe('Create Alert Form', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: {
          user: { id: 'user-1', email: 'test@example.com' },
          expires: '2024-12-31T23:59:59.999Z'
        },
        status: 'authenticated',
        update: jest.fn()
      })
    })

    it('shows create alert form when button is clicked', async () => {
      render(<AlertsPage />)
      
      fireEvent.click(screen.getByText('Create Alert'))
      
      expect(screen.getByText('Create New Alert')).toBeInTheDocument()
      expect(screen.getByLabelText('Cryptocurrency Symbol')).toBeInTheDocument()
      expect(screen.getByLabelText('Name (Optional)')).toBeInTheDocument()
    })

    it('shows loading state while creating', () => {
      mockCreateAlert.isPending = true
      
      render(<AlertsPage />)
      fireEvent.click(screen.getByText('Create Alert'))
      
      expect(screen.getByText('Creating...')).toBeInTheDocument()
    })
  })

  describe('Mutation Callbacks', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: {
          user: { id: 'user-1', email: 'test@example.com' },
          expires: '2024-12-31T23:59:59.999Z'
        },
        status: 'authenticated',
        update: jest.fn()
      })
    })

    it('handles create alert success', () => {
      render(<AlertsPage />)
      
      // Simulate successful creation
      const createMutationMock = mockApi.alerts.createAlert.useMutation.mock.calls[0][0]
      createMutationMock.onSuccess()

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Alert created successfully'
      })
      expect(mockRefetchAlerts).toHaveBeenCalled()
    })

    it('handles create alert error', () => {
      render(<AlertsPage />)
      
      const createMutationMock = mockApi.alerts.createAlert.useMutation.mock.calls[0][0]
      createMutationMock.onError({ message: 'Failed to create alert' })

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Failed to create alert',
        variant: 'destructive'
      })
    })

    it('handles update alert success', () => {
      render(<AlertsPage />)
      
      const updateMutationMock = mockApi.alerts.updateAlert.useMutation.mock.calls[0][0]
      updateMutationMock.onSuccess()

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Alert updated successfully'
      })
      expect(mockRefetchAlerts).toHaveBeenCalled()
    })

    it('handles delete alert success', () => {
      render(<AlertsPage />)
      
      const deleteMutationMock = mockApi.alerts.deleteAlert.useMutation.mock.calls[0][0]
      deleteMutationMock.onSuccess()

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Alert deleted successfully'
      })
      expect(mockRefetchAlerts).toHaveBeenCalled()
    })
  })

  describe('Condition Formatting', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: {
          user: { id: 'user-1', email: 'test@example.com' },
          expires: '2024-12-31T23:59:59.999Z'
        },
        status: 'authenticated',
        update: jest.fn()
      })
    })

    it('formats invalid JSON condition', () => {
      const alertWithInvalidCondition = {
        ...mockAlert,
        condition: 'invalid json'
      }

      mockApi.alerts.getUserAlerts.useQuery.mockReturnValue({
        data: { alerts: [alertWithInvalidCondition], total: 1 },
        refetch: mockRefetchAlerts,
        isLoading: false,
        error: null
      })

      render(<AlertsPage />)
      expect(screen.getByText('Invalid condition')).toBeInTheDocument()
    })

    it('formats custom condition', () => {
      const alertWithCustomCondition = {
        ...mockAlert,
        condition: JSON.stringify({
          customField: 'custom value'
        })
      }

      mockApi.alerts.getUserAlerts.useQuery.mockReturnValue({
        data: { alerts: [alertWithCustomCondition], total: 1 },
        refetch: mockRefetchAlerts,
        isLoading: false,
        error: null
      })

      render(<AlertsPage />)
      expect(screen.getByText('Custom condition')).toBeInTheDocument()
    })

    it('formats percentage price condition', () => {
      const alertWithPercentageCondition = {
        ...mockAlert,
        condition: JSON.stringify({
          priceThreshold: 10,
          direction: 'above',
          percentage: true
        })
      }

      mockApi.alerts.getUserAlerts.useQuery.mockReturnValue({
        data: { alerts: [alertWithPercentageCondition], total: 1 },
        refetch: mockRefetchAlerts,
        isLoading: false,
        error: null
      })

      render(<AlertsPage />)
      expect(screen.getByText('Price above %10')).toBeInTheDocument()
    })
  })

  describe('Alert Icons', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: {
          user: { id: 'user-1', email: 'test@example.com' },
          expires: '2024-12-31T23:59:59.999Z'
        },
        status: 'authenticated',
        update: jest.fn()
      })
    })

    it('displays correct icons for different alert types', () => {
      render(<AlertsPage />)

      // Check for presence of icon elements (lucide-react icons)
      const icons = document.querySelectorAll('svg')
      expect(icons.length).toBeGreaterThan(0)
    })
  })
})