console.log('PRISMA CONFIG: prisma.config.mjs loaded')
export default {
  datasources: {
    db: {
      provider: 'postgresql',
      url: process.env.DATABASE_URL,
    },
  },
}
