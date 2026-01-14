import { NextResponse } from 'next/server'

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

export async function GET(req, { params }){
  try{
    const { username } = params
    const poolUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
    if (!poolUrl) return NextResponse.json({ message: 'Database not configured' }, { status: 503 })

    const { Client } = await import('pg')
    const client = new Client({ connectionString: poolUrl })
    await client.connect()
    try {
      // Fetch user
      const ures = await client.query('SELECT id, name, username, COALESCE(NULL::text, NULL) AS bio FROM users WHERE username = $1 LIMIT 1', [username])
      if (ures.rowCount === 0) { await client.end(); return NextResponse.json({ message: 'Not found' }, { status: 404 }) }
      const userRow = ures.rows[0]

      // determine current user id from token cookie if present
      const cookies = parseCookieHeader(req)
      const token = cookies['halo_token']
      let currentUserId = null
      if (token) {
        const t = await client.query('SELECT "userId" FROM tokens WHERE token = $1 LIMIT 1', [token]).catch(()=>({ rowCount: 0 }))
        if (t.rowCount > 0) currentUserId = t.rows[0].userId
      }

      // friends count and isFriend
      let isFriend = false
      let friendsCount = 0
      if (currentUserId) {
        const f = await client.query('SELECT 1 FROM friends WHERE "userId" = $1 AND "friendId" = (SELECT id FROM users WHERE username = $2 LIMIT 1) LIMIT 1', [currentUserId, username])
        isFriend = f.rowCount > 0
      }
      const fc = await client.query('SELECT COUNT(*)::int AS cnt FROM friends WHERE "userId" = (SELECT id FROM users WHERE username = $1 LIMIT 1)', [username])
      friendsCount = fc.rowCount ? fc.rows[0].cnt : 0

      // posts and likes counts
      const pres = await client.query('SELECT COUNT(*)::int AS cnt, COALESCE(SUM(hearts)::int,0) AS likes FROM published_images WHERE author_id = (SELECT id FROM users WHERE username = $1 LIMIT 1)', [username])
      const postsCount = pres.rowCount ? pres.rows[0].cnt : 0
      const likesCount = pres.rowCount ? pres.rows[0].likes : 0

      await client.end()
      return NextResponse.json({ profile: { name: userRow.name, username: userRow.username, bio: userRow.bio || '', posts: postsCount, likes: likesCount, friends: friendsCount, isFriend } })
    } catch (e) {
      try{ await client.end() }catch(_){}
      return NextResponse.json({ message: 'Database error' }, { status: 503 })
    }
  }catch(err){
    return NextResponse.json({ message: String(err) }, { status: 500 })
  }
}
