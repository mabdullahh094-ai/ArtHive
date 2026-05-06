import argparse
import csv
import json
import math
import random
from pathlib import Path

import torch
import torch.nn as nn
from PIL import Image
from torch.utils.data import DataLoader, Dataset
from torchvision import models, transforms


class ArtworkPriceImageDataset(Dataset):
    def __init__(self, rows, transform):
        self.rows = rows
        self.transform = transform

    def __len__(self):
        return len(self.rows)

    def __getitem__(self, idx):
        row = self.rows[idx]
        img = Image.open(row["image_path"]).convert("RGB")
        x = self.transform(img)

        # Log-scale target stabilizes training for wide PKR price ranges.
        y = math.log1p(float(row["price_pkr"]))
        y = torch.tensor([y], dtype=torch.float32)
        return x, y


def read_rows(csv_path: Path):
    rows = []
    with csv_path.open("r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            p = Path(row["image_path"])
            if p.exists() and row.get("price_pkr"):
                rows.append({"image_path": p, "price_pkr": float(row["price_pkr"])})
    return rows


def split_rows(rows, val_ratio=0.2, seed=42):
    rng = random.Random(seed)
    rows = rows[:]
    rng.shuffle(rows)
    n_val = max(1, int(len(rows) * val_ratio))
    return rows[n_val:], rows[:n_val]


def make_model():
    weights = models.EfficientNet_B0_Weights.DEFAULT
    model = models.efficientnet_b0(weights=weights)
    in_features = model.classifier[1].in_features
    model.classifier[1] = nn.Linear(in_features, 1)
    return model


def evaluate(model, loader, device):
    model.eval()
    mae = 0.0
    count = 0

    with torch.no_grad():
        for x, y_log in loader:
            x = x.to(device)
            y_log = y_log.to(device)

            pred_log = model(x)
            pred = torch.expm1(pred_log).clamp(min=0.0)
            y = torch.expm1(y_log).clamp(min=0.0)

            mae += torch.abs(pred - y).sum().item()
            count += y.shape[0]

    return mae / max(1, count)


def train(args):
    csv_path = Path(args.csv)
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    all_rows = read_rows(csv_path)
    if len(all_rows) < 20:
        raise ValueError("Dataset too small. Need at least 20 image rows.")

    train_rows, val_rows = split_rows(all_rows, val_ratio=args.val_ratio, seed=args.seed)

    train_tf = transforms.Compose(
        [
            transforms.Resize((256, 256)),
            transforms.RandomResizedCrop(224, scale=(0.75, 1.0)),
            transforms.RandomHorizontalFlip(p=0.5),
            transforms.ColorJitter(brightness=0.15, contrast=0.15, saturation=0.15),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        ]
    )

    val_tf = transforms.Compose(
        [
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        ]
    )

    train_ds = ArtworkPriceImageDataset(train_rows, train_tf)
    val_ds = ArtworkPriceImageDataset(val_rows, val_tf)

    train_loader = DataLoader(train_ds, batch_size=args.batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_ds, batch_size=args.batch_size, shuffle=False, num_workers=0)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = make_model().to(device)

    criterion = nn.MSELoss()
    optimizer = torch.optim.AdamW(
        model.parameters(),
        lr=args.lr,
        weight_decay=args.weight_decay,
    )
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
        optimizer,
        mode="min",
        factor=0.5,
        patience=args.lr_patience,
        min_lr=args.min_lr,
    )

    best_mae = float("inf")
    no_improve_epochs = 0
    best_path = out_dir / "best_model.pt"

    for epoch in range(1, args.epochs + 1):
        model.train()
        total_loss = 0.0

        for x, y in train_loader:
            x = x.to(device)
            y = y.to(device)

            optimizer.zero_grad()
            pred = model(x)
            loss = criterion(pred, y)
            loss.backward()
            optimizer.step()

            total_loss += loss.item() * x.shape[0]

        train_loss = total_loss / len(train_ds)
        val_mae = evaluate(model, val_loader, device)
        scheduler.step(val_mae)
        current_lr = optimizer.param_groups[0]["lr"]

        print(
            f"Epoch {epoch:02d} | train_loss={train_loss:.4f} | val_mae_pkr={val_mae:.2f} | lr={current_lr:.6f}"
        )

        if val_mae < (best_mae - args.min_delta):
            best_mae = val_mae
            no_improve_epochs = 0
            torch.save(
                {
                    "model_state_dict": model.state_dict(),
                    "arch": "efficientnet_b0",
                    "img_size": 224,
                    "best_val_mae_pkr": best_mae,
                },
                best_path,
            )
        else:
            no_improve_epochs += 1

        if no_improve_epochs >= args.early_stop_patience:
            print(
                f"Early stopping at epoch {epoch} after {no_improve_epochs} non-improving epochs"
            )
            break

    metrics = {
        "best_val_mae_pkr": best_mae,
        "train_rows": len(train_rows),
        "val_rows": len(val_rows),
        "epochs": args.epochs,
        "batch_size": args.batch_size,
        "lr": args.lr,
        "weight_decay": args.weight_decay,
        "early_stop_patience": args.early_stop_patience,
        "min_delta": args.min_delta,
    }

    metrics_path = out_dir / "metrics.json"
    metrics_path.write_text(json.dumps(metrics, indent=2), encoding="utf-8")

    print(f"Best model saved at: {best_path}")
    print(f"Metrics saved at: {metrics_path}")


def parse_args():
    p = argparse.ArgumentParser(description="Train image-only artwork price predictor")
    p.add_argument("--csv", default="data/image_price_dataset.csv")
    p.add_argument("--out-dir", default="models/image_price_regressor")
    p.add_argument("--epochs", type=int, default=12)
    p.add_argument("--batch-size", type=int, default=16)
    p.add_argument("--lr", type=float, default=1e-4)
    p.add_argument("--weight-decay", type=float, default=1e-4)
    p.add_argument("--lr-patience", type=int, default=2)
    p.add_argument("--min-lr", type=float, default=1e-6)
    p.add_argument("--early-stop-patience", type=int, default=4)
    p.add_argument("--min-delta", type=float, default=25.0)
    p.add_argument("--val-ratio", type=float, default=0.2)
    p.add_argument("--seed", type=int, default=42)
    return p.parse_args()


if __name__ == "__main__":
    args = parse_args()
    train(args)
