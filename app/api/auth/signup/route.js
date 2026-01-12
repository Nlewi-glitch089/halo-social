import { NextResponse } from 'next/server'

// In-memory users store for dev only. Persisted on global to survive reloads.
const users = global.__halo_users ||= new Map()
const tokens = global.__halo_tokens ||= new Map()

export async function POST(req) {
  try {
    const body = await req.json()
    const { name, username, email, password } = body || {}
    if (!email || !password || !username) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
    }

    // Try using Prisma when a runtime DB is configured. If Prisma isn't
    // configured (getPrisma throws), fall back to in-memory. If Prisma is
    // configured but any DB operation fails, return 503 so the client sees
    // a clear server error instead of silently falling back.
    let prismaAvailable = false
    try {
      const { getPrisma } = await import('../../../../lib/prismaClient.mjs')
      const prisma = await getPrisma()
      prismaAvailable = true

      const existsEmail = await prisma.user.findUnique({ where: { email } })
      if (existsEmail) return NextResponse.json({ message: 'Email already exists' }, { status: 409 })
      const existsUsername = await prisma.user.findUnique({ where: { username } })
      if (existsUsername) return NextResponse.json({ message: 'Username already exists' }, { status: 409 })

      const user = await prisma.user.create({ data: { name: name || '', username, email, password } })
      const token = Buffer.from(`${email}:${Date.now()}`).toString('base64')
      await prisma.token.create({ data: { token, userId: user.id } })

      const res = NextResponse.json({ user: { id: user.id, name: user.name, username, email }, token }, { status: 201 })
      res.cookies.set('halo_token', token, { httpOnly: true, path: '/', sameSite: 'lax' })
      return res
    } catch (prismaErr) {
      if (prismaAvailable) {
        // Prisma was available but an operation failed — surface server error
        return NextResponse.json({ message: 'Having trouble signing you up — try again later.' }, { status: 503 })
      }
      // otherwise, Prisma not configured: fall back to in-memory below
    }

    // check existing (in-memory fallback)
    for (const u of users.values()) {
      if (u.email === email) return NextResponse.json({ message: 'Email already exists' }, { status: 409 })
      if (u.username === username) return NextResponse.json({ message: 'Username already exists' }, { status: 409 })
    }

    const id = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`
    const user = { id, name: name || '', username, email, password, friends: [], likes: [] }
    users.set(id, user)

    const token = Buffer.from(`${email}:${Date.now()}`).toString('base64')
    // map token -> user id for session lookups (in-memory)
    tokens.set(token, id)
    const res = NextResponse.json({ user: { id, name: user.name, username, email }, token }, { status: 201 })
    res.cookies.set('halo_token', token, { httpOnly: true, path: '/', sameSite: 'lax' })
    return res
  } catch (err) {
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
