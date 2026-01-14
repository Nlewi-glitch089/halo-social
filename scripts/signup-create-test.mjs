import dotenv from 'dotenv'
dotenv.config({ path: 'c:\\Users\\Launchpad8\\Social\\halo-social\\.env' })
import { getPrisma } from '../lib/prismaClient.mjs'

async function main(){
  try{
    const prisma = await getPrisma()
    console.log('Got prisma client')
    const user = await prisma.user.create({ data: { name: 'SignupTest', username: `testuser_${Date.now()}`, email: `signup-test+${Date.now()}@example.test`, password: 'x' } })
    console.log('Created user:', user)
    if (prisma && typeof prisma.$disconnect === 'function') await prisma.$disconnect()
    process.exit(0)
  }catch(err){
    console.error('CREATE USER ERROR', err)
    process.exit(1)
  }
}

main()
