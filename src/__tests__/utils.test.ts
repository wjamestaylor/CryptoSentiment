/**
 * @jest-environment jsdom
 */

import { formatCurrency, formatPercentage, getSentimentLabel } from '@/lib/utils'

describe('Utility Functions', () => {
  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56')
      expect(formatCurrency(0.001234)).toBe('$0.00')
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