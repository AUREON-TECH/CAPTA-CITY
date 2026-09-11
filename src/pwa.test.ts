import { afterEach, describe, expect, it, vi } from 'vitest'
import { registerServiceWorker } from './pwa'

describe('CAPTA CITY PWA', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('registers the versioned service worker without using the HTTP cache', async () => {
    const register = vi.fn().mockResolvedValue({})
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { register },
    })

    await registerServiceWorker()

    expect(register).toHaveBeenCalledWith('./sw.js?v=1', {
      updateViaCache: 'none',
    })
  })
})
