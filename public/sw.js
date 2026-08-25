/*
 * 홈 화면에 설치해 앱처럼 쓰기 위한 서비스 워커.
 * 앱 껍데기만 캐시한다. Gemini 호출은 교차 출처라 손대지 않는다.
 */

const CACHE = 'face-studio-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) {
        if (key !== CACHE) await caches.delete(key);
      }
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  // 같은 출처만 처리한다. API 요청은 그대로 통과시킨다.
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // 화면 진입은 네트워크 우선 — 배포한 새 버전이 바로 반영되게 한다.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(CACHE);
          cache.put(request, fresh.clone());
          return fresh;
        } catch {
          return (await caches.match(request)) || (await caches.match('index.html')) || Response.error();
        }
      })(),
    );
    return;
  }

  // 나머지는 캐시 우선. 해시가 붙은 파일이라 내용이 바뀌면 이름도 바뀐다.
  event.respondWith(
    (async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(CACHE);
        cache.put(request, response.clone());
      }
      return response;
    })(),
  );
});
