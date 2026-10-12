"""Minimal Lazada Open Platform client for the PH affiliate APIs.

Credentials come from environment variables (GitHub Actions secrets):
  LAZADA_APP_KEY, LAZADA_APP_SECRET, LAZADA_USER_TOKEN
(LAZADAA_USER_TOKEN is accepted as a fallback spelling.)

Signing (Lazada docs): sort all params except `sign` by name, concatenate
key+value, prefix the API path, HMAC-SHA256 with the app secret, uppercase hex.
Never print request params: they contain the user token and signature.
"""
import hashlib
import hmac
import os
import time

import requests

GATEWAY = os.environ.get("LAZADA_GATEWAY", "https://api.lazada.com.ph/rest")


class LazadaError(RuntimeError):
    """Raised when the API returns a non-zero code. Safe to print (no secrets)."""

    def __init__(self, path, resp):
        self.path = path
        self.code = resp.get("code")
        self.type = resp.get("type")
        self.message = resp.get("message")
        self.request_id = resp.get("request_id")
        super().__init__(f"{path}: code={self.code} type={self.type} message={self.message} request_id={self.request_id}")


def _env(name, *fallbacks):
    for key in (name, *fallbacks):
        val = os.environ.get(key)
        if val:
            return val.strip()
    raise SystemExit(f"Missing environment variable {name}")


def credentials():
    return (
        _env("LAZADA_APP_KEY"),
        _env("LAZADA_APP_SECRET"),
        _env("LAZADA_USER_TOKEN", "LAZADAA_USER_TOKEN"),
    )


def sign(path, params, secret):
    payload = path + "".join(f"{k}{params[k]}" for k in sorted(params))
    return hmac.new(secret.encode("utf-8"), payload.encode("utf-8"), hashlib.sha256).hexdigest().upper()


def call(path, biz=None, retries=3, with_user_token=True):
    """Call a Lazada API path with business params `biz`. Returns the parsed JSON."""
    app_key, secret, user_token = credentials()
    biz = dict(biz or {})
    if with_user_token:
        biz.setdefault("userToken", user_token)
    for attempt in range(retries + 1):
        params = {
            "app_key": app_key,
            "sign_method": "sha256",
            "timestamp": str(int(time.time() * 1000)),
            **{k: str(v) for k, v in biz.items() if v is not None},
        }
        params["sign"] = sign(path, params, secret)
        resp = requests.post(GATEWAY + path, data=params, timeout=30)
        try:
            data = resp.json()
        except ValueError:
            raise RuntimeError(f"{path}: HTTP {resp.status_code}, non-JSON response")
        if str(data.get("code")) == "0":
            return data
        if data.get("code") == "ApiCallLimit" and attempt < retries:
            time.sleep(1.5 * (attempt + 1))
            continue
        raise LazadaError(path, data)


def product_feed(page=1, limit=20, offer_type=1, category_l1=None, product_ids=None):
    return call("/marketing/product/feed", {
        "offerType": offer_type,
        "page": page,
        "limit": limit,
        "categoryL1": category_l1,
        "productIds": ",".join(map(str, product_ids)) if product_ids else None,
    })


def get_links(product_ids, sub_id1=None, sub_id2=None):
    return call("/marketing/getlink", {
        "inputType": "productId",
        "inputValue": ",".join(map(str, product_ids)),
        "subId1": sub_id1,
        "subId2": sub_id2,
    })


def category_tree(language_code="en_US"):
    return call("/category/tree/get", {"language_code": language_code}, with_user_token=False)
