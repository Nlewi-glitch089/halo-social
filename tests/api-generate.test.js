import { describe, it, expect } from 'vitest'

describe('API /api/generate', () => {
  it('route file exists', () => {
    const exists = require('fs').existsSync('app/api/generate/route.js')
    expect(exists).toBe(true)
  })
})
