# Great Finds

Automated, honest deal picks and buying guides for Filipino shoppers.

## Layout

- `site/`: the public website (static HTML). Hosted on Cloudflare Pages (or GitHub Pages).
- `scripts/`: Python scripts run by GitHub Actions (Lazada affiliate API client, tests, and later the fetch and publish steps).
- `.github/workflows/`: GitHub Actions workflows.

## Secrets

All keys live in **Settings → Secrets and variables → Actions**. Never commit `.env` or any key file (blocked by `.gitignore`).

| Secret | Used for |
|---|---|
| `LAZADA_APP_KEY` | Lazada Open Platform app key |
| `LAZADA_APP_SECRET` | Lazada Open Platform app secret |
| `LAZADA_USER_TOKEN` | Lazada affiliate user token |

## Running the Lazada connection test

Go to **Actions → Lazada API test → Run workflow**. The job summary shows how many categories, products and links came back. It never prints keys or tokens, because Actions logs on a public repo are public.
