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

    // check existing
    for (const u of users.values()) {
      if (u.email === email) return NextResponse.json({ message: 'Email already exists' }, { status: 409 })
      if (u.username === username) return NextResponse.json({ message: 'Username already exists' }, { status: 409 })
    }

    const id = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`
    const user = { id, name: name || '', username, email, password, friends: [], likes: [] }
    users.set(id, user)

    const token = Buffer.from(`${email}:${Date.now()}`).toString('base64')
    // map token -> user id for session lookups
    tokens.set(token, id)
    const res = NextResponse.json({ user: { id, name: user.name, username, email }, token }, { status: 201 })
    res.cookies.set('halo_token', token, { httpOnly: true, path: '/', sameSite: 'lax' })
    return res
  } catch (err) {
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
