+++
date = '2021-07-21T17:13:42+08:00'
slug = 'open-pwa-for-site'
tags = ['PWA']
title = '为网站开启 PWA'
+++

开启 PWA 需要三个部分：一个 JS 文件，一个 HTML 文件，一个 manifest 文件。我的网站使用 Hugo 构建。

JS 文件：

```js
/**
  References:

  1. https://developers.google.com/web/fundamentals/primers/service-workers
  2. https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook
  3. https://googlechrome.github.io/samples/service-worker/
  4. https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers
  5. https://serviceworke.rs/
  6. https://www.youtube.com/watch?v=baSiSIyTGSk
*/

const RUNTIME = "runtime";

self.skipWaiting();

self.addEventListener("fetch", (event) => {
  // Do nothing if not the same origin
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Network first strategy
  event.respondWith(
    (async () => {
      const cache = await caches.open(RUNTIME);

      try {
        const networkResponse = await fetch(event.request);

        // Save/Update cache if network response is ok
        if (networkResponse && networkResponse.status === 200) {
          cache.put(event.request, networkResponse.clone());
        }

        return networkResponse;
      } catch (e) {
        const cachedResponse = await cache.match(event.request);

        return cachedResponse;
      }
    })()
  );
});
```

HTML 文件：

```html
{{ if and .Site.Params.enableServiceWorker (eq hugo.Environment "production") }}
    {{- $sw := resources.Get "js/sw.js" -}}
    {{- $dummy := "" | resources.FromString "dummy.js" -}}
    {{- $url := (slice $sw $dummy | resources.Concat "sw.js").RelPermalink -}}

    <script>
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
                navigator.serviceWorker.register('{{ $url }}');
            });
        }
    </script>
{{ end }}
```

manifest 文件：

```json
{
  "name": "一大加贝",
  "icons": [
    {
      "src": "/images/android-chrome-192x192.png",
      "type": "image/png",
      "sizes": "192x192",
      "purpose": "maskable"
    },
    {
      "src": "/images/android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "start_url": "/?source=pwa",
  "theme_color": "#fff",
  "background_color": "#fff",
  "display": "standalone",
  "orientation": "portrait-primary"
}
```

最后把以上三个文件导入网站中即可。

ref:

1. <https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta/name/theme-color>
2. [一个简单的 Service Worker](https://io-oi.me/tech/a-simple-service-worker/)
3. [service-worker.html](https://github.com/reuixiy/hugo-theme-meme/blob/159652eafb/layouts/partials/components/service-worker.html)
4. [sw.js](https://github.com/reuixiy/hugo-theme-meme/blob/159652eafb/assets/js/sw.js)
