// غيّر رقم النسخة لما تحدّث أي ملف PDF عشان المستخدمين ياخدوا النسخة الجديدة
const CACHE = 'pdf-cache-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (!new URL(req.url).pathname.toLowerCase().endsWith('.pdf')) return;
  e.respondWith(pdfFromCacheOrNetwork(req));
});

async function pdfFromCacheOrNetwork(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req.url);
  if (hit) return rangeFrom(req, hit);        // موجود عند المستخدم: بيفتح فوراً
  const net = await fetch(req);               // مش موجود: تحميل عادي
  if (net.status === 200) cache.put(req.url, net.clone());   // التحميل الكامل بس هو اللي بيتخزن
  return net;
}

// عارض الـ PDF بيطلب أجزاء من الملف (Range)، فبنرد من النسخة المخزنة
async function rangeFrom(req, res) {
  const range = req.headers.get('range');
  const m = range && /bytes=(\d*)-(\d*)/.exec(range);
  if (!m) return res;
  const blob = await res.clone().blob();
  const size = blob.size;
  const start = m[1] === '' ? size - parseInt(m[2], 10) : parseInt(m[1], 10);
  const end = (m[1] === '' || m[2] === '') ? size - 1 : Math.min(parseInt(m[2], 10), size - 1);
  if (isNaN(start) || isNaN(end) || start > end || start < 0) {
    return new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + size } });
  }
  return new Response(blob.slice(start, end + 1), {
    status: 206,
    statusText: 'Partial Content',
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Range': 'bytes ' + start + '-' + end + '/' + size,
      'Content-Length': String(end - start + 1),
      'Accept-Ranges': 'bytes'
    }
  });
}
