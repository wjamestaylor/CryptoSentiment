/**
 * @jest-environment jsdom
 */

import { formatCurrency, formatPercentage, getSentimentLabel, formatDate } from '@/lib/utils'

describe('Utility Functions', () => {
  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56')
      expect(formatCurrency(0.001234)).toBe('$0.00')
    })

    it('should format different currencies correctly', () => {
      expect(formatCurrency(1234.56, 'EUR')).toContain('1,234.56')
      expect(formatCurrency(1234.56, 'GBP')).toContain('1,234.56')
      expect(formatCurrency(1234.56, 'JPY')).toContain('1,235') // JPY has no decimals
    })
  })

  describe('formatDate', () => {
    it('should format date with default timezone', () => {
      const date = new Date('2024-01-15T12:30:00Z')
      const formatted = formatDate(date)
      expect(formatted).toContain('Jan')
      expect(formatted).toContain('15')
      expect(formatted).toContain('2024')
    })

    it('should format date with custom timezone', () => {
      const date = new Date('2024-01-15T12:30:00Z')
      const formatted = formatDate(date, 'America/New_York')
      expect(formatted).toContain('2024')
    })

    it('should handle string dates', () => {
      const formatted = formatDate('2024-01-15T12:30:00Z')
      expect(formatted).toContain('Jan')
      expect(formatted).toContain('15')
      expect(formatted).toContain('2024')
    })

    it('should accept custom format options', () => {
      const date = new Date('2024-01-15T12:30:00Z')
      const formatted = formatDate(date, 'UTC', { 
        year: 'numeric',
        month: 'long',
      })
      expect(formatted).toContain('January')
      expect(formatted).toContain('2024')
    })
  })

  describe('formatPercentage', () => {
    it('should format positive percentages with plus sign', () => {
      expect(formatPercentage(5.2)).toBe('+5.20%')
    })

    it('should format negative percentages without double negative', () => {
      expect(formatPercentage(-3.45)).toBe('-3.45%')
    })

    it('should handle zero', () => {
      expect(formatPercentage(0)).toBe('0.00%')
    })
  })

  describe('getSentimentLabel', () => {
    it('should return correct sentiment labels', () => {
      expect(getSentimentLabel(0.9)).toBe('Very Bullish')
      expect(getSentimentLabel(0.7)).toBe('Bullish')
      expect(getSentimentLabel(0.5)).toBe('Neutral')
      expect(getSentimentLabel(0.3)).toBe('Bearish')
      expect(getSentimentLabel(0.1)).toBe('Very Bearish')
    })
  })
})