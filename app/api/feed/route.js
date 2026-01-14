import { NextResponse } from 'next/server'

const getCookie = (cookieHeader, name) => {
  const m = cookieHeader.split(';').map(s => s.trim()).find(s => s.startsWith(name + '='))
  return m ? m.split('=')[1] : null
}

export async function GET(req) {
  try {
    const url = new URL(req.url)
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))
    const limit = Math.max(1, parseInt(url.searchParams.get('limit') || '10', 10))
    const username = url.searchParams.get('username')
    const start = (page - 1) * limit

    const poolUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
    if (!poolUrl) return NextResponse.json({ message: 'Database not configured' }, { status: 503 })

    const { Client } = await import('pg')
    const client = new Client({ connectionString: poolUrl })
    await client.connect()
    try {
      let q, params
      if (username) {
        q = `SELECT p.id, p.prompt, p.image_url AS "imageUrl", p.hearts, p.created_at AS "createdAt", u.id AS author_id, u.username AS author_username, u.name AS author_name FROM published_images p LEFT JOIN users u ON u.id = p.author_id WHERE u.username = $3 ORDER BY p.created_at DESC LIMIT $1 OFFSET $2`
        params = [limit, start, username]
      } else {
        q = `SELECT p.id, p.prompt, p.image_url AS "imageUrl", p.hearts, p.created_at AS "createdAt", u.id AS author_id, u.username AS author_username, u.name AS author_name FROM published_images p LEFT JOIN users u ON u.id = p.author_id ORDER BY p.created_at DESC LIMIT $1 OFFSET $2`
        params = [limit, start]
      }
      const res = await client.query(q, params)
      const itemsDb = res.rows.map(r => ({ id: String(r.id), imageUrl: r.imageurl || r.imageUrl, prompt: r.prompt, hearts: Number(r.hearts || 0), createdAt: r.createdat || r.createdAt, author: r.author_id ? { id: String(r.author_id), username: r.author_username, name: r.author_name } : null }))

      const cookieHeader = req.headers.get('cookie') || ''
      const token = getCookie(cookieHeader, 'halo_token')
      let currentUserId = null
      if (token) {
        const tRes = await client.query('SELECT "userId" FROM tokens WHERE token = $1 LIMIT 1', [token]).catch(() => ({ rowCount: 0 }))
        if (tRes.rowCount > 0) currentUserId = tRes.rows[0].userId
      }

      if (currentUserId) {
        const ids = itemsDb.map(it => Number(it.id))
        if (ids.length > 0) {
          const likeRes = await client.query(`SELECT "imageId" FROM likes WHERE "userId" = $1 AND "imageId" = ANY($2::int[])`, [currentUserId, ids])
          const likedSet = new Set(likeRes.rows.map(r => String(r.imageid || r.imageId)))
          for (const it of itemsDb) it.likedByCurrent = likedSet.has(it.id)
        }
      }

      let total = 0
      if (username) {
        const cnt = await client.query('SELECT COUNT(*)::int AS cnt FROM published_images p JOIN users u ON u.id = p.author_id WHERE u.username = $1', [username])
        total = cnt.rowCount ? cnt.rows[0].cnt : 0
      } else {
        const cnt = await client.query('SELECT COUNT(*)::int AS cnt FROM published_images')
        total = cnt.rowCount ? cnt.rows[0].cnt : 0
      }
      await client.end()
      const totalPages = Math.max(1, Math.ceil(total / limit))
      return NextResponse.json({ images: itemsDb, totalPages, page })
    } catch (e) {
      try { await client.end() } catch (er) {}
      return NextResponse.json({ message: 'Database error' }, { status: 503 })
    }
  } catch (err) {
    return NextResponse.json({ message: String(err) }, { status: 500 })
  }
}

export async function PUT(req) {
  try {
    const body = await req.json()
    const { id, hearts } = body
    if (!id) return NextResponse.json({ message: 'Missing id' }, { status: 400 })
    const poolUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
    if (!poolUrl) return NextResponse.json({ message: 'Database not configured' }, { status: 503 })
    try {
      const { Client } = await import('pg')
      const client = new Client({ connectionString: poolUrl })
      await client.connect()
      const res = await client.query('UPDATE published_images SET hearts = $1 WHERE id = $2 RETURNING id, image_url AS "imageUrl", prompt, hearts, created_at AS "createdAt"', [Number(hearts) || 0, Number(id)])
      await client.end()
      if (res.rowCount === 0) return NextResponse.json({ message: 'Not found' }, { status: 404 })
      return NextResponse.json({ ok: true, item: res.rows[0] })
    } catch (e) {
      return NextResponse.json({ message: 'Database error' }, { status: 503 })
    }
  } catch (err) {
    return NextResponse.json({ message: String(err) }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const body = await req.json()
    const imageUrl = body.imageUrl || '/placeholder-image.jpg'
    const prompt = body.prompt || ''
    const poolUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
    if (!poolUrl) return NextResponse.json({ message: 'Database not configured' }, { status: 503 })

    const cookieHeader = req.headers.get('cookie') || ''
    const token = getCookie(cookieHeader, 'halo_token')
    let authorId = null
    try {
      const { Client } = await import('pg')
      const client = new Client({ connectionString: poolUrl })
      await client.connect()
      if (token) {
        const tRes = await client.query('SELECT "userId" FROM tokens WHERE token = $1 LIMIT 1', [token]).catch(() => ({ rowCount: 0 }))
        if (tRes.rowCount > 0) authorId = tRes.rows[0].userId
      }
      if (authorId) {
        const res = await client.query('INSERT INTO published_images (image_url, prompt, author_id) VALUES ($1,$2,$3) RETURNING id, image_url AS "imageUrl", prompt, hearts, created_at AS "createdAt", author_id', [imageUrl, prompt, Number(authorId)])
        await client.end()
        const row = res.rows[0]
        const item = { ...row, author: row.author_id ? { id: String(row.author_id) } : null }
        return NextResponse.json({ ok: true, item }, { status: 201 })
      } else {
        const res = await client.query('INSERT INTO published_images (image_url, prompt) VALUES ($1,$2) RETURNING id, image_url AS "imageUrl", prompt, hearts, created_at AS "createdAt"', [imageUrl, prompt])
        await client.end()
        return NextResponse.json({ ok: true, item: res.rows[0] }, { status: 201 })
      }
    } catch (e) {
      return NextResponse.json({ message: 'Database error' }, { status: 503 })
    }
  } catch (err) {
    return NextResponse.json({ message: String(err) }, { status: 500 })
  }
}
              await client.end()
              if (res.rowCount === 0) return NextResponse.json({ message: 'Not found' }, { status: 404 })
              return NextResponse.json({ ok: true, item: res.rows[0] })
            } catch (e) {
              return NextResponse.json({ message: 'Database error' }, { status: 503 })
                params = [limit, start, username]
              } else {
                q = `SELECT p.id, p.prompt, p.image_url AS "imageUrl", p.hearts, p.created_at AS "createdAt", u.id AS author_id, u.username AS author_username, u.name AS author_name FROM published_images p LEFT JOIN users u ON u.id = p.author_id ORDER BY p.created_at DESC LIMIT $1 OFFSET $2`
                params = [limit, start]
              }
              const res = await client.query(q, params)
              const itemsDb = res.rows.map(r => ({ id: String(r.id), imageUrl: r.imageurl || r.imageUrl, prompt: r.prompt, hearts: Number(r.hearts || 0), createdAt: r.createdat || r.createdAt, author: r.author_id ? { id: String(r.author_id), username: r.author_username, name: r.author_name } : null }))

              // detect current user by token cookie (if present)
              const cookieHeader = req.headers.get('cookie') || ''
              const getCookie = (name) => {
                const m = cookieHeader.split(';').map(s=>s.trim()).find(s=>s.startsWith(name+'='))
                return m ? m.split('=')[1] : null
              }
              const token = getCookie('halo_token')
              let currentUserId = null
              if (token) {
                const tRes = await client.query('SELECT "userId" FROM tokens WHERE token = $1 LIMIT 1', [token]).catch(()=>({ rowCount: 0 }))
                if (tRes.rowCount > 0) currentUserId = tRes.rows[0].userId
              }

              if (currentUserId) {
                const ids = itemsDb.map(it => Number(it.id))
                if (ids.length > 0) {
                  const likeRes = await client.query(`SELECT "imageId" FROM likes WHERE "userId" = $1 AND "imageId" = ANY($2::int[])`, [currentUserId, ids])
                  const likedSet = new Set(likeRes.rows.map(r => String(r.imageid || r.imageId)))
                  for (const it of itemsDb) it.likedByCurrent = likedSet.has(it.id)
                }
              }

              // total pages: do a count query
              let total = 0
              if (username) {
                const cnt = await client.query('SELECT COUNT(*)::int AS cnt FROM published_images p JOIN users u ON u.id = p.author_id WHERE u.username = $1', [username])
                total = cnt.rowCount ? cnt.rows[0].cnt : 0
              } else {
                const cnt = await client.query('SELECT COUNT(*)::int AS cnt FROM published_images')
                total = cnt.rowCount ? cnt.rows[0].cnt : 0
              }
              await client.end()
              const totalPages = Math.max(1, Math.ceil(total / limit))
              return NextResponse.json({ images: itemsDb, totalPages, page })
            } catch (e) {
              try { await client.end() } catch (er) {}
              return NextResponse.json({ message: 'Database error' }, { status: 503 })
            }
          } catch (err) {
            return NextResponse.json({ message: String(err) }, { status: 500 })
          }
        }
      } catch (e) {
        try {
          const { Client } = await import('pg')
          const client = new Client({ connectionString: poolUrl })
          await client.connect()
          if (authorId) {
            const res = await client.query('INSERT INTO published_images (image_url, prompt, author_id) VALUES ($1,$2,$3) RETURNING id, image_url AS "imageUrl", prompt, hearts, created_at AS "createdAt", author_id', [imageUrl, prompt, Number(authorId)])
            await client.end()
            const row = res.rows[0]
            const item = { ...row, author: row.author_id ? { id: String(row.author_id) } : null }
            return NextResponse.json({ ok: true, item }, { status: 201 })
          } else {
            const res = await client.query('INSERT INTO published_images (image_url, prompt) VALUES ($1,$2) RETURNING id, image_url AS "imageUrl", prompt, hearts, created_at AS "createdAt"', [imageUrl, prompt])
            await client.end()
            return NextResponse.json({ ok: true, item: res.rows[0] }, { status: 201 })
          }
        } catch (pgE) {
          // fall through to in-memory
        }
      }
    }

    const item = {
      id: `post_${Date.now()}`,
      imageUrl,
      prompt,
      hearts: 0,
      createdAt: new Date().toISOString(),
      author: body.author || { id: 'guest', name: 'Guest', username: 'guest' }
    }
    FEED.unshift(item)
    return NextResponse.json({ ok: true, item }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ message: String(err) }, { status: 500 })
  }
}
