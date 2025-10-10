import { initTRPC, TRPCError } from '@trpc/server'
import { type Session } from 'next-auth'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/nextauth'
import { prisma } from '@/lib/db/prisma'
import superjson from 'superjson'
import { ZodError } from 'zod'
import { type FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'

type CreateContextOptions = {
  session: Session | null
}

const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    session: opts.session,
    prisma,
  }
}

export const createTRPCContext = async (opts: FetchCreateContextFnOptions) => {
  // Get session from request headers using the new App Router method
  const session = await getServerSession(authOptions)
  
  return createInnerTRPCContext({
    session,
  })
}

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }
  },
})

export const createTRPCRouter = t.router
export const publicProcedure = t.procedure

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  })
})

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed)