import { NextResponse } from 'next/server'

// Simple in-memory feed store for dev. Persisted to globalThis so HMR keeps it.
const FEED = globalThis.__DEV_FEED ||= []

// Seed a few example posts so the feed has visible content in dev.
if (FEED.length === 0) {
  FEED.push(
    {
      id: 'sample-1',
      imageUrl: '/sample-beach.jpg',
      prompt: 'Me walking along a rocky beach at sunset',
      hearts: 12,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      author: { id: 'user-1', name: 'Sarah Johnson', username: 'sarah_adventures' }
    },
    {
      id: 'sample-2',
      imageUrl: '/sample-portrait.jpg',
      prompt: 'Portrait of me smiling in a vintage cafe',
      hearts: 7,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
      author: { id: 'user-2', name: 'Mike Chen', username: 'mike_travels' }
    },
    {
      id: 'sample-3',
      imageUrl: '/sample-mountain.jpg',
      prompt: 'Hiking up to the ridge with friends, windy day',
      hearts: 3,
      createdAt: new Date().toISOString(),
      author: { id: 'user-3', name: 'Alex Martinez', username: 'alex_explorer' }
    }
  )

  // Extra seeded posts to give the feed more variety
  FEED.push(
    {
      id: 'sample-4',
      imageUrl: '/sample-city.jpg',
      prompt: 'Night skyline with neon reflections on the river',
      hearts: 21,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
      author: { id: 'user-4', name: 'Priya Singh', username: 'priya_cityscapes' }
    },
    {
      id: 'sample-5',
      imageUrl: '/sample-forest.jpg',
      prompt: 'Sunbeams through the pines during an early morning hike',
      hearts: 9,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
      author: { id: 'user-5', name: 'Diego Alvarez', username: 'diego_outdoors' }
    },
    {
      id: 'sample-6',
      imageUrl: '/sample-food.jpg',
      prompt: 'A cozy brunch table with colorful pastries',
      hearts: 14,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
      author: { id: 'user-6', name: 'Evelyn Park', username: 'evelyn_foodie' }
    },
    {
      id: 'sample-7',
      imageUrl: '/sample-sunset.jpg',
      prompt: 'Quiet pier and a pastel sky at dusk',
      hearts: 5,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      author: { id: 'user-7', name: 'Noah Williams', username: 'noah_pier' }
    },
    {
      id: 'sample-8',
      imageUrl: '/sample-street.jpg',
      prompt: 'Morning market, vendors setting up their stalls',
      hearts: 4,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
      author: { id: 'user-8', name: 'Lina Gomez', username: 'lina_market' }
    }
  )
}

// Ensure sample authors exist in the in-memory users map so profiles and counts work.
{
  const users = global.__halo_users ||= new Map()
  const sampleAuthors = [
    { id: 'user-1', name: 'Sarah Johnson', username: 'sarah_adventures' },
    { id: 'user-2', name: 'Mike Chen', username: 'mike_travels' },
    { id: 'user-3', name: 'Alex Martinez', username: 'alex_explorer' },
    { id: 'user-4', name: 'Priya Singh', username: 'priya_cityscapes' },
    { id: 'user-5', name: 'Diego Alvarez', username: 'diego_outdoors' },
    { id: 'user-6', name: 'Evelyn Park', username: 'evelyn_foodie' },
    { id: 'user-7', name: 'Noah Williams', username: 'noah_pier' },
    { id: 'user-8', name: 'Lina Gomez', username: 'lina_market' }
  ]
  for (const a of sampleAuthors) {
    if (!Array.from(users.values()).find(u=>u.username===a.username)) {
      const id = a.id
      users.set(id, { id, name: a.name, username: a.username, email: `${a.username}@example.com`, password: 'devpass', friends: [], likes: [] })
    }
  }
}

export async function GET(req) {
  try {
    const url = new URL(req.url)
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))
    const limit = Math.max(1, parseInt(url.searchParams.get('limit') || '10', 10))
    const username = url.searchParams.get('username')
    const start = (page - 1) * limit
    let items = FEED
    if (username) items = items.filter(i => i.author && i.author.username === username)

    // detect current user by token cookie (if present) so we can mark liked status
    const cookieHeader = req.headers.get('cookie') || ''
    const getCookie = (name) => {
      const m = cookieHeader.split(';').map(s=>s.trim()).find(s=>s.startsWith(name+'='))
      return m ? m.split('=')[1] : null
    }
    const token = getCookie('halo_token')
    const tokens = global.__halo_tokens ||= new Map()
    const users = global.__halo_users ||= new Map()
    let currentUserId = null
    if (token) {
      try {
        const { getPrisma } = await import('../../../lib/prismaClient.mjs')
        const prisma = await getPrisma()
        const t = await prisma.token.findUnique({ where: { token } }).catch(() => null)
        if (t) currentUserId = t.userId
      } catch (e) {
        // ignore and fall back to in-memory
      }
      if (!currentUserId) currentUserId = tokens.get(token)
    }

    const images = items.slice(start, start + limit).map(i => {
      const likedByCurrent = currentUserId ? (users.get(currentUserId)?.likes || []).includes(i.id) : false
      return { ...i, likedByCurrent }
    })
    const totalPages = Math.max(1, Math.ceil(items.length / limit))
    return NextResponse.json({ images, totalPages, page })
  } catch (err) {
    return NextResponse.json({ message: String(err) }, { status: 500 })
  }
}

export async function PUT(req) {
  try {
    const body = await req.json()
    const { id, hearts } = body
    if (!id) return NextResponse.json({ message: 'Missing id' }, { status: 400 })
    const idx = FEED.findIndex((i) => i.id === id)
    if (idx === -1) return NextResponse.json({ message: 'Not found' }, { status: 404 })
    FEED[idx].hearts = Number(hearts) || 0
    return NextResponse.json({ ok: true, item: FEED[idx] })
  } catch (err) {
    return NextResponse.json({ message: String(err) }, { status: 500 })
  }
}

export async function POST(req) {
  // Optional: allow creating a new feed item in dev
  try {
    const body = await req.json()
    const item = {
      id: `post_${Date.now()}`,
      imageUrl: body.imageUrl || '/placeholder-image.jpg',
      prompt: body.prompt || '',
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
