import { createTRPCRouter } from '@/server/api/trpc'
import { cryptoRouter } from './routers/crypto'
import { authRouter } from './routers/auth'
import { alertsRouter } from './routers/alerts'
import { sentimentRouter } from './routers/sentiment'
import { notificationsRouter } from './routers/notifications'
import { botsRouter } from './routers/bots'

export const appRouter = createTRPCRouter({
  crypto: cryptoRouter,
  auth: authRouter,
  alerts: alertsRouter,
  sentiment: sentimentRouter,
  notifications: notificationsRouter,
  bots: botsRouter,
})

export type AppRouter = typeof appRouter