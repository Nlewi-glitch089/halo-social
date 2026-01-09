import { describe, it, expect } from 'vitest'
import { execSync } from 'child_process'

describe('Database schema', () => {
  it('prisma client can be imported', () => {
    const pkg = require('@prisma/client')
    expect(pkg).toBeDefined()
  })

  it('schema.prisma file exists and contains PublishedImage model', () => {
    const s = require('fs').readFileSync('prisma/schema.prisma', 'utf8')
    expect(s).toMatch(/model\s+PublishedImage/)
  })
})
