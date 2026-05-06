# Image-Based Artwork Price Prediction (Upload Flow)

This pipeline predicts price from artwork image only.

## One-click run (recommended)

If you want everything to run automatically:

1. Double-click `run_everything.bat`
2. It will install deps, ensure dataset/model, start API, and open:
	- `http://127.0.0.1:8000/docs`
	- `frontend_upload_demo.html`

For periodic feedback retraining, run:

- `periodic_retrain.bat`

## 1) Install dependencies

```bash
"c:/Users/11 TRDs/Desktop/Abdullah/Scrapping/.venv/Scripts/python.exe" -m pip install -r requirements-image-model.txt
```

## 2) Build image-price dataset

```bash
"c:/Users/11 TRDs/Desktop/Abdullah/Scrapping/.venv/Scripts/python.exe" prepare_image_price_dataset.py
```

Optional quick run:

```bash
"c:/Users/11 TRDs/Desktop/Abdullah/Scrapping/.venv/Scripts/python.exe" prepare_image_price_dataset.py --max-samples 150
```

Output:
- `data/image_price_dataset.csv`
- downloaded images in `data/images/`

## 3) Train image model

```bash
"c:/Users/11 TRDs/Desktop/Abdullah/Scrapping/.venv/Scripts/python.exe" train_image_price_model.py --epochs 12 --batch-size 16
```

Higher-accuracy tuned run (recommended):

```bash
"c:/Users/11 TRDs/Desktop/Abdullah/Scrapping/.venv/Scripts/python.exe" train_image_price_model.py --csv data/image_price_dataset.csv --epochs 30 --batch-size 16 --lr 0.00008 --weight-decay 0.0002 --lr-patience 2 --early-stop-patience 6 --min-delta 10
```

Output model:
- `models/image_price_regressor/best_model.pt`
- `models/image_price_regressor/metrics.json`

## 4) Predict from a single uploaded image

```bash
"c:/Users/11 TRDs/Desktop/Abdullah/Scrapping/.venv/Scripts/python.exe" predict_price_from_image.py --image path/to/uploaded_artwork.jpg
```

## 5) Run API for app upload integration

```bash
"c:/Users/11 TRDs/Desktop/Abdullah/Scrapping/.venv/Scripts/python.exe" -m uvicorn image_price_api:app --host 0.0.0.0 --port 8000
```

### API endpoint
- `POST /predict-price`
- Form field name: `file` (image upload)
- Response includes `predicted_price_pkr`

## 6) Frontend upload demo

Open this file in browser:

- `frontend_upload_demo.html`

It calls:

- `POST /predict-price` for image based suggestion
- `POST /feedback-price` for manual override saving

Make sure API is running at:

- `http://127.0.0.1:8000`

### Extended ecommerce contract

1. `POST /predict-price`
- Input: multipart image in `file`
- Output:
	- `request_id`
	- `predicted_price_pkr`
	- `recommended_min_price_pkr`
	- `recommended_max_price_pkr`
	- `confidence_score` (0 to 1)
	- `confidence_label` (`high`, `medium`, `low`)

2. `POST /feedback-price`
- Use this when artist/store manager manually overrides suggested price.
- JSON body example:

```json
{
	"request_id": "2f2ca30e-67a1-4d2b-9090-f4e43ef6f1ad",
	"predicted_price_pkr": 45000,
	"final_price_pkr": 52000,
	"artist_id": "artist_101",
	"product_id": "new_upload_55",
	"image_path": "data/uploads/new_upload_55.jpg",
	"notes": "artist requested higher value"
}
```

- Feedback is stored in `data/price_feedback.csv`.

3. Feedback to retraining dataset

```bash
"c:/Users/11 TRDs/Desktop/Abdullah/Scrapping/.venv/Scripts/python.exe" merge_feedback_for_retraining.py
```

- Output: `data/image_price_dataset_with_feedback.csv`
- Then retrain with:

```bash
"c:/Users/11 TRDs/Desktop/Abdullah/Scrapping/.venv/Scripts/python.exe" train_image_price_model.py --csv data/image_price_dataset_with_feedback.csv
```

## 7) Deploy with Docker

Build and run:

```bash
docker compose up --build -d
```

API will be available at:

- `http://localhost:8000`
