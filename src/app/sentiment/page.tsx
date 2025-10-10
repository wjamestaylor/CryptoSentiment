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
                      {analysis.score}/100
                    </div>
                  </div>
                </div>

                {analysis.reasoning && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600 font-medium mb-2">AI Analysis</div>
                    <div className="text-gray-800">{analysis.reasoning}</div>
                  </div>
                )}

                {analysis.factors && analysis.factors.length > 0 && (
                  <div>
                    <div className="text-sm text-gray-600 font-medium mb-2">Key Factors</div>
                    <div className="flex flex-wrap gap-2">
                      {analysis.factors.map((factor: string, index: number) => (
                        <span 
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {factor}
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