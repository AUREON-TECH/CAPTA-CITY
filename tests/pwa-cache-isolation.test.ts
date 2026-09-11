import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('PWA cache isolation', () => {
  it('only deletes old CAPTA CITY caches during activation', () => {
    const sw = readFileSync('public/sw.js', 'utf8')
    expect(sw).toContain("const CACHE_PREFIX = 'capta-city-'")
    expect(sw).toMatch(/key\.startsWith\(CACHE_PREFIX\).*key !== CACHE/s)
    expect(sw).not.toMatch(/filter\(key => key !== CACHE\)/)
  })

  it('never persists navigation responses and only caches public static assets', () => {
    const sw = readFileSync('public/sw.js', 'utf8')
    expect(sw).toMatch(/if\s*\(request\.mode === ['"]navigate['"]\)\s*\{([\s\S]*?)\n\s*\}/)
    const navigation = sw.match(/if\s*\(request\.mode === ['"]navigate['"]\)\s*\{([\s\S]*?)\n\s*\}/)?.[1] || ''
    expect(navigation).not.toMatch(/safePut\(|cache\.put\(/)
    expect(sw).toContain('isPublicStaticRequest')
    expect(sw).toMatch(/fetch\(request,\s*\{[^}]*cache:\s*['"]no-store['"][^}]*\}/s)
  })
})
