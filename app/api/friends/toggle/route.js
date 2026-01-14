import { NextResponse } from 'next/server'

const poolUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
const tokens = poolUrl ? null : (global.__halo_tokens ||= new Map())
const users = poolUrl ? null : (global.__halo_users ||= new Map())

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
    // Try DB-backed friends table via `pg` fallback. If DB not available,
    // fall back to in-memory dev store.
    try {
      const { Client } = await import('pg')
      const client = new Client({ connectionString: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL })
      await client.connect()
      try {
        // find target user id
        const targetRes = await client.query('SELECT id, username FROM users WHERE username = $1 LIMIT 1', [targetUsername])
        if (targetRes.rowCount === 0) { await client.end(); return NextResponse.json({ message: 'Target user not found' }, { status: 404 }) }
        const target = targetRes.rows[0]

        const exists = await client.query('SELECT id FROM friends WHERE "userId" = $1 AND "friendId" = $2 LIMIT 1', [currentUserId, target.id])
        let added = false
        if (exists.rowCount > 0) {
          await client.query('DELETE FROM friends WHERE id = $1', [exists.rows[0].id])
          added = false
        } else {
          await client.query('INSERT INTO friends ("userId","friendId") VALUES ($1,$2)', [currentUserId, target.id])
          added = true
        }
        const friendsRes = await client.query('SELECT u.username FROM friends f JOIN users u ON u.id = f."friendId" WHERE f."userId" = $1', [currentUserId])
        await client.end()
        return NextResponse.json({ ok: true, friends: friendsRes.rows.map(r=>r.username), added })
      } catch (dbErr) {
        try{ await client.end() }catch(e){}
        throw dbErr
      }
    } catch (dbFallbackErr) {
      // fall back to in-memory
    }

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
