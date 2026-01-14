let _prisma = null

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT: ' + label)), ms))
  ])
}

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
  const poolUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
  if (!poolUrl) throw new Error('TEST_DATABASE_URL or DATABASE_URL must be set for runtime Prisma')
  try {
    console.debug('Prisma poolUrl present, length:', String(poolUrl).length ? `${String(poolUrl).slice(0,40)}...` : '<empty>')
  } catch (e) {}

    // Attempt to use the Neon adapter when available; handle ESM/CJS interop
    // quirks by checking default exports.
    // On Windows, the Neon serverless Pool can behave unexpectedly in dev.
    // Prefer the default PrismaClient but construct with explicit options so
    // PrismaClient receives a valid PrismaClientOptions object.
    if (process.platform === 'win32') {
      try { console.debug('Running on Windows; attempting Neon adapter first') } catch (e) {}
      try {
        console.debug('Windows: importing @neondatabase/serverless')
        const neonMod = await import('@neondatabase/serverless')
        const createPool = neonMod.createPool ?? neonMod.default?.createPool
        const PoolClass = neonMod.Pool ?? neonMod.default?.Pool
        console.debug('Windows: imported neon, createPool/PoolClass:', typeof createPool, typeof PoolClass)
        console.debug('Windows: importing @prisma/adapter-neon')
        const neonAdapterMod = await import('@prisma/adapter-neon')
        const PrismaNeon = neonAdapterMod.PrismaNeon ?? neonAdapterMod.default ?? neonAdapterMod
        console.debug('Windows: importing ws')
        const wsModule = await import('ws')
        const ws = wsModule?.default ?? wsModule
        console.debug('Windows: ws imported')
        if (typeof createPool === 'function' && typeof PrismaNeon === 'function') {
          console.debug('Windows: creating pool via createPool')
          const pool = createPool(poolUrl)
          console.debug('Windows: creating PrismaNeon adapter (createPool)')
          const neonAdapter = new PrismaNeon(pool, { webSocketConstructor: ws })
          console.debug('Windows: constructing PrismaClient with neon adapter (createPool)')
          try {
            _prisma = await withTimeout(Promise.resolve().then(() => new PrismaClient({ adapter: neonAdapter })), 8000, 'new PrismaClient(adapter createPool)')
            console.debug('Windows: constructed PrismaClient (createPool)')
          } catch (e) {
            console.error('Windows: Prisma constructor (createPool) failed or timed out:', e && e.message)
            throw e
          }
          console.debug('Windows: skipping internal test query; returning constructed PrismaClient (createPool)')
          return _prisma
        }
        if (PoolClass && typeof PrismaNeon === 'function') {
          console.debug('Windows: creating pool via PoolClass')
          let pool
          try { pool = new PoolClass({ connectionString: poolUrl }) } catch (e) { pool = new PoolClass(poolUrl) }
          console.debug('Windows: creating PrismaNeon adapter (PoolClass)')
          const neonAdapter = new PrismaNeon(pool, { webSocketConstructor: ws })
          console.debug('Windows: constructing PrismaClient with neon adapter (PoolClass)')
          try {
            _prisma = await withTimeout(Promise.resolve().then(() => new PrismaClient({ adapter: neonAdapter })), 8000, 'new PrismaClient(adapter PoolClass)')
            console.debug('Windows: constructed PrismaClient (PoolClass)')
          } catch (e) {
            console.error('Windows: Prisma constructor (PoolClass) failed or timed out:', e && e.message)
            throw e
          }
          console.debug('Windows: skipping internal test query; returning constructed PrismaClient (PoolClass)')
          return _prisma
        }
      } catch (e) {
        console.warn('Windows Neon adapter init failed (will fallback to default PrismaClient):', e && e.message)
      }
      try { console.debug('Falling back to default PrismaClient on Windows') } catch (e) {}
      _prisma = new PrismaClient()
      return _prisma
    }
  try {
    const neonMod = await import('@neondatabase/serverless')
    const createPool = neonMod.createPool ?? neonMod.default?.createPool
    const PoolClass = neonMod.Pool ?? neonMod.default?.Pool
    try { console.debug('neon module loaded; createPool:', typeof createPool, 'PoolClass:', typeof PoolClass) } catch (e) {}
    const neonAdapterMod = await import('@prisma/adapter-neon')
    const PrismaNeon = neonAdapterMod.PrismaNeon ?? neonAdapterMod.default ?? neonAdapterMod
    const wsModule = await import('ws')
    const ws = wsModule?.default ?? wsModule
    if (typeof createPool === 'function' && typeof PrismaNeon === 'function') {
      const pool = createPool(poolUrl)
      try { console.debug('Using neon createPool path') } catch (e) {}
      const neonAdapter = new PrismaNeon(pool, { webSocketConstructor: ws })
      try {
        _prisma = await withTimeout(Promise.resolve().then(() => new PrismaClient({ adapter: neonAdapter })), 8000, 'new PrismaClient(adapter)')
        console.debug('constructed PrismaClient (neon createPool)')
      } catch (e) {
        console.error('Prisma constructor (neon createPool) failed or timed out:', e && e.message)
        throw e
      }
      console.debug('Skipping internal test query; returning constructed PrismaClient (neon createPool)')
      return _prisma
    }

    if (PoolClass && typeof PrismaNeon === 'function') {
      // Some Neon packages export `Pool` class instead of `createPool`.
      let pool
      try {
        pool = new PoolClass({ connectionString: poolUrl })
      } catch (e) {
        pool = new PoolClass(poolUrl)
      }
      try { console.debug('Using neon PoolClass path') } catch (e) {}
      const neonAdapter = new PrismaNeon(pool, { webSocketConstructor: ws })
      try {
        _prisma = await withTimeout(Promise.resolve().then(() => new PrismaClient({ adapter: neonAdapter })), 8000, 'new PrismaClient(adapter PoolClass)')
        console.debug('constructed PrismaClient (neon PoolClass)')
      } catch (e) {
        console.error('Prisma constructor (neon PoolClass) failed or timed out:', e && e.message)
        throw e
      }
      console.debug('Skipping internal test query; returning constructed PrismaClient (neon PoolClass)')
      return _prisma
    }
  } catch (e) {
    console.warn('Prisma Neon adapter init failed (will fallback to default PrismaClient):', e && e.message)
    // fall through to default PrismaClient construction below
  }

  // Fallback: construct PrismaClient without a Neon adapter using DATABASE_URL
  try {
    _prisma = await withTimeout(Promise.resolve().then(() => new PrismaClient()), 8000, 'new PrismaClient(fallback)')
    console.debug('constructed PrismaClient (fallback)')
  } catch (e) {
    console.error('Prisma constructor (fallback) failed or timed out:', e && e.message)
    throw e
  }
  return _prisma
}

export default getPrisma
