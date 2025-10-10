export interface User {
  id: string
  email: string
  username?: string
  name?: string
  image?: string
  subscription?: Subscription
  preferences?: UserPreferences
}

export interface Subscription {
  id: string
  tier: SubscriptionTier
  status: SubscriptionStatus
  stripeId?: string
}

export interface UserPreferences {
  emailNotifications: boolean
  pushNotifications: boolean
  discordNotifications: boolean
  telegramNotifications: boolean
  sentimentThreshold: number
  priceChangeThreshold: number
  volumeThreshold: number
  theme: string
  currency: string
  timezone: string
}

export interface Cryptocurrency {
  id: string
  symbol: string
  name: string
  logoUrl?: string
  marketCap?: number
  rank?: number
  currentPrice?: number
  priceChange24h?: number
  volume24h?: number
}

export interface SentimentAnalysis {
  id: string
  cryptoId: string
  score: number
  label: SentimentLabel
  confidence: number
  aiSummary: string
  aiReasoning: string
  modelUsed: string
  sources: NewsSource[]
  whaleActivity: WhaleActivity[]
  createdAt: Date
}

export interface NewsSource {
  id: string
  title: string
  content: string
  url: string
  publishedAt: Date
  source: string
  relevanceScore: number
}

export interface WhaleActivity {
  id: string
  amount: number
  fromAddr?: string
  toAddr?: string
  txHash: string
  timestamp: Date
}

export interface PriceData {
  id: string
  cryptoId: string
  price: number
  volume24h: number
  change24h: number
  marketCap: number
  timestamp: Date
}

export interface Alert {
  id: string
  userId: string
  cryptoId: string
  type: AlertType
  condition: string
  isActive: boolean
  lastTriggered?: Date
  triggerCount: number
}

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  content: string
  isRead: boolean
  createdAt: Date
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasNext: boolean
  hasPrevious: boolean
}

// External API Types
export interface CoinGeckoPrice {
  id: string
  symbol: string
  name: string
  current_price: number
  market_cap: number
  market_cap_rank: number
  price_change_percentage_24h: number
  total_volume: number
}

export interface WhaleAlertTransaction {
  hash: string
  amount: number
  amount_usd: number
  from: {
    address: string
    owner?: string
  }
  to: {
    address: string
    owner?: string
  }
  timestamp: number
  symbol: string
}

export interface NewsDataArticle {
  title: string
  content: string
  link: string
  pubDate: string
  source_id: string
  country: string[]
  category: string[]
  language: string
}

// Enums
export enum SubscriptionTier {
  FREE = "FREE",
  BASIC = "BASIC",
  PRO = "PRO",
  ENTERPRISE = "ENTERPRISE"
}

export enum SubscriptionStatus {
  ACTIVE = "ACTIVE",
  CANCELED = "CANCELED",
  PAST_DUE = "PAST_DUE",
  UNPAID = "UNPAID"
}

export enum SentimentLabel {
  VERY_BULLISH = "VERY_BULLISH",
  BULLISH = "BULLISH",
  NEUTRAL = "NEUTRAL",
  BEARISH = "BEARISH",
  VERY_BEARISH = "VERY_BEARISH"
}

export enum AlertType {
  SENTIMENT_CHANGE = "SENTIMENT_CHANGE",
  PRICE_CHANGE = "PRICE_CHANGE",
  VOLUME_SPIKE = "VOLUME_SPIKE",
  WHALE_ACTIVITY = "WHALE_ACTIVITY",
  NEWS_MENTION = "NEWS_MENTION"
}

export enum NotificationType {
  ALERT_TRIGGERED = "ALERT_TRIGGERED",
  SUBSCRIPTION_UPDATE = "SUBSCRIPTION_UPDATE",
  SYSTEM_ANNOUNCEMENT = "SYSTEM_ANNOUNCEMENT",
  SECURITY_NOTICE = "SECURITY_NOTICE"
}