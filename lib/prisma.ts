/**
 * Singleton-клиент Prisma. В dev-режиме переиспользуется через globalThis,
 * чтобы Next.js HMR не плодил коннекты к БД. В проде — обычный экземпляр.
 */
import { PrismaClient } from '@prisma/client'

declare global {
  var __prisma: PrismaClient | undefined
}

export const prisma =
  globalThis.__prisma ??
  new PrismaClient({
    log: process.env['NODE_ENV'] === 'development' ? ['warn', 'error'] : ['error'],
  })

if (process.env['NODE_ENV'] !== 'production') {
  globalThis.__prisma = prisma
}
