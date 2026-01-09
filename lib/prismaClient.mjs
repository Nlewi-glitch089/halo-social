let _prisma = null

export async function getPrisma() {
  if (process.env.NODE_ENV === 'test') {
    if (_prisma) return _prisma
    // Simple in-memory store for tests
    const store = []
    let idCounter = 1
    _prisma = {
      publishedImage: {
        create: async ({ data }) => {
          const item = { id: idCounter++, hearts: 0, createdAt: new Date(), ...data }
          store.push(item)
          return item
        },
        findMany: async ({ skip = 0, take = 10 } = {}) => {
          const slice = store.slice(skip, skip + take).map((i) => ({ ...i }))
          return slice
        },
        count: async () => store.length,
        findUnique: async ({ where }) => store.find((i) => i.id === where.id) || null,
        update: async ({ where, data }) => {
          const idx = store.findIndex((i) => i.id === where.id)
          if (idx === -1) return null
          store[idx] = { ...store[idx], ...data }
          return store[idx]
        },
        deleteMany: async () => {
          const removed = store.length
          store.length = 0
          return { count: removed }
        },
      },
    }
    return _prisma
  }

  if (_prisma) return _prisma

  const { PrismaClient } = await import('@prisma/client')
  const { createPool } = await import('@neondatabase/serverless')
  const { PrismaNeon } = await import('@prisma/adapter-neon')
  const wsModule = await import('ws')
  const ws = wsModule?.default ?? wsModule
  const poolUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
  if (!poolUrl) throw new Error('TEST_DATABASE_URL or DATABASE_URL must be set for runtime Prisma')
  const pool = createPool(poolUrl)
  const neonAdapter = PrismaNeon(pool, { webSocketConstructor: ws })
  _prisma = new PrismaClient({ adapter: neonAdapter })
  return _prisma
}

export default getPrisma
