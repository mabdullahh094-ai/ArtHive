import argparse
import math
from pathlib import Path

import torch
from PIL import Image
from torchvision import models, transforms


def load_model(model_path: Path, device: torch.device):
    ckpt = torch.load(model_path, map_location=device)

    model = models.efficientnet_b0(weights=None)
    in_features = model.classifier[1].in_features
    model.classifier[1] = torch.nn.Linear(in_features, 1)

    model.load_state_dict(ckpt["model_state_dict"])
    model.to(device)
    model.eval()
    return model


def preprocess(image_path: Path):
    tf = transforms.Compose(
        [
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        ]
    )
    img = Image.open(image_path).convert("RGB")
    return tf(img).unsqueeze(0)


def predict(model, x, device):
    with torch.no_grad():
        pred_log = model(x.to(device))
        pred_pkr = torch.expm1(pred_log).clamp(min=0.0).item()
    return pred_pkr


def main():
    parser = argparse.ArgumentParser(description="Predict artwork price from image only")
    parser.add_argument("--image", required=True, help="Path to uploaded artwork image")
    parser.add_argument("--model", default="models/image_price_regressor/best_model.pt")
    args = parser.parse_args()

    image_path = Path(args.image)
    model_path = Path(args.model)

    if not image_path.exists():
        raise FileNotFoundError(f"Image not found: {image_path}")
    if not model_path.exists():
        raise FileNotFoundError(f"Model not found: {model_path}")

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = load_model(model_path, device)
    x = preprocess(image_path)
    pred = predict(model, x, device)

    print(f"Predicted Price (PKR): {pred:,.0f}")


if __name__ == "__main__":
    main()
