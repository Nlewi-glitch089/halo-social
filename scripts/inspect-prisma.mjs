import dotenv from 'dotenv'
dotenv.config({ path: 'c:\\Users\\Launchpad8\\Social\\halo-social\\.env' })
const mod = await import('@prisma/client')
console.log('Prisma module keys:', Object.keys(mod))
console.log('PrismaClient type:', typeof mod.PrismaClient)
console.log('PrismaClient present:', !!mod.PrismaClient)
