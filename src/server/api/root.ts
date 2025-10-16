import { createTRPCRouter } from '@/server/api/trpc'
import { cryptoRouter } from './routers/crypto'
import { authRouter } from './routers/auth'
import { alertsRouter } from './routers/alerts'
import { sentimentRouter } from './routers/sentiment'
import { notificationsRouter } from './routers/notifications'
import { botsRouter } from './routers/bots'
import { subscriptionRouter } from './routers/subscription'
import { analyticsRouter } from './routers/analytics'

export const appRouter = createTRPCRouter({
  crypto: cryptoRouter,
  auth: authRouter,
  alerts: alertsRouter,
  sentiment: sentimentRouter,
  notifications: notificationsRouter,
  bots: botsRouter,
  subscription: subscriptionRouter,
  analytics: analyticsRouter,
})

export type AppRouter = typeof appRouter