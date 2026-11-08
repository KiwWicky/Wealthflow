// WealthFlow Pro - Service Worker
// เปลี่ยนเลขเวอร์ชันนี้ทุกครั้งที่อัปเดตไฟล์ เพื่อให้เครื่องผู้ใช้ล้างแคชเก่า
const VER = 'wealthflow-v2';
const SHELL = ['./', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
const CDN = ['cdn.tailwindcss.com', 'fonts.googleapis.com', 'fonts.gstatic.com', 'cdnjs.cloudflare.com', 'www.gstatic.com'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VER).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VER).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  // หน้าเว็บ: ลองออนไลน์ก่อนเพื่อได้เวอร์ชันล่าสุด ถ้าออฟไลน์ใช้ของที่เก็บไว้
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }).then((r) => { const cp = r.clone(); caches.open(VER).then((c) => { c.put(req, cp); }); return r; })
        .catch(() => caches.match(req).then((h) => h || caches.match('./')))
    );
    return;
  }
  // ไฟล์ของแอปเองและ CDN: ใช้ของในเครื่องก่อน แล้วอัปเดตเบื้องหลัง
  if (u.origin === location.origin || CDN.includes(u.hostname)) {
    e.respondWith(caches.open(VER).then((c) => c.match(req).then((hit) => {
      const net = fetch(req).then((r) => { if (r && (r.ok || r.type === 'opaque')) c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    })));
  }
  // ที่เหลือ (Firebase, ข้อมูลหุ้น ฯลฯ) ปล่อยผ่านเครือข่ายตามปกติ ไม่แคช
});
