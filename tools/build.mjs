// Builds the static Great Finds site into site/ from src/guides/*.json and src/data/products.json.
// Usage: node tools/build.mjs   (no network, no secrets)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = path.join(ROOT, 'site');
const BASE_URL = 'https://samsanclaria2295-ai.github.io/great-deals/';
const PINTEREST = 'https://www.pinterest.com/samsanclaria2295/';
const EMAIL = 'samsanclaria2295@gmail.com';

const products = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/products.json'), 'utf8'));
const guides = fs.readdirSync(path.join(ROOT, 'src/guides')).filter(f => f.endsWith('.json'))
  .map(f => JSON.parse(fs.readFileSync(path.join(ROOT, 'src/guides', f), 'utf8')))
  .sort((a, b) => (b.published + (b.order || 0)).localeCompare(a.published + (a.order || 0)));

const CATS = {
  tech: { name: 'Tech & Gadgets', short: 'Tech', img: 'cat-tech', blurb: 'Chargers, earbuds and the small gadgets that make everyday life smoother.' },
  home: { name: 'Home & Decor', short: 'Home', img: 'cat-home', blurb: 'Storage, lighting and decor that make a small space feel like home.' },
  beauty: { name: 'Beauty & Skin Care', short: 'Beauty', img: 'cat-beauty', blurb: 'Skin care and beauty finds, with extra care to steer clear of fakes.' },
  seasonal: { name: 'Seasonal Finds', short: 'Seasonal', img: 'cat-seasonal', blurb: 'Christmas, sale seasons and the moments worth planning for.' },
};
// Rendered image sizes (width -> height) for each AI image.
const LAND = { 800: 537, 1600: 1073 }, PORT = { 560: 695, 1000: 1241 }, WIDE = { 800: 597, 1600: 1195 };
const IMGS = {
  hero: PORT, 'cat-tech': PORT, 'cat-home': PORT, 'cat-beauty': PORT, 'cat-seasonal': PORT, everyday: WIDE,
  'guide-phone': LAND, 'guide-xmas': LAND, 'guide-home': LAND, 'style-muji': LAND, 'style-japandi': LAND, 'style-filipino': LAND,
};
const OG = { 'must-have-phone-accessories': 'og-guide-phone.jpg', 'small-condo-christmas-decor': 'og-guide-xmas.jpg', 'home-style-finds': 'og-guide-home.jpg' };

// ---------- helpers ----------
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const peso = n => '₱' + Math.round(n).toLocaleString('en-PH');
const fmtDate = d => new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(d.length === 10 ? d + 'T12:00:00+08:00' : d));
const catsOf = g => [g.category, ...(g.alsoIn || [])];
const itemsOf = g => g.items || (g.sections || []).flatMap(s => s.items);
const pricesCheckedOf = g => {
  const dates = itemsOf(g).map(it => products[it.id]?.checkedAt).filter(Boolean).sort();
  return dates.length ? fmtDate(dates[0]) : fmtDate(g.updated);
};

const ICON = {
  arrow: '<svg class="arr" viewBox="0 0 24 12" aria-hidden="true"><path d="M0 6h22M17 1l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  plus: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  pinterest: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-3.64 19.31c-.09-.79-.17-2 .03-2.86l1.17-4.97s-.3-.6-.3-1.48c0-1.39.81-2.43 1.81-2.43.85 0 1.27.64 1.27 1.41 0 .86-.55 2.14-.83 3.33-.24 1 .5 1.81 1.48 1.81 1.78 0 3.14-1.87 3.14-4.58 0-2.39-1.72-4.07-4.18-4.07-2.85 0-4.52 2.14-4.52 4.35 0 .86.33 1.78.74 2.28.08.1.09.19.07.29l-.28 1.13c-.04.18-.15.22-.33.13-1.25-.58-2.03-2.41-2.03-3.88 0-3.16 2.3-6.06 6.62-6.06 3.48 0 6.18 2.48 6.18 5.79 0 3.45-2.18 6.23-5.2 6.23-1.02 0-1.97-.53-2.3-1.15l-.62 2.38c-.23.87-.84 1.96-1.25 2.62A10 10 0 1 0 12 2z"/></svg>',
  mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18v12H3z M3 7l9 6 9-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  tag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12V4h8l10 10-8 8L3 12z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><circle cx="7.5" cy="8.5" r="1.6" fill="currentColor"/></svg>',
  scale: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18M5 21h14M4 7h16M7 7l-3 7a3 3 0 0 0 6 0L7 7zm10 0-3 7a3 3 0 0 0 6 0l-3-7z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/></svg>',
  book: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M8 8h8M8 11.5h6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  peso: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 20V4h5a4.5 4.5 0 0 1 0 9H8M5 7.5h14M5 10.5h14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15 15l5.5 5.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
};
const squiggle = (cls = '') => `<svg class="squiggle ${cls}" viewBox="0 0 132 14" aria-hidden="true"><path d="M2 8c8-7 14-7 22 0s14 7 22 0 14-7 22 0 14 7 22 0 14-7 22 0 12 6 18 2"/></svg>`;
const ring = (text, id) => `<svg class="ring" viewBox="0 0 120 120" aria-hidden="true"><defs><path id="${id}" d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0"/></defs><text><textPath href="#${id}" textLength="286" lengthAdjust="spacing">${esc(text)}</textPath></text></svg>`;

function renderImg(r, name, alt, sizes, eager = false) {
  const d = IMGS[name]; const ws = Object.keys(d).map(Number); const big = Math.max(...ws), small = Math.min(...ws);
  return `<img src="${r}assets/img/${name}-${small}.webp" srcset="${ws.map(w => `${r}assets/img/${name}-${w}.webp ${w}w`).join(', ')}" sizes="${sizes}" width="${big}" height="${d[big]}" alt="${esc(alt)}"${eager ? ' fetchpriority="high"' : ' loading="lazy" decoding="async"'}>`;
}
const renderCaption = (text) => `<figcaption><sup>1</sup><span>${esc(text)}</span></figcaption>`;
const productImg = (p, alt, lazy = true) => p?.images?.[0]
  ? `<img src="${esc(p.images[0])}" alt="${esc(alt)}" referrerpolicy="no-referrer"${lazy ? ' loading="lazy" decoding="async"' : ''}>` : '';
const buyLink = (p, label, cls = 'btn small') => p?.link
  ? `<a class="${cls}" href="${esc(p.link)}" target="_blank" rel="sponsored nofollow noopener">${label} ${ICON.arrow}</a>` : '';

// ---------- layout ----------
function layout({ r = '', title, description, canonical, og = 'og-home.jpg', active = '', body, type = 'website' }) {
  const fullTitle = title.includes('Great Finds') ? title : `${title} | Great Finds`;
  const nav = (href, label, key) => `<a href="${r}${href}"${active === key ? ' aria-current="page"' : ''}>${label}</a>`;
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
<meta property="og:image" content="${BASE_URL}assets/img/${og}">
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
    <nav class="nav" aria-label="Main">
      ${nav('guides/', 'Guides', 'guides')}
      <a href="${r}guides/#tech">Tech</a>
      <a href="${r}guides/#home">Home</a>
      <a href="${r}guides/#beauty">Beauty</a>
      <a href="${r}guides/#seasonal">Seasonal</a>
    </nav>
    <a class="logo" href="${r}index.html" aria-label="Great Finds, home"><span class="word">Great<br>Finds<span class="dots" aria-hidden="true"><i></i><i></i></span></span><span class="tag">Honest finds · PH</span></a>
    <nav class="nav right" aria-label="Secondary">
      ${nav('about.html', 'How we pick', 'about')}
      <a class="pin" href="${PINTEREST}" target="_blank" rel="noopener">${ICON.pinterest}Pinterest</a>
    </nav>
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="mobile-menu" aria-label="Open menu"><span></span><span></span><span></span></button>
  </div>
</header>
<nav class="mobile-menu" id="mobile-menu" aria-label="Mobile">
    <a href="${r}index.html">Home</a>
    <a href="${r}guides/">All guides</a>
    <a href="${r}about.html">How we pick</a>
    <div class="group">
      <a class="sub" href="${r}guides/#tech">Tech &amp; Gadgets</a>
      <a class="sub" href="${r}guides/#home">Home &amp; Decor</a>
      <a class="sub" href="${r}guides/#beauty">Beauty &amp; Skin Care</a>
      <a class="sub" href="${r}guides/#seasonal">Seasonal Finds</a>
      <a class="sub" href="${PINTEREST}" target="_blank" rel="noopener">Pinterest</a>
    </div>
</nav>
<main id="main">
${body}
</main>
<footer class="site-footer">
  <div class="wrap">
    <div class="top">
      <div class="about"><b>Great Finds</b><p>Researched product finds for Filipino shoppers: tech, home and decor, beauty and seasonal picks, always with the pros and the cons.</p></div>
      <nav aria-label="Footer">
        <a href="${r}guides/">Guides</a>
        <a href="${r}about.html">How we pick</a>
        <a href="${r}privacy.html">Privacy</a>
        <a href="mailto:${EMAIL}">Contact</a>
      </nav>
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
function guideCard(g, r, i = 0) {
  const colors = { mustard: 'bg-mustard', olive: 'bg-olive', terracotta: 'bg-terracotta', salmon: 'bg-salmon', lavender: 'bg-lavender' };
  return `<a class="card" href="${r}guides/${g.slug}.html" data-cat="${catsOf(g).join(' ')}" data-reveal>
      <div class="media ${colors[g.color] || 'bg-peach'}">${renderImg(r, g.hero.img, '', '(max-width: 640px) 100vw, (max-width: 920px) 50vw, 400px')}<span class="ai-chip">AI sample render</span></div>
      <div class="body">
        <span class="cat">${esc(CATS[g.category].name)}</span>
        <h3>${esc(g.shortTitle)}</h3>
        <p>${esc(g.dek)}</p>
        <div class="foot"><span>${g.readMinutes} min read · Updated ${fmtDate(g.updated)}</span><span class="plus">${ICON.plus}</span></div>
      </div>
    </a>`;
}

function shortDisclosure(r) {
  return `<div class="disclosure" data-reveal><p><strong>Heads up:</strong> links to Lazada on this page are affiliate links, so we may earn a small commission if you buy, at no extra cost to you. This guide was researched with the help of AI tools. <a href="${r}about.html">Here's how we pick.</a></p></div>`;
}

const EVIDENCE = {
  strong: 'Research: strong · independent reviews',
  moderate: 'Research: moderate · maker specs and coverage',
  light: 'Research: light · no independent review found',
  guidance: 'Research: buying and safety guidance',
};

function altBlock(alt, r) {
  if (!alt) return '';
  const p = products[alt.id];
  if (!p) return '';
  return `<div class="alt">
        <a class="ashot" href="${esc(p.link)}" target="_blank" rel="sponsored nofollow noopener">${productImg(p, `Product photo of ${alt.name} from its Lazada listing`)}</a>
        <div><small>Also consider</small><b>${esc(alt.name)}</b><p>${esc(alt.note)}</p></div>
        <div class="ap">From around ${peso(p.price)}<a href="${esc(p.link)}" target="_blank" rel="sponsored nofollow noopener">View on Lazada</a></div>
      </div>`;
}

function pickCard(it, g, r) {
  const p = products[it.id];
  if (!p) throw new Error(`Missing product data for ${it.id} in ${g.slug}; run tools/refresh-products.mjs`);
  const reviewsTitle = it.evidence === 'guidance' ? (g.guidanceLabel || 'Good to know') : 'What reviewers say';
  const reviews = it.reviewers?.length
    ? `<ul>${it.reviewers.map(rv => `<li>${esc(rv.point)} <cite>(<a href="${esc(rv.url)}" target="_blank" rel="noopener">${esc(rv.source)}</a>)</cite></li>`).join('')}</ul>`
    : `<p class="small muted" style="margin:0">We couldn't find an independent review of this exact model, so treat it as a lighter recommendation and read recent buyer reviews on the listing before you buy.</p>`;
  return `<article class="pick" id="pick-${it.rank}" data-reveal>
    <div class="rank" aria-hidden="true">${it.rank}</div>
    <div class="top">
      <a class="shot" href="${esc(p.link)}" target="_blank" rel="sponsored nofollow noopener" aria-label="${esc(it.name)} on Lazada">${productImg(p, `Product photo of ${it.name} from its Lazada listing`)}<span class="src-chip">Lazada listing photo</span></a>
      <div>
        <div class="slot">#${it.rank} · ${esc(it.slot)}</div>
        <h3>${esc(it.name)}</h3>
        <div class="chips"><span class="chip ev-${it.evidence}"><i></i>${EVIDENCE[it.evidence]}</span>${it.brand ? `<span class="chip">${esc(it.brand)}</span>` : ''}</div>
        <p class="summary" style="margin-top:14px">${esc(it.summary)}</p>
        <div class="buy">
          <div class="price">From around ${peso(p.price)}<small>Price checked ${fmtDate(p.checkedAt)}${p.seller ? ` · Sold by ${esc(p.seller.trim())}` : ''}</small></div>
          ${buyLink(p, 'View on Lazada')}
        </div>
      </div>
    </div>
    <div class="reviews"><h4>${esc(reviewsTitle)}</h4>${reviews}</div>
    <div class="procon">
      <div class="pros"><h4>What we like</h4><ul>${it.pros.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
      <div class="cons"><h4>Keep in mind</h4><ul>${it.cons.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
    </div>
    <div class="tipbox">
      <div><h4>Best for</h4><p>${esc(it.bestFor)}</p></div>
      <div><h4>Before you buy</h4><p>${esc(it.tip)}</p></div>
    </div>
    ${altBlock(it.alt, r)}
  </article>`;
}

function findCard(it, r) {
  const p = products[it.id];
  if (!p) throw new Error(`Missing product data for ${it.id}; run tools/refresh-products.mjs`);
  const alt = it.alt && products[it.alt.id] ? (() => { const ap = products[it.alt.id]; return `<div class="alt">
          <a class="ashot" href="${esc(ap.link)}" target="_blank" rel="sponsored nofollow noopener">${productImg(ap, `Product photo of ${it.alt.name} from its Lazada listing`)}</a>
          <div><small>Also consider</small><b>${esc(it.alt.name)}</b><p>${esc(it.alt.note)}</p></div>
          <div class="ap">From around ${peso(ap.price)}<a href="${esc(ap.link)}" target="_blank" rel="sponsored nofollow noopener">View on Lazada</a></div>
        </div>`; })() : '';
  return `<article class="find" data-reveal>
      <a class="shot" href="${esc(p.link)}" target="_blank" rel="sponsored nofollow noopener" aria-label="${esc(it.name)} on Lazada">${productImg(p, `Product photo of ${it.name} from its Lazada listing`)}<span class="src-chip">Lazada listing photo</span></a>
      <div class="fb">
        <h4>${esc(it.name)}</h4>
        <p class="why">${esc(it.summary)}</p>
        <ul>${it.pros.map(x => `<li class="p">${esc(x)}</li>`).join('')}${it.cons.map(x => `<li class="c">${esc(x)}</li>`).join('')}</ul>
        <p class="ftip"><b>Before you buy:</b> ${esc(it.tip)}</p>
        <div class="fbuy">
          <div class="price">From around ${peso(p.price)}<small>Checked ${fmtDate(p.checkedAt)}${p.seller ? ` · ${esc(p.seller.trim())}` : ''}</small></div>
          ${buyLink(p, 'View on Lazada')}
        </div>
        ${alt}
      </div>
    </article>`;
}

function footnotes(g) {
  return `<div class="footnotes">
      <p><sup>1</sup> <strong>About the images:</strong> pictures marked "AI sample render" were generated with AI (Google Gemini) from text descriptions, for inspiration. They show items similar to our picks styled in a room; they are not photos of the actual products and may differ in size, colour and detail. The real product photos come from each product's Lazada listing and are shown unmodified.</p>
      <p><strong>About prices:</strong> prices were checked on ${pricesCheckedOf(g)} and change often, and many listings have several options at different prices. Always check the final price, options and seller details on Lazada before you buy.</p>
    </div>`;
}

function sourcesBlock(g) {
  const list = [...(g.sources || [])];
  if (!list.length) return '';
  return `<section class="sources" id="sources" data-reveal><h2 style="font-size:1.6rem">Sources</h2><ol>${list.map(s => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)}</a></li>`).join('')}</ol></section>`;
}

function related(g, r) {
  const others = guides.filter(x => x.slug !== g.slug).slice(0, 3);
  if (!others.length) return '';
  return `<section class="section tight" style="background:var(--cream-2)">
  <div class="wrap">
    <span class="kicker">Keep browsing</span>
    <h2>More guides you might like</h2>
    ${squiggle()}
    <div class="cards" data-stagger>${others.map(o => guideCard(o, r)).join('')}</div>
  </div>
</section>`;
}

function guideHead(g, r) {
  const n = itemsOf(g).length;
  return `<section class="page-head">
  <div class="wrap">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="${r}index.html">Home</a><span>/</span><a href="${r}guides/">Guides</a><span>/</span><a href="${r}guides/#${g.category}">${esc(CATS[g.category].name)}</a></nav>
    <span class="kicker">${esc(g.kicker)}</span>
    <h1>${esc(g.title)}</h1>
    ${squiggle()}
    <p class="lede">${esc(g.dek)}</p>
    <div class="meta"><span>Updated ${fmtDate(g.updated)}</span><span>${g.readMinutes} min read</span><span>${n} picks</span><span>Prices checked ${pricesCheckedOf(g)}</span></div>
  </div>
</section>
<section class="wrap" style="padding-bottom:12px">
  <figure class="render" data-reveal>
    <div class="frame">${renderImg(r, g.hero.img, g.hero.alt, '(max-width: 1240px) 100vw, 1180px', true)}<span class="ai-chip">AI sample render</span></div>
    ${renderCaption('Sample render made with AI for inspiration. It is not a photo of the actual products; the real product photos from Lazada are below.')}
  </figure>
</section>`;
}

// ---------- pages ----------
function rankedGuide(g) {
  const r = '../';
  const quick = `<div class="quick" data-reveal><h3>The picks at a glance</h3><ol>${g.items.map(it => {
    const p = products[it.id];
    return `<li><a href="#pick-${it.rank}"><span class="n">${it.rank}</span><span class="what"><small>${esc(it.slot)}</small><b>${esc(it.name)}</b></span><span class="p">from ${peso(p.price)}</span></a></li>`;
  }).join('')}</ol></div>`;
  const callouts = g.callouts?.length ? `<div class="callouts" data-stagger>${g.callouts.map(c => `<div class="callout" data-reveal><h3>${esc(c.title)}</h3><p>${esc(c.body)}</p><div class="src">Sources: ${c.sources.map(s => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)}</a>`).join(', ')}</div></div>`).join('')}</div>` : '';
  const sellerNote = g.sellerNote ? `<div class="disclosure" style="border-left-color:var(--mustard)" data-reveal><p><strong>About the sellers:</strong> ${esc(g.sellerNote)}</p></div>` : '';
  const tips = g.tips?.length ? `<section id="tips" style="margin-top:40px" data-reveal><span class="kicker">Stay safe</span><h2 style="font-size:clamp(1.7rem,3vw,2.3rem)">${esc(g.tipsTitle || 'Tips')}</h2><div class="tips-grid">${g.tips.map(t => `<div class="tip-card"><h3>${esc(t.title)}</h3><p>${esc(t.body)}</p><div class="src">Source: <a href="${esc(t.url)}" target="_blank" rel="noopener">${esc(t.source)}</a></div></div>`).join('')}</div></section>` : '';
  const introSources = g.introSources?.length ? `<p class="small muted">Further reading: ${g.introSources.map(s => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)}</a>`).join(' · ')}</p>` : '';
  const toc = `<div class="box toc-box"><h4>In this guide</h4><ol class="toc">${g.items.map(it => `<li><a href="#pick-${it.rank}"><span class="n">${it.rank}</span><span>${esc(it.slot)}</span></a></li>`).join('')}${g.tips?.length ? `<li><a href="#tips"><span class="n">+</span><span>Safety tips</span></a></li>` : ''}<li><a href="#how"><span class="n">?</span><span>How we picked</span></a></li></ol></div>`;
  const body = `${guideHead(g, r)}
<section class="section" style="padding-top:28px">
  <div class="wrap article">
    <div class="main">
      ${shortDisclosure(r)}
      <div style="margin-top:26px">${g.intro.map(p => `<p class="lede" style="max-width:none">${esc(p)}</p>`).join('')}${introSources}</div>
      ${quick}
      ${callouts}
      ${sellerNote}
      <div data-stagger>${g.items.map(it => pickCard(it, g, r)).join('\n')}</div>
      ${tips}
      <div class="method" id="how" data-reveal><h3>How we picked these</h3><p>${esc(g.method)} <a href="${r}about.html">More on how we pick</a>.</p></div>
      ${sourcesBlock(g)}
      ${footnotes(g)}
    </div>
    <aside class="aside">
      ${toc}
      <div class="box"><h4>Good to know</h4><p class="small" style="margin:0">Prices were checked on ${pricesCheckedOf(g)}. They change often, so always check the final price and options on Lazada. Product photos are from each listing and shown unmodified.</p></div>
    </aside>
  </div>
</section>
${related(g, r)}`;
  return layout({ r, title: g.title, description: g.description, canonical: `guides/${g.slug}.html`, og: OG[g.slug], active: 'guides', body, type: 'article' });
}

function stylesGuide(g) {
  const r = '../';
  const jump = `<div class="jumps" data-reveal>${g.sections.map((s, i) => `<a class="btn ghost small" href="#${s.id}">${i + 1}. ${esc(s.short)}</a>`).join('')}</div>`;
  const sections = g.sections.map((s, i) => `<section class="style-sec" id="${s.id}">
    <div class="style-head">
      <div data-reveal>
        <span class="kicker">Style ${i + 1} of ${g.sections.length}</span>
        <h2>${esc(s.name)}</h2>
        ${squiggle()}
        <p class="lede" style="max-width:none">${esc(s.definition)}</p>
        <ol class="tips">${s.tips.map(t => `<li>${esc(t)}</li>`).join('')}</ol>
        ${s.note ? `<p class="note">${esc(s.note)}</p>` : ''}
      </div>
      <figure class="render" data-reveal>
        <div class="frame">${renderImg(r, s.img, s.alt, '(max-width: 920px) 100vw, 600px')}<span class="ai-chip">AI sample render</span></div>
        ${renderCaption('Sample render of the look, made with AI. It shows items similar to our picks, not the actual products. The real finds and their Lazada photos are below.')}
      </figure>
    </div>
    <div class="finds-title"><h3>The real finds for this look</h3></div>
    <div class="finds" data-stagger>${s.items.map(it => findCard(it, r)).join('\n')}</div>
  </section>`).join('\n');
  const body = `${guideHead(g, r)}
<section class="section" style="padding-top:28px">
  <div class="wrap">
    <div class="narrow">
      ${shortDisclosure(r)}
      <div style="margin-top:26px">${g.intro.map(p => `<p class="lede" style="max-width:none">${esc(p)}</p>`).join('')}</div>
      ${jump}
    </div>
    ${sections}
    <div class="narrow">
      <div class="method" id="how" data-reveal><h3>How we picked these</h3><p>${esc(g.method)} <a href="${r}about.html">More on how we pick</a>.</p></div>
      ${sourcesBlock(g)}
      ${footnotes(g)}
    </div>
  </div>
</section>
${related(g, r)}`;
  return layout({ r, title: g.title, description: g.description, canonical: `guides/${g.slug}.html`, og: OG[g.slug], active: 'guides', body, type: 'article' });
}

function homePage() {
  const r = '';
  const count = k => guides.filter(g => catsOf(g).includes(k)).length;
  const catTiles = Object.entries(CATS).map(([k, c]) => {
    const n = count(k);
    return `<a class="cat-tile" href="guides/#${k}" data-reveal>${renderImg(r, c.img, '', '(max-width: 640px) 50vw, (max-width: 1080px) 50vw, 300px')}<span class="count${n ? '' : ' soon'}">${n ? `${n} guide${n > 1 ? 's' : ''}` : 'Coming soon'}</span><span class="label"><b>${esc(c.name)}</b><span>${esc(c.blurb)}</span></span></a>`;
  }).join('\n');
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
      <div class="blob">${renderImg(r, 'hero', 'AI sample render of a lilac ceramic stand in warm sunlight holding a small vase, a dropper bottle, wireless earbuds and a wrapped gift against terracotta tiles', '(max-width: 920px) 100vw, 560px', true)}<span class="ai-chip">AI sample render</span></div>
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
      <p>Each guide starts with real listings and ends with an honest verdict: who a product suits, what to watch out for, and where the research came from.</p>
      <p>New guides are added as our research turns up products worth recommending.</p>
      <a class="link-arrow" href="guides/">See all guides ${ICON.arrow}</a>
    </div>
    <div class="cards" data-stagger>${guides.slice(0, 3).map(g => guideCard(g, r)).join('\n')}</div>
  </div>
</section>

<section class="section tight" style="background:var(--cream-2)">
  <div class="wrap">
    <div data-reveal>
      <span class="kicker">Shop by category</span>
      <h2>What are you shopping for?</h2>
      ${squiggle()}
    </div>
    <div class="cats" data-stagger>${catTiles}</div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div style="margin-bottom:28px;max-width:860px">
      <div data-reveal>
        <span class="kicker">How we pick</span>
        <h2>Four checks before anything makes the list.</h2>
        ${squiggle()}
      </div>
      <p class="lede" data-reveal>Being someone's go-to for recommendations means earning trust one guide at a time. This is the process every pick goes through, and we're open about where the evidence is strong and where it's thin.</p>
    </div>
    <div class="steps" data-stagger>
      <div class="step" data-reveal><h3>Start with real listings</h3><p>We work from Lazada's own product data: current price, stock and how many people have bought recently.</p></div>
      <div class="step" data-reveal><h3>Weed out the risky ones</h3><p>Odd prices, keyword-stuffed names, look-alike stores and recalled model numbers get dropped, even when they sell well.</p></div>
      <div class="step" data-reveal><h3>Read the research</h3><p>Manufacturer specs, independent reviews and safety guidance, cross-checked with AI research assistants (Claude, Gemini and ChatGPT).</p></div>
      <div class="step" data-reveal><h3>Write it straight</h3><p>Pros and cons, who it's for and the sources behind every claim. We never say we tested something we didn't.</p></div>
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
  <div class="t-img">${renderImg(r, 'everyday', 'AI sample render of a sunlit condo kitchen counter with a rattan tray holding a phone on a stand, a cup of coffee and a small plant', '(max-width: 920px) 100vw, 45vw')}<span class="ai-chip">AI sample render</span></div>
  <div class="t-follow" data-reveal>
    <div class="badge">${ring('Good finds · Good finds · Good finds · ', 'ring-follow')}<span class="center">${ICON.tag}</span></div>
    <p style="margin:0;max-width:18em">New finds and room ideas, pinned as we publish them.</p>
    <span class="handle">pinterest.com/samsanclaria2295</span>
    <a class="link-arrow" href="${PINTEREST}" target="_blank" rel="noopener">Follow on Pinterest ${ICON.arrow}</a>
  </div>
</section>`;
  return layout({ r, title: 'Great Finds | Researched product finds for Filipino shoppers', description: 'Great Finds shares researched product finds and buying guides for Filipino shoppers: tech, home and decor, beauty and seasonal picks, with honest pros, cons and sources.', canonical: '', body });
}

function guidesIndex() {
  const r = '../';
  const body = `<section class="page-head">
  <div class="wrap">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="${r}index.html">Home</a><span>/</span><span>Guides</span></nav>
    <span class="kicker">All guides</span>
    <h1>Guides worth bookmarking</h1>
    ${squiggle()}
    <p class="lede">Researched buying guides for Filipino shoppers, with real listings, honest pros and cons, and sources you can check. Filter by category, or start with the newest.</p>
  </div>
</section>
<section class="section" style="padding-top:20px">
  <div class="wrap">
    <div class="filters" role="group" aria-label="Filter guides by category">
      <button type="button" data-cat="all" aria-pressed="true">All</button>
      ${Object.entries(CATS).map(([k, c]) => `<button type="button" data-cat="${k}" aria-pressed="false">${esc(c.name)}</button>`).join('\n      ')}
    </div>
    <div class="cards" data-stagger>${guides.map(g => guideCard(g, r)).join('\n')}</div>
    <div class="empty-note" role="status"><h3 class="serif" style="margin-top:0">Our first <span data-name></span> guide is on the way.</h3><p style="margin:0">We only publish a guide once we've found products we're comfortable recommending. In the meantime, browse the other guides or follow along on <a href="${PINTEREST}" target="_blank" rel="noopener">Pinterest</a>.</p></div>
  </div>
</section>`;
  return layout({ r, title: 'Guides', description: 'All Great Finds buying guides: tech and gadgets, home and decor, beauty and skin care, and seasonal finds for Filipino shoppers.', canonical: 'guides/', active: 'guides', body });
}

function aboutPage() {
  const r = '';
  const body = `<section class="page-head">
  <div class="wrap narrow">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="index.html">Home</a><span>/</span><span>How we pick</span></nav>
    <span class="kicker">About Great Finds</span>
    <h1>How we pick what we recommend</h1>
    ${squiggle()}
    <p class="lede">Great Finds is a small, independent project run by one person in the Philippines. The goal is simple: help Filipino shoppers find products that are actually worth their money, and be honest about the ones that aren't.</p>
  </div>
</section>
<section class="section" style="padding-top:16px">
  <div class="wrap narrow prose">
    <h2 data-reveal>What we cover</h2>
    <p data-reveal>Tech and gadgets, home and decor, beauty and skin care, and seasonal finds like Christmas decor and sale-season picks. The topics come from research into what people are shopping for, and each guide focuses on products available to buyers in the Philippines.</p>

    <h2 data-reveal>The four checks</h2>
    <div class="values" data-stagger>
      <div class="value" data-reveal><h3>1. Real listings first</h3><p>We work from Lazada's affiliate product data: current price, stock and recent purchases. We never copy or scrape Lazada's website.</p></div>
      <div class="value" data-reveal><h3>2. Risky listings out</h3><p>We drop listings with odd prices, brand names stuffed into unrelated products, look-alike store names or recalled model numbers, even when they sell well.</p></div>
      <div class="value" data-reveal><h3>3. Research, with sources</h3><p>We read manufacturer pages, independent reviews and safety guidance, and cross-check our notes with AI research assistants (Claude, Gemini and ChatGPT). Claims link back to their source.</p></div>
      <div class="value" data-reveal><h3>4. Straight talk</h3><p>Every pick gets pros and cons, who it suits and what to check before buying. Where the evidence is thin, we say so on the page.</p></div>
    </div>

    <h2 data-reveal>What we won't do</h2>
    <ul data-reveal>
      <li>Say we tested a product when we haven't. Unless a guide says otherwise, we haven't handled the products ourselves.</li>
      <li>Invent reviews, ratings or testimonials.</li>
      <li>Hide the downsides of a product to make it sound better.</li>
      <li>Show a product photo that's been edited. Product photos come straight from each Lazada listing.</li>
    </ul>

    <h2 data-reveal>How we use AI</h2>
    <p data-reveal>AI helps us research and write faster, but it doesn't replace checking. We use AI research assistants to gather and compare sources, and every claim about a product links to a source you can read yourself. Room and still-life pictures marked "AI sample render" are generated with Google's Gemini image model from text descriptions. They show the overall look with items similar to our picks; they are not photos of the actual products.</p>

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
  <div class="wrap narrow">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="index.html">Home</a><span>/</span><span>Privacy Policy</span></nav>
    <span class="kicker">Legal</span>
    <h1>Privacy Policy</h1>
    ${squiggle()}
    <p class="meta"><span>Effective October 12, 2026</span><span>Last updated October 12, 2026</span></p>
  </div>
</section>
<section class="section" style="padding-top:16px">
  <div class="wrap narrow prose">
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
  <div class="wrap narrow">
    <span class="kicker">Page not found</span>
    <h1>404</h1>
    <p class="lede" style="margin:0 auto 28px">This page may have moved, or the link has a typo. The good finds are still here, though.</p>
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
write('about.html', aboutPage());
write('privacy.html', privacyPage());
write('404.html', notFoundPage());

const urls = ['', 'guides/', ...guides.map(g => `guides/${g.slug}.html`), 'about.html', 'privacy.html'];
const lastmod = new Date().toISOString().slice(0, 10);
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${BASE_URL}${u}</loc><lastmod>${lastmod}</lastmod></url>`).join('\n')}\n</urlset>\n`);
write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${BASE_URL}sitemap.xml\n`);
