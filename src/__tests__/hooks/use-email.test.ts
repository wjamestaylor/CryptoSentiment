import { renderHook, act, waitFor } from '@testing-library/react';
import { useUserRegistration, useEmailTesting } from '@/hooks/use-email';

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = fetch as jest.Mock;

describe('useUserRegistration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset fetch mock before each test
    mockFetch.mockClear();
  });

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useUserRegistration());

    expect(result.current.isProcessing).toBe(false);
    expect(result.current.lastResult).toBe(null);
    expect(typeof result.current.handleNewUserRegistration).toBe('function');
  });

  it('should handle successful user registration', async () => {
    const mockResponse = {
      success: true,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useUserRegistration());

    let registrationResult: any;

    await act(async () => {
      registrationResult = await result.current.handleNewUserRegistration('user-123');
    });

    // Check that fetch was called with correct parameters
    expect(mockFetch).toHaveBeenCalledWith('/api/test/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'handle-registration',
        userId: 'user-123',
      }),
    });

    // Check the returned result
    expect(registrationResult).toEqual({ success: true });

    // Check the hook state
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.lastResult).toEqual({ success: true });
  });

  it('should handle failed user registration with error message', async () => {
    const mockResponse = {
      success: false,
      error: 'Email service unavailable',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useUserRegistration());

    let registrationResult: any;

    await act(async () => {
      registrationResult = await result.current.handleNewUserRegistration('user-456');
    });

    expect(registrationResult).toEqual({
      success: false,
      error: 'Email service unavailable',
    });

    expect(result.current.lastResult).toEqual({
      success: false,
      error: 'Email service unavailable',
    });
  });

  it('should handle failed user registration without error message', async () => {
    const mockResponse = {
      success: false,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useUserRegistration());

    let registrationResult: any;

    await act(async () => {
      registrationResult = await result.current.handleNewUserRegistration('user-789');
    });

    expect(registrationResult).toEqual({
      success: false,
      error: 'Registration processing failed',
    });

    expect(result.current.lastResult).toEqual({
      success: false,
      error: 'Registration processing failed',
    });
  });

  it('should handle fetch network errors', async () => {
    const networkError = new Error('Network connection failed');
    mockFetch.mockRejectedValueOnce(networkError);

    const { result } = renderHook(() => useUserRegistration());

    let registrationResult: any;

    await act(async () => {
      registrationResult = await result.current.handleNewUserRegistration('user-error');
    });

    expect(registrationResult).toEqual({
      success: false,
      error: 'Network connection failed',
    });

    expect(result.current.lastResult).toEqual({
      success: false,
      error: 'Network connection failed',
    });
  });

  it('should handle unknown errors', async () => {
    mockFetch.mockRejectedValueOnce('Unknown error type');

    const { result } = renderHook(() => useUserRegistration());

    let registrationResult: any;

    await act(async () => {
      registrationResult = await result.current.handleNewUserRegistration('user-unknown');
    });

    expect(registrationResult).toEqual({
      success: false,
      error: 'Unknown error',
    });

    expect(result.current.lastResult).toEqual({
      success: false,
      error: 'Unknown error',
    });
  });

  it('should set isProcessing to true during registration and false afterward', async () => {
    let resolvePromise: (value: any) => void;
    const delayedPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    mockFetch.mockReturnValueOnce(delayedPromise);

    const { result } = renderHook(() => useUserRegistration());

    // Start the registration process
    act(() => {
      result.current.handleNewUserRegistration('user-processing');
    });

    // Should be processing
    expect(result.current.isProcessing).toBe(true);

    // Resolve the promise
    await act(async () => {
      resolvePromise({
        ok: true,
        json: async () => ({ success: true }),
      });
    });

    // Should no longer be processing
    await waitFor(() => {
      expect(result.current.isProcessing).toBe(false);
    });
  });
});

describe('useEmailTesting', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useEmailTesting());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.lastResult).toBe(null);
    expect(typeof result.current.testEmailConnection).toBe('function');
    expect(typeof result.current.sendTestWelcomeEmail).toBe('function');
    expect(typeof result.current.sendTestAlertEmail).toBe('function');
  });

  describe('testEmailConnection', () => {
    it('should test email connection successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Connection successful',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useEmailTesting());

      let connectionResult: any;

      await act(async () => {
        connectionResult = await result.current.testEmailConnection();
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/test/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'test-connection' }),
      });

      expect(connectionResult).toEqual(mockResponse);
      expect(result.current.lastResult).toEqual(mockResponse);
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle connection test errors', async () => {
      const error = new Error('Connection failed');
      mockFetch.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useEmailTesting());

      let connectionResult: any;

      await act(async () => {
        connectionResult = await result.current.testEmailConnection();
      });

      const expectedResult = {
        success: false,
        error: 'Connection failed',
      };

      expect(connectionResult).toEqual(expectedResult);
      expect(result.current.lastResult).toEqual(expectedResult);
    });
  });

  describe('sendTestWelcomeEmail', () => {
    it('should send welcome email with name', async () => {
      const mockResponse = {
        success: true,
        messageId: 'welcome-123',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useEmailTesting());

      let emailResult: any;

      await act(async () => {
        emailResult = await result.current.sendTestWelcomeEmail('test@example.com', 'John Doe');
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/test/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'send-welcome',
          email: 'test@example.com',
          name: 'John Doe',
        }),
      });

      expect(emailResult).toEqual(mockResponse);
      expect(result.current.lastResult).toEqual(mockResponse);
    });

    it('should send welcome email without name', async () => {
      const mockResponse = {
        success: true,
        messageId: 'welcome-456',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useEmailTesting());

      await act(async () => {
        await result.current.sendTestWelcomeEmail('test@example.com');
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/test/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'send-welcome',
          email: 'test@example.com',
          name: undefined,
        }),
      });
    });

    it('should handle welcome email sending errors', async () => {
      const error = new Error('SMTP error');
      mockFetch.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useEmailTesting());

      let emailResult: any;

      await act(async () => {
        emailResult = await result.current.sendTestWelcomeEmail('invalid@example.com');
      });

      const expectedResult = {
        success: false,
        error: 'SMTP error',
      };

      expect(emailResult).toEqual(expectedResult);
      expect(result.current.lastResult).toEqual(expectedResult);
    });
  });

  describe('sendTestAlertEmail', () => {
    it('should send alert email with all parameters', async () => {
      const mockResponse = {
        success: true,
        messageId: 'alert-789',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useEmailTesting());

      const alertParams = {
        email: 'trader@example.com',
        name: 'Jane Trader',
        cryptoName: 'Bitcoin',
        cryptoSymbol: 'BTC',
        alertType: 'PRICE_CHANGE',
        title: 'Bitcoin Price Alert',
        message: 'Bitcoin has reached your target price',
      };

      let emailResult: any;

      await act(async () => {
        emailResult = await result.current.sendTestAlertEmail(alertParams);
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/test/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'send-alert',
          ...alertParams,
        }),
      });

      expect(emailResult).toEqual(mockResponse);
      expect(result.current.lastResult).toEqual(mockResponse);
    });

    it('should send alert email with minimal parameters', async () => {
      const mockResponse = {
        success: true,
        messageId: 'alert-minimal',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useEmailTesting());

      const minimalParams = {
        email: 'user@example.com',
      };

      await act(async () => {
        await result.current.sendTestAlertEmail(minimalParams);
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/test/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'send-alert',
          email: 'user@example.com',
        }),
      });
    });

    it('should handle alert email sending errors', async () => {
      mockFetch.mockRejectedValueOnce('Server error');

      const { result } = renderHook(() => useEmailTesting());

      let emailResult: any;

      await act(async () => {
        emailResult = await result.current.sendTestAlertEmail({
          email: 'error@example.com',
        });
      });

      const expectedResult = {
        success: false,
        error: 'Unknown error',
      };

      expect(emailResult).toEqual(expectedResult);
      expect(result.current.lastResult).toEqual(expectedResult);
    });
  });

  it('should set isLoading to true during operations and false afterward', async () => {
    let resolvePromise: (value: any) => void;
    const delayedPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    mockFetch.mockReturnValueOnce(delayedPromise);

    const { result } = renderHook(() => useEmailTesting());

    // Start the operation
    act(() => {
      result.current.testEmailConnection();
    });

    // Should be loading
    expect(result.current.isLoading).toBe(true);

    // Resolve the promise
    await act(async () => {
      resolvePromise({
        ok: true,
        json: async () => ({ success: true }),
      });
    });

    // Should no longer be loading
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should maintain loading state across different operations', async () => {
    const { result } = renderHook(() => useEmailTesting());

    // Mock multiple successful responses
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

    // Test connection
    await act(async () => {
      await result.current.testEmailConnection();
    });

    expect(result.current.isLoading).toBe(false);

    // Send welcome email
    await act(async () => {
      await result.current.sendTestWelcomeEmail('test@example.com');
    });

    expect(result.current.isLoading).toBe(false);
  });
});