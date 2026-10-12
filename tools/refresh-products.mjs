// Refresh product data and affiliate links for every guide, from the Lazada affiliate API only.
// Usage (PowerShell):  $env:GF_ENV="C:\path\to\.env"; node tools/refresh-products.mjs
// Writes src/data/products.json with public fields only (no sales or commission data).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { products, links } from './lazada.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GUIDES = path.join(ROOT, 'src', 'guides');
const OUT = path.join(ROOT, 'src', 'data', 'products.json');

function idsOf(guide) {
  const items = guide.items || (guide.sections || []).flatMap(s => s.items);
  return items.flatMap(it => [it.id, it.alt?.id]).filter(Boolean).map(String);
}

const existing = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
const result = {}; // only products still used by a guide are kept
const checkedAt = new Date().toISOString();
let problems = 0;

for (const file of fs.readdirSync(GUIDES).filter(f => f.endsWith('.json'))) {
  const guide = JSON.parse(fs.readFileSync(path.join(GUIDES, file), 'utf8'));
  const ids = [...new Set(idsOf(guide))];
  const data = await products(ids);
  const urls = await links(ids, guide.slug);
  for (const id of ids) {
    const x = data[id];
    if (!x) { console.warn(`! ${guide.slug}: ${id} is no longer in the affiliate feed`); problems++; continue; }
    const price = Number(x.discountPrice);
    if (x.outOfStock || !(Number(x.stock) > 0)) { console.warn(`! ${guide.slug}: ${id} is out of stock`); problems++; }
    if (!urls[id]) { console.warn(`! ${guide.slug}: ${id} has no affiliate link`); problems++; }
    if (!(price > 0 && price < 100000)) { console.warn(`! ${guide.slug}: ${id} has an odd price ${price}`); problems++; }
    // A product can appear in several guides; each guide keeps its own tracked link (subId2 = guide slug).
    const prev = result[id] || {};
    const guideLinks = { ...(prev.links || {}), [guide.slug]: urls[id] || existing[id]?.links?.[guide.slug] || existing[id]?.link || '' };
    result[id] = {
      id,
      name: x.productName,
      brand: x.brandName,
      seller: x.sellerName || '',
      price,
      currency: x.currency || '₱',
      images: (x.pictures || []).slice(0, 4).map(u => (u.startsWith('//') ? 'https:' + u : u)),
      inStock: !x.outOfStock && Number(x.stock) > 0,
      links: guideLinks,
      link: prev.link || guideLinks[guide.slug],
      guides: [...new Set([...(prev.guides || []), guide.slug])],
      checkedAt,
    };
  }
  console.log(`${guide.slug}: ${ids.length} products refreshed`);
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(result, null, 2) + '\n');
console.log(problems ? `Done with ${problems} warning(s).` : 'Done, no warnings.');
