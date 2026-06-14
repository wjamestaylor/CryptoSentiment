/**
 * Type definitions for the tRPC API
 * These types are shared with the backend AppRouter
 */

// Placeholder for AppRouter type - will be replaced with actual type from backend
export type AppRouter = any;

// Common response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Crypto types
export interface Cryptocurrency {
  id: string;
  name: string;
  symbol: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  image?: string;
}

// User types
export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  subscriptionTier?: 'FREE' | 'PRO' | 'BUSINESS';
}

// Alert types
export interface Alert {
  id: string;
  userId: string;
  coinId: string;
  type: 'PRICE_ABOVE' | 'PRICE_BELOW' | 'SENTIMENT';
  value: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Portfolio types
export interface PortfolioItem {
  id: string;
  userId: string;
  coinId: string;
  coinName: string;
  symbol: string;
  amount: number;
  purchasePrice: number;
  currentPrice: number;
  totalValue: number;
  profitLoss: number;
  profitLossPercentage: number;
}
