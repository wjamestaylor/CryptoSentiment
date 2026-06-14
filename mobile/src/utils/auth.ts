import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

/**
 * Securely store authentication tokens
 */
export async function saveAuthTokens(tokens: AuthTokens): Promise<void> {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(tokens));
  } catch (error) {
    console.error('Error saving auth tokens:', error);
    throw error;
  }
}

/**
 * Retrieve stored authentication tokens
 */
export async function getAuthTokens(): Promise<AuthTokens | null> {
  try {
    const tokens = await SecureStore.getItemAsync(TOKEN_KEY);
    return tokens ? JSON.parse(tokens) : null;
  } catch (error) {
    console.error('Error retrieving auth tokens:', error);
    return null;
  }
}

/**
 * Remove stored authentication tokens
 */
export async function clearAuthTokens(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  } catch (error) {
    console.error('Error clearing auth tokens:', error);
    throw error;
  }
}

/**
 * Store user data
 */
export async function saveUserData(user: any): Promise<void> {
  try {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Error saving user data:', error);
    throw error;
  }
}

/**
 * Retrieve stored user data
 */
export async function getUserData(): Promise<any | null> {
  try {
    const userData = await SecureStore.getItemAsync(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error retrieving user data:', error);
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const tokens = await getAuthTokens();
  return tokens !== null && tokens.accessToken !== '';
}
