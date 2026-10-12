"""One-off connection test for the Lazada PH affiliate API.

Prints only non-secret facts (counts, field names, error codes) because
Actions logs on a public repo are public. Key results are also emitted as
workflow annotations so they show on the run page.
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import lazada_api as lz  # noqa: E402

lines, notices = [], []


def out(msg=""):
    print(msg)
    lines.append(msg)


def note(msg):
    out(msg)
    notices.append(msg)


def items_of(data):
    result = data.get("result") or data.get("data") or {}
    if isinstance(result, dict):
        items = result.get("data") or result.get("products") or []
    else:
        items = result
    return items if isinstance(items, list) else []


ok = True

# 1. Category tree (helps pick categoryL1 IDs)
try:
    cats = lz.category_tree().get("data") or []
    picks = [f"{c.get('name')}={c.get('category_id')}" for c in cats
             if any(w in str(c.get("name", "")).lower() for w in ("home", "kitchen", "appliance", "living"))]
    note(f"Categories OK: {len(cats)} top-level. Home/kitchen: {'; '.join(picks) or 'none matched'}")
except Exception as e:  # noqa: BLE001
    note(f"Categories FAILED: {e}")

# 2. Product feed at several page sizes
sample_ids = []
for limit in (20, 50, 100):
    try:
        items = items_of(lz.product_feed(page=1, limit=limit))
        note(f"Feed limit={limit}: OK, {len(items)} items")
        if items and not sample_ids:
            note("Feed fields: " + ", ".join(sorted(items[0].keys()))[:900])
            sample = " | ".join(
                f"{str(it.get('productName', ''))[:30]} {it.get('currency')} {it.get('discountPrice')} cat {it.get('categoryL1')} comm {it.get('totalCommissionRate')} 7d {it.get('sales7d')} stock {it.get('stock')}"
                for it in items[:3])
            note("Feed sample: " + sample)
            sample_ids = [it.get("productId") for it in items[:2] if it.get("productId")]
    except Exception as e:  # noqa: BLE001
        ok = False
        note(f"Feed limit={limit} FAILED: {e}")
        break

# 3. Affiliate links with a sub ID
if sample_ids:
    try:
        raw = lz.get_links(sample_ids, sub_id1="test")
        res = raw.get("result")
        shape = f"top keys {sorted(raw.keys())}; result type {type(res).__name__}"
        if isinstance(res, dict):
            shape += f" keys {sorted(res.keys())}"
            if isinstance(res.get('data'), dict):
                shape += f"; data keys {sorted(res['data'].keys())}"
        note("Links response shape: " + shape)
        result = (res or {}).get("data") or {} if isinstance(res, dict) else {}
        links = result.get("product_batch_get_link_info_list") or []
        errors = result.get("error_info_list") or []
        have = sum(1 for l in links if l.get("regular_promotion_link"))
        prefix = (links[0].get("regular_promotion_link") or "")[:28] if links else ""
        note(f"Links OK: {have}/{len(sample_ids)} links (format {prefix}...), {len(errors)} errors "
             + "; ".join(f"{e.get('error_code')} {e.get('error_msg')}" for e in errors))
    except Exception as e:  # noqa: BLE001
        ok = False
        note(f"Links FAILED: {e}")
else:
    note("Links skipped: no products from feed")

for msg in notices[:10]:
    print(f"::notice title=Lazada test::{msg}")

summary = os.environ.get("GITHUB_STEP_SUMMARY")
if summary:
    with open(summary, "a", encoding="utf-8") as f:
        f.write("# Lazada API connection test\n\n" + "\n\n".join(lines) + "\n")

os.makedirs("test-output", exist_ok=True)
with open("test-output/lazada_test.json", "w", encoding="utf-8") as f:
    json.dump({"ok": ok, "log": lines}, f, indent=1)

sys.exit(0 if ok else 1)
