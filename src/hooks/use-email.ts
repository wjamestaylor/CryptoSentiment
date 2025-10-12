import { useState } from 'react';

export interface RegistrationResult {
  success: boolean;
  error?: string;
}

export interface EmailTestResult {
  success: boolean;
  message: string;
  error?: string;
  timestamp: string;
  email?: string;
  alertType?: string;
  subject?: string;
  userId?: string;
}

/**
 * Hook to handle post-registration tasks like sending welcome emails
 */
export function useUserRegistration() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<RegistrationResult | null>(null);

  const handleNewUserRegistration = async (userId: string): Promise<RegistrationResult> => {
    setIsProcessing(true);
    
    try {
      // Call the registration service via API
      const response = await fetch('/api/test/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'handle-registration',
          userId,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setLastResult({ success: true });
        return { success: true };
      } else {
        setLastResult({ success: false, error: result.error || 'Registration processing failed' });
        return { success: false, error: result.error || 'Registration processing failed' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setLastResult({ success: false, error: errorMessage });
      return { success: false, error: errorMessage };
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    handleNewUserRegistration,
    isProcessing,
    lastResult,
  };
}

/**
 * Hook to send test emails (for development/testing)
 */
export function useEmailTesting() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<EmailTestResult | null>(null);

  const testEmailConnection = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/test/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'test-connection' }),
      });
      
      const result = await response.json();
      setLastResult(result);
      return result;
    } catch (error) {
      const errorResult: EmailTestResult = { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to test email connection',
        timestamp: new Date().toISOString(),
      };
      setLastResult(errorResult);
      return errorResult;
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestWelcomeEmail = async (email: string, name?: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/test/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'send-welcome',
          email,
          name,
        }),
      });
      
      const result = await response.json();
      setLastResult(result);
      return result;
    } catch (error) {
      const errorResult: EmailTestResult = { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to send welcome email',
        timestamp: new Date().toISOString(),
      };
      setLastResult(errorResult);
      return errorResult;
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestAlertEmail = async (params: {
    email: string;
    name?: string;
    cryptoName?: string;
    cryptoSymbol?: string;
    alertType?: string;
    title?: string;
    message?: string;
  }) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/test/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'send-alert',
          ...params,
        }),
      });
      
      const result = await response.json();
      setLastResult(result);
      return result;
    } catch (error) {
      const errorResult: EmailTestResult = { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to send alert email',
        timestamp: new Date().toISOString(),
      };
      setLastResult(errorResult);
      return errorResult;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    testEmailConnection,
    sendTestWelcomeEmail,
    sendTestAlertEmail,
    isLoading,
    lastResult,
  };
}