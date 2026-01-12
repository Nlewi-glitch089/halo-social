import { NextResponse } from 'next/server'

const users = global.__halo_users ||= new Map()
const tokens = global.__halo_tokens ||= new Map()

export async function POST(req) {
  try {
    const body = await req.json()
    const { email, password } = body || {}
    if (!email || !password) return NextResponse.json({ message: 'Missing credentials' }, { status: 400 })

    // find user
    // Prefer Prisma when DB is configured. If Prisma isn't configured,
    // fall back to the in-memory store. If Prisma is available but the DB
    // operations fail, return 503 to show a server-side error.
    let prismaAvailable = false
    try {
      const { getPrisma } = await import('../../../../lib/prismaClient.mjs')
      const prisma = await getPrisma()
      prismaAvailable = true
      const found = await prisma.user.findUnique({ where: { email } })
      if (!found || found.password !== password) return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 })
      const token = Buffer.from(`${email}:${Date.now()}`).toString('base64')
      await prisma.token.create({ data: { token, userId: found.id } })
      const res = NextResponse.json({ user: { id: found.id, name: found.name, username: found.username, email }, token })
      res.cookies.set('halo_token', token, { httpOnly: true, path: '/', sameSite: 'lax' })
      return res
    } catch (prismaErr) {
      if (prismaAvailable) return NextResponse.json({ message: 'Having trouble signing you in — try again later.' }, { status: 503 })
      // otherwise fall back to in-memory
    }

    let found = null
    for (const u of users.values()) {
      if (u.email === email) { found = u; break }
    }
    if (!found) return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 })
    if (found.password !== password) return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 })

    const token = Buffer.from(`${email}:${Date.now()}`).toString('base64')
    tokens.set(token, found.id)
    const res = NextResponse.json({ user: { id: found.id, name: found.name, username: found.username, email }, token })
    res.cookies.set('halo_token', token, { httpOnly: true, path: '/', sameSite: 'lax' })
    return res
  } catch (err) {
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
