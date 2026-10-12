// Local preview server: serves site/ at http://localhost:8000/great-deals/ (same path as GitHub Pages).
// Usage: node tools/serve.mjs   (port 8765 belongs to Great Finds Studio; don't use it)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'site');
const PORT = Number(process.env.PORT) || 8000;
const PREFIX = '/great-deals/';
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml' };

http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  if (!url.startsWith(PREFIX)) { res.writeHead(302, { Location: PREFIX }); return res.end(); }
  let file = path.join(SITE, url.slice(PREFIX.length));
  if (!file.startsWith(SITE)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) { res.writeHead(404, { 'Content-Type': TYPES['.html'] }); return res.end(fs.readFileSync(path.join(SITE, '404.html'))); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`Preview: http://localhost:${PORT}${PREFIX}`));
