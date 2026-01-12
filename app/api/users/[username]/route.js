import { NextResponse } from 'next/server'

const tokens = global.__halo_tokens ||= new Map()
const users = global.__halo_users ||= new Map()
const FEED = globalThis.__DEV_FEED ||= []

function parseCookieHeader(req){
  const cookieHeader = req.headers.get('cookie') || ''
  const m = cookieHeader.split(';').map(s=>s.trim())
  const obj = {}
  for(const c of m){
    const [k,v] = c.split('=')
    if(k && v) obj[k]=v
  }
  return obj
}

export async function GET(req, { params }){
  try{
    const { username } = params
    const user = Array.from(users.values()).find(u=>u.username === username)
    if(!user) return NextResponse.json({ message: 'Not found' }, { status: 404 })

    const cookies = parseCookieHeader(req)
    const token = cookies['halo_token']
    let currentUserId = null
    if (token) {
      try {
        const { getPrisma } = await import('../../../../lib/prismaClient.mjs')
        const prisma = await getPrisma()
        const t = await prisma.token.findUnique({ where: { token } }).catch(() => null)
        if (t) currentUserId = t.userId
      } catch (e) {
        // ignore and fallback to in-memory
      }
      if (!currentUserId) currentUserId = tokens.get(token)
    }
    const isFriend = currentUserId ? (users.get(currentUserId)?.friends || []).includes(user.username) : false

    // compute counts
    const posts = FEED.filter(i=>i.author && i.author.username === username)
    const likes = posts.reduce((s,p)=>s + (p.hearts||0), 0)
    const friendsCount = (user.friends || []).length

    return NextResponse.json({ profile: { name: user.name, username: user.username, bio: user.bio || '', posts: posts.length, likes, friends: friendsCount, isFriend } })
  }catch(err){
    return NextResponse.json({ message: String(err) }, { status: 500 })
  }
}
