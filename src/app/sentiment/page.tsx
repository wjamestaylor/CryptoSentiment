'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function SentimentPage() {
  const [cryptocurrency, setCryptocurrency] = useState('bitcoin');
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeSentiment = async () => {
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
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze sentiment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Crypto Sentiment Analysis</h1>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Analyze Cryptocurrency Sentiment</CardTitle>
            <CardDescription>
              Get AI-powered sentiment analysis for any cryptocurrency
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Input
                placeholder="Enter cryptocurrency (e.g., bitcoin, ethereum)"
                value={cryptocurrency}
                onChange={(e) => setCryptocurrency(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={analyzeSentiment}
                disabled={loading || !cryptocurrency.trim()}
              >
                {loading ? 'Analyzing...' : 'Analyze'}
              </Button>
            </div>
            
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                Error: {error}
              </div>
            )}
          </CardContent>
        </Card>

        {analysis && (
          <Card>
            <CardHeader>
              <CardTitle>Sentiment Analysis Results</CardTitle>
              <CardDescription>
                AI analysis for {cryptocurrency}
                {analysis.dataSource && (
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${
                    analysis.dataSource === 'live' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {analysis.dataSource === 'live' ? '🔴 LIVE DATA' : '⚠️ SAMPLE DATA'}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm text-blue-600 font-medium">Overall Sentiment</div>
                    <div className="text-2xl font-bold text-blue-900 capitalize">
                      {analysis.sentiment}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-sm text-green-600 font-medium">Confidence</div>
                    <div className="text-2xl font-bold text-green-900">
                      {Math.round(analysis.confidence * 100)}%
                    </div>
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="text-sm text-purple-600 font-medium">Score</div>
                    <div className="text-2xl font-bold text-purple-900">
                      {Math.round((analysis.score + 1) * 50)}/100
                    </div>
                  </div>
                </div>

                {analysis.reasoning && (
                  <div className="p-4 bg-gray-50 rounded-lg">
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
                        <span className="text-gray-500">Volume:</span> ${(analysis.priceData.volume_24h / 1e9)?.toFixed(1)}B
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
                    <div className="flex flex-wrap gap-2">
                      {analysis.factors.map((factor: any, index: number) => (
                        <span 
                          key={index}
                          className={`px-3 py-1 rounded-full text-sm ${
                            factor.impact === 'positive' 
                              ? 'bg-green-100 text-green-800'
                              : factor.impact === 'negative'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {factor.description || factor}
                        </span>
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