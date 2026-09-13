const SERVICE_WORKER_VERSION = 'v3-public-static-only'

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !window.isSecureContext) return

  try {
    const registration = await navigator.serviceWorker.register(`./sw.js?v=${SERVICE_WORKER_VERSION}`, {
      updateViaCache: 'none',
    })
    void registration.update().catch(() => undefined)
  } catch (error) {
    console.warn('CAPTA CITY: service worker registration failed', error)
  }
}
