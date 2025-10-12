import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useSearchParams } from 'next/navigation';
import SentimentPage from '@/app/sentiment/page';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.Mock;

// Mock search params
const mockUseSearchParams = useSearchParams as jest.Mock;

// Sample sentiment analysis response
const mockSentimentAnalysis = {
  score: 0.3,
  sentiment: 'positive',
  confidence: 0.85,
  timestamp: '2023-10-12T10:30:00Z',
  requestId: 'req-123',
  dataSource: 'live',
  reasoning: 'The cryptocurrency shows strong market performance with positive technical indicators and growing institutional adoption.',
  priceData: {
    current_price: 45000,
    price_change_24h: 2.5,
    volume_24h: 25000000000,
    market_cap: 850000000000,
  },
  factors: [
    {
      description: 'Strong institutional adoption with major companies adding Bitcoin to their balance sheets',
      impact: 'positive' as const,
      source: 'Financial News',
      sourceUrl: 'https://example.com/news1',
      confidence: 0.9,
      type: 'institutional_adoption',
    },
    {
      description: 'Recent regulatory clarity from major financial jurisdictions',
      impact: 'positive' as const,
      source: 'Regulatory Updates',
      sourceUrl: 'https://example.com/news2',
      confidence: 0.8,
      type: 'regulatory_news',
    },
    {
      description: 'Market volatility concerns due to macroeconomic uncertainty',
      impact: 'negative' as const,
      source: 'Market Analysis',
      confidence: 0.7,
      type: 'market_volatility',
    },
  ],
};

describe('SentimentPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock: no search params
    mockUseSearchParams.mockReturnValue({
      get: jest.fn().mockReturnValue(null),
    });
    
    // Mock successful fetch response
    mockFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockSentimentAnalysis),
    });
  });

  describe('Component Rendering', () => {
    it('renders the main page structure', () => {
      render(<SentimentPage />);

      expect(screen.getByText('Crypto Sentiment Analysis')).toBeInTheDocument();
      expect(screen.getByText('Analyze Cryptocurrency Sentiment')).toBeInTheDocument();
      expect(screen.getByText('Get AI-powered sentiment analysis for any cryptocurrency')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter cryptocurrency (e.g., bitcoin, ethereum)')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Analyze' })).toBeInTheDocument();
    });

    it('renders loading fallback initially', () => {
      render(<SentimentPage />);
      
      // Should show loading spinner in suspense fallback
      // Note: Due to Suspense, this might not be visible in tests, but the component structure should be there
    });

    it('shows default input state', () => {
      render(<SentimentPage />);

      const input = screen.getByPlaceholderText('Enter cryptocurrency (e.g., bitcoin, ethereum)');
      expect(input).toHaveValue('bitcoin'); // Default value
      
      const analyzeButton = screen.getByRole('button', { name: 'Analyze' });
      expect(analyzeButton).not.toBeDisabled();
    });
  });

  describe('URL Parameters', () => {
    it('sets cryptocurrency from URL parameter', () => {
      mockUseSearchParams.mockReturnValue({
        get: jest.fn().mockReturnValue('ethereum'),
      });

      render(<SentimentPage />);

      const input = screen.getByPlaceholderText('Enter cryptocurrency (e.g., bitcoin, ethereum)');
      expect(input).toHaveValue('ethereum');
    });

    it('auto-analyzes when crypto parameter is provided', async () => {
      mockUseSearchParams.mockReturnValue({
        get: jest.fn().mockReturnValue('bitcoin'),
      });

      render(<SentimentPage />);

      // Should automatically trigger analysis
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/sentiment/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ cryptocurrency: 'bitcoin' }),
        });
      });
    });

    it('handles empty URL parameter gracefully', () => {
      mockUseSearchParams.mockReturnValue({
        get: jest.fn().mockReturnValue(''),
      });

      render(<SentimentPage />);

      const input = screen.getByPlaceholderText('Enter cryptocurrency (e.g., bitcoin, ethereum)');
      expect(input).toHaveValue('bitcoin'); // Should fall back to default
    });
  });

  describe('User Interactions', () => {
    it('updates input value when user types', () => {
      render(<SentimentPage />);

      const input = screen.getByPlaceholderText('Enter cryptocurrency (e.g., bitcoin, ethereum)');
      fireEvent.change(input, { target: { value: 'ethereum' } });

      expect(input).toHaveValue('ethereum');
    });

    it('disables analyze button when input is empty', () => {
      render(<SentimentPage />);

      const input = screen.getByPlaceholderText('Enter cryptocurrency (e.g., bitcoin, ethereum)');
      const analyzeButton = screen.getByRole('button', { name: 'Analyze' });

      fireEvent.change(input, { target: { value: '' } });
      expect(analyzeButton).toBeDisabled();

      fireEvent.change(input, { target: { value: '   ' } }); // Whitespace only
      expect(analyzeButton).toBeDisabled();
    });

    it('enables analyze button when input has content', () => {
      render(<SentimentPage />);

      const input = screen.getByPlaceholderText('Enter cryptocurrency (e.g., bitcoin, ethereum)');
      const analyzeButton = screen.getByRole('button', { name: 'Analyze' });

      fireEvent.change(input, { target: { value: 'ethereum' } });
      expect(analyzeButton).not.toBeDisabled();
    });

    it('triggers analysis when analyze button is clicked', async () => {
      render(<SentimentPage />);

      const analyzeButton = screen.getByRole('button', { name: 'Analyze' });
      fireEvent.click(analyzeButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/sentiment/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ cryptocurrency: 'bitcoin' }),
        });
      });
    });
  });

  describe('Loading States', () => {
    it('shows loading state during analysis', async () => {
      // Mock a delayed response
      mockFetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve(mockSentimentAnalysis),
        }), 100))
      );

      render(<SentimentPage />);

      const analyzeButton = screen.getByRole('button', { name: 'Analyze' });
      fireEvent.click(analyzeButton);

      // Should show loading state
      expect(screen.getByRole('button', { name: 'Analyzing...' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Analyzing...' })).toBeDisabled();

      // Wait for analysis to complete
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Analyze' })).toBeInTheDocument();
      });
    });

    it('disables button during loading', async () => {
      mockFetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve(mockSentimentAnalysis),
        }), 100))
      );

      render(<SentimentPage />);

      const analyzeButton = screen.getByRole('button', { name: 'Analyze' });
      fireEvent.click(analyzeButton);

      expect(analyzeButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('displays error when API request fails', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      render(<SentimentPage />);

      const analyzeButton = screen.getByRole('button', { name: 'Analyze' });
      fireEvent.click(analyzeButton);

      await waitFor(() => {
        expect(screen.getByText('Error: Network error')).toBeInTheDocument();
      });
    });

    it('displays error when API returns non-ok response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      render(<SentimentPage />);

      const analyzeButton = screen.getByRole('button', { name: 'Analyze' });
      fireEvent.click(analyzeButton);

      await waitFor(() => {
        expect(screen.getByText('Error: HTTP error! status: 500')).toBeInTheDocument();
      });
    });

    it('clears previous errors when starting new analysis', async () => {
      // First request fails
      mockFetch.mockRejectedValueOnce(new Error('First error'));

      render(<SentimentPage />);

      const analyzeButton = screen.getByRole('button', { name: 'Analyze' });
      fireEvent.click(analyzeButton);

      await waitFor(() => {
        expect(screen.getByText('Error: First error')).toBeInTheDocument();
      });

      // Second request succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockSentimentAnalysis),
      });

      fireEvent.click(analyzeButton);

      await waitFor(() => {
        expect(screen.queryByText('Error: First error')).not.toBeInTheDocument();
      });
    });
  });

  describe('Analysis Results Display', () => {
    beforeEach(async () => {
      render(<SentimentPage />);

      const analyzeButton = screen.getByRole('button', { name: 'Analyze' });
      fireEvent.click(analyzeButton);

      await waitFor(() => {
        expect(screen.getByText('Sentiment Analysis Results')).toBeInTheDocument();
      });
    });

    it('displays basic sentiment metrics', () => {
      expect(screen.getByText('Overall Sentiment')).toBeInTheDocument();
      expect(screen.getByText('positive')).toBeInTheDocument(); // Lowercase as shown by CSS capitalize
      
      expect(screen.getByText('Confidence')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument(); // confidence * 100
      
      expect(screen.getByText('Score')).toBeInTheDocument();
      expect(screen.getByText('65/100')).toBeInTheDocument(); // (score + 1) * 50
    });

    it('displays AI reasoning when available', () => {
      expect(screen.getByText('AI Analysis')).toBeInTheDocument();
      expect(screen.getByText('The cryptocurrency shows strong market performance with positive technical indicators and growing institutional adoption.')).toBeInTheDocument();
    });

    it('displays market data with correct formatting', () => {
      expect(screen.getByText('Market Data Used')).toBeInTheDocument();
      expect(screen.getByText('$45,000')).toBeInTheDocument(); // Price formatting
      expect(screen.getByText('2.50%')).toBeInTheDocument(); // 24h change
      expect(screen.getByText('$25.0B')).toBeInTheDocument(); // Volume in billions
      expect(screen.getByText('$850.0B')).toBeInTheDocument(); // Market cap in billions
    });

    it('displays timestamp and request ID when available', () => {
      expect(screen.getByText(/11:30:00 PM/)).toBeInTheDocument(); // Timestamp formatted by locale
      expect(screen.getByText(/ID: req-123/)).toBeInTheDocument(); // Request ID
    });

    it('displays live data indicator', () => {
      expect(screen.getByText('🔴 LIVE DATA')).toBeInTheDocument();
    });

    it('displays sentiment factors with correct styling', () => {
      expect(screen.getByText('Key Factors')).toBeInTheDocument();
      
      // Positive factor
      expect(screen.getByText('Strong institutional adoption with major companies adding Bitcoin to their balance sheets')).toBeInTheDocument();
      expect(screen.getByText('INSTITUTIONAL ADOPTION')).toBeInTheDocument();
      
      // Negative factor
      expect(screen.getByText('Market volatility concerns due to macroeconomic uncertainty')).toBeInTheDocument();
      expect(screen.getByText('MARKET VOLATILITY')).toBeInTheDocument();
    });

    it('displays factor sources with links when available', () => {
      const financialNewsLink = screen.getByRole('link', { name: 'Financial News' });
      expect(financialNewsLink).toHaveAttribute('href', 'https://example.com/news1');
      expect(financialNewsLink).toHaveAttribute('target', '_blank');
      expect(financialNewsLink).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('Analysis Results Edge Cases', () => {
    it('handles analysis without factors', async () => {
      const analysisWithoutFactors = {
        ...mockSentimentAnalysis,
        factors: undefined,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(analysisWithoutFactors),
      });

      render(<SentimentPage />);

      const analyzeButton = screen.getByRole('button', { name: 'Analyze' });
      fireEvent.click(analyzeButton);

      await waitFor(() => {
        expect(screen.getByText('Sentiment Analysis Results')).toBeInTheDocument();
      });

      expect(screen.queryByText('Key Factors')).not.toBeInTheDocument();
    });

    it('handles analysis without price data', async () => {
      const analysisWithoutPriceData = {
        ...mockSentimentAnalysis,
        priceData: undefined,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(analysisWithoutPriceData),
      });

      render(<SentimentPage />);

      const analyzeButton = screen.getByRole('button', { name: 'Analyze' });
      fireEvent.click(analyzeButton);

      await waitFor(() => {
        expect(screen.getByText('Sentiment Analysis Results')).toBeInTheDocument();
      });

      expect(screen.queryByText('Market Data Used')).not.toBeInTheDocument();
    });

    it('handles analysis without reasoning', async () => {
      const analysisWithoutReasoning = {
        ...mockSentimentAnalysis,
        reasoning: undefined,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(analysisWithoutReasoning),
      });

      render(<SentimentPage />);

      const analyzeButton = screen.getByRole('button', { name: 'Analyze' });
      fireEvent.click(analyzeButton);

      await waitFor(() => {
        expect(screen.getByText('Sentiment Analysis Results')).toBeInTheDocument();
      });

      expect(screen.queryByText('AI Analysis')).not.toBeInTheDocument();
    });

    it('handles factors without source URLs', async () => {
      const analysisWithFactorsNoUrls = {
        ...mockSentimentAnalysis,
        factors: [
          {
            description: 'Market trend analysis shows positive momentum',
            impact: 'positive' as const,
            source: 'Technical Analysis',
            // No sourceUrl
            confidence: 0.8,
            type: 'technical_analysis',
          },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(analysisWithFactorsNoUrls),
      });

      render(<SentimentPage />);

      const analyzeButton = screen.getByRole('button', { name: 'Analyze' });
      fireEvent.click(analyzeButton);

      await waitFor(() => {
        expect(screen.getByText('Technical Analysis')).toBeInTheDocument();
      });

      // Should display source as text, not link
      const sourceText = screen.getByText('Technical Analysis');
      expect(sourceText.tagName).not.toBe('A');
    });

    it('handles empty factors array', async () => {
      const analysisWithEmptyFactors = {
        ...mockSentimentAnalysis,
        factors: [],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(analysisWithEmptyFactors),
      });

      render(<SentimentPage />);

      const analyzeButton = screen.getByRole('button', { name: 'Analyze' });
      fireEvent.click(analyzeButton);

      await waitFor(() => {
        expect(screen.getByText('Sentiment Analysis Results')).toBeInTheDocument();
      });

      expect(screen.queryByText('Key Factors')).not.toBeInTheDocument();
    });
  });

  describe('API Integration', () => {
    it('sends correct request payload', async () => {
      render(<SentimentPage />);

      const input = screen.getByPlaceholderText('Enter cryptocurrency (e.g., bitcoin, ethereum)');
      fireEvent.change(input, { target: { value: 'ethereum' } });

      const analyzeButton = screen.getByRole('button', { name: 'Analyze' });
      fireEvent.click(analyzeButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/sentiment/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ cryptocurrency: 'ethereum' }),
        });
      });
    });

    it('handles different sentiment types correctly', async () => {
      const negativeSentiment = {
        ...mockSentimentAnalysis,
        sentiment: 'negative',
        score: -0.4,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(negativeSentiment),
      });

      render(<SentimentPage />);

      const analyzeButton = screen.getByRole('button', { name: 'Analyze' });
      fireEvent.click(analyzeButton);

      await waitFor(() => {
        expect(screen.getByText('negative')).toBeInTheDocument(); // Lowercase as shown by CSS capitalize
        expect(screen.getByText('30/100')).toBeInTheDocument(); // (-0.4 + 1) * 50 = 30
      });
    });
  });
});