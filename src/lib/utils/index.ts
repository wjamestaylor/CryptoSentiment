import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(
  amount: number,
  currency: string = "USD"
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount)
}

export function formatDate(
  date: Date | string,
  timezone: string = "UTC",
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  };
  return new Intl.DateTimeFormat("en-US", defaultOptions).format(dateObj);
}

export function formatNumber(number: number): string {
  return new Intl.NumberFormat("en-US").format(number)
}

export function formatPercentage(value: number): string {
  if (value === 0) return '0.00%'
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`
}

export function truncateAddress(address: string, chars: number = 6): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`
}

export function timeAgo(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return "just now"
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  return `${Math.floor(diffInSeconds / 86400)}d ago`
}

export function getSentimentColor(score: number): string {
  if (score >= 0.7) return "text-green-500"
  if (score >= 0.3) return "text-yellow-500"
  return "text-red-500"
}

export function getSentimentLabel(score: number): string {
  if (score >= 0.8) return "Very Bullish"
  if (score >= 0.6) return "Bullish"
  if (score >= 0.4) return "Neutral"
  if (score >= 0.2) return "Bearish"
  return "Very Bearish"
}