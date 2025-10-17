'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { api } from '@/lib/trpc/provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertPageLoading } from '@/components/ui/loading'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { AlertType } from '@prisma/client'
import { FeatureGate } from '@/components/feature-gating/FeatureGate'
import { 
  Trash2, 
  Plus, 
  Bell, 
  TrendingUp, 
  Volume2, 
  Zap, 
  Star,
  Target,
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface AlertCondition {
  sentimentThreshold?: number
  direction?: 'bullish' | 'bearish' | 'above' | 'below'
  priceThreshold?: number
  percentage?: boolean
  volumeThreshold?: number
  notificationMethods?: string[]
}

interface CreateAlertFormData {
  cryptoSymbol: string
  cryptoName?: string
  type: AlertType
  condition: AlertCondition
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

interface AlertTemplate {
  id: string
  name: string
  description: string
  alertType: AlertType
  condition: Record<string, unknown>
  tags: string[]
  isPopular: boolean
  useCase: string
}

interface MonitoringStatus {
  isRunning: boolean
  monitoredCount: number
  lastUpdate: string
  monitoredCryptos: Array<{
    symbol: string
    lastPrice?: number
    lastUpdated?: string
  }>
}

export default function AlertsPage() {
  const { status } = useSession()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [activeOnly, setActiveOnly] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<AlertTemplate | null>(null)
  const [monitoringStatus, setMonitoringStatus] = useState<MonitoringStatus | null>(null)
  
  // Fetch alert templates
  const [popularTemplates, setPopularTemplates] = useState<AlertTemplate[]>([])

  // Load templates and monitoring status
  useEffect(() => {
    const loadTemplatesAndStatus = async () => {
      try {
        // Load popular templates
        const templatesResponse = await fetch('/api/alerts/templates?popular=true')
        if (templatesResponse.ok) {
          const templatesData = await templatesResponse.json()
          setPopularTemplates(templatesData.templates || [])
        }

        // Load monitoring status
        const statusResponse = await fetch('/api/alerts/monitoring')
        if (statusResponse.ok) {
          const statusData = await statusResponse.json()
          setMonitoringStatus(statusData.monitoring || null)
        }
      } catch (error) {
        console.error('Error loading templates and status:', error)
      }
    }

    if (status === 'authenticated') {
      loadTemplatesAndStatus()
    }
  }, [status])

  // Redirect if not authenticated
  if (status === 'loading') {
    return <AlertPageLoading />
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

  const createFromTemplate = async (template: AlertTemplate, cryptoSymbol: string, cryptoName?: string) => {
    try {
      const response = await fetch('/api/alerts/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: template.id,
          cryptoSymbol,
          cryptoName,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Success',
          description: `Alert created from template: ${template.name}`,
        })
        setSelectedTemplate(null)
        setShowTemplates(false)
        refetchAlerts()
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to create alert from template',
          variant: 'destructive',
        })
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to create alert from template',
        variant: 'destructive',
      })
    }
  }

  const toggleMonitoring = async () => {
    try {
      const action = monitoringStatus?.isRunning ? 'stop' : 'start'
      const response = await fetch('/api/alerts/monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      const result = await response.json()

      if (result.success) {
        setMonitoringStatus(result.status)
        toast({
          title: 'Success',
          description: result.message,
        })
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to toggle monitoring',
          variant: 'destructive',
        })
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to toggle monitoring',
        variant: 'destructive',
      })
    }
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
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Alert Management</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Set up alerts for price changes, sentiment shifts, and market events
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setShowTemplates(!showTemplates)}
            className="w-full sm:w-auto"
            size="sm"
          >
            <Zap className="h-4 w-4 mr-2" />
            Templates
          </Button>
          <FeatureGate usageType="ALERT_CREATION">
            <Button 
              onClick={() => setShowCreateForm(true)}
              className="w-full sm:w-auto"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Alert
            </Button>
          </FeatureGate>
        </div>
      </div>

      {/* Monitoring Status */}
      {monitoringStatus && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-2 w-2 rounded-full ${monitoringStatus.isRunning ? 'bg-green-500' : 'bg-red-500'}`} />
                <div>
                  <p className="font-medium">
                    Alert Monitoring: {monitoringStatus.isRunning ? 'Active' : 'Inactive'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Tracking {monitoringStatus.monitoredCount} cryptocurrencies
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleMonitoring}
              >
                {monitoringStatus.isRunning ? 'Stop' : 'Start'} Monitoring
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Popular Templates */}
      {showTemplates && popularTemplates.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Popular Alert Templates
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTemplates(false)}
              >
                ×
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {popularTemplates.map((template) => (
                <Card key={template.id} className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{template.name}</h3>
                      <Badge variant="secondary">
                        {template.alertType.replace('_', ' ').toLowerCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {template.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {template.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => setSelectedTemplate(template)}
                    >
                      Use Template
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Template Quick Setup */}
      {selectedTemplate && (
        <TemplateQuickSetup
          template={selectedTemplate}
          onCancel={() => setSelectedTemplate(null)}
          onSubmit={createFromTemplate}
        />
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:space-x-4 sm:gap-0">
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

function TemplateQuickSetup({
  template,
  onCancel,
  onSubmit,
}: {
  template: AlertTemplate
  onCancel: () => void
  onSubmit: (template: AlertTemplate, cryptoSymbol: string, cryptoName?: string) => void
}) {
  const [cryptoSymbol, setCryptoSymbol] = useState('')
  const [cryptoName, setCryptoName] = useState('')

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

    onSubmit(template, cryptoSymbol, cryptoName)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Quick Setup: {template.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="font-medium mb-2">Template Details:</p>
            <p className="text-sm text-muted-foreground mb-2">{template.description}</p>
            <p className="text-sm">
              <strong>Use Case:</strong> {template.useCase}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quick-crypto-symbol">Cryptocurrency Symbol</Label>
              <Input
                id="quick-crypto-symbol"
                placeholder="e.g., btc, eth, sol"
                value={cryptoSymbol}
                onChange={(e) => setCryptoSymbol(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="quick-crypto-name">Name (Optional)</Label>
              <Input
                id="quick-crypto-name"
                placeholder="e.g., Bitcoin, Ethereum"
                value={cryptoName}
                onChange={(e) => setCryptoName(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <FeatureGate usageType="ALERT_CREATION">
              <Button type="submit">
                Create Alert
              </Button>
            </FeatureGate>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function CreateAlertForm({
  onCancel,
  onSubmit,
  isLoading,
}: {
  onCancel: () => void
  onSubmit: (data: CreateAlertFormData) => void
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
            <FeatureGate usageType="ALERT_CREATION">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Alert'}
              </Button>
            </FeatureGate>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}