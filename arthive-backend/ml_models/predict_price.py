#!/usr/bin/env python3
"""
ArtHive - Price Prediction API
Load trained model and provide predictions for artwork prices
"""

import json
import torch
import os
import sys
import numpy as np
import joblib
from typing import Dict, List, Tuple
from pathlib import Path
from PIL import Image
from torchvision import models, transforms

try:
    from analyze_image import analyze_image_quality, extract_dimensions_from_pixels
except Exception:
    analyze_image_quality = None
    extract_dimensions_from_pixels = None

# Ensure we're in the correct directory
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ENCODERS_PATH = os.path.join(SCRIPT_DIR, 'encoders.pkl')
FEATURES_INFO_PATH = os.path.join(SCRIPT_DIR, 'features_info.json')
LEGACY_MODEL_PATH = os.path.join(SCRIPT_DIR, 'price_model.pkl')


def resolve_model_path() -> str:
    """Resolve the image model checkpoint path for local and deployed environments."""
    candidates = []

    env_model_path = os.environ.get('MODEL_PATH')
    env_model_dir = os.environ.get('MODEL_DIR')

    if env_model_path:
        candidates.append(env_model_path)

    if env_model_dir:
        candidates.extend([
            os.path.join(env_model_dir, 'best_model.pt'),
            os.path.join(env_model_dir, 'model.pt'),
        ])

    candidates.extend([
        os.path.join(SCRIPT_DIR, 'best_model.pt'),
        os.path.join(SCRIPT_DIR, 'model.pt'),
        os.path.join(SCRIPT_DIR, 'models', 'best_model.pt'),
        os.path.join(SCRIPT_DIR, 'models', 'model.pt'),
        os.path.join(os.sep, 'models', 'image_price_regressor_feedback_v2', 'best_model.pt'),
    ])

    for candidate in candidates:
        if candidate and os.path.exists(candidate):
            return candidate

    return candidates[0] if candidates else ''


MODEL_PATH = resolve_model_path()


def safe_print(message: str):
    """Print text using ASCII-safe output on Windows consoles."""
    print(message.encode('ascii', 'replace').decode('ascii'))

class PricePredictor:
    """Load and use trained model for price predictions"""
    
    def __init__(self):
        """Initialize predictor by loading model"""
        self.model = None
        self.device = None
        self.is_loaded = False
        self.legacy_model = None
        self.encoders = None
        self.features_info = None
        self.model_mode = None
        self.model_path = None
        self.load_model()
    
    def load_model(self):
        """Load trained PyTorch model"""
        try:
            # Determine device
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

            # Prefer the image checkpoint if it exists.
            if MODEL_PATH and os.path.exists(MODEL_PATH):
                model = models.efficientnet_b0(weights=None)
                in_features = model.classifier[1].in_features
                model.classifier[1] = torch.nn.Linear(in_features, 1)

                ckpt = torch.load(MODEL_PATH, map_location=self.device)
                model.load_state_dict(ckpt["model_state_dict"])
                model.to(self.device)
                model.eval()

                self.model = model
                self.model_mode = 'image'
                self.model_path = MODEL_PATH
                self.is_loaded = True
                safe_print(f"[OK] Image model loaded successfully! Using device: {self.device}")
                return

            # Fallback to bundled legacy model artifacts.
            if os.path.exists(LEGACY_MODEL_PATH):
                self.legacy_model = joblib.load(LEGACY_MODEL_PATH)
                self.encoders = joblib.load(ENCODERS_PATH) if os.path.exists(ENCODERS_PATH) else {}
                if os.path.exists(FEATURES_INFO_PATH):
                    with open(FEATURES_INFO_PATH, 'r', encoding='utf-8') as f:
                        self.features_info = json.load(f)
                self.model_mode = 'legacy'
                self.model_path = LEGACY_MODEL_PATH
                self.is_loaded = True
                safe_print(f"[OK] Legacy model loaded successfully! Using device: {self.device}")
                return

            raise FileNotFoundError(
                f"No model found. Checked image checkpoint at {MODEL_PATH or 'unset'} and legacy model at {LEGACY_MODEL_PATH}."
            )
            
        except Exception as e:
            safe_print(f"[ERROR] Error loading model: {e}")
            self.is_loaded = False
    
    def preprocess_image(self, image_path: str) -> torch.Tensor:
        """Preprocess image for model input"""
        tf = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        ])
        
        img = Image.open(image_path).convert("RGB")
        return tf(img).unsqueeze(0)
    
    def validate_input(self, image_path: str) -> Tuple[bool, str]:
        """
        Validate input image
        Returns: (is_valid, error_message)
        """
        if not self.is_loaded:
            return False, "Model not loaded"
        
        if not os.path.exists(image_path):
            return False, f"Image not found: {image_path}"
        
        # Check if file is a valid image
        try:
            Image.open(image_path).verify()
            Image.open(image_path)  # Verify again to ensure it's readable
        except Exception as e:
            return False, f"Invalid image file: {str(e)}"
        
        return True, ""
    
    def predict(self, image_path: str) -> Dict:
        """
        Predict price for artwork from image
        
        Input: path to image file
        
        Returns:
        {
            "success": true,
            "predicted_price_pkr": 125000.00,
            "price_range": {"min": 100000, "max": 150000},
            "confidence": 0.85,
            "currency": "PKR"
        }
        """
        
        # Validate input
        is_valid, error_msg = self.validate_input(image_path)
        if not is_valid:
            return {
                "success": False,
                "error": error_msg
            }
        
        try:
            if self.model_mode == 'image':
                # Preprocess image
                x = self.preprocess_image(image_path)

                # Make prediction
                with torch.no_grad():
                    pred_log = self.model(x.to(self.device))
                    pred_price = torch.expm1(pred_log).clamp(min=0.0).item()

                price_range = {
                    "min": max(0, pred_price - 25000),
                    "max": pred_price + 25000
                }

                return {
                    "success": True,
                    "predicted_price_pkr": round(float(pred_price), 2),
                    "price_range": {
                        "min": round(float(price_range["min"]), 2),
                        "max": round(float(price_range["max"]), 2)
                    },
                    "confidence": 0.85,
                    "currency": "PKR",
                    "model_path": self.model_path,
                    "model_type": "image_checkpoint",
                    "image_path": image_path
                }

            return self.predict_legacy(image_path)

        except Exception as e:
            return {
                "success": False,
                "error": f"Prediction error: {str(e)}"
            }

    def predict_legacy(self, image_path: str) -> Dict:
        """Predict using the bundled RandomForest model and image-derived features."""
        if self.legacy_model is None:
            return {
                "success": False,
                "error": "Model not loaded"
            }

        if analyze_image_quality is None or extract_dimensions_from_pixels is None:
            return {
                "success": False,
                "error": "Image analysis helpers not available"
            }

        image_metrics = analyze_image_quality(image_path)
        if not image_metrics.get('success'):
            return {
                "success": False,
                "error": image_metrics.get('error', 'Image analysis failed')
            }

        dimensions = extract_dimensions_from_pixels(image_metrics['width_px'], image_metrics['height_px'])

        # Safe defaults for the non-image business fields used by the legacy model.
        features = {
            'width_cm': dimensions['width_cm'],
            'height_cm': dimensions['height_cm'],
            'size_cm2': dimensions['size_cm2'],
            'aspect_ratio': dimensions['aspect_ratio'],
            'medium': 'oil',
            'style': 'impressionism',
            'artist_experience_years': 5,
            'artist_previous_sales': 0,
            'artist_reputation_score': 3.0,
            'country': 'Pakistan',
            'is_original': 1,
            'edition_size': 1,
            'condition': 'good',
            'year_created': 2024,
            'time_taken_hours': 10,
            'ai_quality_score': image_metrics['quality_score'],
            'ai_authenticity_score': image_metrics['authenticity_score'],
            'image_brightness_score': image_metrics['brightness_score'],
            'image_contrast_score': image_metrics['contrast_score'],
            'composition_score': image_metrics['composition_score'],
            'color_harmony_score': image_metrics['color_harmony_score'],
            'subject_complexity_score': 0.75,
            'market_demand_index': 0.50,
        }

        try:
            feature_order = []
            if self.features_info:
                feature_order = self.features_info.get('numerical_features', []) + self.features_info.get('categorical_features', [])
            if not feature_order:
                feature_order = [
                    'width_cm', 'height_cm', 'size_cm2', 'aspect_ratio',
                    'artist_experience_years', 'artist_previous_sales', 'artist_reputation_score',
                    'edition_size', 'year_created', 'time_taken_hours',
                    'ai_quality_score', 'ai_authenticity_score', 'image_brightness_score',
                    'image_contrast_score', 'composition_score', 'color_harmony_score',
                    'subject_complexity_score', 'market_demand_index',
                    'medium', 'style', 'country', 'is_original', 'condition'
                ]

            row = []
            for feature in feature_order:
                value = features[feature]
                if feature in self.encoders:
                    encoder = self.encoders[feature]
                    value = encoder.transform([str(value)])[0]
                row.append(value)

            X = np.array([row], dtype=float)
            pred_price = float(self.legacy_model.predict(X)[0])
            price_range = {
                'min': max(0, pred_price * 0.85),
                'max': pred_price * 1.15,
            }

            return {
                'success': True,
                'predicted_price_pkr': round(pred_price, 2),
                'price_range': {
                    'min': round(float(price_range['min']), 2),
                    'max': round(float(price_range['max']), 2),
                },
                'confidence': 0.72,
                'currency': 'PKR',
                'model_path': self.model_path,
                'model_type': 'legacy_random_forest',
                'image_path': image_path,
                'artwork_features': features,
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Legacy prediction error: {str(e)}'
            }

# Global predictor instance
_predictor = None

def get_predictor():
    """Get or create predictor instance"""
    global _predictor
    if _predictor is None:
        _predictor = PricePredictor()
    return _predictor

def predict_price(image_path: str) -> Dict:
    """
    Main prediction function
    Can be called from Node.js backend with image path
    """
    predictor = get_predictor()
    return predictor.predict(image_path)

# Test function
def test_prediction():
    """Test the predictor with a sample image"""
    print("\n" + "=" * 60)
    print("ArtHive Price Predictor - Image-Based Test")
    print("=" * 60)
    
    # For testing, you would need to provide a valid image path
    # Example: test_image_path = r"C:\path\to\artwork.jpg"
    test_image_path = r"d:\FYP\arthive-backend\ml_models\test_images\test_artwork.jpg"
    
    print(f"\n[1] Testing with artwork image:")
    print(f"  - Image path: {test_image_path}")
    
    if not os.path.exists(test_image_path):
        safe_print(f"\n[ERROR] Test image not found: {test_image_path}")
        safe_print("  Please provide a valid test image in ml_models/test_images/ directory")
        return
    
    print("\n[2] Running prediction...")
    predictor = get_predictor()
    result = predictor.predict(test_image_path)
    
    if result['success']:
        safe_print(f"\n[OK] PREDICTION SUCCESSFUL!")
        safe_print(f"  - Predicted Price (PKR): {result['predicted_price_pkr']:,.2f}")
        safe_print(f"  - Price Range: PKR {result['price_range']['min']:,.2f} - PKR {result['price_range']['max']:,.2f}")
        safe_print(f"  - Confidence: {result['confidence']*100:.2f}%")
    else:
        safe_print(f"\n[ERROR] PREDICTION FAILED: {result['error']}")
    
    safe_print("\n" + "=" * 60)

if __name__ == "__main__":
    # Support command-line usage: python predict_price.py <image_path>
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
        result = predict_price(image_path)
        print(json.dumps(result))
    else:
        test_prediction()
