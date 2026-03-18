const CACHE_NAME = 'aovein-os-cache-v1';
const urlsToCache =[
    './',
    './index.html',
    './manifest.json'
];

// 安装 Service Worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
    );
});

// 拦截网络请求，支持离线或提升加载速度
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // 如果缓存中有，则返回缓存；否则进行网络请求
                return response || fetch(event.request);
            })
    );
});
