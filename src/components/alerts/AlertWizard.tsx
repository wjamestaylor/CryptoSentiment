'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { HelpTooltip } from '@/components/ui/help-tooltip';
import { 
  Bell, 
  TrendingUp, 
  Volume2, 
  ChevronRight, 
  ChevronLeft,
  Check,
  AlertCircle
} from 'lucide-react';
import { AlertType } from '@prisma/client';

interface AlertWizardProps {
  onComplete: (data: AlertFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export interface AlertFormData {
  cryptoSymbol: string;
  cryptoName: string;
  type: AlertType;
  condition: {
    priceThreshold?: number;
    direction?: 'above' | 'below';
    sentimentThreshold?: number;
    sentimentDirection?: 'bullish' | 'bearish';
    volumeThreshold?: number;
  };
}

const ALERT_TYPES = [
  {
    type: AlertType.PRICE_CHANGE,
    icon: <TrendingUp className="h-6 w-6" />,
    title: 'Price Alert',
    description: 'Get notified when price reaches a specific target',
    example: 'Alert me when Bitcoin reaches $100,000',
    color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/20 border-blue-200'
  },
  {
    type: AlertType.SENTIMENT_CHANGE,
    icon: <Bell className="h-6 w-6" />,
    title: 'Sentiment Alert',
    description: 'Track changes in market sentiment and mood',
    example: 'Alert me when Ethereum sentiment becomes bullish',
    color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/20 border-purple-200'
  },
  {
    type: AlertType.VOLUME_SPIKE,
    icon: <Volume2 className="h-6 w-6" />,
    title: 'Volume Alert',
    description: 'Monitor unusual trading volume spikes',
    example: 'Alert me when Solana trading volume exceeds $1B',
    color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/20 border-orange-200'
  }
];

const STEPS = [
  { id: 'crypto', title: 'Select Crypto', description: 'Choose which cryptocurrency to monitor' },
  { id: 'type', title: 'Alert Type', description: 'Pick the type of alert you want' },
  { id: 'conditions', title: 'Set Conditions', description: 'Define when to trigger the alert' },
  { id: 'review', title: 'Review', description: 'Confirm your alert settings' }
];

export function AlertWizard({ onComplete, onCancel, isSubmitting = false }: AlertWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<AlertFormData>({
    cryptoSymbol: '',
    cryptoName: '',
    type: AlertType.PRICE_CHANGE,
    condition: {}
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      if (!formData.cryptoSymbol.trim()) {
        newErrors.cryptoSymbol = 'Please enter a cryptocurrency symbol';
      }
    } else if (step === 2) {
      if (formData.type === AlertType.PRICE_CHANGE) {
        if (!formData.condition.priceThreshold) {
          newErrors.priceThreshold = 'Please enter a price threshold';
        }
        if (!formData.condition.direction) {
          newErrors.direction = 'Please select above or below';
        }
      } else if (formData.type === AlertType.SENTIMENT_CHANGE) {
        if (!formData.condition.sentimentThreshold) {
          newErrors.sentimentThreshold = 'Please enter a sentiment threshold';
        }
        if (!formData.condition.sentimentDirection) {
          newErrors.sentimentDirection = 'Please select bullish or bearish';
        }
      } else if (formData.type === AlertType.VOLUME_SPIKE) {
        if (!formData.condition.volumeThreshold) {
          newErrors.volumeThreshold = 'Please enter a volume threshold';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        onComplete(formData);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setErrors({});
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Label htmlFor="crypto-symbol">Cryptocurrency Symbol</Label>
                <HelpTooltip content="Enter the symbol (e.g., BTC for Bitcoin, ETH for Ethereum)" />
              </div>
              <Input
                id="crypto-symbol"
                placeholder="e.g., btc, eth, sol"
                value={formData.cryptoSymbol}
                onChange={(e) => setFormData({ ...formData, cryptoSymbol: e.target.value })}
                className={errors.cryptoSymbol ? 'border-red-500' : ''}
              />
              {errors.cryptoSymbol && (
                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.cryptoSymbol}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="crypto-name">Name (Optional)</Label>
              <Input
                id="crypto-name"
                placeholder="e.g., Bitcoin, Ethereum"
                value={formData.cryptoName}
                onChange={(e) => setFormData({ ...formData, cryptoName: e.target.value })}
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            {ALERT_TYPES.map((alertType) => (
              <Card
                key={alertType.type}
                className={`cursor-pointer transition-all ${
                  formData.type === alertType.type
                    ? `border-2 ${alertType.color}`
                    : 'border hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                onClick={() => setFormData({ ...formData, type: alertType.type })}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${alertType.color}`}>
                      {alertType.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{alertType.title}</h4>
                        {formData.type === alertType.type && (
                          <Badge variant="default">Selected</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {alertType.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2 italic">
                        Example: {alertType.example}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );

      case 2:
        if (formData.type === AlertType.PRICE_CHANGE) {
          return (
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Label htmlFor="price-threshold">Price Target ($)</Label>
                  <HelpTooltip content="The price level that will trigger the alert" />
                </div>
                <Input
                  id="price-threshold"
                  type="number"
                  placeholder="50000"
                  value={formData.condition.priceThreshold || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    condition: { ...formData.condition, priceThreshold: parseFloat(e.target.value) }
                  })}
                  className={errors.priceThreshold ? 'border-red-500' : ''}
                />
                {errors.priceThreshold && (
                  <p className="text-sm text-red-600 mt-1">{errors.priceThreshold}</p>
                )}
              </div>
              <div>
                <Label>Alert When Price Goes</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <Button
                    type="button"
                    variant={formData.condition.direction === 'above' ? 'default' : 'outline'}
                    onClick={() => setFormData({
                      ...formData,
                      condition: { ...formData.condition, direction: 'above' }
                    })}
                  >
                    Above Target
                  </Button>
                  <Button
                    type="button"
                    variant={formData.condition.direction === 'below' ? 'default' : 'outline'}
                    onClick={() => setFormData({
                      ...formData,
                      condition: { ...formData.condition, direction: 'below' }
                    })}
                  >
                    Below Target
                  </Button>
                </div>
                {errors.direction && (
                  <p className="text-sm text-red-600 mt-1">{errors.direction}</p>
                )}
              </div>
            </div>
          );
        } else if (formData.type === AlertType.SENTIMENT_CHANGE) {
          return (
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Label htmlFor="sentiment-threshold">Sentiment Score (0-1)</Label>
                  <HelpTooltip content="Sentiment threshold on a 0-1 scale. Typically 0.7+ indicates bullish sentiment, while 0.3 or below indicates bearish sentiment." />
                </div>
                <Input
                  id="sentiment-threshold"
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  placeholder="0.7"
                  value={formData.condition.sentimentThreshold || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    condition: { ...formData.condition, sentimentThreshold: parseFloat(e.target.value) }
                  })}
                  className={errors.sentimentThreshold ? 'border-red-500' : ''}
                />
                {errors.sentimentThreshold && (
                  <p className="text-sm text-red-600 mt-1">{errors.sentimentThreshold}</p>
                )}
              </div>
              <div>
                <Label>Sentiment Direction</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <Button
                    type="button"
                    variant={formData.condition.sentimentDirection === 'bullish' ? 'default' : 'outline'}
                    onClick={() => setFormData({
                      ...formData,
                      condition: { ...formData.condition, sentimentDirection: 'bullish' }
                    })}
                  >
                    Bullish 📈
                  </Button>
                  <Button
                    type="button"
                    variant={formData.condition.sentimentDirection === 'bearish' ? 'default' : 'outline'}
                    onClick={() => setFormData({
                      ...formData,
                      condition: { ...formData.condition, sentimentDirection: 'bearish' }
                    })}
                  >
                    Bearish 📉
                  </Button>
                </div>
                {errors.sentimentDirection && (
                  <p className="text-sm text-red-600 mt-1">{errors.sentimentDirection}</p>
                )}
              </div>
            </div>
          );
        } else {
          return (
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Label htmlFor="volume-threshold">Volume Threshold ($)</Label>
                  <HelpTooltip content="24-hour trading volume that will trigger the alert" />
                </div>
                <Input
                  id="volume-threshold"
                  type="number"
                  placeholder="1000000000"
                  value={formData.condition.volumeThreshold || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    condition: { ...formData.condition, volumeThreshold: parseFloat(e.target.value) }
                  })}
                  className={errors.volumeThreshold ? 'border-red-500' : ''}
                />
                {errors.volumeThreshold && (
                  <p className="text-sm text-red-600 mt-1">{errors.volumeThreshold}</p>
                )}
              </div>
            </div>
          );
        }

      case 3:
        const selectedType = ALERT_TYPES.find(t => t.type === formData.type);
        return (
          <div className="space-y-4">
            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="font-semibold">Alert Summary</span>
                  </div>
                  <div className="pl-7 space-y-2 text-sm">
                    <p><strong>Cryptocurrency:</strong> {formData.cryptoSymbol.toUpperCase()} {formData.cryptoName && `(${formData.cryptoName})`}</p>
                    <p><strong>Alert Type:</strong> {selectedType?.title}</p>
                    {formData.type === AlertType.PRICE_CHANGE && (
                      <p><strong>Condition:</strong> Alert when price goes {formData.condition.direction} ${formData.condition.priceThreshold}</p>
                    )}
                    {formData.type === AlertType.SENTIMENT_CHANGE && (
                      <p><strong>Condition:</strong> Alert when sentiment becomes {formData.condition.sentimentDirection} (threshold: {formData.condition.sentimentThreshold})</p>
                    )}
                    {formData.type === AlertType.VOLUME_SPIKE && (
                      <p><strong>Condition:</strong> Alert when 24h volume exceeds ${formData.condition.volumeThreshold?.toLocaleString()}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle>Create Alert - Step {currentStep + 1} of {STEPS.length}</CardTitle>
        <CardDescription>{STEPS[currentStep].description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Indicator */}
        <div className="flex gap-2">
          {STEPS.map((step, index) => (
            <div
              key={step.id}
              className={`flex-1 h-2 rounded-full transition-colors ${
                index < currentStep
                  ? 'bg-green-500'
                  : index === currentStep
                  ? 'bg-blue-600'
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[300px]">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={currentStep === 0 ? onCancel : handleBack}
            disabled={isSubmitting}
          >
            {currentStep === 0 ? (
              'Cancel'
            ) : (
              <>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </>
            )}
          </Button>
          <Button
            type="button"
            onClick={handleNext}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              'Creating...'
            ) : currentStep === STEPS.length - 1 ? (
              <>
                Create Alert
                <Check className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
