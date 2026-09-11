const CACHE = 'capta-city-v1-safe-shell'
const CORE = ['./', './index.html', './offline.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png']
const SENSITIVE_PATH = /\/(api|auth|login|logout|token|session|supabase|graphql)(\/|$)/i
const SENSITIVE_QUERY = /(^|&)(token|access_token|refresh_token|code|password|session)=/i
const SENSITIVE_VARY = /(^|,|\s)(authorization|cookie|range|if-range)(,|$)/i

function requestIsSensitive(request, url) {
  const headers = request.headers
  return request.method !== 'GET' ||
    request.cache === 'no-store' ||
    headers.has('authorization') || headers.has('cookie') || headers.has('range') || headers.has('if-range') ||
    SENSITIVE_PATH.test(url.pathname) || SENSITIVE_QUERY.test(url.search.slice(1))
}

function responseIsCacheable(response) {
  if (!response || !response.ok || response.status === 206) return false
  const cacheControl = response.headers.get('cache-control') || ''
  const vary = response.headers.get('vary') || ''
  return !/private|no-store/i.test(cacheControl) &&
    !response.headers.has('set-cookie') &&
    !response.headers.has('content-range') &&
    vary !== '*' && !SENSITIVE_VARY.test(vary)
}

async function safePut(request, response) {
  if (!responseIsCacheable(response)) return
  const url = new URL(request.url)
  if (requestIsSensitive(request, url)) return
  const cache = await caches.open(CACHE)
  await cache.put(request, response.clone())
}

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)))
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))))
  self.clients.claim()
})

self.addEventListener('fetch', event => {
  const request = event.request
  const url = new URL(request.url)
  if (url.origin !== self.location.origin || requestIsSensitive(request, url)) return

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(response => {
      void safePut(request, response)
      return response
    }).catch(async () => (await caches.match(request)) || caches.match('./offline.html')))
    return
  }

  const staticAsset = ['script', 'style', 'image', 'font', 'manifest'].includes(request.destination)
  if (!staticAsset) return

  event.respondWith(caches.match(request).then(cached => {
    const network = fetch(request).then(response => {
      void safePut(request, response)
      return response
    })
    return cached || network
  }))
})
