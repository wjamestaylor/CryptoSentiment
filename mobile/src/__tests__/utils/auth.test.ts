import * as auth from '../../utils/auth';
import * as SecureStore from 'expo-secure-store';

jest.mock('expo-secure-store');

describe('Auth Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveAuthTokens', () => {
    it('should save tokens to secure store', async () => {
      const tokens = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
      };

      (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);

      await auth.saveAuthTokens(tokens);

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'auth_token',
        JSON.stringify(tokens)
      );
    });

    it('should throw error if save fails', async () => {
      const tokens = {
        accessToken: 'test-access-token',
      };

      (SecureStore.setItemAsync as jest.Mock).mockRejectedValue(
        new Error('Save failed')
      );

      await expect(auth.saveAuthTokens(tokens)).rejects.toThrow('Save failed');
    });
  });

  describe('getAuthTokens', () => {
    it('should retrieve tokens from secure store', async () => {
      const tokens = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
      };

      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(
        JSON.stringify(tokens)
      );

      const result = await auth.getAuthTokens();

      expect(result).toEqual(tokens);
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('auth_token');
    });

    it('should return null if no tokens exist', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      const result = await auth.getAuthTokens();

      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockRejectedValue(
        new Error('Read failed')
      );

      const result = await auth.getAuthTokens();

      expect(result).toBeNull();
    });
  });

  describe('clearAuthTokens', () => {
    it('should delete tokens from secure store', async () => {
      (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);

      await auth.clearAuthTokens();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('user_data');
    });
  });

  describe('isAuthenticated', () => {
    it('should return true if tokens exist', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(
        JSON.stringify({ accessToken: 'test-token' })
      );

      const result = await auth.isAuthenticated();

      expect(result).toBe(true);
    });

    it('should return false if no tokens exist', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      const result = await auth.isAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe('saveUserData', () => {
    it('should save user data to secure store', async () => {
      const user = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
      };

      (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);

      await auth.saveUserData(user);

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'user_data',
        JSON.stringify(user)
      );
    });
  });

  describe('getUserData', () => {
    it('should retrieve user data from secure store', async () => {
      const user = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
      };

      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(
        JSON.stringify(user)
      );

      const result = await auth.getUserData();

      expect(result).toEqual(user);
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('user_data');
    });

    it('should return null if no user data exists', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      const result = await auth.getUserData();

      expect(result).toBeNull();
    });
  });
});
