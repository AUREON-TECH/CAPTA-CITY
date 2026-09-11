export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return

  try {
    const registration = await navigator.serviceWorker.register('./sw.js?v=1', {
      updateViaCache: 'none',
    })
    void registration.update().catch(() => undefined)
  } catch (error) {
    console.warn('CAPTA CITY: service worker registration failed', error)
  }
}
