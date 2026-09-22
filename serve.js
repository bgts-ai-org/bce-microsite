/* Local preview server for the BCE microsite.
   Zero dependencies, Node >= 18. Not a production server.

   Handles what the page actually needs: correct MIME types for the extracted
   assets, and byte ranges so the walkthrough video can seek. */
const http = require('http');
const fs   = require('fs');
const path = require('path');
const { sendMail } = require('./lib/gmail');

const root = __dirname;
const port = Number(process.env.PORT) || 8080;
const CONTACT_TO = process.env.CONTACT_TO || 'opensource-ai@bgts.com';

function readJsonBody(req, limit = 1e6) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > limit) { reject(new Error('Payload too large')); req.destroy(); }
    });
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); }
      catch { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

function isEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || '').trim()); }

async function handleContact(req, res) {
  let body;
  try { body = await readJsonBody(req); }
  catch (e) { res.writeHead(400, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ ok: false, error: e.message })); }

  const name    = String(body.name || '').trim();
  const email   = String(body.email || '').trim();
  const company = String(body.company || '').trim();
  const phone   = String(body.phone || '').trim();
  const message = String(body.message || '').trim();
  const kvkk    = !!body.kvkk;

  if (name.length < 2 || !isEmail(email) || message.length < 5 || !kvkk) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: false, error: 'Invalid submission' }));
  }

  const text = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Company: ${company || '—'}`,
    `Phone: ${phone || '—'}`,
    '',
    message,
    '',
    '— Sent from the BGTS Context Engine microsite',
  ].join('\n');

  try {
    await sendMail({
      to: CONTACT_TO,
      replyTo: email,
      subject: `BGTS Context Engine — ${company || name}`,
      text,
    });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
  } catch (e) {
    console.error(e);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: 'Mail send failed' }));
  }
}

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.mjs':  'text/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml':  'application/xml; charset=utf-8',
  '.txt':  'text/plain; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png':  'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico':  'image/x-icon',
  '.mp4':  'video/mp4',
  '.webm': 'video/webm',
  '.woff2':'font/woff2',
  '.woff': 'font/woff',
  '.webmanifest': 'application/manifest+json',
};

/* assets/ is content-addressed by the ?v= handle in index.html, so it may be
   cached hard. The document itself must never be. */
function cacheFor(urlPath) {
  if (urlPath.startsWith('/assets/')) return 'public, max-age=31536000, immutable';
  return 'no-cache';
}

http.createServer((req, res) => {
  let urlPath;
  try { urlPath = decodeURIComponent(req.url.split('?')[0]); }
  catch { res.writeHead(400); return res.end('Bad request'); }
  if (urlPath === '/') urlPath = '/index.html';

  if (req.method === 'POST' && urlPath === '/api/contact') { return handleContact(req, res); }

  /* Contain every request inside root — decodeURIComponent above makes
     %2e%2e traversal reachable otherwise. */
  const filePath = path.resolve(root, '.' + path.posix.normalize(urlPath));
  if (filePath !== root && !filePath.startsWith(root + path.sep)) {
    res.writeHead(403); return res.end('Forbidden');
  }

  fs.stat(filePath, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404); return res.end('Not found'); }

    const ext  = path.extname(filePath).toLowerCase();
    const head = {
      'Content-Type': types[ext] || 'application/octet-stream',
      'Cache-Control': cacheFor(urlPath),
      'Accept-Ranges': 'bytes',
    };

    const range = req.headers.range;
    const m = range && /^bytes=(\d*)-(\d*)$/.exec(range.trim());
    if (m && (m[1] || m[2])) {
      let start = m[1] ? parseInt(m[1], 10) : st.size - parseInt(m[2], 10);
      let end   = m[1] && m[2] ? parseInt(m[2], 10) : st.size - 1;
      start = Math.max(0, start);
      end   = Math.min(st.size - 1, end);
      if (Number.isNaN(start) || Number.isNaN(end) || start > end) {
        res.writeHead(416, { 'Content-Range': `bytes */${st.size}` });
        return res.end();
      }
      head['Content-Range']  = `bytes ${start}-${end}/${st.size}`;
      head['Content-Length'] = end - start + 1;
      res.writeHead(206, head);
      if (req.method === 'HEAD') return res.end();
      return fs.createReadStream(filePath, { start, end }).pipe(res);
    }

    head['Content-Length'] = st.size;
    res.writeHead(200, head);
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(filePath).pipe(res);
  });
}).listen(port, () => console.log(`Serving ${root} on http://localhost:${port}`));
