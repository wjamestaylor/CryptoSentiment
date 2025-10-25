import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import {
  saveAuthTokens,
  getAuthTokens,
  clearAuthTokens,
  saveUserData,
  getUserData,
  isAuthenticated as checkAuth,
} from '../utils/auth';
import type { User } from '../types/api';

// Complete web browser auth session
WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Google OAuth configuration
  const discovery = {
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
  };

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: Constants.expoConfig?.extra?.googleClientId || '',
      scopes: ['openid', 'profile', 'email'],
      redirectUri: AuthSession.makeRedirectUri({
        scheme: 'cryptosentiment',
      }),
    },
    discovery
  );

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      const { code } = response.params;
      handleAuthCallback(code);
    }
  }, [response]);

  async function checkAuthStatus() {
    try {
      const authenticated = await checkAuth();
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        const userData = await getUserData();
        setUser(userData);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAuthCallback(code: string) {
    try {
      // Exchange code for tokens with backend
      // This would call your backend API endpoint
      const response = await fetch(
        `${Constants.expoConfig?.extra?.apiUrl}/api/auth/mobile/google`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        }
      );

      const data = await response.json();
      
      if (data.success && data.tokens) {
        await saveAuthTokens(data.tokens);
        await saveUserData(data.user);
        setUser(data.user);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error handling auth callback:', error);
    }
  }

  async function signIn() {
    try {
      await promptAsync();
    } catch (error) {
      console.error('Error signing in:', error);
    }
  }

  async function signOut() {
    try {
      await clearAuthTokens();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  async function refreshUser() {
    try {
      const userData = await getUserData();
      setUser(userData);
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        signIn,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
