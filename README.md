# Great Finds

Automated, honest deal picks and buying guides for Filipino shoppers.

## Layout

- `site/`: the public website (static HTML, built output plus `assets/`). Published to GitHub Pages on every push to `main` that touches `site/`.
- `src/guides/*.json`: guide content (copy, picks, pros and cons, sources). One file per guide.
- `src/data/products.json`: product data and affiliate links from the Lazada affiliate API (no sales or commission data).
- `tools/`: Node scripts (no dependencies):
  - `build.mjs` builds every page in `site/` from `src/`. Run `node tools/build.mjs`.
  - `refresh-products.mjs` refreshes prices, photos and affiliate links (`subId1=website`, `subId2=<guide slug>`) from the Lazada API. Needs the keys: set `GF_ENV` to the path of a local `.env`, then run it. Never commit keys.
  - `serve.mjs` previews the site at http://localhost:8000/great-deals/.
- `scripts/`: Python scripts run by GitHub Actions (Lazada affiliate API client and tests).
- `.github/workflows/`: GitHub Actions workflows.

## Adding or updating a guide

1. Add or edit `src/guides/<slug>.json` (copy an existing guide; `type` is `ranked` or `styles`).
2. `node tools/refresh-products.mjs` (with `GF_ENV` set) to fetch product data and affiliate links.
3. `node tools/build.mjs`, then preview with `node tools/serve.mjs`.
4. Commit `src/` and `site/` together.

AI scene images live in `site/assets/img/` and are made from text prompts only. Product photos are never edited; pages load them straight from the Lazada image URLs the API returns.

## Secrets

All keys live in **Settings → Secrets and variables → Actions**. Never commit `.env` or any key file (blocked by `.gitignore`).

| Secret | Used for |
|---|---|
| `LAZADA_APP_KEY` | Lazada Open Platform app key |
| `LAZADA_APP_SECRET` | Lazada Open Platform app secret |
| `LAZADA_USER_TOKEN` | Lazada affiliate user token |

## Running the Lazada connection test

Go to **Actions → Lazada API test → Run workflow**. The job summary shows how many categories, products and links came back. It never prints keys or tokens, because Actions logs on a public repo are public.
