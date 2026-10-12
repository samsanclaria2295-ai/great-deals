// Minimal signed client for the Lazada PH affiliate Open API.
// Keys come from environment variables, or from a local .env file whose path is in GF_ENV.
// Never commit keys; this file holds no secrets.
import crypto from 'node:crypto';
import fs from 'node:fs';

const GATEWAY = 'https://api.lazada.com.ph/rest';

function loadEnv() {
  const env = { ...process.env };
  const file = process.env.GF_ENV;
  if (file && fs.existsSync(file)) {
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (m && !env[m[1]]) env[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, '');
    }
  }
  return env;
}

const env = loadEnv();
const KEY = env.LAZADA_APP_KEY;
const SECRET = env.LAZADA_APP_SECRET;
const TOKEN = env.LAZADA_USER_TOKEN || env.LAZADAA_USER_TOKEN;

export async function call(path, biz = {}, { method = 'POST', withToken = true } = {}) {
  if (!KEY || !SECRET || (withToken && !TOKEN)) throw new Error('Lazada keys missing (set GF_ENV to the .env path)');
  if (withToken) biz = { userToken: TOKEN, ...biz };
  for (let attempt = 0; attempt < 5; attempt++) {
    const p = { app_key: KEY, sign_method: 'sha256', timestamp: String(Date.now()) };
    for (const [k, v] of Object.entries(biz)) if (v !== undefined && v !== null) p[k] = String(v);
    const payload = path + Object.keys(p).sort().map(k => k + p[k]).join('');
    p.sign = crypto.createHmac('sha256', SECRET).update(payload).digest('hex').toUpperCase();
    const res = method === 'GET'
      ? await fetch(`${GATEWAY}${path}?${new URLSearchParams(p)}`)
      : await fetch(GATEWAY + path, { method: 'POST', body: new URLSearchParams(p) });
    const j = await res.json();
    if (String(j.code) === '0') return j;
    if (['ApiCallLimit', 'ServiceTimeout'].includes(j.code)) { await new Promise(r => setTimeout(r, 1500 * (attempt + 1))); continue; }
    throw new Error(`${path}: ${j.code} ${j.message}`);
  }
  throw new Error(`${path}: gave up after retries`);
}

/** Affiliate-feed data for up to 20 product IDs per call. */
export async function products(ids) {
  const out = {};
  for (let i = 0; i < ids.length; i += 20) {
    const chunk = ids.slice(i, i + 20).map(Number);
    const j = await call('/marketing/product/feed', { offerType: 1, page: 1, limit: 50, productIds: JSON.stringify(chunk) });
    for (const x of j.result?.data || []) out[String(x.productId)] = x;
  }
  return out;
}

/** Affiliate links tagged subId1=website, subId2=<page slug>. */
export async function links(ids, slug) {
  const out = {};
  for (let i = 0; i < ids.length; i += 20) {
    const j = await call('/marketing/getlink', { inputType: 'productId', inputValue: ids.slice(i, i + 20).join(','), subId1: 'website', subId2: slug });
    for (const x of j.result?.data?.productBatchGetLinkInfoList || []) out[String(x.productId)] = x.regularPromotionLink;
  }
  return out;
}
