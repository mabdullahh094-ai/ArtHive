import argparse
import csv
from pathlib import Path

BASE_DATASET = Path("data/image_price_dataset.csv")
FEEDBACK_DATASET = Path("data/price_feedback.csv")
OUT_DATASET = Path("data/image_price_dataset_with_feedback.csv")


def read_csv_rows(path: Path):
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def main(base_csv: Path, feedback_csv: Path, out_csv: Path):
    base_rows = read_csv_rows(base_csv)
    feedback_rows = read_csv_rows(feedback_csv)

    merged = []
    merged.extend(base_rows)

    # Only feedback entries with usable local image path can be reused in retraining.
    for row in feedback_rows:
        image_path = (row.get("image_path") or "").strip()
        final_price = (row.get("final_price_pkr") or "").strip()

        if not image_path or not final_price:
            continue

        p = Path(image_path)
        if not p.exists():
            continue

        merged.append(
            {
                "product_id": row.get("product_id") or f"feedback_{row.get('request_id', '')}",
                "name": "feedback_override",
                "price_pkr": final_price,
                "image_url": row.get("image_url") or "",
                "image_path": p.as_posix(),
            }
        )

    out_csv.parent.mkdir(parents=True, exist_ok=True)
    with out_csv.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=["product_id", "name", "price_pkr", "image_url", "image_path"],
        )
        writer.writeheader()
        writer.writerows(merged)

    print(f"Base rows: {len(base_rows)}")
    print(f"Feedback rows: {len(feedback_rows)}")
    print(f"Merged rows: {len(merged)}")
    print(f"Saved: {out_csv}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Merge manual feedback for retraining")
    parser.add_argument("--base-csv", default=str(BASE_DATASET))
    parser.add_argument("--feedback-csv", default=str(FEEDBACK_DATASET))
    parser.add_argument("--out-csv", default=str(OUT_DATASET))
    args = parser.parse_args()

    main(Path(args.base_csv), Path(args.feedback_csv), Path(args.out_csv))
