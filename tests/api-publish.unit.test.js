import { describe, it, expect } from 'vitest'
import { getPrisma } from '../lib/prismaClient.mjs'

describe('POST /api/publish', () => {
  it('creates a published image and returns 201 (test mock)', async () => {
    const mod = await import('../app/api/publish/route.js')
    const payload = { imageUrl: 'https://example.test/img.png', prompt: 'test prompt' }
    const req = { json: async () => payload, url: 'http://localhost/api/publish' }
    const res = await mod.POST(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body).toHaveProperty('id')
    // verify persisted in DB
    const prisma = await getPrisma()
    const found = await prisma.publishedImage.findUnique({ where: { id: body.id } })
    expect(found).toBeDefined()
  })

  it('returns 400 for missing imageUrl', async () => {
    const mod = await import('../app/api/publish/route.js')
    const req = { json: async () => ({ prompt: 'x' }), url: 'http://localhost/api/publish' }
    const res = await mod.POST(req)
    expect(res.status).toBe(400)
  })
})
