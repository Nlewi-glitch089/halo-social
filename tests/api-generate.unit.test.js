import { describe, it, expect, vi, beforeAll } from 'vitest'
import path from 'path'

// Mock OpenAI to return a predictable image URL
vi.mock('openai', () => {
  return {
    default: function OpenAI() {
      this.images = {
        generate: async ({ prompt }) => ({ data: [{ url: `https://example.test/${encodeURIComponent(prompt)}.png` }] }),
      }
    }
  }
})

describe('POST /api/generate', () => {
  it('returns 200 and imageUrl for valid prompt', async () => {
    const mod = await import('../app/api/generate/route.js')
    const req = { json: async () => ({ prompt: 'a purple cat' }), url: 'http://localhost/api/generate' }
    const res = await mod.POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('imageUrl')
    expect(body.prompt).toBe('a purple cat')
  })

  it('returns 400 for missing prompt', async () => {
    const mod = await import('../app/api/generate/route.js')
    const req = { json: async () => ({ }), url: 'http://localhost/api/generate' }
    const res = await mod.POST(req)
    expect(res.status).toBe(400)
  })
})
