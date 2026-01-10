import { NextResponse } from 'next/server'

const users = global.__halo_users ||= new Map()
const tokens = global.__halo_tokens ||= new Map()

export async function POST(req) {
  try {
    const body = await req.json()
    const { email, password } = body || {}
    if (!email || !password) return NextResponse.json({ message: 'Missing credentials' }, { status: 400 })

    // find user
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
