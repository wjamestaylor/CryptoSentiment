import { toast } from '@/hooks/use-toast';

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalAlert = window.alert;

describe('toast', () => {
  let mockConsoleLog: jest.SpyInstance;
  let mockConsoleError: jest.SpyInstance;
  let mockAlert: jest.SpyInstance;

  beforeEach(() => {
    // Mock console methods
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock window.alert
    mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
  });

  afterAll(() => {
    // Restore original implementations
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    window.alert = originalAlert;
  });

  describe('default variant', () => {
    it('should log title only when no description is provided', () => {
      toast({ title: 'Success' });

      expect(mockConsoleLog).toHaveBeenCalledWith('Success');
      expect(mockConsoleError).not.toHaveBeenCalled();
      expect(mockAlert).not.toHaveBeenCalled();
    });

    it('should log title and description when both are provided', () => {
      toast({ title: 'Success', description: 'Operation completed successfully' });

      expect(mockConsoleLog).toHaveBeenCalledWith('Success: Operation completed successfully');
      expect(mockConsoleError).not.toHaveBeenCalled();
      expect(mockAlert).not.toHaveBeenCalled();
    });

    it('should use default variant when variant is not specified', () => {
      toast({ title: 'Default message' });

      expect(mockConsoleLog).toHaveBeenCalledWith('Default message');
      expect(mockConsoleError).not.toHaveBeenCalled();
      expect(mockAlert).not.toHaveBeenCalled();
    });

    it('should explicitly handle default variant', () => {
      toast({ title: 'Explicit default', variant: 'default' });

      expect(mockConsoleLog).toHaveBeenCalledWith('Explicit default');
      expect(mockConsoleError).not.toHaveBeenCalled();
      expect(mockAlert).not.toHaveBeenCalled();
    });

    it('should handle default variant with description', () => {
      toast({ 
        title: 'Info', 
        description: 'This is an informational message',
        variant: 'default' 
      });

      expect(mockConsoleLog).toHaveBeenCalledWith('Info: This is an informational message');
      expect(mockConsoleError).not.toHaveBeenCalled();
      expect(mockAlert).not.toHaveBeenCalled();
    });
  });

  describe('destructive variant', () => {
    it('should log error and show alert for destructive variant with title only', () => {
      toast({ title: 'Error occurred', variant: 'destructive' });

      expect(mockConsoleError).toHaveBeenCalledWith('Error occurred');
      expect(mockAlert).toHaveBeenCalledWith('Error: Error occurred');
      expect(mockConsoleLog).not.toHaveBeenCalled();
    });

    it('should log error and show alert for destructive variant with description', () => {
      toast({ 
        title: 'Connection Failed', 
        description: 'Unable to connect to server',
        variant: 'destructive' 
      });

      expect(mockConsoleError).toHaveBeenCalledWith('Connection Failed: Unable to connect to server');
      expect(mockAlert).toHaveBeenCalledWith('Error: Connection Failed: Unable to connect to server');
      expect(mockConsoleLog).not.toHaveBeenCalled();
    });

    it('should handle destructive variant with empty description', () => {
      toast({ 
        title: 'Critical Error', 
        description: '',
        variant: 'destructive' 
      });

      expect(mockConsoleError).toHaveBeenCalledWith('Critical Error');
      expect(mockAlert).toHaveBeenCalledWith('Error: Critical Error');
      expect(mockConsoleLog).not.toHaveBeenCalled();
    });

    it('should handle destructive variant with undefined description', () => {
      toast({ 
        title: 'System Error', 
        description: undefined,
        variant: 'destructive' 
      });

      expect(mockConsoleError).toHaveBeenCalledWith('System Error');
      expect(mockAlert).toHaveBeenCalledWith('Error: System Error');
      expect(mockConsoleLog).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle empty title', () => {
      toast({ title: '' });

      expect(mockConsoleLog).toHaveBeenCalledWith('');
      expect(mockConsoleError).not.toHaveBeenCalled();
      expect(mockAlert).not.toHaveBeenCalled();
    });

    it('should handle empty title with description', () => {
      toast({ title: '', description: 'Just description' });

      expect(mockConsoleLog).toHaveBeenCalledWith(': Just description');
      expect(mockConsoleError).not.toHaveBeenCalled();
      expect(mockAlert).not.toHaveBeenCalled();
    });

    it('should handle empty title with destructive variant', () => {
      toast({ title: '', variant: 'destructive' });

      expect(mockConsoleError).toHaveBeenCalledWith('');
      expect(mockAlert).toHaveBeenCalledWith('Error: ');
      expect(mockConsoleLog).not.toHaveBeenCalled();
    });

    it('should handle title with special characters', () => {
      const specialTitle = 'Alert! @#$%^&*()';
      toast({ title: specialTitle });

      expect(mockConsoleLog).toHaveBeenCalledWith(specialTitle);
      expect(mockConsoleError).not.toHaveBeenCalled();
      expect(mockAlert).not.toHaveBeenCalled();
    });

    it('should handle description with special characters', () => {
      const specialDescription = 'Description with <html> & "quotes"';
      toast({ title: 'Test', description: specialDescription });

      expect(mockConsoleLog).toHaveBeenCalledWith(`Test: ${specialDescription}`);
      expect(mockConsoleError).not.toHaveBeenCalled();
      expect(mockAlert).not.toHaveBeenCalled();
    });

    it('should handle very long title', () => {
      const longTitle = 'A'.repeat(1000);
      toast({ title: longTitle });

      expect(mockConsoleLog).toHaveBeenCalledWith(longTitle);
      expect(mockConsoleError).not.toHaveBeenCalled();
      expect(mockAlert).not.toHaveBeenCalled();
    });

    it('should handle very long description', () => {
      const longDescription = 'B'.repeat(1000);
      toast({ title: 'Test', description: longDescription });

      expect(mockConsoleLog).toHaveBeenCalledWith(`Test: ${longDescription}`);
      expect(mockConsoleError).not.toHaveBeenCalled();
      expect(mockAlert).not.toHaveBeenCalled();
    });
  });

  describe('multiple calls', () => {
    it('should handle multiple default toasts', () => {
      toast({ title: 'First message' });
      toast({ title: 'Second message' });
      toast({ title: 'Third message' });

      expect(mockConsoleLog).toHaveBeenCalledTimes(3);
      expect(mockConsoleLog).toHaveBeenNthCalledWith(1, 'First message');
      expect(mockConsoleLog).toHaveBeenNthCalledWith(2, 'Second message');
      expect(mockConsoleLog).toHaveBeenNthCalledWith(3, 'Third message');
      expect(mockConsoleError).not.toHaveBeenCalled();
      expect(mockAlert).not.toHaveBeenCalled();
    });

    it('should handle multiple destructive toasts', () => {
      toast({ title: 'Error 1', variant: 'destructive' });
      toast({ title: 'Error 2', variant: 'destructive' });

      expect(mockConsoleError).toHaveBeenCalledTimes(2);
      expect(mockAlert).toHaveBeenCalledTimes(2);
      expect(mockConsoleError).toHaveBeenNthCalledWith(1, 'Error 1');
      expect(mockConsoleError).toHaveBeenNthCalledWith(2, 'Error 2');
      expect(mockAlert).toHaveBeenNthCalledWith(1, 'Error: Error 1');
      expect(mockAlert).toHaveBeenNthCalledWith(2, 'Error: Error 2');
      expect(mockConsoleLog).not.toHaveBeenCalled();
    });

    it('should handle mixed variant toasts', () => {
      toast({ title: 'Info message' });
      toast({ title: 'Error message', variant: 'destructive' });
      toast({ title: 'Another info', description: 'With description' });

      expect(mockConsoleLog).toHaveBeenCalledTimes(2);
      expect(mockConsoleError).toHaveBeenCalledTimes(1);
      expect(mockAlert).toHaveBeenCalledTimes(1);

      expect(mockConsoleLog).toHaveBeenNthCalledWith(1, 'Info message');
      expect(mockConsoleError).toHaveBeenCalledWith('Error message');
      expect(mockAlert).toHaveBeenCalledWith('Error: Error message');
      expect(mockConsoleLog).toHaveBeenNthCalledWith(2, 'Another info: With description');
    });
  });

  describe('parameter validation', () => {
    it('should handle title parameter correctly', () => {
      const title = 'Test Title';
      toast({ title });

      expect(mockConsoleLog).toHaveBeenCalledWith(title);
    });

    it('should handle description parameter correctly', () => {
      const title = 'Title';
      const description = 'Description';
      toast({ title, description });

      expect(mockConsoleLog).toHaveBeenCalledWith(`${title}: ${description}`);
    });

    it('should handle variant parameter correctly', () => {
      toast({ title: 'Test', variant: 'destructive' });

      expect(mockConsoleError).toHaveBeenCalledWith('Test');
      expect(mockAlert).toHaveBeenCalledWith('Error: Test');
    });
  });

  describe('return behavior', () => {
    it('should not return anything (undefined)', () => {
      const result = toast({ title: 'Test' });

      expect(result).toBeUndefined();
    });

    it('should not return anything for destructive variant', () => {
      const result = toast({ title: 'Error', variant: 'destructive' });

      expect(result).toBeUndefined();
    });
  });
});