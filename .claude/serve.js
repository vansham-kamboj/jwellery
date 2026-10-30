// Local site on one address, laid out like the live one: node .claude/serve.js [port]
//   /          the storefront (frontend/ is never in the address)
//   /admin     the admin panel, passed through to the Laravel backend (with /api and /uploads)
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const port = Number(process.argv[2]) || 5173;
const backend = { host: '127.0.0.1', port: Number(process.env.BACKEND_PORT) || 8000 };
const localApi = process.env.LOCAL_API_URL || '/api';
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.gif': 'image/gif', '.mp4': 'video/mp4', '.webm': 'video/webm', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
};
const toBackend = /^\/(admin|admin-assets|api|uploads)(\/|$)/;

function proxy(req, res) {
  const upstream = http.request({ ...backend, path: req.url, method: req.method, headers: req.headers }, r => {
    res.writeHead(r.statusCode, r.headers);
    r.pipe(res);
  });
  upstream.on('error', () => { res.writeHead(502, { 'Content-Type': 'text/plain' }); res.end('The backend is not running.'); });
  req.pipe(upstream);
}

http.createServer((req, res) => {
  const [rawPath, query] = req.url.split('?');
  const url = decodeURIComponent(rawPath);
  if (toBackend.test(url)) return proxy(req, res);
  if (/^\/(frontend\/?|frontend\/index\.html|index\.html)$/.test(url)) {   // old links → the clean address
    res.writeHead(301, { Location: '/' + (query ? '?' + query : '') });
    return res.end();
  }
  // Local runs talk to the local backend, not the live API baked into the tracked site-env.js.
  if (url === '/js/site-env.js') {
    res.writeHead(200, { 'Content-Type': types['.js'] });
    return res.end(`window.AVYA_ENV = ${JSON.stringify({ AVYA_API_URL: localApi, WHATSAPP_API_URL: 'https://wa.me' })};\n`);
  }
  // Only the storefront and its assets are served; nothing else in the project (such as backend/.env) is reachable.
  const page = url.match(/^\/([a-z0-9-]+)\/?$/);   // /our-story/, /contact/ … → frontend/<page>/index.html (see tools/build-pages.js)
  const relative = url === '/' ? 'frontend/index.html' : /^\/(css|js)\//.test(url) ? 'frontend' + url : /^\/assets\//.test(url) ? url.slice(1)
    : /^\/(robots\.txt|sitemap\.xml|favicon\.ico)$/.test(url) ? url.slice(1)
      : page && fs.existsSync(path.join(root, 'frontend', page[1], 'index.html')) ? `frontend/${page[1]}/index.html` : null;
  const file = relative && path.join(root, relative);
  if (!file || !file.startsWith(root + path.sep)) { res.writeHead(404); return res.end('Not found'); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': types[path.extname(file).toLowerCase()] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(port, '127.0.0.1', () => console.log(`Store on http://localhost:${port}/ · admin on http://localhost:${port}/admin`));
