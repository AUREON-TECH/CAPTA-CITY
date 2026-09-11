const CACHE_PREFIX = 'capta-city-'
const CACHE = `${CACHE_PREFIX}v3-public-static-only`
const CORE = ['./index.html', './offline.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png']
const SENSITIVE_PATH = /\/(api|auth|login|logout|token|session|supabase|graphql)(\/|$)/i
const SENSITIVE_QUERY = /(^|&)(token|access_token|refresh_token|code|password|senha|session|auth|authorization|secret|api_key|apikey)=/i
const SENSITIVE_VARY = /(^|,|\s)(authorization|cookie|range|if-range)(,|\s|$)/i
const PUBLIC_DESTINATIONS = new Set(['script', 'style', 'image', 'font', 'manifest'])

function requestIsSensitive(request, url) {
  const headers = request.headers
  return request.method !== 'GET' ||
    request.cache === 'no-store' ||
    headers.has('authorization') || headers.has('cookie') || headers.has('range') || headers.has('if-range') ||
    SENSITIVE_PATH.test(url.pathname) || SENSITIVE_QUERY.test(url.search.slice(1))
}

function responseIsCacheable(response) {
  if (!response || !response.ok || response.status === 206 || response.type === 'opaque' || response.redirected) return false
  const cacheControl = response.headers.get('cache-control') || ''
  const vary = response.headers.get('vary') || ''
  return !/private|no-store/i.test(cacheControl) &&
    !response.headers.has('set-cookie') &&
    !response.headers.has('content-range') &&
    vary.trim() !== '*' && !SENSITIVE_VARY.test(vary)
}

function isPublicStaticRequest(request, url) {
  return url.origin === self.location.origin &&
    !url.search &&
    !requestIsSensitive(request, url) &&
    PUBLIC_DESTINATIONS.has(request.destination)
}

async function safePut(request, response) {
  if (!responseIsCacheable(response)) return
  const url = new URL(request.url)
  if (!isPublicStaticRequest(request, url)) return
  const cache = await caches.open(CACHE)
  await cache.put(request, response.clone())
}

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)))
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE).map(key => caches.delete(key)))))
  self.clients.claim()
})

self.addEventListener('fetch', event => {
  const request = event.request
  const url = new URL(request.url)
  if (url.origin !== self.location.origin || requestIsSensitive(request, url)) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request, { cache: 'no-store', credentials: 'same-origin', redirect: 'follow' })
        .catch(() => caches.match('./offline.html'))
    )
    return
  }

  if (!isPublicStaticRequest(request, url)) return

  event.respondWith(caches.match(request, { ignoreSearch: false }).then(cached => {
    if (cached) return cached
    return fetch(request, { cache: 'no-store', credentials: 'omit', redirect: 'error' }).then(response => {
      void safePut(request, response)
      return response
    })
  }))
})
