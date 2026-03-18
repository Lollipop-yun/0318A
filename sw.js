// 极简版 Service Worker，仅用于触发 PWA 的安装条件
self.addEventListener('install', (e) => {
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    return self.clients.claim();
});

self.addEventListener('fetch', (e) => {
    // 基础的网络请求拦截（不作离线缓存，确保每次获取最新数据）
    e.respondWith(fetch(e.request).catch(() => new Response('请检查网络连接')));
});
