import getPrisma from '../lib/prismaClient.mjs'

async function main(){
  try{
    const prisma = await getPrisma()
    const users = await prisma.user.findMany({ take: 20 })
    const tokens = await prisma.token.findMany({ take: 20 })
    console.log('users:', users)
    console.log('tokens:', tokens)
    process.exit(0)
  }catch(err){
    console.error('err', err)
    process.exit(2)
  }
}

main()
