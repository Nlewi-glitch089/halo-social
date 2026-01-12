import { NextResponse } from 'next/server'

const FEED = globalThis.__DEV_FEED ||= []
const tokens = global.__halo_tokens ||= new Map()
const users = global.__halo_users ||= new Map()

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

export async function POST(req, { params }){
  try{
    const { id } = params
    const cookies = parseCookieHeader(req)
    const token = cookies['halo_token']
    let userId = null
    if (token) {
      // Try DB-backed tokens first when Prisma configured
      try {
        const { getPrisma } = await import('../../../../../lib/prismaClient.mjs')
        const prisma = await getPrisma()
        const t = await prisma.token.findUnique({ where: { token } }).catch(() => null)
        if (t) userId = t.userId
      } catch (e) {
        // ignore and fall back to in-memory map
      }
      if (!userId) userId = tokens.get(token)
    }
    if(!userId) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })

    const idx = FEED.findIndex(i=>i.id === id)
    if(idx === -1) return NextResponse.json({ message: 'Not found' }, { status: 404 })

    const u = users.get(userId)
    u.likes = u.likes || []
    const liked = u.likes.includes(id)
    if(liked){
      // remove like
      u.likes = u.likes.filter(x=>x!==id)
      FEED[idx].hearts = Math.max(0, (FEED[idx].hearts||0) - 1)
    } else {
      u.likes.push(id)
      FEED[idx].hearts = (FEED[idx].hearts||0) + 1
    }
    users.set(userId, u)
    return NextResponse.json({ ok: true, item: FEED[idx], liked: !liked })
  }catch(err){
    return NextResponse.json({ message: String(err) }, { status: 500 })
  }
}
