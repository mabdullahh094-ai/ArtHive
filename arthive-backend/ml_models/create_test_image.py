#!/usr/bin/env python3
"""
Create test image for image analysis
"""

from PIL import Image, ImageDraw
import os

# Create test image directory
test_dir = os.path.join(os.path.dirname(__file__), 'test_images')
os.makedirs(test_dir, exist_ok=True)

# Create a simple test image (800x600 pixels)
img = Image.new('RGB', (800, 600), color=(180, 150, 100))
draw = ImageDraw.Draw(img)

# Add gradient effect
for i in range(600):
    shade = int(150 + (i / 600) * 100)
    draw.rectangle([(0, i), (800, i+1)], fill=(shade, shade-30, shade-50))

# Add shapes
draw.rectangle([(100, 100), (700, 500)], outline=(50, 100, 200), width=3)
draw.ellipse([(300, 200), (500, 400)], fill=(0, 255, 100))

# Add text
draw.text((250, 50), 'Test Artwork', fill=(255, 255, 255))

# Save test image
test_image_path = os.path.join(test_dir, 'test_artwork.jpg')
img.save(test_image_path, quality=95)

print(f"✓ Test image created: {test_image_path}")
print(f"  - Size: 800×600 pixels")
print(f"  - Format: JPG")
