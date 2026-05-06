#!/usr/bin/env python3
"""
ArtHive - Image Analysis Module
Analyzes artwork images for quality, composition, brightness, contrast, etc.
"""

import cv2
import numpy as np
import json
import sys
from pathlib import Path

def analyze_image_quality(image_path):
    """
    Analyze image and extract quality metrics
    
    Returns:
    {
        "success": true,
        "width_px": 1920,
        "height_px": 1080,
        "brightness_score": 0.65,
        "contrast_score": 0.70,
        "composition_score": 0.82,
        "color_harmony_score": 0.75,
        "quality_score": 0.72,
        "authenticity_score": 0.85
    }
    """
    try:
        # Read image
        if not Path(image_path).exists():
            return {
                "success": False,
                "error": f"Image not found: {image_path}"
            }
        
        img = cv2.imread(image_path)
        if img is None:
            return {
                "success": False,
                "error": "Failed to read image"
            }
        
        # Get dimensions
        height_px, width_px = img.shape[:2]
        
        # Convert to grayscale for analysis
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # 1. BRIGHTNESS SCORE (0-1)
        # Average pixel intensity / 255
        brightness = np.mean(gray) / 255.0
        brightness_score = min(brightness * 1.2, 1.0)  # Boost slightly
        
        # 2. CONTRAST SCORE (0-1)
        # Standard deviation of pixel values / 127 (max possible std)
        contrast = np.std(gray) / 127.0
        contrast_score = min(contrast, 1.0)
        
        # 3. COMPOSITION SCORE (0-1)
        # Based on edge detection (rule of thirds, focal points)
        edges = cv2.Canny(gray, 100, 200)
        edge_density = np.count_nonzero(edges) / edges.size
        composition_score = min(edge_density * 3, 1.0)  # 3x boost for visibility
        
        # 4. COLOR HARMONY SCORE (0-1)
        # Based on color distribution and saturation
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        saturation = hsv[:, :, 1]
        color_harmony = np.mean(saturation) / 255.0
        color_harmony_score = min(color_harmony * 1.15, 1.0)
        
        # 5. SHARPNESS SCORE (using Laplacian variance)
        # Higher variance = sharper image
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        sharpness = min(laplacian_var / 500, 1.0)
        
        # 6. OVERALL QUALITY SCORE
        # Weighted average of metrics
        quality_score = (
            brightness_score * 0.15 +
            contrast_score * 0.20 +
            composition_score * 0.25 +
            color_harmony_score * 0.20 +
            sharpness * 0.20
        )
        
        # 7. AUTHENTICITY SCORE
        # Detect signs of editing, filters, etc.
        # For now, use a simple heuristic based on color distribution
        hist = cv2.calcHist([hsv], [0], None, [256], [0, 256])
        hist_entropy = -np.sum((hist / hist.sum()) * np.log2(hist / hist.sum() + 1e-10))
        authenticity = min(hist_entropy / 8.0, 1.0)
        
        return {
            "success": True,
            "width_px": int(width_px),
            "height_px": int(height_px),
            "brightness_score": round(float(brightness_score), 3),
            "contrast_score": round(float(contrast_score), 3),
            "composition_score": round(float(composition_score), 3),
            "color_harmony_score": round(float(color_harmony_score), 3),
            "sharpness_score": round(float(sharpness), 3),
            "quality_score": round(float(quality_score), 3),
            "authenticity_score": round(float(authenticity), 3)
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Image analysis error: {str(e)}"
        }

def extract_dimensions_from_pixels(width_px, height_px, dpi=200):
    """
    Convert pixel dimensions to centimeters
    
    Standard DPI: 72 (screen), 150 (print), 200 (high quality), 300 (professional)
    Using 200 DPI as default (good quality digital art)
    
    Formula: cm = (pixels / DPI) * 2.54
    """
    cm_per_pixel = 2.54 / dpi
    width_cm = width_px * cm_per_pixel
    height_cm = height_px * cm_per_pixel
    size_cm2 = width_cm * height_cm
    aspect_ratio = width_cm / height_cm if height_cm > 0 else 1.0
    
    return {
        "width_cm": round(width_cm, 2),
        "height_cm": round(height_cm, 2),
        "size_cm2": round(size_cm2, 2),
        "aspect_ratio": round(aspect_ratio, 2),
        "dpi": dpi
    }

# Test function
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python analyze_image.py <image_path>")
        sys.exit(1)
    
    image_path = sys.argv[1]
    
    print("\n" + "=" * 60)
    print("ArtHive Image Analysis")
    print("=" * 60)
    
    # Analyze quality
    print(f"\n[1] Analyzing image: {image_path}")
    result = analyze_image_quality(image_path)
    
    if result["success"]:
        print(f"✓ Analysis successful!")
        print(f"\n[2] Pixel Dimensions:")
        print(f"  - Width: {result['width_px']} px")
        print(f"  - Height: {result['height_px']} px")
        
        # Extract physical dimensions
        dimensions = extract_dimensions_from_pixels(result['width_px'], result['height_px'])
        print(f"\n[3] Physical Dimensions (at 200 DPI):")
        print(f"  - Width: {dimensions['width_cm']} cm")
        print(f"  - Height: {dimensions['height_cm']} cm")
        print(f"  - Size: {dimensions['size_cm2']} cm²")
        print(f"  - Aspect Ratio: {dimensions['aspect_ratio']}")
        
        # Quality metrics
        print(f"\n[4] Image Quality Metrics:")
        print(f"  - Brightness: {result['brightness_score']:.3f}")
        print(f"  - Contrast: {result['contrast_score']:.3f}")
        print(f"  - Composition: {result['composition_score']:.3f}")
        print(f"  - Color Harmony: {result['color_harmony_score']:.3f}")
        print(f"  - Sharpness: {result['sharpness_score']:.3f}")
        print(f"\n✓ Overall Quality Score: {result['quality_score']:.3f}")
        print(f"✓ Authenticity Score: {result['authenticity_score']:.3f}")
        
        # Combined output
        output = {
            **result,
            **dimensions
        }
        print(f"\n[5] Complete Output (JSON):")
        print(json.dumps(output, indent=2))
    else:
        print(f"✗ Analysis failed: {result['error']}")
    
    print("\n" + "=" * 60)
