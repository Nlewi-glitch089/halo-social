export default {
  datasources: {
    db: {
      provider: 'postgresql',
      url: process.env.DATABASE_URL,
    },
  },
}
let _prisma: any = null

export function getPrisma() {
	if (!_prisma) {
		// require inside function to avoid loading modules at `prisma generate` time
		// which may not be available until after generation
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const { PrismaClient } = require('@prisma/client')
		// require neon packages lazily
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const { createPool } = require('@neondatabase/serverless')
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const { PrismaNeon } = require('@prisma/adapter-neon')
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const ws = require('ws')

		const pool = createPool(process.env.DATABASE_URL as string)
		const neonAdapter = PrismaNeon(pool, { webSocketConstructor: ws } as any)
		_prisma = new PrismaClient({ adapter: neonAdapter as any } as any)
	}
	return _prisma
}

export default { getPrisma }
