import { createTRPCRouter } from '@/server/api/trpc'
import { cryptoRouter } from './routers/crypto'
import { authRouter } from './routers/auth'
import { alertsRouter } from './routers/alerts'
import { sentimentRouter } from './routers/sentiment'

export const appRouter = createTRPCRouter({
  crypto: cryptoRouter,
  auth: authRouter,
  alerts: alertsRouter,
  sentiment: sentimentRouter,
})

export type AppRouter = typeof appRouter