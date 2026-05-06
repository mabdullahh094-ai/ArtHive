#!/usr/bin/env python3
"""Test tier-based pricing with multiple images"""

import requests
import json
from pathlib import Path

api_url = "http://127.0.0.1:8001/predict-price"
image_dir = Path("data/images")

if image_dir.exists():
    images = sorted(list(image_dir.glob("*.jpeg")) + list(image_dir.glob("*.jpg")))[:5]
    print(f"Testing {len(images)} images...\n")
    
    for img_path in images:
        size_kb = img_path.stat().st_size / 1024
        
        with open(img_path, "rb") as f:
            # Set correct content type
            files = {"file": (img_path.name, f, "image/jpeg")}
            try:
                resp = requests.post(api_url, files=files, timeout=10)
                if resp.status_code == 200:
                    data = resp.json()
                    print(f"✓ {img_path.name} ({size_kb:.1f}KB)")
                    print(f"  Price: PKR {data['predicted_price_pkr']:,.0f}")
                    print(f"  Range: PKR {data['recommended_min_price_pkr']:,.0f} - {data['recommended_max_price_pkr']:,.0f}")
                    print(f"  Fallback: {data['fallback_applied']} ({data['fallback_reason']})\n")
                else:
                    print(f"✗ {img_path.name}: HTTP {resp.status_code}")
                    print(f"  Error: {resp.text}\n")
            except Exception as e:
                print(f"✗ {img_path.name}: {e}\n")
else:
    print("Image directory not found")
