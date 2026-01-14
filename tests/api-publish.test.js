import { describe, it, expect } from 'vitest'

describe('API /api/publish', () => {
  it('route file exists', () => {
    const exists = require('fs').existsSync('app/api/publish/route.js')
    expect(exists).toBe(true)
  })
})
