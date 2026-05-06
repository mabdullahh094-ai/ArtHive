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
from typing import Dict, List, Tuple
from pathlib import Path
from PIL import Image
from torchvision import models, transforms

# Ensure we're in the correct directory
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

def resolve_model_path():
    env_model_path = os.getenv('MODEL_PATH')
    if env_model_path:
        return env_model_path

    env_model_dir = os.getenv('MODEL_DIR')
    if env_model_dir:
        return os.path.join(env_model_dir, 'best_model.pt')

    # Fallback to repository-level models directory.
    repo_root = os.path.abspath(os.path.join(SCRIPT_DIR, '..', '..'))
    return os.path.join(repo_root, 'models', 'image_price_regressor_feedback_v2', 'best_model.pt')

MODEL_PATH = resolve_model_path()
ENCODERS_PATH = os.path.join(SCRIPT_DIR, 'encoders.pkl')
FEATURES_INFO_PATH = os.path.join(SCRIPT_DIR, 'features_info.json')

class PricePredictor:
    """Load and use trained model for price predictions"""
    
    def __init__(self):
        """Initialize predictor by loading model"""
        self.model = None
        self.device = None
        self.is_loaded = False
        self.load_model()
    
    def load_model(self):
        """Load trained PyTorch model"""
        try:
            # Determine device
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            
            # Load model
            if not os.path.exists(MODEL_PATH):
                raise FileNotFoundError(f"Model not found: {MODEL_PATH}")
            
            # Create EfficientNet model architecture
            model = models.efficientnet_b0(weights=None)
            in_features = model.classifier[1].in_features
            model.classifier[1] = torch.nn.Linear(in_features, 1)
            
            # Load checkpoint
            ckpt = torch.load(MODEL_PATH, map_location=self.device)
            model.load_state_dict(ckpt["model_state_dict"])
            model.to(self.device)
            model.eval()
            
            self.model = model
            self.is_loaded = True
            print(f"[OK] Model loaded successfully. Using device: {self.device}", file=sys.stderr)
            
        except Exception as e:
            print(f"[ERROR] Error loading model: {e}", file=sys.stderr)
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
            # Preprocess image
            x = self.preprocess_image(image_path)
            
            # Make prediction
            with torch.no_grad():
                pred_log = self.model(x.to(self.device))
                pred_price = torch.expm1(pred_log).clamp(min=0.0).item()
            
            # Calculate price range (±PKR 25000)
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
                "image_path": image_path
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Prediction error: {str(e)}"
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
        print(f"\n[ERROR] Test image not found: {test_image_path}")
        print("  Please provide a valid test image in ml_models/test_images/ directory")
        return
    
    print("\n[2] Running prediction...")
    predictor = get_predictor()
    result = predictor.predict(test_image_path)
    
    if result['success']:
        print(f"\n[OK] PREDICTION SUCCESSFUL!")
        print(f"  - Predicted Price (PKR): {result['predicted_price_pkr']:,.2f}")
        print(f"  - Price Range: PKR {result['price_range']['min']:,.2f} - PKR {result['price_range']['max']:,.2f}")
        print(f"  - Confidence: {result['confidence']*100:.2f}%")
    else:
        print(f"\n[ERROR] PREDICTION FAILED: {result['error']}")
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    # Support command-line usage: python predict_price.py <image_path>
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
        result = predict_price(image_path)
        print(json.dumps(result))
    else:
        test_prediction()
