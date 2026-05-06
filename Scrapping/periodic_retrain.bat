@echo off
setlocal
cd /d "%~dp0"

echo [1/2] Merging feedback into retraining dataset...
".venv\Scripts\python.exe" merge_feedback_for_retraining.py
if errorlevel 1 (
  echo Feedback merge failed.
  exit /b 1
)

echo [2/2] Retraining model with feedback dataset...
".venv\Scripts\python.exe" train_image_price_model.py --csv data\image_price_dataset_with_feedback.csv --out-dir models\image_price_regressor_feedback --epochs 8 --batch-size 8 --lr 0.00008 --weight-decay 0.0002 --lr-patience 2 --early-stop-patience 4 --min-delta 10
if errorlevel 1 (
  echo Retraining failed.
  exit /b 1
)

echo Retraining complete.
exit /b 0
