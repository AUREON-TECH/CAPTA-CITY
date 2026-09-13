import { afterEach, describe, expect, it, vi } from 'vitest'
import { registerServiceWorker } from './pwa'

describe('CAPTA CITY PWA', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('registers the current versioned service worker without using the HTTP cache', async () => {
    const register = vi.fn().mockResolvedValue({ update: vi.fn().mockResolvedValue(undefined) })
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { register },
    })
    Object.defineProperty(window, 'isSecureContext', {
      configurable: true,
      value: true,
    })

    await registerServiceWorker()

    expect(register).toHaveBeenCalledWith('./sw.js?v=v3-public-static-only', {
      updateViaCache: 'none',
    })
  })

  it('does not register a service worker in an insecure non-local context', async () => {
    const register = vi.fn()
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { register },
    })
    Object.defineProperty(window, 'isSecureContext', {
      configurable: true,
      value: false,
    })

    await registerServiceWorker()

    expect(register).not.toHaveBeenCalled()
  })
})
