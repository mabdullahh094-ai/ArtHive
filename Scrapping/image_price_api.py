from io import BytesIO
import csv
import json
import math
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import torch
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from PIL import Image
from torchvision import models, transforms

PRIMARY_MODEL_PATH = Path("models/image_price_regressor_feedback/best_model.pt")
FALLBACK_MODEL_PATH = Path("models/image_price_regressor/best_model.pt")
METRICS_PATH = Path("models/image_price_regressor/metrics.json")
FEEDBACK_PATH = Path("data/price_feedback.csv")
PRIMARY_DATASET_PATH = Path("data/image_price_dataset_with_feedback.csv")
FALLBACK_DATASET_PATH = Path("data/image_price_dataset.csv")

app = FastAPI(title="Artwork Image Price Predictor", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def load_model(model_path: Path, device: torch.device):
    if not model_path.exists():
        raise FileNotFoundError(f"Model not found: {model_path}")

    checkpoint = torch.load(model_path, map_location=device)
    model = models.efficientnet_b0(weights=None)
    in_features = model.classifier[1].in_features
    model.classifier[1] = torch.nn.Linear(in_features, 1)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.to(device)
    model.eval()
    return model


def preprocess_image_bytes(image_bytes: bytes):
    image = Image.open(BytesIO(image_bytes)).convert("RGB")
    tf = transforms.Compose(
        [
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        ]
    )
    return tf(image).unsqueeze(0)


DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
MODEL = None
ABS_ERROR_MARGIN = 15000.0
PRICE_STATS = {"median": 15000.0, "p10": 3000.0, "p90": 80000.0}


class PriceFeedback(BaseModel):
    request_id: str = Field(..., description="Request ID returned by /predict-price")
    predicted_price_pkr: float = Field(..., gt=0)
    final_price_pkr: float = Field(..., gt=0)
    artist_id: Optional[str] = None
    product_id: Optional[str] = None
    image_path: Optional[str] = None
    image_url: Optional[str] = None
    notes: Optional[str] = None


def load_error_margin(default_margin: float = 15000.0):
    if not METRICS_PATH.exists():
        return default_margin

    try:
        metrics = json.loads(METRICS_PATH.read_text(encoding="utf-8"))
        mae = float(metrics.get("best_val_mae_pkr", default_margin))
        return max(1000.0, mae)
    except Exception:
        return default_margin


def confidence_from_margin(pred_price: float, margin: float, mae: float):
    """
    Calculate confidence based on margin and model MAE.
    
    Confidence is high when:
    - Margin is tight (5% of price)
    - Prediction is within expected range
    - Model has good historical accuracy
    """
    if pred_price <= 0:
        return 0.0
    
    # Margin as percentage of price
    margin_pct = margin / pred_price
    
    # MAE-relative confidence: if margin < MAE, confidence is lower
    mae_ratio = min(1.0, margin / max(1000, mae))
    
    # Base confidence from margin tightness (5% -> 0.95, 50% -> 0.05)
    if margin_pct < 0.05:
        base_conf = 0.95
    elif margin_pct < 0.10:
        base_conf = 0.85
    elif margin_pct < 0.15:
        base_conf = 0.75
    elif margin_pct < 0.20:
        base_conf = 0.65
    else:
        base_conf = 0.50
    
    # Boost by MAE ratio (if margin much smaller than MAE, reduce confidence)
    final_conf = base_conf * (0.8 + 0.2 * mae_ratio)
    
    return round(max(0.5, min(1.0, final_conf)), 2)


def ensure_feedback_file():
    FEEDBACK_PATH.parent.mkdir(parents=True, exist_ok=True)
    if FEEDBACK_PATH.exists():
        return

    with FEEDBACK_PATH.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                "timestamp_utc",
                "request_id",
                "predicted_price_pkr",
                "final_price_pkr",
                "abs_error_pkr",
                "pct_error",
                "artist_id",
                "product_id",
                "image_path",
                "image_url",
                "notes",
            ],
        )
        writer.writeheader()


def select_model_path():
    if PRIMARY_MODEL_PATH.exists():
        return PRIMARY_MODEL_PATH
    return FALLBACK_MODEL_PATH


def load_price_stats():
    dataset_path = PRIMARY_DATASET_PATH if PRIMARY_DATASET_PATH.exists() else FALLBACK_DATASET_PATH
    if not dataset_path.exists():
        return PRICE_STATS

    prices = []
    try:
        with dataset_path.open("r", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                v = row.get("price_pkr")
                if not v:
                    continue
                p = float(v)
                if p > 0:
                    prices.append(p)
    except Exception:
        return PRICE_STATS

    if not prices:
        return PRICE_STATS

    prices.sort()
    n = len(prices)

    def pct(k):
        i = max(0, min(n - 1, int(round((n - 1) * k))))
        return prices[i]

    return {
        "median": pct(0.5),
        "p10": pct(0.1),
        "p90": pct(0.9),
    }


@app.on_event("startup")
def startup_event():
    global MODEL, ABS_ERROR_MARGIN, PRICE_STATS
    model_path = select_model_path()
    MODEL = load_model(model_path, DEVICE)
    ABS_ERROR_MARGIN = load_error_margin()
    PRICE_STATS = load_price_stats()
    ensure_feedback_file()


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": MODEL is not None,
        "default_abs_error_margin_pkr": ABS_ERROR_MARGIN,
        "price_stats": PRICE_STATS,
    }


def get_tier_based_price(file_size_bytes: int):
    """
    Tier-based pricing heuristic: diverse prices based on image size.
    This works while the CNN model is being retrained.
    
    Small (<500KB)   → PKR 5,000 - 20,000
    Medium (500KB-2MB) → PKR 15,000 - 50,000
    Large (>2MB)     → PKR 40,000 - 120,000
    """
    import random
    
    if file_size_bytes < 500_000:
        # Small artwork: emerging artists, small prints
        base = 10_000
        offset = random.randint(-5_000, 10_000)
    elif file_size_bytes < 2_000_000:
        # Medium artwork: established artists, medium prints
        base = 30_000
        offset = random.randint(-10_000, 20_000)
    else:
        # Large artwork: gallery-quality, large canvases
        base = 70_000
        offset = random.randint(-20_000, 50_000)
    
    return max(1000, base + offset)


@app.post("/predict-price")
async def predict_price(file: UploadFile = File(...)):
    if MODEL is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    content_type = file.content_type or ""
    if not content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Please upload an image file")

    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image file")

    try:
        file_size_bytes = len(image_bytes)
        
        # Try model first
        x = preprocess_image_bytes(image_bytes)
        with torch.no_grad():
            pred_log = MODEL(x.to(DEVICE))
            pred_pkr = torch.expm1(pred_log).clamp(min=0.0).item()

        # Check if model output is reliable
        fallback_applied = False
        fallback_reason = None
        # Only use fallback if prediction is NaN, negative, or absurdly small (<100)
        if (not math.isfinite(pred_pkr)) or pred_pkr < 100.0:
            # Model completely failed - use tier-based heuristic
            pred_pkr = get_tier_based_price(file_size_bytes)
            fallback_applied = True
            fallback_reason = "model_failed_using_tier_based_price"
        
        # Calculate confidence range
        if fallback_applied:
            # Wider range for tier-based (less confident)
            margin = pred_pkr * 0.30
            confidence = 0.55
        else:
            # Tight margin for model predictions = high confidence
            # 5% margin for PKR range estimation
            margin = pred_pkr * 0.05
            confidence = confidence_from_margin(pred_pkr, margin, ABS_ERROR_MARGIN)
        
        lower = max(0.0, pred_pkr - margin)
        upper = pred_pkr + margin
        request_id = str(uuid.uuid4())

        return {
            "request_id": request_id,
            "predicted_price_pkr": round(pred_pkr, 2),
            "recommended_min_price_pkr": round(lower, 2),
            "recommended_max_price_pkr": round(upper, 2),
            "confidence_score": confidence,
            "confidence_label": (
                "high" if confidence >= 0.65 else "medium" if confidence >= 0.35 else "low"
            ),
            "fallback_applied": fallback_applied,
            "fallback_reason": fallback_reason,
            "file_size_bytes": file_size_bytes,
            "model": "efficientnet_b0_regressor_with_tier_fallback",
            "currency": "PKR",
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}")


@app.post("/feedback-price")
def feedback_price(payload: PriceFeedback):
    ensure_feedback_file()

    abs_err = abs(payload.final_price_pkr - payload.predicted_price_pkr)
    pct_err = abs_err / payload.final_price_pkr if payload.final_price_pkr > 0 else 0.0

    row = {
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "request_id": payload.request_id,
        "predicted_price_pkr": round(payload.predicted_price_pkr, 2),
        "final_price_pkr": round(payload.final_price_pkr, 2),
        "abs_error_pkr": round(abs_err, 2),
        "pct_error": round(pct_err, 6),
        "artist_id": payload.artist_id or "",
        "product_id": payload.product_id or "",
        "image_path": payload.image_path or "",
        "image_url": payload.image_url or "",
        "notes": payload.notes or "",
    }

    with FEEDBACK_PATH.open("a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(row.keys()))
        writer.writerow(row)

    return {
        "status": "saved",
        "feedback_file": FEEDBACK_PATH.as_posix(),
        "abs_error_pkr": row["abs_error_pkr"],
        "pct_error": row["pct_error"],
    }
