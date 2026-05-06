import csv
import json
import re
import argparse
from pathlib import Path
from urllib.parse import urlparse

import requests

RAW_JSON = Path("data/artreserves_products_raw.json")
OUT_CSV = Path("data/image_price_dataset.csv")
IMAGES_DIR = Path("data/images")


def parse_price_pkr(minor_units: str):
    if not minor_units:
        return None
    try:
        return int(minor_units) / 100.0
    except (TypeError, ValueError):
        return None


def is_artwork_product(categories, tags, name: str):
    text = " ".join(categories + tags + [name.lower()])
    non_art_keywords = ["acrylic color", "paint", "brush", "tube", "ml"]
    return not any(k in text for k in non_art_keywords)


def safe_ext_from_url(url: str):
    path = urlparse(url).path.lower()
    if path.endswith(".png"):
        return ".png"
    if path.endswith(".webp"):
        return ".webp"
    if path.endswith(".jpeg"):
        return ".jpeg"
    if path.endswith(".jpg"):
        return ".jpg"
    return ".jpg"


def sanitize_filename(s: str):
    return re.sub(r"[^a-zA-Z0-9_-]", "_", s)


def download_image(url: str, out_path: Path, timeout: int = 30):
    out_path.parent.mkdir(parents=True, exist_ok=True)
    if out_path.exists() and out_path.stat().st_size > 0:
        return True

    try:
        resp = requests.get(url, timeout=timeout)
        resp.raise_for_status()
        out_path.write_bytes(resp.content)
        return True
    except Exception:
        return False


def parse_args():
    parser = argparse.ArgumentParser(description="Prepare image-price dataset for artwork model")
    parser.add_argument("--max-samples", type=int, default=0, help="Limit rows for a quick run (0 = all)")
    parser.add_argument(
        "--skip-download",
        action="store_true",
        help="Only build CSV entries for already-downloaded images",
    )
    return parser.parse_args()


def main(args):
    if not RAW_JSON.exists():
        raise FileNotFoundError(f"Raw JSON not found: {RAW_JSON}")

    data = json.loads(RAW_JSON.read_text(encoding="utf-8"))
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    OUT_CSV.parent.mkdir(parents=True, exist_ok=True)

    rows = []
    downloaded = 0
    skipped = 0

    for idx, item in enumerate(data, start=1):
        prices = item.get("prices", {})
        price_pkr = parse_price_pkr(prices.get("price"))
        if not price_pkr or price_pkr <= 0:
            skipped += 1
            continue

        categories = [c.get("name", "").strip().lower() for c in item.get("categories", []) if c.get("name")]
        tags = [t.get("name", "").strip().lower() for t in item.get("tags", []) if t.get("name")]
        name = (item.get("name") or "").strip()

        if not is_artwork_product(categories, tags, name):
            skipped += 1
            continue

        images = item.get("images") or []
        if not images:
            skipped += 1
            continue

        image_url = images[0].get("src")
        if not image_url:
            skipped += 1
            continue

        product_id = item.get("id")
        slug = sanitize_filename(item.get("slug") or str(product_id))
        ext = safe_ext_from_url(image_url)
        image_path = IMAGES_DIR / f"{product_id}_{slug}{ext}"

        ok = True
        if not args.skip_download:
            ok = download_image(image_url, image_path)
        elif not image_path.exists():
            ok = False

        if not ok:
            skipped += 1
            continue

        downloaded += 1
        rows.append(
            {
                "product_id": product_id,
                "name": name,
                "price_pkr": price_pkr,
                "image_url": image_url,
                "image_path": image_path.as_posix(),
            }
        )

        if idx % 50 == 0:
            print(f"Processed {idx}/{len(data)} | kept={len(rows)} | skipped={skipped}", flush=True)

        if args.max_samples > 0 and len(rows) >= args.max_samples:
            break

    with OUT_CSV.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f, fieldnames=["product_id", "name", "price_pkr", "image_url", "image_path"]
        )
        writer.writeheader()
        writer.writerows(rows)

    print(f"Saved: {OUT_CSV} ({len(rows)} rows)")
    print(f"Downloaded images: {downloaded}")
    print(f"Skipped items: {skipped}")


if __name__ == "__main__":
    args = parse_args()
    main(args)
