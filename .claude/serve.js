// Minimal static server for the storefront (no Python needed): node .claude/serve.js [port]
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const port = Number(process.argv[2]) || 5173;
const localApi = process.env.LOCAL_API_URL || 'http://127.0.0.1:8000/api';
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.gif': 'image/gif', '.mp4': 'video/mp4', '.webm': 'video/webm', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
};

http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  // Local runs talk to the local backend, not the live API baked into the tracked site-env.js.
  if (url === '/frontend/js/site-env.js') {
    res.writeHead(200, { 'Content-Type': types['.js'] });
    return res.end(`window.AVYA_ENV = ${JSON.stringify({ AVYA_API_URL: localApi, WHATSAPP_API_URL: 'https://wa.me' })};\n`);
  }
  let file = path.join(root, url);
  if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': types[path.extname(file).toLowerCase()] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(port, '127.0.0.1', () => console.log(`Storefront on http://localhost:${port}/frontend/`));
