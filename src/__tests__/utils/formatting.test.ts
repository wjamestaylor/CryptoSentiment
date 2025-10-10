import { 
  formatCurrency, 
  formatPercentage, 
  formatNumber, 
  truncateAddress,
  timeAgo,
  getSentimentColor,
  getSentimentLabel,
  cn
} from '@/lib/utils';

describe('Currency and Number Formatting', () => {
  describe('formatCurrency', () => {
    it('should format positive currency values', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(0)).toBe('$0.00');
      expect(formatCurrency(0.99)).toBe('$0.99');
    });

    it('should format negative currency values', () => {
      expect(formatCurrency(-1234.56)).toBe('-$1,234.56');
      expect(formatCurrency(-0.99)).toBe('-$0.99');
    });

    it('should handle very large numbers', () => {
      expect(formatCurrency(1234567890.12)).toBe('$1,234,567,890.12');
    });

    it('should handle different currencies', () => {
      expect(formatCurrency(1000, 'EUR')).toBe('€1,000.00');
      expect(formatCurrency(1000, 'GBP')).toBe('£1,000.00');
    });
  });

  describe('formatPercentage', () => {
    it('should format positive percentages', () => {
      expect(formatPercentage(5.5)).toBe('+5.50%');
      expect(formatPercentage(0.1)).toBe('+0.10%');
      expect(formatPercentage(100)).toBe('+100.00%');
    });

    it('should format negative percentages', () => {
      expect(formatPercentage(-5.5)).toBe('-5.50%');
      expect(formatPercentage(-0.1)).toBe('-0.10%');
      expect(formatPercentage(-100)).toBe('-100.00%');
    });

    it('should format zero percentage', () => {
      expect(formatPercentage(0)).toBe('0.00%');
    });
  });

  describe('formatNumber', () => {
    it('should format numbers with commas', () => {
      expect(formatNumber(1234)).toBe('1,234');
      expect(formatNumber(1234567)).toBe('1,234,567');
      expect(formatNumber(0)).toBe('0');
    });

    it('should handle negative numbers', () => {
      expect(formatNumber(-1234)).toBe('-1,234');
    });

    it('should handle decimal numbers', () => {
      expect(formatNumber(1234.56)).toBe('1,234.56');
    });
  });

  describe('truncateAddress', () => {
    it('should truncate long addresses', () => {
      const address = '0x1234567890abcdef1234567890abcdef12345678';
      expect(truncateAddress(address)).toBe('0x1234...345678');
    });

    it('should handle custom character length', () => {
      const address = '0x1234567890abcdef1234567890abcdef12345678';
      expect(truncateAddress(address, 4)).toBe('0x12...5678');
      expect(truncateAddress(address, 8)).toBe('0x123456...12345678');
    });

    it('should handle short addresses', () => {
      const address = '0x123456';
      expect(truncateAddress(address)).toBe('0x1234...123456');
    });
  });
});

describe('Time Utilities', () => {
  describe('timeAgo', () => {
    it('should format recent times', () => {
      const now = new Date();
      const thirtySecondsAgo = new Date(now.getTime() - 30 * 1000);
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      
      expect(timeAgo(thirtySecondsAgo)).toBe('just now');
      expect(timeAgo(fiveMinutesAgo)).toBe('5m ago');
      expect(timeAgo(twoHoursAgo)).toBe('2h ago');
    });

    it('should format older times', () => {
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      
      expect(timeAgo(threeDaysAgo)).toBe('3d ago');
    });
  });
});

describe('Sentiment Utilities', () => {
  describe('getSentimentColor', () => {
    it('should return correct colors for different sentiment scores', () => {
      expect(getSentimentColor(0.8)).toBe('text-green-500');
      expect(getSentimentColor(0.7)).toBe('text-green-500');
      expect(getSentimentColor(0.5)).toBe('text-yellow-500');
      expect(getSentimentColor(0.3)).toBe('text-yellow-500');
      expect(getSentimentColor(0.1)).toBe('text-red-500');
      expect(getSentimentColor(-0.1)).toBe('text-red-500');
    });
  });

  describe('getSentimentLabel', () => {
    it('should return correct labels for different sentiment scores', () => {
      expect(getSentimentLabel(0.9)).toBe('Very Bullish');
      expect(getSentimentLabel(0.8)).toBe('Very Bullish');
      expect(getSentimentLabel(0.7)).toBe('Bullish');
      expect(getSentimentLabel(0.6)).toBe('Bullish');
      expect(getSentimentLabel(0.5)).toBe('Neutral');
      expect(getSentimentLabel(0.4)).toBe('Neutral');
      expect(getSentimentLabel(0.3)).toBe('Bearish');
      expect(getSentimentLabel(0.2)).toBe('Bearish');
      expect(getSentimentLabel(0.1)).toBe('Very Bearish');
      expect(getSentimentLabel(0)).toBe('Very Bearish');
    });
  });
});

describe('CSS Utilities', () => {
  describe('cn (className merger)', () => {
    it('should merge class names correctly', () => {
      expect(cn('px-4', 'py-2')).toBe('px-4 py-2');
    });

    it('should handle conditional classes', () => {
      expect(cn('px-4', true && 'py-2')).toBe('px-4 py-2');
      expect(cn('px-4', false && 'py-2')).toBe('px-4');
    });

    it('should handle object classes', () => {
      expect(cn({
        'px-4': true,
        'py-2': false,
        'text-red': true
      })).toBe('px-4 text-red');
    });

    it('should merge conflicting Tailwind classes', () => {
      // twMerge should handle conflicting classes
      const result = cn('px-2 px-4');
      expect(result).toBe('px-4'); // Should keep the last one
    });

    it('should handle arrays of classes', () => {
      expect(cn(['px-4', 'py-2'], 'text-center')).toBe('px-4 py-2 text-center');
    });

    it('should handle undefined and null', () => {
      expect(cn('px-4', undefined, null, 'py-2')).toBe('px-4 py-2');
    });
  });
});