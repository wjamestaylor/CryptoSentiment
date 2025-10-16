'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SentimentLoading } from '@/components/ui/loading';
import { useUsageLimit } from '@/hooks/use-usage-limit';
import { UsageType } from '@prisma/client';

interface SentimentFactor {
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  source?: string;
  sourceUrl?: string;
  confidence?: number;
  type?: string;
}

interface PriceData {
  current_price?: number;
  price_change_24h?: number;
  volume_24h?: number;
  market_cap?: number;
}

interface SentimentAnalysis {
  score: number;
  sentiment: string;
  confidence: number;
  factors?: SentimentFactor[];
  summary?: string;
  timestamp?: string;
  dataSource?: string;
  reasoning?: string;
  priceData?: PriceData;
  requestId?: string;
}

function SentimentPageContent() {
  const searchParams = useSearchParams();
  const cryptoParam = searchParams.get('crypto');
  
  const [cryptocurrency, setCryptocurrency] = useState(cryptoParam || 'bitcoin');
  const [analysis, setAnalysis] = useState<SentimentAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Authentication and usage limits
  const { data: session } = useSession();
  const aiAnalysisUsage = useUsageLimit(UsageType.AI_ANALYSIS);

    const analyzeSentiment = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/sentiment/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cryptocurrency }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 401) {
          throw new Error('Please sign in to use AI sentiment analysis');
        } else if (response.status === 403) {
          throw new Error(errorData.details || 'AI analysis limit reached. Please upgrade your subscription.');
        } else {
          throw new Error(errorData.details || `HTTP error! status: ${response.status}`);
        }
      }
      
      const result = await response.json();
      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze sentiment');
    } finally {
      setLoading(false);
    }
  }, [cryptocurrency]);

  // Auto-run analysis if crypto parameter is provided
  useEffect(() => {
    if (cryptoParam && cryptoParam.trim()) {
      setCryptocurrency(cryptoParam);
      // Auto-run analysis after a short delay to ensure state is set
      setTimeout(() => {
        analyzeSentiment();
      }, 100);
    }
  }, [cryptoParam, analyzeSentiment]);

  return (
    <div className="container mx-auto py-6 sm:py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Crypto Sentiment Analysis</h1>
        
        <Card className="mb-6 sm:mb-8">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Analyze Cryptocurrency Sentiment</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Get AI-powered sentiment analysis for any cryptocurrency
            </CardDescription>
            {session && aiAnalysisUsage && aiAnalysisUsage.limit > 0 && (
              <div className="flex items-center justify-between text-sm text-muted-foreground pt-2">
                <span>
                  AI Analysis Usage: {aiAnalysisUsage.currentUsage}/{aiAnalysisUsage.limit}
                </span>
                {aiAnalysisUsage.currentUsage >= aiAnalysisUsage.limit && (
                  <span className="text-orange-600 font-medium">Limit reached</span>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Input
                placeholder="Enter cryptocurrency (e.g., bitcoin, ethereum)"
                value={cryptocurrency}
                onChange={(e) => setCryptocurrency(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={analyzeSentiment}
                disabled={
                  loading || 
                  !cryptocurrency.trim() || 
                  !session ||
                  (session && aiAnalysisUsage?.allowed === false)
                }
                className={`w-full sm:w-auto ${
                  !session || (session && aiAnalysisUsage?.allowed === false)
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                title={
                  !session 
                    ? "Sign in to access AI analysis"
                    : aiAnalysisUsage?.allowed === false
                    ? `AI analysis limit reached (${aiAnalysisUsage.currentUsage}/${aiAnalysisUsage.limit}). Upgrade to analyze more.`
                    : "Analyze cryptocurrency sentiment"
                }
              >
                {loading ? 'Analyzing...' : 
                 !session ? 'Sign In to Analyze' :
                 aiAnalysisUsage?.allowed === false ? 'Limit Reached' :
                 'Analyze'}
              </Button>
            </div>
            
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                Error: {error}
              </div>
            )}
          </CardContent>
        </Card>

        {loading && (
          <SentimentLoading />
        )}

        {analysis && !loading && (
          <Card>
            <CardHeader>
              <CardTitle>Sentiment Analysis Results</CardTitle>
              <CardDescription>
                AI analysis for {cryptocurrency}
                {analysis.dataSource && (
                  <span className="ml-2 px-2 py-1 rounded text-xs bg-green-100 text-green-700">
                    🔴 LIVE DATA
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <div className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-medium">Overall Sentiment</div>
                    <div className="text-lg sm:text-2xl font-bold text-blue-900 dark:text-blue-100 capitalize">
                      {analysis.sentiment}
                    </div>
                  </div>
                  
                  <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <div className="text-xs sm:text-sm text-green-600 dark:text-green-400 font-medium">Confidence</div>
                    <div className="text-lg sm:text-2xl font-bold text-green-900 dark:text-green-100">
                      {Math.round(analysis.confidence * 100)}%
                    </div>
                  </div>
                  
                  <div className="p-3 sm:p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg sm:col-span-2 lg:col-span-1">
                    <div className="text-xs sm:text-sm text-purple-600 dark:text-purple-400 font-medium">Score</div>
                    <div className="text-lg sm:text-2xl font-bold text-purple-900 dark:text-purple-100">
                      {Math.round((analysis.score + 1) * 50)}/100
                    </div>
                  </div>
                </div>

                {analysis.reasoning && (
                  <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <div className="text-sm text-gray-600 font-medium mb-2">AI Analysis</div>
                    <div className="text-gray-800">{analysis.reasoning}</div>
                  </div>
                )}

                {analysis.priceData && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600 font-medium mb-2">
                      Market Data Used
                      {analysis.timestamp && (
                        <span className="ml-2 text-xs text-gray-400">
                          • {new Date(analysis.timestamp).toLocaleTimeString()}
                        </span>
                      )}
                      {analysis.requestId && (
                        <span className="ml-2 text-xs text-gray-400">
                          • ID: {analysis.requestId}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Price:</span> ${analysis.priceData.current_price?.toLocaleString()}
                      </div>
                      <div>
                        <span className="text-gray-500">24h Change:</span> {analysis.priceData.price_change_24h?.toFixed(2)}%
                      </div>
                      <div>
                        <span className="text-gray-500">Volume:</span> ${(analysis.priceData.volume_24h ? analysis.priceData.volume_24h / 1e9 : 0)?.toFixed(1)}B
                      </div>
                      {analysis.priceData.market_cap && (
                        <div>
                          <span className="text-gray-500">Market Cap:</span> ${(analysis.priceData.market_cap / 1e9)?.toFixed(1)}B
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {analysis.factors && analysis.factors.length > 0 && (
                  <div>
                    <div className="text-sm text-gray-600 font-medium mb-2">Key Factors</div>
                    <div className="space-y-2">
                      {analysis.factors.map((factor: SentimentFactor, index: number) => (
                        <div 
                          key={index}
                          className={`p-3 rounded-lg border-l-4 ${
                            factor.impact === 'positive' 
                              ? 'bg-green-50 border-green-400'
                              : factor.impact === 'negative'
                              ? 'bg-red-50 border-red-400'
                              : 'bg-blue-50 border-blue-400'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className={`text-sm font-medium ${
                                factor.impact === 'positive' 
                                  ? 'text-green-800'
                                  : factor.impact === 'negative'
                                  ? 'text-red-800'
                                  : 'text-blue-800'
                              }`}>
                                {factor.description}
                              </div>
                              {factor.source && (
                                <div className="mt-1 text-xs text-gray-600">
                                  Source: {factor.sourceUrl ? (
                                    <a 
                                      href={factor.sourceUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 underline"
                                    >
                                      {factor.source}
                                    </a>
                                  ) : (
                                    <span>{factor.source}</span>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                              factor.impact === 'positive' 
                                ? 'bg-green-100 text-green-700'
                                : factor.impact === 'negative'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {factor.type?.replace('_', ' ').toUpperCase()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function SentimentPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    }>
      <SentimentPageContent />
    </Suspense>
  );
}