/**
 * Service Worker for offline support and caching.
 * Implements a Network First caching strategy to ensure users always get fresh content
 * when online, while maintaining offline accessibility through cached responses.
 *
 * References:
 * 1. https://developers.google.com/web/fundamentals/primers/service-workers
 * 2. https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook
 * 3. https://googlechrome.github.io/samples/service-worker/
 * 4. https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers
 * 5. https://serviceworke.rs/
 * 6. https://www.youtube.com/watch?v=baSiSIyTGSk
 */

// Declare the service worker global scope for TypeScript type checking
declare const self: ServiceWorkerGlobalScope;

/**
 * Cache name for runtime caching.
 * Using a dedicated cache name allows for easy cache versioning and cleanup.
 */
const RUNTIME = "runtime";

/**
 * Immediately activate the new service worker without waiting for existing clients to close.
 * This ensures updates are applied quickly without requiring a page reload.
 */
self.skipWaiting();

/**
 * Intercept all fetch requests from the page.
 * The service worker acts as a proxy between the page and the network.
 */
self.addEventListener("fetch", (event: FetchEvent) => {
  // Skip cross-origin requests - only handle requests to the same domain
  // This prevents the service worker from interfering with third-party resources
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Implement Network First caching strategy
  // This prioritizes fresh content from the network, falling back to cache when offline
  event.respondWith(
    (async (): Promise<Response> => {
      // Open the runtime cache for storing/retrieving responses
      const cache = await caches.open(RUNTIME);

      try {
        // Attempt to fetch from the network first
        const networkResponse = await fetch(event.request);

        // Cache the response if it's successful (HTTP 200)
        // We clone the response because it can only be consumed once
        if (networkResponse && networkResponse.status === 200) {
          cache.put(event.request, networkResponse.clone());
        }

        return networkResponse;
      } catch (error) {
        // Network request failed - attempt to serve from cache
        const cachedResponse = await cache.match(event.request);

        if (cachedResponse) {
          // Return cached version when offline
          return cachedResponse;
        }

        // No cached response available - re-throw the original error
        // This will result in a standard network error in the browser
        throw error;
      }
    })(),
  );
});
