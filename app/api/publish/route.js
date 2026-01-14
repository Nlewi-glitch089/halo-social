import { NextResponse } from 'next/server'

// Note: publish requires a database; no in-memory FEED fallback remains.

export async function POST(req) {
  try {
    const body = await req.json()
    const imageUrl = body?.imageUrl
    const prompt = body?.prompt
    const author = body?.author || { id: 'guest', name: 'Guest', username: 'guest' }

    if (!imageUrl) return NextResponse.json({ message: 'Missing imageUrl' }, { status: 400 })
    if (typeof imageUrl !== 'string' || imageUrl.trim().length === 0) return NextResponse.json({ message: 'Invalid imageUrl' }, { status: 400 })
    if (prompt === undefined) return NextResponse.json({ message: 'Missing prompt' }, { status: 400 })
    if (typeof prompt !== 'string') return NextResponse.json({ message: 'Prompt must be a string' }, { status: 400 })

    // Try to use Prisma if the runtime DB is configured. If Prisma isn't
    // configured, fall back to the in-memory FEED so the dev UX still works.
    let prismaAvailable = false
    try {
      const { getPrisma } = await import('../../../lib/prismaClient.mjs')
      const prisma = await getPrisma()
      prismaAvailable = true

      // Try to set author if request contains a valid halo_token
      const cookieHeader = req.headers.get('cookie') || ''
      const getCookie = (name) => {
        const m = cookieHeader.split(';').map(s=>s.trim()).find(s=>s.startsWith(name+'='))
        return m ? m.split('=')[1] : null
      }
      const token = getCookie('halo_token')
      const data = { imageUrl, prompt }
      if (token) {
        const t = await prisma.token.findUnique({ where: { token } }).catch(()=>null)
        if (t) data.authorId = t.userId
      }
      const created = await prisma.publishedImage.create({ data })
      return NextResponse.json(created, { status: 201 })
    } catch (prismaErr) {
      if (prismaAvailable) {
        console.error('Publish DB error', prismaErr)
        return NextResponse.json({ message: 'Database error' }, { status: 500 })
      }
      // otherwise fall through to in-memory fallback
    }

    // Try a direct pg fallback when Prisma isn't available but DB is configured
    const poolUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
    if (poolUrl) {
      try {
        const { Client } = await import('pg')
        const client = new Client({ connectionString: poolUrl })
        await client.connect()
        // detect token
        const cookieHeader = req.headers.get('cookie') || ''
        const getCookie = (name) => {
          const m = cookieHeader.split(';').map(s=>s.trim()).find(s=>s.startsWith(name+'='))
          return m ? m.split('=')[1] : null
        }
        const token = getCookie('halo_token')
        let authorId = null
        if (token) {
          const tres = await client.query('SELECT "userId" FROM tokens WHERE token = $1 LIMIT 1', [token]).catch(()=>({ rowCount: 0 }))
          if (tres.rowCount > 0) authorId = tres.rows[0].userId
        }
        if (authorId) {
          const res = await client.query('INSERT INTO published_images (image_url, prompt, author_id) VALUES ($1,$2,$3) RETURNING id, image_url AS "imageUrl", prompt, hearts, created_at AS "createdAt", author_id', [imageUrl, prompt, Number(authorId)])
          await client.end()
          const row = res.rows[0]
          const item = { ...row, author: row.author_id ? { id: String(row.author_id) } : null }
          return NextResponse.json(item, { status: 201 })
        } else {
          const res = await client.query('INSERT INTO published_images (image_url, prompt) VALUES ($1,$2) RETURNING id, image_url AS "imageUrl", prompt, hearts, created_at AS "createdAt"', [imageUrl, prompt])
          await client.end()
          return NextResponse.json(res.rows[0], { status: 201 })
        }
      } catch (e) {
        // fall through to in-memory
      }
    }

    // No in-memory fallback: require DB to persist published posts
    return NextResponse.json({ message: 'Database not configured' }, { status: 503 })
  } catch (err) {
    console.error('Publish error', err)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
