import { NextResponse } from 'next/server'

// In-memory users store for dev-only fallback. Use DB when configured.
const poolUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
const users = poolUrl ? null : (global.__halo_users ||= new Map())
const tokens = poolUrl ? null : (global.__halo_tokens ||= new Map())

export async function POST(req) {
  try {
    try {
      const poolUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
      const hasTest = Boolean(process.env.TEST_DATABASE_URL)
      const hasMain = Boolean(process.env.DATABASE_URL)
      let host = '<none>'
      try { if (poolUrl) host = new URL(poolUrl).host } catch (e) { host = '<unparseable>' }
      console.debug('ENV check — TEST_DATABASE_URL present?', hasTest, 'DATABASE_URL present?', hasMain, 'db host:', host)
    } catch (e) { /* ignore logging errors */ }
    const body = await req.json()
    const { name, username, email, password } = body || {}
    if (!email || !password || !username) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
    }

    // Try using Prisma when a runtime DB is configured. If Prisma isn't
    // configured (getPrisma throws), fall back to in-memory. If Prisma is
    // configured but any DB operation fails, return 503 so the client sees
    // a clear server error instead of silently falling back.
    // On Windows, the Prisma client may be configured with the Neon
    // adapter which can fail to run queries in dev; prefer the direct
    // pg fallback on Windows to ensure persistence works reliably.
    const skipPrisma = process.platform === 'win32' || Boolean(process.env.FORCE_PG)
    let prismaAvailable = false
    try {
      if (skipPrisma) throw new Error('Skipping Prisma on this platform')
      const { getPrisma } = await import('../../../../lib/prismaClient.mjs')
      const prisma = await getPrisma()
      prismaAvailable = true

      const existsEmail = await prisma.user.findUnique({ where: { email } })
        try { console.debug('Prisma: existsEmail ->', Boolean(existsEmail)) } catch (e) {}
      if (existsEmail) return NextResponse.json({ message: 'Email already exists' }, { status: 409 })
      const existsUsername = await prisma.user.findUnique({ where: { username } })
        try { console.debug('Prisma: existsUsername ->', Boolean(existsUsername)) } catch (e) {}
      if (existsUsername) return NextResponse.json({ message: 'Username already exists' }, { status: 409 })

      const user = await prisma.user.create({ data: { name: name || '', username, email, password } })
      const token = Buffer.from(`${email}:${Date.now()}`).toString('base64')
      await prisma.token.create({ data: { token, userId: user.id } })
      try { console.debug('Signup persistence: prisma') } catch (e) {}

      const res = NextResponse.json({ user: { id: user.id, name: user.name, username, email }, token }, { status: 201 })
      res.cookies.set('halo_token', token, { httpOnly: true, path: '/', sameSite: 'lax' })
      return res
    } catch (prismaErr) {
      // Log Prisma errors for easier debugging in dev
      try {
        console.error('Prisma signup error:', prismaErr?.message || prismaErr)
      } catch (e) {
        // ignore logging errors
      }
      // Attempt a direct `pg` fallback write when Prisma operations fail.
      // This lets the dev server persist signups until Prisma is debugged.
      try {
        const { Client } = await import('pg')
        const client = new Client({ connectionString: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL })
        await client.connect()

        // Check uniqueness
        const emailRes = await client.query('SELECT "id" FROM "users" WHERE "email" = $1 LIMIT 1', [email])
        try { console.debug('pg: emailRes.rowCount ->', emailRes.rowCount) } catch (e) {}
        if (emailRes.rowCount > 0) {
          try { console.debug('pg: existing email rows ->', emailRes.rows) } catch (e) {}
          await client.end()
          return NextResponse.json({ message: 'Email already exists' }, { status: 409 })
        }
        const userRes = await client.query('SELECT "id" FROM "users" WHERE "username" = $1 LIMIT 1', [username])
        if (userRes.rowCount > 0) {
          await client.end()
          return NextResponse.json({ message: 'Username already exists' }, { status: 409 })
        }

        const insertUser = await client.query(
          'INSERT INTO "users" ("name","username","email","password") VALUES ($1,$2,$3,$4) RETURNING "id","name","username","email","createdAt"',
          [name || '', username, email, password]
        )
        const createdUser = insertUser.rows[0]
        try { console.debug('Signup persistence: pg-fallback') } catch (e) {}

        const token = Buffer.from(`${email}:${Date.now()}`).toString('base64')
        await client.query('INSERT INTO "tokens" ("token","userId") VALUES ($1,$2)', [token, createdUser.id])
        await client.end()

        const res = NextResponse.json({ user: { id: createdUser.id, name: createdUser.name, username: createdUser.username, email: createdUser.email }, token }, { status: 201 })
        res.cookies.set('halo_token', token, { httpOnly: true, path: '/', sameSite: 'lax' })
        return res
      } catch (pgErr) {
        try { console.error('pg fallback error:', pgErr && pgErr.message ? pgErr.message : pgErr) } catch (_) {}
        // If pg fallback fails, either surface an error (when DB is
        // configured) or continue to in-memory fallback for pure dev.
        try { console.debug('pg fallback error, falling back to in-memory') } catch (e) {}
        prismaAvailable = false
        const poolUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
        if (poolUrl) {
          return NextResponse.json({ message: 'Having trouble signing you up — try again later.' }, { status: 503 })
        }
      }
    }

    // check existing (in-memory fallback)
    for (const u of users.values()) {
      try { console.debug('in-memory: checking user', u.email, u.username) } catch (e) {}
      if (u.email === email) return NextResponse.json({ message: 'Email already exists' }, { status: 409 })
      if (u.username === username) return NextResponse.json({ message: 'Username already exists' }, { status: 409 })
    }

    const id = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`
    const user = { id, name: name || '', username, email, password, friends: [], likes: [] }
    users.set(id, user)

    const token = Buffer.from(`${email}:${Date.now()}`).toString('base64')
    // map token -> user id for session lookups (in-memory)
    tokens.set(token, id)
    try { console.debug('Signup persistence: in-memory') } catch (e) {}
    const res = NextResponse.json({ user: { id, name: user.name, username, email }, token }, { status: 201 })
    res.cookies.set('halo_token', token, { httpOnly: true, path: '/', sameSite: 'lax' })
    return res
  } catch (err) {
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
