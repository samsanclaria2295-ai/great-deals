// Builds the static Great Finds site into site/ from src/ (guides, categories, products, image sizes).
// Usage: node tools/build.mjs   (no network, no secrets)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = path.join(ROOT, 'site');
const BASE_URL = 'https://samsanclaria2295-ai.github.io/great-deals/';
const PINTEREST = 'https://www.pinterest.com/samsanclaria2295/';
const EMAIL = 'samsanclaria2295@gmail.com';

const readJSON = p => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const products = readJSON('src/data/products.json');
const IMGS = readJSON('src/data/images.json');
const CATS = readJSON('src/categories.json');
const guides = fs.readdirSync(path.join(ROOT, 'src/guides')).filter(f => f.endsWith('.json'))
  .map(f => readJSON(`src/guides/${f}`))
  .sort((a, b) => (b.published + String(b.order || 0)).localeCompare(a.published + String(a.order || 0)));

// ---------- helpers ----------
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const peso = n => '₱' + Math.round(n).toLocaleString('en-PH');
const fmtDate = d => new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(d.length === 10 ? d + 'T12:00:00+08:00' : d));
const placements = g => g.placements || [{ cat: g.category, topic: g.topic }];
const primary = g => placements(g)[0];
const inCat = (g, cat) => placements(g).some(p => p.cat === cat);
const inTopic = (g, cat, topic) => placements(g).some(p => p.cat === cat && p.topic === topic);
const guidesIn = cat => guides.filter(g => inCat(g, cat));
const itemsOf = g => g.items || (g.sections || []).flatMap(s => s.items);
const pricesCheckedOf = g => {
  const dates = itemsOf(g).map(it => products[it.id]?.checkedAt).filter(Boolean).sort();
  return dates.length ? fmtDate(dates[0]) : fmtDate(g.updated);
};
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const product = (id, where) => {
  const p = products[id];
  if (!p) throw new Error(`Missing product data for ${id} (${where}); run tools/refresh-products.mjs`);
  return p;
};

const ICON = {
  arrow: '<svg class="arr" viewBox="0 0 24 12" aria-hidden="true"><path d="M0 6h22M17 1l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  chev: '<svg viewBox="0 0 12 8" aria-hidden="true"><path d="M1 1.5l5 5 5-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  plus: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.5l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17l-5.9 3.3 1.3-6.5L2.5 9.3l6.6-.8z"/></svg>',
  pinterest: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-3.64 19.31c-.09-.79-.17-2 .03-2.86l1.17-4.97s-.3-.6-.3-1.48c0-1.39.81-2.43 1.81-2.43.85 0 1.27.64 1.27 1.41 0 .86-.55 2.14-.83 3.33-.24 1 .5 1.81 1.48 1.81 1.78 0 3.14-1.870 3.14-4.58 0-2.39-1.72-4.07-4.18-4.07-2.85 0-4.52 2.14-4.52 4.35 0 .86.33 1.78.74 2.28.08.1.09.19.07.29l-.28 1.13c-.04.18-.15.22-.33.13-1.25-.58-2.03-2.41-2.03-3.880 0-3.16 2.3-6.06 6.62-6.06 3.48 0 6.18 2.48 6.18 5.79 0 3.45-2.18 6.23-5.2 6.23-1.02 0-1.97-.53-2.3-1.15l-.62 2.38c-.23.87-.84 1.96-1.25 2.62A10 10 0 1 0 12 2z"/></svg>',
  mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18v12H3z M3 7l9 6 9-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  tag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12V4h8l10 10-8 8L3 12z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><circle cx="7.5" cy="8.5" r="1.6" fill="currentColor"/></svg>',
  scale: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18M5 21h14M4 7h16M7 7l-3 7a3 3 0 0 0 6 0L7 7zm10 0-3 7a3 3 0 0 0 6 0l-3-7z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/></svg>',
  book: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M8 8h8M8 11.5h6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  peso: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 20V4h5a4.5 4.5 0 0 1 0 9H8M5 7.5h14M5 10.5h14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15 15l5.5 5.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
};
const squiggle = (cls = '') => `<svg class="squiggle ${cls}" viewBox="0 0 132 14" aria-hidden="true"><path d="M2 8c8-7 14-7 22 0s14 7 22 0 14-7 22 0 14 7 22 0 14-7 22 0 12 6 18 2"/></svg>`;
const ring = (text, id) => `<svg class="ring" viewBox="0 0 120 120" aria-hidden="true"><defs><path id="${id}" d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0"/></defs><text><textPath href="#${id}" textLength="286" lengthAdjust="spacing">${esc(text)}</textPath></text></svg>`;

function img(r, name, alt, sizes, eager = false) {
  const d = IMGS[name];
  if (!d) throw new Error(`Image ${name} missing from src/data/images.json`);
  const ws = Object.keys(d).map(Number).sort((a, b) => a - b);
  const big = ws[ws.length - 1];
  return `<img src="${r}assets/img/${name}-${ws[0]}.webp" srcset="${ws.map(w => `${r}assets/img/${name}-${w}.webp ${w}w`).join(', ')}" sizes="${sizes}" width="${big}" height="${d[big]}" alt="${esc(alt)}"${eager ? ' fetchpriority="high"' : ' loading="lazy" decoding="async"'}>`;
}
const lazImg = (p, alt) => p?.images?.[0] ? `<img src="${esc(p.images[0])}" alt="${esc(alt)}" referrerpolicy="no-referrer" loading="lazy" decoding="async">` : '';
const aff = (p, inner, cls) => `<a${cls ? ` class="${cls}"` : ''} href="${esc(p.link)}" target="_blank" rel="sponsored nofollow noopener">${inner}</a>`;
const buyBtn = (p, extra = '') => aff(p, `<span class="label">View on Lazada</span> ${ICON.arrow}`, `btn sm${extra}`);

// ---------- layout: header, menus, footer ----------
function megaItem(key, r, active) {
  const c = CATS[key];
  const gs = guidesIn(key);
  const topics = Object.entries(c.topics || {}).map(([tk, t]) => [tk, t, gs.filter(g => inTopic(g, key, tk)).length]).filter(t => t[2] > 0);
  const minis = gs.slice(0, 3).map(g => `<a class="mini" href="${r}guides/${g.slug}.html"><span class="mini-img">${img(r, g.hero.img, '', '220px')}</span><span class="mini-body"><b>${esc(g.shortTitle)}</b><small>${g.readMinutes} min read · ${plural(itemsOf(g).length, 'pick')}</small></span></a>`).join('');
  return `<div class="nav-item has-mega">
        <a class="nav-link" href="${r}category/${key}/"${active === `cat-${key}` ? ' aria-current="page"' : ''}>${esc(c.short)}</a>
        <button class="nav-chev" type="button" aria-expanded="false" aria-controls="mega-${key}" aria-label="Show ${esc(c.name)} menu">${ICON.chev}</button>
        <div class="mega" id="mega-${key}">
          <div class="wrap mega-inner">
            <div class="mega-intro">
              <span class="kicker">${esc(c.name)}</span>
              <p>${esc(c.blurb)}</p>
              ${topics.length ? `<ul class="mega-topics">${topics.map(([tk, t, n]) => `<li><a href="${r}category/${key}/#${tk}">${esc(t.name)} <span>${plural(n, 'guide')}</span></a></li>`).join('')}</ul>` : ''}
              <a class="link-arrow" href="${r}category/${key}/">${gs.length ? `All ${esc(c.short)} guides` : `About ${esc(c.short)}`} ${ICON.arrow}</a>
            </div>
            <div class="mega-guides">${minis || `<div class="mega-empty"><b>First guides on the way</b>We only publish once we've found products we're comfortable recommending.</div>`}</div>
          </div>
        </div>
      </div>`;
}

function mobileMenu(r) {
  const cats = Object.entries(CATS).map(([key, c]) => {
    const gs = guidesIn(key);
    return `<details><summary>${esc(c.name)} ${ICON.chev}</summary><ul>
      <li><a class="all" href="${r}category/${key}/">${gs.length ? `All ${esc(c.short)} guides` : `About ${esc(c.short)}`}</a></li>
      ${gs.length ? gs.map(g => `<li><a href="${r}guides/${g.slug}.html">${esc(g.shortTitle)}</a></li>`).join('') : '<li class="soon">First guides on the way</li>'}
    </ul></details>`;
  }).join('\n    ');
  return `<nav class="mobile-menu" id="mobile-menu" aria-label="Mobile">
    <a href="${r}index.html">Home</a>
    ${cats}
    <a href="${r}guides/">All guides</a>
    <a href="${r}about.html">How we pick</a>
    <div class="group"><a href="${PINTEREST}" target="_blank" rel="noopener">Pinterest</a><a href="mailto:${EMAIL}">Contact</a></div>
  </nav>`;
}

function layout({ r = '', title, description, canonical, og = 'og-home.jpg', active = '', body, type = 'website' }) {
  const fullTitle = title.includes('Great Finds') ? title : `${title} | Great Finds`;
  const cur = key => (active === key ? ' aria-current="page"' : '');
  return `<!doctype html>
<html lang="en" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${BASE_URL}${canonical}">
<meta property="og:type" content="${type}">
<meta property="og:site_name" content="Great Finds">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${BASE_URL}${canonical}">
<meta property="og:image" content="${BASE_URL}assets/img/${og || 'og-home.jpg'}">
<meta property="og:locale" content="en_PH">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#f5ebdd">
<link rel="icon" type="image/png" href="${r}great-finds-icon-150.png">
<link rel="apple-touch-icon" href="${r}assets/img/icon-512.png">
<link rel="preload" href="${r}assets/fonts/fraunces-latin-soft-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${r}assets/fonts/dm-sans-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${r}assets/css/style.css">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="site-header">
  <div class="wrap bar">
    <nav class="nav" aria-label="Categories">
      ${Object.keys(CATS).map(k => megaItem(k, r, active)).join('\n      ')}
    </nav>
    <a class="logo" href="${r}index.html" aria-label="Great Finds, home"><span class="word">Great<br>Finds<span class="dots" aria-hidden="true"><i></i><i></i></span></span><span class="tag">Honest finds · PH</span></a>
    <nav class="nav right" aria-label="Site">
      <a class="nav-link" href="${r}guides/"${cur('guides')}>All guides</a>
      <a class="nav-link" href="${r}about.html"${cur('about')}>How we pick</a>
      <a class="nav-link pin" href="${PINTEREST}" target="_blank" rel="noopener">${ICON.pinterest}Pinterest</a>
    </nav>
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="mobile-menu" aria-label="Open menu"><span></span><span></span><span></span></button>
  </div>
</header>
${mobileMenu(r)}
<main id="main">
${body}
</main>
<footer class="site-footer">
  <div class="wrap">
    <div class="top">
      <div class="about"><b>Great Finds</b><p>Researched product finds for Filipino shoppers: tech, home and decor, beauty and seasonal picks, always with the pros and the cons.</p></div>
      <div class="foot-cols">
        <div><h4>Categories</h4><ul>${Object.entries(CATS).map(([k, c]) => `<li><a href="${r}category/${k}/">${esc(c.name)}</a></li>`).join('')}</ul></div>
        <div><h4>Latest guides</h4><ul>${guides.slice(0, 4).map(g => `<li><a href="${r}guides/${g.slug}.html">${esc(g.shortTitle)}</a></li>`).join('')}</ul></div>
        <div><h4>Great Finds</h4><ul><li><a href="${r}guides/">All guides</a></li><li><a href="${r}about.html">How we pick</a></li><li><a href="${r}privacy.html">Privacy policy</a></li><li><a href="mailto:${EMAIL}">Contact</a></li></ul></div>
      </div>
      <div class="socials">
        <a href="${PINTEREST}" target="_blank" rel="noopener" aria-label="Great Finds on Pinterest">${ICON.pinterest}</a>
        <a href="mailto:${EMAIL}" aria-label="Email Great Finds">${ICON.mail}</a>
      </div>
    </div>
    <div class="legal">
      <p><strong>Affiliate disclosure:</strong> Some links on Great Finds are affiliate links. If you buy through them, we may earn a small commission at no extra cost to you. Prices and availability change often; always check the final price on the store before buying. Our picks are prepared with the help of AI tools and reviewed against the product data available at the time of posting. Images marked "AI sample render" are generated with AI for inspiration and are not photos of the actual products.</p>
      <p>© <span id="y">2026</span> Great Finds · Philippines · An independent site, not operated by Lazada. · <a href="${r}privacy.html">Privacy Policy</a></p>
    </div>
  </div>
</footer>
<script src="${r}assets/js/site.js" defer></script>
</body>
</html>
`;
}

// ---------- shared blocks ----------
function guideCard(g, r, wide = false) {
  const c = CATS[primary(g).cat];
  return `<a class="card${wide ? ' wide' : ''}" href="${r}guides/${g.slug}.html" data-reveal>
      <div class="media bg-${g.color || c.color}">${img(r, g.hero.img, '', '(max-width: 640px) 100vw, (max-width: 920px) 50vw, 380px')}<span class="ai-chip">AI sample render</span></div>
      <div class="body">
        <span class="cat">${esc(c.name)}</span>
        <h3>${esc(g.shortTitle)}</h3>
        <p>${esc(g.teaser || g.dek)}</p>
        <div class="foot"><span>${g.readMinutes} min read · ${plural(itemsOf(g).length, 'pick')}</span><span class="plus">${ICON.plus}</span></div>
      </div>
    </a>`;
}
// Balanced grids: 1 guide = wide feature card, 2 = two columns, 3+ = three columns.
const cardGrid = (gs, r) => gs.length === 1
  ? `<div class="grid-1">${guideCard(gs[0], r, true)}</div>`
  : `<div class="grid-${gs.length === 2 ? 2 : 3}" data-stagger>${gs.map(g => guideCard(g, r)).join('\n')}</div>`;

const EVIDENCE = {
  strong: 'Research: strong · independent reviews',
  moderate: 'Research: moderate · maker specs and coverage',
  light: 'Research: light · few independent reviews',
  guidance: 'Research: buying and safety guidance',
};

function notesBlock(it, g) {
  const title = it.reviewersTitle || (it.evidence === 'strong' || it.evidence === 'moderate' ? 'What reviewers say' : (g.guidanceLabel || 'Good to know'));
  const list = it.reviewers || [];
  if (!list.length) return '';
  return `<div class="notes"><h4>${esc(title)}</h4><ul>${list.map(n => `<li>${esc(n.point)}${n.url ? ` <cite>(<a href="${esc(n.url)}" target="_blank" rel="noopener">${esc(n.source)}</a>)</cite>` : ''}</li>`).join('')}</ul></div>`;
}
const prosCons = it => `<div class="pc" role="group" aria-label="Pros and cons">
        <div class="pc-col pc-pros"><div class="pc-head"><i aria-hidden="true">+</i>Pros</div><ul>${it.pros.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
        <div class="pc-col pc-cons"><div class="pc-head"><i aria-hidden="true">&minus;</i>Cons</div><ul>${it.cons.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
      </div>`;
const factsBlock = (it, p) => {
  const rows = [...(it.facts || [])];
  return rows.length ? `<dl class="facts" style="--cols:${rows.length === 4 ? 2 : Math.min(rows.length, 3)}">${rows.map(f => `<div><dt>${esc(f.k)}</dt><dd>${esc(f.v)}</dd></div>`).join('')}</dl>` : '';
};
const priceBlock = p => `<div class="price">From around ${peso(p.price)}<small>Price checked ${fmtDate(p.checkedAt)}${p.seller ? ` · Sold by ${esc(p.seller.trim())}` : ''}</small></div>`;
const award = label => label ? `<span class="award">${ICON.star}${esc(label)}</span>` : '';

function altBlock(alt) {
  if (!alt?.id) return '';
  const p = product(alt.id, 'alternate');
  return `<div class="alt">
        ${aff(p, lazImg(p, `Product photo of ${alt.name} from its Lazada listing`), 'ashot')}
        <div><small>${esc(alt.label || 'Also consider')}</small><b>${esc(alt.name)}</b><p>${esc(alt.note)}</p></div>
        <div class="ap">From around ${peso(p.price)}${aff(p, 'View on Lazada')}</div>
      </div>`;
}

// Full-width review block (ranked guides)
function pickBlock(it, g) {
  const p = product(it.id, g.slug);
  return `<article class="pick" id="pick-${it.rank}" data-reveal>
    <div class="pick-head"><span class="rank" aria-hidden="true">${it.rank}</span><span class="slot">${esc(it.slot)}</span>${award(it.label)}</div>
    <div class="pick-top">
      <div class="pick-media">
        <div>${aff(p, lazImg(p, `Product photo of ${it.name} from its Lazada listing`), 'shot')}<span class="photo-note">Photo from the Lazada listing</span></div>
        <div class="buybox">${priceBlock(p)}${buyBtn(p, ' full')}</div>
      </div>
      <div class="pick-body">
        <h3>${esc(it.name)}</h3>
        <div class="chips"><span class="chip ev-${it.evidence}"><i></i>${EVIDENCE[it.evidence]}</span></div>
        <p class="verdict">${esc(it.verdict)}</p>
        <p class="summary">${esc(it.summary)}</p>
        ${factsBlock(it, p)}
      </div>
    </div>
    ${notesBlock(it, g)}
    ${prosCons(it)}
    <div class="pick-foot">
      <div><h4>Best for</h4><p>${esc(it.bestFor)}</p></div>
      <div><h4>Before you buy</h4><p>${esc(it.tip)}</p></div>
    </div>
    ${altBlock(it.alt)}
  </article>`;
}

// Card version of the same block (style guides). Alternates are shown under the grid, not inside cards,
// so every card holds the same kinds of content.
function pickCard(it, g) {
  const p = product(it.id, g.slug);
  return `<article class="pcard" id="${esc(it.anchor || 'p' + it.id)}" data-reveal>
      <div class="pcard-top">
        <div>${aff(p, lazImg(p, `Product photo of ${it.name} from its Lazada listing`), 'shot')}<span class="photo-note">Photo from the Lazada listing</span></div>
        <div class="pcard-head"><span class="slot">${esc(it.slot)}</span>${award(it.label)}<h3>${esc(it.name)}</h3><p class="verdict">${esc(it.verdict)}</p></div>
      </div>
      <p class="summary">${esc(it.summary)}</p>
      ${factsBlock(it, p)}
      ${notesBlock(it, g)}
      ${prosCons(it)}
      <p class="tipline"><b>Before you buy:</b> ${esc(it.tip)}</p>
      <div class="buyrow">${priceBlock(p)}${buyBtn(p)}</div>
    </article>`;
}
const altsRow = items => {
  const withAlt = items.filter(it => it.alt?.id);
  if (!withAlt.length) return '';
  return `<div class="alts" data-reveal><h4>Also worth a look</h4><div class="grid-2">${withAlt.map(it => altBlock({ label: `Instead of: ${it.slot}`, ...it.alt })).join('')}</div></div>`;
};

function glanceTable(items, g, title = 'The picks at a glance') {
  return `<section class="glance" id="glance" data-reveal>
    <div class="glance-head"><h2>${esc(title)}</h2><p>Prices checked ${pricesCheckedOf(g)}. Tap a name to jump to its full review.</p></div>
    <table>
      <thead><tr><th class="g-rank">#</th><th>Product</th><th class="g-hide">Best for</th><th>From</th><th class="g-cta"><span class="sr-only">Link</span></th></tr></thead>
      <tbody>${items.map(it => {
        const p = product(it.id, g.slug);
        const anchor = it.rank ? `#pick-${it.rank}` : `#${it.anchor || 'p' + it.id}`;
        return `<tr>
          <td class="g-rank">${it.rank || '·'}</td>
          <td><a class="g-prod" href="${anchor}"><span class="g-thumb">${lazImg(p, '')}</span><span class="g-name"><small>${esc(it.label || it.slot)}</small><b>${esc(it.name)}</b></span></a></td>
          <td class="g-for g-hide">${esc(it.bestFor || it.verdict)}</td>
          <td class="g-price">${peso(p.price)}</td>
          <td class="g-cta">${buyBtn(p)}</td>
        </tr>`;
      }).join('')}</tbody>
    </table>
  </section>`;
}

function curationBox(g) {
  const c = g.curation;
  if (!c) return '';
  return `<section class="curation" id="how-built" data-reveal>
    <div>
      <span class="kicker">How we built this list</span>
      <h2>${esc(c.title || 'Research first, products second')}</h2>
      ${(Array.isArray(c.summary) ? c.summary : [c.summary]).map(p => `<p>${esc(p)}</p>`).join('')}
    </div>
    <div>
      <h4>${esc(c.stepsTitle || 'What we did')}</h4>
      <ol>${c.steps.map(s => `<li><span>${esc(s)}</span></li>`).join('')}</ol>
    </div>
    ${c.sources?.length ? `<div class="srcs">Shopping list based on: ${c.sources.map(s => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)}</a>`).join(' · ')}</div>` : ''}
  </section>`;
}

const disclosureShort = r => `<div class="disclosure" data-reveal><p><strong>Heads up:</strong> links to Lazada on this page are affiliate links, so we may earn a small commission if you buy, at no extra cost to you. This guide was researched with the help of AI tools. <a href="${r}about.html">Here's how we pick.</a></p></div>`;

function footnotes(g) {
  return `<div class="footnotes">
      <p><sup>1</sup> <strong>About the images:</strong> pictures marked "AI sample render" were generated with AI (Google Gemini) from written descriptions of our picks, for inspiration. They show close lookalikes styled in a room, not photos of the actual products, and may differ in size, colour and detail. The real product photos come from each product's Lazada listing and are shown unmodified.</p>
      <p><strong>About prices:</strong> prices were checked on ${pricesCheckedOf(g)} and change often, and many listings have several options at different prices. Always check the final price, options and seller details on Lazada before you buy.</p>
    </div>`;
}
const sourcesBlock = g => g.sources?.length ? `<section class="block sources" id="sources" data-reveal><h2>Sources</h2><ol>${g.sources.map(s => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)}</a></li>`).join('')}</ol></section>` : '';

function related(g, r) {
  const others = guides.filter(x => x.slug !== g.slug).slice(0, 3);
  if (!others.length) return '';
  return `<section class="section tint">
  <div class="wrap">
    <div class="sec-head"><span class="kicker">Keep browsing</span><h2>More guides you might like</h2>${squiggle()}</div>
    ${cardGrid(others, r)}
  </div>
</section>`;
}

function crumbsFor(g, r) {
  const { cat, topic } = primary(g);
  const c = CATS[cat];
  const t = c.topics?.[topic];
  return `<nav class="crumbs" aria-label="Breadcrumb"><a href="${r}index.html">Home</a><span>/</span><a href="${r}category/${cat}/">${esc(c.name)}</a>${t ? `<span>/</span><a href="${r}category/${cat}/#${topic}">${esc(t.name)}</a>` : ''}</nav>`;
}

function guideHead(g, r) {
  return `<section class="page-head">
  <div class="wrap">
    ${crumbsFor(g, r)}
    <span class="kicker">${esc(g.kicker)}</span>
    <h1>${esc(g.title)}</h1>
    ${squiggle()}
    <p class="lede">${esc(g.dek)}</p>
    <div class="meta"><span>Updated ${fmtDate(g.updated)}</span><span>${g.readMinutes} min read</span><span>${plural(itemsOf(g).length, 'pick')}</span><span>Prices checked ${pricesCheckedOf(g)}</span></div>
  </div>
</section>
<section class="wrap hero-render">
  <figure class="render" data-reveal>
    <div class="frame">${img(r, g.hero.img, g.hero.alt, '(max-width: 1200px) 100vw, 1120px', true)}<span class="ai-chip">AI sample render</span></div>
    <figcaption><sup>1</sup> ${esc(g.hero.caption || 'AI sample render of our picks, drawn from written descriptions of each product. The real product photos from Lazada are below.')}</figcaption>
  </figure>
</section>`;
}

// ---------- pages ----------
function rankedGuide(g) {
  const r = '../';
  const callouts = g.callouts?.length ? `<div class="grid-2" data-stagger>${g.callouts.map(c => `<div class="callout" data-reveal><h3>${esc(c.title)}</h3><p>${esc(c.body)}</p><div class="src">Sources: ${c.sources.map(s => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)}</a>`).join(', ')}</div></div>`).join('')}</div>` : '';
  const sellerNote = g.sellerNote ? `<div class="disclosure" style="border-left-color:var(--mustard)" data-reveal><p><strong>About the sellers:</strong> ${esc(g.sellerNote)}</p></div>` : '';
  // Tip groups render as balanced grids: 3 tips in a row of three, otherwise rows of two.
  const groups = g.tipGroups || (g.tips?.length ? [{ title: g.tipsTitle || 'Tips', tips: g.tips }] : []);
  const tipCard = t => `<div class="box tip-card" data-reveal><h3>${esc(t.title)}</h3><p>${esc(t.body)}</p><div class="foot">${t.url ? `Source: <a href="${esc(t.url)}" target="_blank" rel="noopener">${esc(t.source)}</a>` : 'Common-sense care'}</div></div>`;
  const tips = groups.map((grp, i) => `<section class="block" id="tips-${i + 1}" data-reveal>${grp.kicker ? `<span class="kicker" style="margin:0">${esc(grp.kicker)}</span>` : ''}<h2>${esc(grp.title)}</h2><div class="grid-${grp.tips.length % 3 === 0 && grp.tips.length % 2 ? 3 : 2}" data-stagger>${grp.tips.map(tipCard).join('')}</div></section>`).join('\n');
  const toc = `<div class="side-box"><h4>In this guide</h4><ol class="toc">
      ${g.curation ? `<li><a href="#how-built"><span class="n">·</span><span>How we built this list</span></a></li>` : ''}
      <li><a href="#glance"><span class="n">·</span><span>At a glance</span></a></li>
      ${g.items.map(it => `<li><a href="#pick-${it.rank}"><span class="n">${it.rank}</span><span>${esc(it.slot)}</span></a></li>`).join('')}
      ${groups.map((grp, i) => `<li><a href="#tips-${i + 1}"><span class="n">+</span><span>${esc(grp.kicker || 'Tips')}</span></a></li>`).join('')}
      ${g.sources?.length ? `<li><a href="#sources"><span class="n">·</span><span>Sources</span></a></li>` : ''}
    </ol></div>`;
  const body = `${guideHead(g, r)}
<section class="section flush-top">
  <div class="wrap article">
    <div class="main-col">
      <div class="block">${disclosureShort(r)}<div class="intro">${g.intro.map(p => `<p>${esc(p)}</p>`).join('')}</div></div>
      ${curationBox(g)}
      ${glanceTable(g.items, g)}
      ${callouts}
      ${sellerNote}
      <section class="block" aria-label="Full reviews">${g.items.map(it => pickBlock(it, g)).join('\n')}</section>
      ${tips}
      ${sourcesBlock(g)}
      ${footnotes(g)}
    </div>
    <aside class="aside">
      ${toc}
      <div class="side-box"><h4>Good to know</h4><p>Prices were checked on ${pricesCheckedOf(g)} and change often. Product photos come straight from each Lazada listing.</p></div>
    </aside>
  </div>
</section>
${related(g, r)}`;
  return layout({ r, title: g.title, description: g.description, canonical: `guides/${g.slug}.html`, og: g.og, active: `cat-${primary(g).cat}`, body, type: 'article' });
}

function stylesGuide(g) {
  const r = '../';
  const jump = `<nav class="style-jump" aria-label="Styles in this guide" data-stagger>${g.sections.map((s, i) => `<a href="#${s.id}" data-reveal>${img(r, s.img, '', '80px')}<span><small>Style ${i + 1}</small><b>${esc(s.name)}</b></span></a>`).join('')}</nav>`;
  const sections = g.sections.map((s, i) => `<section class="style-sec" id="${s.id}">
    <div class="style-head">
      <div data-reveal>
        <span class="kicker">Style ${i + 1} of ${g.sections.length}</span>
        <h2>${esc(s.name)}</h2>
        ${squiggle()}
        <p>${esc(s.definition)}</p>
        ${s.palette?.length ? `<div class="palette" aria-label="Palette">${s.palette.map(c => `<span>${esc(c)}</span>`).join('')}</div>` : ''}
        <ol class="tips">${s.tips.map(t => `<li>${esc(t)}</li>`).join('')}</ol>
        ${s.note ? `<p class="note">${esc(s.note)}</p>` : ''}
        ${s.definitionSources?.length ? `<p class="small muted" style="margin-top:var(--s3)">Style references: ${s.definitionSources.map(x => `<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.name)}</a>`).join(' · ')}</p>` : ''}
      </div>
      <figure class="render" data-reveal>
        <div class="frame">${img(r, s.img, s.alt, '(max-width: 920px) 100vw, 600px')}<span class="ai-chip">AI sample render</span></div>
        <figcaption><sup>1</sup> AI sample render of the picks below in one room, drawn from written descriptions of each product. Not a photo of the actual products.</figcaption>
      </figure>
    </div>
    <div class="list-head" data-reveal><h3>The shopping list</h3>${s.shoppingList ? `<p>${esc(s.shoppingList)}</p>` : ''}</div>
    <div class="grid-2" data-stagger>${s.items.map(it => pickCard(it, g)).join('\n')}</div>
    ${altsRow(s.items)}
  </section>`).join('\n');
  const body = `${guideHead(g, r)}
<section class="section flush-top">
  <div class="wrap" style="display:flex;flex-direction:column;gap:var(--s7)">
    <div class="reading block">${disclosureShort(r)}<div class="intro">${g.intro.map(p => `<p>${esc(p)}</p>`).join('')}</div></div>
    ${curationBox(g)}
    ${jump}
    ${sections}
    <div class="reading" style="display:flex;flex-direction:column;gap:var(--s6)">${sourcesBlock(g)}${footnotes(g)}</div>
  </div>
</section>
${related(g, r)}`;
  return layout({ r, title: g.title, description: g.description, canonical: `guides/${g.slug}.html`, og: g.og, active: `cat-${primary(g).cat}`, body, type: 'article' });
}

function catTile(k, c, r) {
  const n = guidesIn(k).length;
  return `<a class="cat-tile" href="${r}category/${k}/" data-reveal>${img(r, c.img, '', '(max-width: 640px) 50vw, 300px')}<span class="count${n ? '' : ' soon'}">${n ? plural(n, 'guide') : 'Coming soon'}</span><span class="label"><b>${esc(c.name)}</b><span>${esc(c.blurb)}</span></span></a>`;
}

function categoryPage(key) {
  const r = '../../';
  const c = CATS[key];
  const gs = guidesIn(key);
  const topicBlocks = Object.entries(c.topics || {}).map(([tk, t]) => {
    const tg = gs.filter(g => inTopic(g, key, tk));
    if (!tg.length) return '';
    return `<div class="topic-block" id="${tk}"><div class="topic-head"><h3>${esc(t.name)}</h3><span>${plural(tg.length, 'guide')}</span></div>${cardGrid(tg, r)}</div>`;
  }).join('');
  const others = Object.entries(CATS).filter(([k]) => k !== key);
  const body = `<section class="page-head with-art">
  <div class="wrap">
    <div>
      <nav class="crumbs" aria-label="Breadcrumb"><a href="${r}index.html">Home</a><span>/</span><span>${esc(c.name)}</span></nav>
      <span class="kicker">Category</span>
      <h1>${esc(c.name)}</h1>
      ${squiggle()}
      <p class="lede">${esc(c.intro)}</p>
      <div class="meta"><span>${gs.length ? plural(gs.length, 'guide') : 'First guides on the way'}</span></div>
    </div>
    <div class="art" data-reveal>${img(r, c.img, '', '(max-width: 920px) 100vw, 480px', true)}<span class="ai-chip">AI sample render</span></div>
  </div>
</section>
<section class="section" style="padding-top:var(--s6)">
  <div class="wrap">
    ${gs.length ? topicBlocks : `<div class="empty" data-reveal><h3>Our first ${esc(c.short.toLowerCase())} guides are on the way</h3><p>We only publish a guide once we've found products we're comfortable recommending. Follow along on <a href="${PINTEREST}" target="_blank" rel="noopener">Pinterest</a> to see them first, or browse <a href="${r}guides/">all guides</a> in the meantime.</p></div>`}
  </div>
</section>
<section class="section tint">
  <div class="wrap">
    <div class="sec-head"><span class="kicker">Our standards</span><h2>${esc(c.lookForTitle)}</h2>${squiggle()}</div>
    <div class="grid-3" data-stagger>${c.lookFor.map(x => `<div class="box" data-reveal><h3>${esc(x.title)}</h3><p>${esc(x.body)}</p></div>`).join('')}</div>
  </div>
</section>
<section class="section">
  <div class="wrap">
    <div class="sec-head"><span class="kicker">Keep exploring</span><h2>Other categories</h2>${squiggle()}</div>
    <div class="grid-3" data-stagger>${others.map(([k, oc]) => catTile(k, oc, r)).join('')}</div>
  </div>
</section>`;
  return layout({ r, title: c.name, description: `${c.name} guides from Great Finds: ${c.blurb}`, canonical: `category/${key}/`, active: `cat-${key}`, body });
}

function homePage() {
  const r = '';
  const body = `<section class="hero">
  <div class="wrap grid">
    <div>
      <span class="kicker" data-reveal>Product finds for Filipino homes</span>
      <h1><span class="line"><span>Good finds,</span></span><span class="line"><span>honestly</span></span><span class="line"><span>picked.</span></span></h1>
      ${squiggle()}
      <p class="lede" data-reveal>We read the listings, the spec sheets and the independent reviews so you don't have to, then share the finds that are worth your peso, with the pros <em>and</em> the cons.</p>
      <div class="actions" data-reveal>
        <a class="btn" href="guides/">Browse the guides ${ICON.arrow}</a>
        <a class="link-arrow" href="about.html">How we pick ${ICON.arrow}</a>
      </div>
    </div>
    <div class="hero-art" data-reveal>
      <div class="blob">${img(r, 'hero', 'AI sample render of a lilac ceramic stand in warm sunlight holding a small vase, a dropper bottle, wireless earbuds and a wrapped gift against terracotta tiles', '(max-width: 920px) 100vw, 520px', true)}<span class="ai-chip">AI sample render</span></div>
      <div class="badge">${ring('Checked · Compared · Chosen with care · ', 'ring-hero')}<span class="center">${ICON.search}</span></div>
    </div>
  </div>
</section>

<section class="band" aria-label="What you can expect">
  <div class="wrap row" data-stagger>
    <div class="cell" data-reveal><span class="ico">${ICON.tag}</span><div><b>Real Lazada listings</b><span>Live products, prices dated</span></div></div>
    <div class="cell" data-reveal><span class="ico">${ICON.scale}</span><div><b>Pros and cons</b><span>Always both sides</span></div></div>
    <div class="cell" data-reveal><span class="ico">${ICON.book}</span><div><b>Sources linked</b><span>Check the research yourself</span></div></div>
    <div class="cell" data-reveal><span class="ico">${ICON.peso}</span><div><b>Budget-friendly</b><span>Mostly under ₱5,000</span></div></div>
  </div>
</section>

<section class="section">
  <div class="wrap split">
    <div class="intro" data-reveal>
      <span class="kicker">Latest guides</span>
      <h2>Fresh finds, carefully picked.</h2>
      ${squiggle()}
      <p>Every guide starts with research into what actually matters, then compares real listings against that list. You get a clear verdict for each pick, the trade-offs, and the sources behind it.</p>
      <a class="link-arrow" href="guides/">See all guides ${ICON.arrow}</a>
    </div>
    ${cardGrid(guides.slice(0, 3), r)}
  </div>
</section>

<section class="section tint">
  <div class="wrap">
    <div class="sec-head" data-reveal><span class="kicker">Shop by category</span><h2>What are you shopping for?</h2>${squiggle()}</div>
    <div class="grid-4" data-stagger>${Object.entries(CATS).map(([k, c]) => catTile(k, c, r)).join('\n')}</div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="sec-head" data-reveal><span class="kicker">How we pick</span><h2>Four checks before anything makes the list.</h2>${squiggle()}<p class="lede">Being someone's go-to for recommendations means earning trust one guide at a time. This is the process every pick goes through, and we're open about where the evidence is strong and where it's thin.</p></div>
    <div class="grid-4 steps" data-stagger>
      <div class="box step" data-reveal><h3>Start with research</h3><p>We first work out what's worth buying from expert lists, design references and safety guidance, and set clear criteria.</p></div>
      <div class="box step" data-reveal><h3>Compare real listings</h3><p>Then we compare products on Lazada against those criteria: price, stock, seller and recent buyers.</p></div>
      <div class="box step" data-reveal><h3>Weed out the risky ones</h3><p>Odd prices, keyword-stuffed names, look-alike stores and recalled model numbers get dropped, even when they sell well.</p></div>
      <div class="box step" data-reveal><h3>Write it straight</h3><p>Pros and cons, who it's for, and the sources behind every claim. We never say we tested something we didn't.</p></div>
    </div>
  </div>
</section>

<section class="trio" aria-label="Everyday finds">
  <div class="t-text" data-reveal>
    <span class="kicker">Little upgrades</span>
    <h2>Every day is a good find day.</h2>
    ${squiggle('cream')}
    <p>The best finds aren't always big purchases. A cable that doesn't fray, a softer light for the evening, a basket that finally fits the corner: small things that make home life a little easier.</p>
    <a class="link-arrow" href="guides/">Read the guides ${ICON.arrow}</a>
  </div>
  <div class="t-img">${img(r, 'everyday', 'AI sample render of a sunlit condo kitchen counter with a rattan tray holding a phone on a stand, a cup of coffee and a small plant', '(max-width: 920px) 100vw, 45vw')}<span class="ai-chip">AI sample render</span></div>
  <div class="t-follow" data-reveal>
    <div class="badge">${ring('Good finds · Good finds · Good finds · ', 'ring-follow')}<span class="center">${ICON.tag}</span></div>
    <p style="max-width:18em">New finds and room ideas, pinned as we publish them.</p>
    <span class="handle">pinterest.com/samsanclaria2295</span>
    <a class="link-arrow" href="${PINTEREST}" target="_blank" rel="noopener">Follow on Pinterest ${ICON.arrow}</a>
  </div>
</section>`;
  return layout({ r, title: 'Great Finds | Researched product finds for Filipino shoppers', description: 'Great Finds shares researched product finds and buying guides for Filipino shoppers: tech, home and decor, beauty and seasonal picks, with honest pros, cons and sources.', canonical: '', body });
}

function guidesIndex() {
  const r = '../';
  const groups = Object.entries(CATS).map(([k, c]) => {
    const gs = guidesIn(k);
    return `<div class="cat-group" id="${k}">
      <div class="topic-head"><h3>${esc(c.name)}</h3><a href="${r}category/${k}/">${gs.length ? `View category (${plural(gs.length, 'guide')})` : 'About this category'} →</a></div>
      ${gs.length ? cardGrid(gs, r) : `<div class="empty" data-reveal><p>Our first ${esc(c.short.toLowerCase())} guides are on the way. We only publish once we've found products we're comfortable recommending.</p></div>`}
    </div>`;
  }).join('\n');
  const body = `<section class="page-head">
  <div class="wrap">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="${r}index.html">Home</a><span>/</span><span>All guides</span></nav>
    <span class="kicker">All guides</span>
    <h1>Guides worth bookmarking</h1>
    ${squiggle()}
    <p class="lede">Researched buying guides for Filipino shoppers, with real listings, honest pros and cons, and sources you can check, grouped by category.</p>
  </div>
</section>
<section class="section" style="padding-top:var(--s6)">
  <div class="wrap">${groups}</div>
</section>`;
  return layout({ r, title: 'All guides', description: 'All Great Finds buying guides: tech and gadgets, home and decor, beauty and skin care, and seasonal finds for Filipino shoppers.', canonical: 'guides/', active: 'guides', body });
}

function aboutPage() {
  const r = '';
  const body = `<section class="page-head">
  <div class="wrap reading">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="index.html">Home</a><span>/</span><span>How we pick</span></nav>
    <span class="kicker">About Great Finds</span>
    <h1>How we pick what we recommend</h1>
    ${squiggle()}
    <p class="lede">Great Finds is a small, independent project run by one person in the Philippines. The goal is simple: help Filipino shoppers find products that are actually worth their money, and be honest about the ones that aren't.</p>
  </div>
</section>
<section class="section" style="padding-top:var(--s5)">
  <div class="wrap reading prose">
    <h2 style="margin-top:0" data-reveal>What we cover</h2>
    <p data-reveal>Tech and gadgets, home and decor, beauty and skin care, and seasonal finds like Christmas decor and sale-season picks. Topics come from research into what people are shopping for, and every guide focuses on products available to buyers in the Philippines.</p>

    <h2 data-reveal>How a guide comes together</h2>
    <div class="grid-2" data-stagger>
      <div class="box" data-reveal><h3>1. Research first</h3><p>Before looking at any product, we work out what belongs on the list from expert "best of" lists, design references for a style, or safety guidance, and write down the criteria.</p></div>
      <div class="box" data-reveal><h3>2. Compare real listings</h3><p>Then we compare products in Lazada's affiliate program against those criteria, using Lazada's own product data: price, stock, seller and recent buyers. We never copy or scrape Lazada's website.</p></div>
      <div class="box" data-reveal><h3>3. Drop the risky ones</h3><p>Odd prices, brand names stuffed into unrelated products, look-alike store names, photos that don't match the listing, and recalled model numbers are all reasons to drop a product.</p></div>
      <div class="box" data-reveal><h3>4. Write it straight</h3><p>Every pick gets a verdict, pros and cons, who it suits and what to check before buying. Where the evidence is thin, we say so on the page.</p></div>
    </div>

    <h2 data-reveal>What we won't do</h2>
    <ul data-reveal>
      <li>Say we tested a product when we haven't. Unless a guide says otherwise, we haven't handled the products ourselves.</li>
      <li>Invent reviews, ratings or testimonials.</li>
      <li>Hide the downsides of a product to make it sound better.</li>
      <li>Show a product photo that's been edited. Product photos come straight from each Lazada listing.</li>
    </ul>

    <h2 data-reveal>How we use AI</h2>
    <p data-reveal>AI helps us research and write faster, but it doesn't replace checking. We use AI research assistants (Claude, Gemini and ChatGPT) to gather and compare sources, and every claim about a product links to a source you can read yourself. Room and still-life pictures marked "AI sample render" are generated with Google's Gemini image model from written descriptions of our picks. They show close lookalikes for inspiration; they are not photos of the actual products.</p>

    <h2 data-reveal>How Great Finds earns</h2>
    <p data-reveal>Some links on Great Finds are affiliate links. We're part of Lazada's affiliate program, so if you buy through one of our links, we may earn a small commission at no extra cost to you. Great Finds is an independent site, not operated by Lazada, and no brand has paid to appear in our guides.</p>

    <h2 data-reveal>Prices and updates</h2>
    <p data-reveal>Prices are shown as "from around ₱X" with the date we checked them, because online prices and options change often. Always check the final price, the option you're choosing and the seller details on Lazada before you buy.</p>

    <h2 data-reveal>Spotted something off?</h2>
    <p data-reveal>If a detail is wrong or out of date, or a product disappoints you, we want to know. Email <a href="mailto:${EMAIL}">${EMAIL}</a> and we'll look into it and fix the guide.</p>
  </div>
</section>`;
  return layout({ r, title: 'How we pick', description: 'How Great Finds researches and chooses the products it recommends, how we use AI, and how the site earns.', canonical: 'about.html', active: 'about', body });
}

function privacyPage() {
  const r = '';
  const body = `<section class="page-head">
  <div class="wrap reading">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="index.html">Home</a><span>/</span><span>Privacy Policy</span></nav>
    <span class="kicker">Legal</span>
    <h1>Privacy Policy</h1>
    ${squiggle()}
    <div class="meta"><span>Effective October 12, 2026</span><span>Last updated October 12, 2026</span></div>
  </div>
</section>
<section class="section" style="padding-top:var(--s5)">
  <div class="wrap reading prose">
  <p>Great Finds ("we", "us") curates product finds and buying guides for shoppers in the Philippines through this website and our social media pages. Great Finds is operated by an individual based in Metro Manila, Philippines. This policy explains what information we handle and how, in line with the Philippine Data Privacy Act of 2012 (Republic Act No. 10173).</p>

  <h2>1. Information we collect on this website</h2>
  <p>You can browse Great Finds without creating an account or giving us any personal information. We do not run sign-up forms, comments or user accounts on this site, and we do not use cookies, analytics or advertising trackers.</p>
  <p>This website is hosted on GitHub Pages. Like most web hosts, GitHub may log technical information such as your IP address when you visit, as described in <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement">GitHub's Privacy Statement</a>. We do not use these logs to identify visitors. Our fonts and site images are served from this website itself.</p>
  <p>Product photos in our guides are loaded directly from Lazada's image servers so that they appear exactly as they do on the product listing. When your browser loads those photos, Lazada's servers may receive the same kind of technical information any website receives, such as your IP address. If we add privacy-friendly visitor statistics in the future, we will update this policy first.</p>

  <h2>2. Affiliate links and online stores</h2>
  <p>Many links on Great Finds are affiliate links to online stores such as Lazada. When you click one, you leave our site, and the store and its affiliate tracking partners may set cookies or similar technologies to record that the visit came from us. That information is handled by those stores under their own privacy policies; we receive only aggregated reports (such as the number of clicks and completed orders) and never your name, address or payment details.</p>

  <h2>3. Social media and connected apps (including Pinterest)</h2>
  <p>We publish content to our own accounts on platforms such as Pinterest, Facebook, Threads and Telegram using their official tools and APIs. For example, our Pinterest integration is used only to create and manage Pins and boards on Great Finds' own Pinterest account.</p>
  <ul>
    <li>We do not collect, store or process personal data about other Pinterest users or anyone else through these integrations.</li>
    <li>Access tokens for our own accounts are stored privately on our own computer and are used only to publish and manage our own content.</li>
    <li>Basic performance data that a platform provides about our own posts (such as views, saves and clicks) is used only to improve our content.</li>
    <li>If you interact with our pages (for example, by commenting or sending a message), that platform's privacy policy applies to the information you share there.</li>
  </ul>

  <h2>4. How we use information</h2>
  <p>We use the limited information described above only to run and improve Great Finds: choosing which products to feature, measuring which content is helpful, and maintaining our pages. We do not sell, rent or trade personal information, and we do not use it for advertising profiles.</p>

  <h2>5. Data sharing</h2>
  <p>We do not share personal information with third parties, except where required by law or to protect our rights, and the aggregated, non-identifying reports that affiliate programs provide to us.</p>

  <h2>6. Data retention and security</h2>
  <p>We keep account credentials and aggregated performance reports only as long as needed to operate Great Finds. Credentials are kept private on our own devices and accounts, protected by access controls, and are never published.</p>

  <h2>7. Your rights</h2>
  <p>Under the Data Privacy Act, you have the right to be informed, to access, to correct, to object, and to request deletion of personal information about you, and to file a complaint with the National Privacy Commission. Because we generally do not hold personal information about visitors, most requests will not apply, but you can contact us any time and we will respond.</p>

  <h2>8. Children</h2>
  <p>Great Finds is intended for adults and is not directed to children under 18. We do not knowingly collect information from children.</p>

  <h2>9. Changes to this policy</h2>
  <p>We may update this policy as our services change. The dates above show when it took effect and when it was last updated.</p>

  <h2>10. Contact us</h2>
  <p>For privacy questions or requests, email us at <a href="mailto:${EMAIL}">${EMAIL}</a>.</p>
  </div>
</section>`;
  return layout({ r, title: 'Privacy Policy', description: 'How Great Finds handles information on its website, social pages and connected apps.', canonical: 'privacy.html', body });
}

function notFoundPage() {
  const r = '/great-deals/';
  const body = `<section class="lost">
  <div class="wrap reading">
    <span class="kicker">Page not found</span>
    <h1>404</h1>
    <p class="lede">This page may have moved, or the link has a typo. The good finds are still here, though.</p>
    <a class="btn" href="${r}guides/">Browse the guides ${ICON.arrow}</a>
  </div>
</section>`;
  return layout({ r, title: 'Page not found', description: 'The page you were looking for could not be found.', canonical: '404.html', body });
}

// ---------- write ----------
function write(rel, html) {
  const file = path.join(SITE, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
  console.log('wrote', rel);
}

write('index.html', homePage());
write('guides/index.html', guidesIndex());
for (const g of guides) write(`guides/${g.slug}.html`, g.type === 'styles' ? stylesGuide(g) : rankedGuide(g));
for (const key of Object.keys(CATS)) write(`category/${key}/index.html`, categoryPage(key));
write('about.html', aboutPage());
write('privacy.html', privacyPage());
write('404.html', notFoundPage());

const urls = ['', 'guides/', ...Object.keys(CATS).map(k => `category/${k}/`), ...guides.map(g => `guides/${g.slug}.html`), 'about.html', 'privacy.html'];
const lastmod = new Date().toISOString().slice(0, 10);
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${BASE_URL}${u}</loc><lastmod>${lastmod}</lastmod></url>`).join('\n')}\n</urlset>\n`);
write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${BASE_URL}sitemap.xml\n`);
