import { NextResponse } from 'next/server'

const poolUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
if (!poolUrl) {
  // DB required for likes; without it the app cannot persist likes.
  export async function POST(){
    return NextResponse.json({ message: 'Database not configured' }, { status: 503 })
  }
}

function parseCookieHeader(req){
  const cookieHeader = req.headers.get('cookie') || ''
  const m = cookieHeader.split(';').map(s=>s.trim())
  const obj = {}
  for(const c of m){
    const cookies = parseCookieHeader(req)
    const token = cookies['halo_token']
    if (!token) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })
    let userId = null
    try {
      const { Client } = await import('pg')
      const client = new Client({ connectionString: poolUrl })
      await client.connect()
      const t = await client.query('SELECT "userId" FROM tokens WHERE token = $1 LIMIT 1', [token]).catch(()=>({ rowCount: 0 }))
      if (t.rowCount === 0) { await client.end(); return NextResponse.json({ message: 'Not authenticated' }, { status: 401 }) }
      userId = t.rows[0].userId

      // Ensure image exists and fetch author/info
      const imgRes = await client.query('SELECT p.id, p.image_url AS "imageUrl", p.prompt, p.hearts, p.created_at AS "createdAt", u.id AS author_id, u.username AS author_username, u.name AS author_name FROM published_images p LEFT JOIN users u ON u.id = p.author_id WHERE p.id = $1 LIMIT 1', [id])
      if (imgRes.rowCount === 0) { await client.end(); return NextResponse.json({ message: 'Not found' }, { status: 404 }) }

      const likeRes = await client.query('SELECT id FROM likes WHERE "userId" = $1 AND "imageId" = $2 LIMIT 1', [userId, id])
      let liked = false
      if (likeRes.rowCount > 0) {
        await client.query('DELETE FROM likes WHERE id = $1', [likeRes.rows[0].id])
        await client.query('UPDATE published_images SET hearts = GREATEST(0, hearts - 1) WHERE id = $1', [id])
        liked = false
      } else {
        await client.query('INSERT INTO likes ("userId","imageId") VALUES ($1,$2)', [userId, id])
        await client.query('UPDATE published_images SET hearts = hearts + 1 WHERE id = $1', [id])
        liked = true
      }

      const updated = await client.query('SELECT p.id, p.image_url AS "imageUrl", p.prompt, p.hearts, p.created_at AS "createdAt", u.id AS author_id, u.username AS author_username, u.name AS author_name FROM published_images p LEFT JOIN users u ON u.id = p.author_id WHERE p.id = $1 LIMIT 1', [id])
      await client.end()
      const r = updated.rows[0]
      const item = { id: String(r.id), imageUrl: r.imageurl || r.imageUrl, prompt: r.prompt, hearts: Number(r.hearts||0), createdAt: r.createdat || r.createdAt, author: r.author_id ? { id: String(r.author_id), username: r.author_username, name: r.author_name } : null }
      return NextResponse.json({ ok: true, item, liked })
      // remove like
      u.likes = u.likes.filter(x=>x!==id)
      FEED[idx].hearts = Math.max(0, (FEED[idx].hearts||0) - 1)
    } else {
      u.likes.push(id)
      FEED[idx].hearts = (FEED[idx].hearts||0) + 1
    }
    users.set(userId, u)
    const src = FEED[idx]
    const item = { id: src.id, imageUrl: src.imageUrl || src.image_url, prompt: src.prompt || '', hearts: Number(src.hearts||0), createdAt: src.createdAt || src.created_at, author: src.author ? { id: src.author.id ? String(src.author.id) : undefined, username: src.author.username, name: src.author.name } : null }
    return NextResponse.json({ ok: true, item, liked: !liked })
  }catch(err){
    return NextResponse.json({ message: String(err) }, { status: 500 })
  }
}
