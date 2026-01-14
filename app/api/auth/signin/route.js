import { NextResponse } from 'next/server'

const poolUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
const users = poolUrl ? null : (global.__halo_users ||= new Map())
const tokens = poolUrl ? null : (global.__halo_tokens ||= new Map())

export async function POST(req) {
  try {
    const body = await req.json()
    const { email, password } = body || {}
    if (!email || !password) return NextResponse.json({ message: 'Missing credentials' }, { status: 400 })

    // find user
    // Prefer Prisma when DB is configured. If Prisma isn't configured,
    // fall back to the in-memory store. If Prisma is available but the DB
    // operations fail, return 503 to show a server-side error.
    const skipPrisma = process.platform === 'win32' || Boolean(process.env.FORCE_PG)
    let prismaAvailable = false
    try {
      if (skipPrisma) throw new Error('Skipping Prisma on this platform')
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
      // otherwise attempt a direct pg fallback (or in-memory if no DB)
      try {
        const poolUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
        if (poolUrl) {
          const { Client } = await import('pg')
          const client = new Client({ connectionString: poolUrl })
          await client.connect()
          const userRes = await client.query('SELECT "id","name","username","email","password" FROM "users" WHERE "email" = $1 LIMIT 1', [email])
          if (userRes.rowCount === 0) { await client.end(); return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 }) }
          const found = userRes.rows[0]
          if (found.password !== password) { await client.end(); return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 }) }
          const token = Buffer.from(`${email}:${Date.now()}`).toString('base64')
          await client.query('INSERT INTO "tokens" ("token","userId") VALUES ($1,$2)', [token, found.id])
          await client.end()
          const res = NextResponse.json({ user: { id: found.id, name: found.name, username: found.username, email: found.email }, token })
          res.cookies.set('halo_token', token, { httpOnly: true, path: '/', sameSite: 'lax' })
          return res
        }
      } catch (pgErr) {
        try { console.error('pg signin fallback error:', pgErr && pgErr.message ? pgErr.message : pgErr) } catch (e) {}
      }
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
