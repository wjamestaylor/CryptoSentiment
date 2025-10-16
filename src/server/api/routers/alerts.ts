import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { AlertType, SentimentLabel, UsageType } from '@prisma/client'
import { AlertService } from '@/services/notifications/alerts.service'
import { FeatureGateService } from '@/services/feature-gating/feature-gate.service'
import { TRPCError } from '@trpc/server'

const alertService = new AlertService()
const featureGateService = new FeatureGateService()

// Enhanced input validation schemas
const createAlertSchema = z.object({
  cryptoSymbol: z.string().min(1, 'Cryptocurrency symbol is required'),
  cryptoName: z.string().optional(),
  type: z.nativeEnum(AlertType),
  condition: z.object({
    sentimentThreshold: z.number().min(-1).max(1).optional(),
    direction: z.enum(['bullish', 'bearish', 'above', 'below']).optional(),
    priceThreshold: z.number().positive().optional(),
    percentage: z.boolean().optional(),
    volumeThreshold: z.number().positive().optional(),
    notificationMethods: z.array(z.string()).optional(),
    cooldownMinutes: z.number().positive().optional(),
  }),
})

const updateAlertSchema = z.object({
  id: z.string().min(1, 'Alert ID is required'),
  condition: z.object({
    sentimentThreshold: z.number().min(-1).max(1).optional(),
    direction: z.enum(['bullish', 'bearish', 'above', 'below']).optional(),
    priceThreshold: z.number().positive().optional(),
    percentage: z.boolean().optional(),
    volumeThreshold: z.number().positive().optional(),
    notificationMethods: z.array(z.string()).optional(),
    cooldownMinutes: z.number().positive().optional(),
  }).optional(),
  isActive: z.boolean().optional(),
})

export const alertsRouter = createTRPCRouter({
  /**
   * Create a new alert with enhanced validation
   */
  createAlert: protectedProcedure
    .input(createAlertSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if user can create more alerts
        const usageCheck = await featureGateService.canCreateAlert(ctx.session.user.id);
        
        if (!usageCheck.allowed) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: `Alert limit reached (${usageCheck.currentUsage}/${usageCheck.limit}). Upgrade your subscription to create more alerts.`,
          });
        }

        const alert = await alertService.createAlertWithSymbol({
          userId: ctx.session.user.id,
          cryptoSymbol: input.cryptoSymbol,
          cryptoName: input.cryptoName,
          type: input.type,
          condition: input.condition,
        })

        // Track usage after successful creation
        await featureGateService.trackUsage(ctx.session.user.id, UsageType.ALERT_CREATION, {
          cryptoSymbol: input.cryptoSymbol,
          alertType: input.type,
        });

        return {
          success: true,
          alert,
          message: 'Alert created successfully',
        }
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        const message = error instanceof Error ? error.message : 'Unknown error'
        throw new Error(`Failed to create alert: ${message}`)
      }
    }),

  /**
   * Get all alerts for the current user
   */
  getUserAlerts: protectedProcedure
    .input(z.object({
      activeOnly: z.boolean().optional().default(false),
    }))
    .query(async ({ ctx, input }) => {
      try {
        const alerts = await alertService.getUserAlerts(
          ctx.session.user.id,
          input.activeOnly
        )

        return {
          success: true,
          alerts,
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        throw new Error(`Failed to get alerts: ${message}`)
      }
    }),

  /**
   * Update an existing alert
   */
  updateAlert: protectedProcedure
    .input(updateAlertSchema)
    .mutation(async ({ input }) => {
      try {
        const { id, ...updateData } = input
        
        const alert = await alertService.updateAlert(id, updateData)

        return {
          success: true,
          alert,
          message: 'Alert updated successfully',
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        throw new Error(`Failed to update alert: ${message}`)
      }
    }),

  /**
   * Delete an alert
   */
  deleteAlert: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      try {
        await alertService.deleteAlert(input.id)

        return {
          success: true,
          message: 'Alert deleted successfully',
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        throw new Error(`Failed to delete alert: ${message}`)
      }
    }),

  /**
   * Test alert conditions (for debugging)
   */
  testAlert: protectedProcedure
    .input(z.object({
      cryptoId: z.string(),
      sentimentData: z.object({
        score: z.number(),
        label: z.string(),
        confidence: z.number(),
      }).optional(),
      priceData: z.object({
        price: z.number(),
        change24h: z.number(),
        volume24h: z.number().optional(),
      }).optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        // This is for testing purposes only
        if (input.sentimentData) {
          await alertService.checkAlerts(input.cryptoId, {
            cryptoId: input.cryptoId,
            score: input.sentimentData.score,
            label: input.sentimentData.label as SentimentLabel,
            confidence: input.sentimentData.confidence,
          })
        }

        if (input.priceData) {
          await alertService.checkAlerts(input.cryptoId, {
            cryptoId: input.cryptoId,
            price: input.priceData.price,
            change24h: input.priceData.change24h,
            volume24h: input.priceData.volume24h,
          })
        }

        return {
          success: true,
          message: 'Alert check completed',
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        throw new Error(`Failed to test alert: ${message}`)
      }
    }),
})