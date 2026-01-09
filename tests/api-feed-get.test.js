import { describe, it, expect } from 'vitest'

describe('API /api/feed GET', () => {
  it('route file exists', () => {
    const exists = require('fs').existsSync('app/api/feed/route.js')
    expect(exists).toBe(true)
  })
})
