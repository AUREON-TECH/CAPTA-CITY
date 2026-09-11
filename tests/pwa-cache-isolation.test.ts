import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('PWA cache isolation', () => {
  it('only deletes old CAPTA CITY caches during activation', () => {
    const sw = readFileSync('public/sw.js', 'utf8')
    expect(sw).toContain("const CACHE_PREFIX = 'capta-city-'")
    expect(sw).toMatch(/key\.startsWith\(CACHE_PREFIX\).*key !== CACHE/s)
    expect(sw).not.toMatch(/filter\(key => key !== CACHE\)/)
  })
})
