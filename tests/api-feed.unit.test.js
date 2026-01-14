import { describe, it, expect } from 'vitest'

describe('GET /api/feed', () => {
  it('returns paginated images with totals (test mock)', async () => {
    const { getPrisma } = await import('../lib/prismaClient.mjs')
    const prisma = await getPrisma()
    // create 12 records
    for (let i = 0; i < 12; i++) {
      await prisma.publishedImage.create({ data: { imageUrl: `https://x/${i}.png`, prompt: `p${i}` } })
    }
    const mod = await import('../app/api/feed/route.js')
    const req = { url: 'http://localhost/api/feed?page=2&limit=5' }
    const res = await mod.GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('images')
    expect(body.page).toBe(2)
    expect(body.total).toBeGreaterThanOrEqual(12)
    expect(body.images.length).toBeGreaterThanOrEqual(0)
  })
})

describe('PUT /api/feed', () => {
  it('returns 404 for non-existent id (test mock)', async () => {
    const { getPrisma } = await import('../lib/prismaClient.mjs')
    const prisma = await getPrisma()
    const created = await prisma.publishedImage.create({ data: { imageUrl: 'https://x/put.png', prompt: 'p' } })
    const mod = await import('../app/api/feed/route.js')
    const req = { json: async () => ({ id: created.id, hearts: 5 }), url: 'http://localhost/api/feed' }
    const res = await mod.PUT(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.hearts).toBe(5)
  })
})
