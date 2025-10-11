'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { api } from '@/lib/trpc/provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { AlertType } from '@prisma/client'
import { Trash2, Plus, Bell, TrendingUp, Volume2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface AlertCondition {
  sentimentThreshold?: number
  direction?: 'bullish' | 'bearish' | 'above' | 'below'
  priceThreshold?: number
  percentage?: boolean
  volumeThreshold?: number
  notificationMethods?: string[]
}

interface Alert {
  id: string
  type: AlertType
  condition: string
  isActive: boolean
  crypto: {
    symbol: string
    name: string
  }
  createdAt: Date
  lastTriggered?: Date | null
  triggerCount: number
}

export default function AlertsPage() {
  const { data: session, status } = useSession()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [activeOnly, setActiveOnly] = useState(false)

  // Redirect if not authenticated
  if (status === 'loading') {
    return <div>Loading...</div>
  }

  if (status === 'unauthenticated') {
    redirect('/auth/signin')
  }

  // Get user alerts
  const { data: alertsResponse, refetch: refetchAlerts } = api.alerts.getUserAlerts.useQuery({
    activeOnly,
  })

  const alerts = alertsResponse?.alerts || []

  // Mutations
  const createAlertMutation = api.alerts.createAlert.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Alert created successfully',
      })
      setShowCreateForm(false)
      refetchAlerts()
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const updateAlertMutation = api.alerts.updateAlert.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Alert updated successfully',
      })
      refetchAlerts()
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const deleteAlertMutation = api.alerts.deleteAlert.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Alert deleted successfully',
      })
      refetchAlerts()
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const toggleAlert = (alertId: string, isActive: boolean) => {
    updateAlertMutation.mutate({
      id: alertId,
      isActive: !isActive,
    })
  }

  const deleteAlert = (alertId: string) => {
    if (confirm('Are you sure you want to delete this alert?')) {
      deleteAlertMutation.mutate({ id: alertId })
    }
  }

  const getAlertIcon = (type: AlertType) => {
    switch (type) {
      case AlertType.SENTIMENT_CHANGE:
        return <Bell className="h-4 w-4" />
      case AlertType.PRICE_CHANGE:
        return <TrendingUp className="h-4 w-4" />
      case AlertType.VOLUME_SPIKE:
        return <Volume2 className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const formatCondition = (conditionStr: string) => {
    try {
      const condition: AlertCondition = JSON.parse(conditionStr)
      
      if (condition.sentimentThreshold !== undefined) {
        return `Sentiment ${condition.direction || 'change'} (threshold: ${condition.sentimentThreshold})`
      }
      
      if (condition.priceThreshold !== undefined) {
        return `Price ${condition.direction || 'change'} ${condition.percentage ? '%' : '$'}${condition.priceThreshold}`
      }
      
      if (condition.volumeThreshold !== undefined) {
        return `Volume above $${condition.volumeThreshold.toLocaleString()}`
      }
      
      return 'Custom condition'
    } catch {
      return 'Invalid condition'
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Alert Management</h1>
          <p className="text-muted-foreground">
            Set up alerts for price changes, sentiment shifts, and market events
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Alert
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="active-only"
            checked={activeOnly}
            onCheckedChange={setActiveOnly}
            aria-labelledby="active-only-label"
          />
          <Label id="active-only-label" htmlFor="active-only">Show active alerts only</Label>
        </div>
      </div>

      {/* Create Alert Form */}
      {showCreateForm && (
        <CreateAlertForm
          onCancel={() => setShowCreateForm(false)}
          onSubmit={(data) => createAlertMutation.mutate(data)}
          isLoading={createAlertMutation.isPending}
        />
      )}

      {/* Alerts List */}
      <div className="grid gap-4">
        {alerts.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No alerts yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first alert to get notified about market changes
              </p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Alert
              </Button>
            </CardContent>
          </Card>
        ) : (
          alerts.map((alert: Alert) => (
            <Card key={alert.id} className={alert.isActive ? '' : 'opacity-60'} data-testid="alert-card">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getAlertIcon(alert.type)}
                    <div>
                      <CardTitle className="text-lg">
                        {alert.crypto.name} ({alert.crypto.symbol.toUpperCase()})
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {alert.type.replace('_', ' ').toLowerCase()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={alert.isActive}
                      onCheckedChange={() => toggleAlert(alert.id, alert.isActive)}
                      aria-label={`Toggle ${alert.crypto.name} alert ${alert.isActive ? 'off' : 'on'}`}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteAlert(alert.id)}
                      aria-label={`Delete ${alert.crypto.name} alert`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm">
                    <strong>Condition:</strong> {formatCondition(alert.condition)}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      Triggered {alert.triggerCount} time{alert.triggerCount !== 1 ? 's' : ''}
                    </span>
                    {alert.lastTriggered && (
                      <span>
                        Last: {new Date(alert.lastTriggered).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

function CreateAlertForm({
  onCancel,
  onSubmit,
  isLoading,
}: {
  onCancel: () => void
  onSubmit: (data: any) => void
  isLoading: boolean
}) {
  const [alertType, setAlertType] = useState<AlertType>(AlertType.SENTIMENT_CHANGE)
  const [cryptoSymbol, setCryptoSymbol] = useState('')
  const [cryptoName, setCryptoName] = useState('')
  const [condition, setCondition] = useState<AlertCondition>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!cryptoSymbol) {
      toast({
        title: 'Error',
        description: 'Please enter a cryptocurrency symbol',
        variant: 'destructive',
      })
      return
    }

    onSubmit({
      cryptoSymbol: cryptoSymbol.toLowerCase(),
      cryptoName: cryptoName || undefined,
      type: alertType,
      condition,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Alert</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="crypto-symbol">Cryptocurrency Symbol</Label>
              <Input
                id="crypto-symbol"
                placeholder="e.g., btc, eth, sol"
                value={cryptoSymbol}
                onChange={(e) => setCryptoSymbol(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="crypto-name">Name (Optional)</Label>
              <Input
                id="crypto-name"
                placeholder="e.g., Bitcoin, Ethereum"
                value={cryptoName}
                onChange={(e) => setCryptoName(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="alert-type">Alert Type</Label>
            <Select value={alertType} onValueChange={(value: string) => setAlertType(value as AlertType)}>
              <SelectTrigger id="alert-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={AlertType.SENTIMENT_CHANGE}>Sentiment Change</SelectItem>
                <SelectItem value={AlertType.PRICE_CHANGE}>Price Change</SelectItem>
                <SelectItem value={AlertType.VOLUME_SPIKE}>Volume Spike</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Conditional form fields based on alert type */}
          {alertType === AlertType.SENTIMENT_CHANGE && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sentiment-threshold">Sentiment Threshold</Label>
                <Input
                  id="sentiment-threshold"
                  type="number"
                  min="-1"
                  max="1"
                  step="0.1"
                  placeholder="0.7"
                  value={condition.sentimentThreshold || ''}
                  onChange={(e) => setCondition({
                    ...condition,
                    sentimentThreshold: parseFloat(e.target.value)
                  })}
                />
              </div>
              <div>
                <Label htmlFor="sentiment-direction">Direction</Label>
                <Select 
                  value={condition.direction || ''} 
                  onValueChange={(value: string) => setCondition({
                    ...condition,
                    direction: value as 'bullish' | 'bearish'
                  })}
                >
                  <SelectTrigger id="sentiment-direction">
                    <SelectValue placeholder="Select direction" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bullish">Bullish</SelectItem>
                    <SelectItem value="bearish">Bearish</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {alertType === AlertType.PRICE_CHANGE && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price-threshold">Price Threshold</Label>
                <Input
                  id="price-threshold"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="50000"
                  value={condition.priceThreshold || ''}
                  onChange={(e) => setCondition({
                    ...condition,
                    priceThreshold: parseFloat(e.target.value)
                  })}
                />
              </div>
              <div>
                <Label htmlFor="price-direction">Direction</Label>
                <Select 
                  value={condition.direction || ''} 
                  onValueChange={(value: string) => setCondition({
                    ...condition,
                    direction: value as 'above' | 'below'
                  })}
                >
                  <SelectTrigger id="price-direction">
                    <SelectValue placeholder="Select direction" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="above">Above</SelectItem>
                    <SelectItem value="below">Below</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {alertType === AlertType.VOLUME_SPIKE && (
            <div>
              <Label htmlFor="volume-threshold">Volume Threshold</Label>
              <Input
                id="volume-threshold"
                type="number"
                min="0"
                placeholder="1000000000"
                value={condition.volumeThreshold || ''}
                onChange={(e) => setCondition({
                  ...condition,
                  volumeThreshold: parseFloat(e.target.value)
                })}
              />
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Alert'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}