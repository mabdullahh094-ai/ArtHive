import csv
import html
import json
import re
from pathlib import Path

import requests

BASE_URL = "https://artreserves.com"
API_URL = f"{BASE_URL}/wp-json/wc/store/v1/products"
OUT_DIR = Path("data")
OUT_CSV = OUT_DIR / "artreserves_artwork_dataset.csv"
OUT_ARTWORK_CSV = OUT_DIR / "artreserves_artwork_only_for_model.csv"
OUT_JSON = OUT_DIR / "artreserves_products_raw.json"


def strip_html(text: str) -> str:
    if not text:
        return ""
    no_tags = re.sub(r"<[^>]+>", " ", text)
    no_space = re.sub(r"\s+", " ", no_tags).strip()
    return html.unescape(no_space)


def parse_price(value: str):
    if value is None or value == "":
        return None
    try:
        # WooCommerce Store API returns minor units (e.g. PKR 500000 => 5000.00)
        return int(value) / 100.0
    except Exception:
        return None


def parse_dimensions(text: str):
    if not text:
        return None, None, None, None

    # Common forms: "24 x 36 INCHES", "18.5x24.5 inches", "8 X 8 X 36 INCHES"
    pattern = re.compile(
        r"(\d+(?:\.\d+)?)\s*[xX×]\s*(\d+(?:\.\d+)?)(?:\s*[xX×]\s*(\d+(?:\.\d+)?))?\s*(?:INCHES|INCH|CM)?",
        re.IGNORECASE,
    )
    m = pattern.search(text)
    if not m:
        return None, None, None, None

    w = float(m.group(1))
    h = float(m.group(2))
    d = float(m.group(3)) if m.group(3) else None
    area = w * h if w and h else None
    return w, h, d, area


def extract_artist_medium(full_text: str):
    artist = None
    medium = None

    artist_m = re.search(r"ARTIST\s*:\s*([^\n\r\.]+)", full_text, re.IGNORECASE)
    if artist_m:
        artist = artist_m.group(1).strip(" -")

    medium_m = re.search(r"MEDIUM\s*:\s*([^\n\r\.]+)", full_text, re.IGNORECASE)
    if medium_m:
        medium = medium_m.group(1).strip(" -")

    return artist, medium


def is_artwork_product(categories, tags, name: str):
    text = " ".join(categories + tags + [name.lower()])
    non_art_keywords = ["acrylic color", "paint", "brush", "tube", "ml"]
    return not any(k in text for k in non_art_keywords)


def fetch_all_products():
    page = 1
    per_page = 100
    all_items = []

    while True:
        resp = requests.get(API_URL, params={"page": page, "per_page": per_page}, timeout=40)
        if resp.status_code == 400:
            break
        resp.raise_for_status()
        items = resp.json()
        if not items:
            break
        all_items.extend(items)
        print(f"Fetched page {page}: {len(items)} items")
        page += 1

    return all_items


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    products = fetch_all_products()
    print(f"Total fetched products: {len(products)}")

    with OUT_JSON.open("w", encoding="utf-8") as jf:
        json.dump(products, jf, ensure_ascii=False, indent=2)

    rows = []
    for p in products:
        prices = p.get("prices", {})
        short_desc = strip_html(p.get("short_description", ""))
        desc = strip_html(p.get("description", ""))
        full_text = " ".join([short_desc, desc, p.get("name", "")])

        width, height, depth, area = parse_dimensions(full_text)
        artist, medium = extract_artist_medium(full_text)

        categories = [c.get("name", "").strip() for c in p.get("categories", []) if c.get("name")]
        tags = [t.get("name", "").strip() for t in p.get("tags", []) if t.get("name")]

        row = {
            "product_id": p.get("id"),
            "sku": p.get("sku"),
            "name": p.get("name"),
            "slug": p.get("slug"),
            "permalink": p.get("permalink"),
            "currency": prices.get("currency_code"),
            "price_pkr": parse_price(prices.get("price")),
            "regular_price_pkr": parse_price(prices.get("regular_price")),
            "sale_price_pkr": parse_price(prices.get("sale_price")),
            "on_sale": p.get("on_sale"),
            "is_in_stock": p.get("is_in_stock"),
            "is_purchasable": p.get("is_purchasable"),
            "low_stock_remaining": p.get("low_stock_remaining"),
            "average_rating": p.get("average_rating"),
            "review_count": p.get("review_count"),
            "category_list": "|".join(categories),
            "primary_category": categories[0] if categories else None,
            "tag_list": "|".join(tags),
            "primary_tag": tags[0] if tags else None,
            "artist": artist,
            "medium": medium,
            "size_text": short_desc,
            "description_text": desc,
            "width": width,
            "height": height,
            "depth": depth,
            "area_2d": area,
            "title_length": len((p.get("name") or "").strip()),
            "description_length": len(desc),
            "is_artwork_estimate": is_artwork_product(categories, tags, (p.get("name") or "").lower()),
        }
        rows.append(row)

    # Keep rows with valid target value (price) for price prediction
    rows = [r for r in rows if r["price_pkr"] is not None and r["price_pkr"] > 0]
    artwork_rows = [r for r in rows if r["is_artwork_estimate"]]

    fieldnames = list(rows[0].keys()) if rows else []
    with OUT_CSV.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    with OUT_ARTWORK_CSV.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(artwork_rows)

    print(f"Saved CSV: {OUT_CSV} ({len(rows)} rows)")
    print(f"Saved Artwork CSV: {OUT_ARTWORK_CSV} ({len(artwork_rows)} rows)")
    print(f"Saved raw JSON: {OUT_JSON}")


if __name__ == "__main__":
    main()
