"""One-off connection test for the Lazada PH affiliate API.

Prints only non-secret facts (counts, field names, error codes) because
Actions logs on a public repo are public. Writes a short summary to the
GitHub Actions job summary when available.
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import lazada_api as lz  # noqa: E402

lines = []


def out(msg=""):
    print(msg)
    lines.append(msg)


def section(title):
    out("")
    out(f"## {title}")


def first_items(data):
    result = data.get("result") or data.get("data") or {}
    if isinstance(result, dict):
        items = result.get("data") or result.get("products") or []
    else:
        items = result
    return items if isinstance(items, list) else []


ok = True

# 1. Category tree (public; helps pick categoryL1 IDs)
section("1. Category tree")
try:
    tree = lz.category_tree()
    cats = tree.get("data") or []
    out(f"OK: {len(cats)} top-level categories")
    for c in cats:
        name = c.get("name", "")
        if any(w in name.lower() for w in ("home", "kitchen", "appliance", "living")):
            out(f"- {name}: {c.get('category_id')}")
except Exception as e:  # noqa: BLE001
    out(f"FAILED: {e}")

# 2. Product feed at several page sizes
section("2. Product feed (/marketing/product/feed)")
sample_ids = []
for limit in (20, 50, 100):
    try:
        data = lz.product_feed(page=1, limit=limit)
        items = first_items(data)
        out(f"limit={limit}: OK, {len(items)} items")
        if items and not sample_ids:
            first = items[0]
            out(f"fields: {', '.join(sorted(first.keys()))}")
            for it in items[:3]:
                out(
                    f"- {str(it.get('productName', ''))[:60]} | price {it.get('discountPrice')} {it.get('currency', '')}"
                    f" | commission {it.get('totalCommissionRate')} | sales7d {it.get('sales7d')}"
                )
            sample_ids = [it.get("productId") for it in items[:2] if it.get("productId")]
    except Exception as e:  # noqa: BLE001
        ok = False
        out(f"limit={limit}: FAILED: {e}")
        break

# 3. Affiliate links with a sub ID
section("3. Affiliate links (/marketing/getlink)")
if sample_ids:
    try:
        data = lz.get_links(sample_ids, sub_id1="test")
        result = (data.get("result") or {}).get("data") or {}
        links = result.get("product_batch_get_link_info_list") or []
        errors = result.get("error_info_list") or []
        out(f"OK: {len(links)} links, {len(errors)} errors")
        for l in links:
            link = l.get("regular_promotion_link") or ""
            out(f"- product {l.get('product_id')}: link {'present' if link else 'missing'} ({link[:30]}...)")
        for e in errors:
            out(f"- error {e.get('error_code')}: {e.get('error_msg')}")
    except Exception as e:  # noqa: BLE001
        ok = False
        out(f"FAILED: {e}")
else:
    out("Skipped (no products from feed)")

summary = os.environ.get("GITHUB_STEP_SUMMARY")
if summary:
    with open(summary, "a", encoding="utf-8") as f:
        f.write("# Lazada API connection test\n" + "\n".join(lines) + "\n")

os.makedirs("test-output", exist_ok=True)
with open("test-output/lazada_test.json", "w", encoding="utf-8") as f:
    json.dump({"ok": ok, "log": lines}, f, indent=1)

sys.exit(0 if ok else 1)
