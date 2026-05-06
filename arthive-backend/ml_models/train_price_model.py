#!/usr/bin/env python3
"""
ArtHive - ML Model Training Script
Train price recommendation model on artwork dataset
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
import joblib
import os
import json

# Ensure we're in the correct directory
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(os.path.dirname(SCRIPT_DIR))
DATASET_PATH = os.path.join(PROJECT_ROOT, 'ai_price_recommendation_dataset_5000.csv')
MODEL_PATH = os.path.join(SCRIPT_DIR, 'price_model.pkl')
ENCODERS_PATH = os.path.join(SCRIPT_DIR, 'encoders.pkl')
FEATURES_INFO_PATH = os.path.join(SCRIPT_DIR, 'features_info.json')

print("=" * 60)
print("ArtHive Price Recommendation Model Training")
print("=" * 60)

# Load dataset
print(f"\n[1] Loading dataset from: {DATASET_PATH}")
try:
    df = pd.read_csv(DATASET_PATH)
    print(f"✓ Dataset loaded successfully!")
    print(f"  - Rows: {len(df)}")
    print(f"  - Columns: {len(df.columns)}")
    print(f"  - Price range: ${df['price_usd'].min():.2f} - ${df['price_usd'].max():.2f}")
except Exception as e:
    print(f"✗ Error loading dataset: {e}")
    exit(1)

# Prepare features and target
print(f"\n[2] Preparing features and target variable...")

# Define feature columns - numerical and categorical
CATEGORICAL_FEATURES = ['medium', 'style', 'country', 'is_original', 'condition']
NUMERICAL_FEATURES = [
    'width_cm', 'height_cm', 'size_cm2', 'aspect_ratio',
    'artist_experience_years', 'artist_previous_sales', 'artist_reputation_score',
    'edition_size', 'year_created', 'time_taken_hours',
    'ai_quality_score', 'ai_authenticity_score', 'image_brightness_score',
    'image_contrast_score', 'composition_score', 'color_harmony_score',
    'subject_complexity_score', 'market_demand_index'
]

TARGET = 'price_usd'

print(f"  - Numerical features: {len(NUMERICAL_FEATURES)}")
print(f"  - Categorical features: {len(CATEGORICAL_FEATURES)}")

# Prepare data
X = df[NUMERICAL_FEATURES + CATEGORICAL_FEATURES].copy()
y = df[TARGET].copy()

# Encode categorical variables
print(f"\n[3] Encoding categorical variables...")
encoders = {}
for feature in CATEGORICAL_FEATURES:
    le = LabelEncoder()
    X[feature] = le.fit_transform(X[feature].astype(str))
    encoders[feature] = le
    print(f"  ✓ {feature}: {len(le.classes_)} unique values")

# Handle any missing values
print(f"\n[4] Handling missing values...")
missing_count = X.isnull().sum().sum()
X = X.fillna(X.mean())
print(f"  ✓ Missing values filled: {missing_count}")

# Split dataset
print(f"\n[5] Splitting dataset...")
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)
print(f"  - Training set: {len(X_train)} samples")
print(f"  - Testing set: {len(X_test)} samples")

# Train model
print(f"\n[6] Training Random Forest Model...")
print(f"  (This may take a minute...)")

model = RandomForestRegressor(
    n_estimators=100,
    max_depth=20,
    min_samples_split=5,
    min_samples_leaf=2,
    random_state=42,
    n_jobs=-1,
    verbose=1
)

model.fit(X_train, y_train)
print(f"  ✓ Model training completed!")

# Evaluate model
print(f"\n[7] Model Evaluation...")
y_pred = model.predict(X_test)

mse = mean_squared_error(y_test, y_pred)
rmse = np.sqrt(mse)
mae = mean_absolute_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)

print(f"  - MSE: ${mse:,.2f}")
print(f"  - RMSE: ${rmse:,.2f}")
print(f"  - MAE: ${mae:,.2f}")
print(f"  - R² Score: {r2:.4f}")

# Feature importance
print(f"\n[8] Top 10 Important Features:")
feature_importance = pd.DataFrame({
    'feature': NUMERICAL_FEATURES + CATEGORICAL_FEATURES,
    'importance': model.feature_importances_
}).sort_values('importance', ascending=False)

for idx, row in feature_importance.head(10).iterrows():
    print(f"  {row['feature']:<30} {row['importance']:.4f}")

# Save model
print(f"\n[9] Saving model artifacts...")
try:
    joblib.dump(model, MODEL_PATH)
    print(f"  ✓ Model saved to: {MODEL_PATH}")
    
    joblib.dump(encoders, ENCODERS_PATH)
    print(f"  ✓ Encoders saved to: {ENCODERS_PATH}")
    
    # Save features info for API
    features_info = {
        'numerical_features': NUMERICAL_FEATURES,
        'categorical_features': CATEGORICAL_FEATURES,
        'categorical_classes': {
            feature: list(encoders[feature].classes_)
            for feature in CATEGORICAL_FEATURES
        },
        'model_metrics': {
            'rmse': float(rmse),
            'mae': float(mae),
            'r2_score': float(r2),
            'training_samples': len(X_train),
            'testing_samples': len(X_test)
        }
    }
    
    with open(FEATURES_INFO_PATH, 'w') as f:
        json.dump(features_info, f, indent=2)
    print(f"  ✓ Features info saved to: {FEATURES_INFO_PATH}")
    
except Exception as e:
    print(f"  ✗ Error saving model: {e}")
    exit(1)

print(f"\n" + "=" * 60)
print(f"✓ MODEL TRAINING COMPLETED SUCCESSFULLY!")
print(f"=" * 60)
print(f"\nNext Step: Run predict_price.py to use the model")
