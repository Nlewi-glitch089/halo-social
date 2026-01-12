import { NextResponse } from 'next/server'

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

export async function POST(req){
  try{
    const body = await req.json()
    const targetUsername = body?.username
    if(!targetUsername) return NextResponse.json({ message: 'Missing username' }, { status: 400 })

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
        // ignore, fall back to in-memory
      }
      if (!currentUserId) currentUserId = tokens.get(token)
    }
    if(!currentUserId) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })

    const currentUser = users.get(currentUserId)
    if(!currentUser) return NextResponse.json({ message: 'User not found' }, { status: 404 })

    const target = Array.from(users.values()).find(u=>u.username === targetUsername)
    if(!target) return NextResponse.json({ message: 'Target user not found' }, { status: 404 })

    currentUser.friends = currentUser.friends || []
    const idx = currentUser.friends.indexOf(targetUsername)
    let added = false
    if(idx === -1){ currentUser.friends.push(targetUsername); added = true } else { currentUser.friends.splice(idx,1); added = false }
    users.set(currentUserId, currentUser)
    return NextResponse.json({ ok: true, friends: currentUser.friends, added })
  }catch(err){
    return NextResponse.json({ message: String(err) }, { status: 500 })
  }
}
