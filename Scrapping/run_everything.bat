@echo off
setlocal
cd /d "%~dp0"

echo [1/5] Ensuring virtual environment exists...
if not exist ".venv\Scripts\python.exe" (
  echo Virtual environment not found. Creating .venv...
  py -m venv .venv
)

echo [2/5] Installing dependencies...
".venv\Scripts\python.exe" -m pip install -r requirements-image-model.txt
if errorlevel 1 (
  echo Dependency install failed.
  exit /b 1
)

echo [3/5] Ensuring image dataset exists...
if not exist "data\image_price_dataset.csv" (
  ".venv\Scripts\python.exe" prepare_image_price_dataset.py --max-samples 300
  if errorlevel 1 (
    echo Dataset preparation failed.
    exit /b 1
  )
)

for /f %%R in ('find /c /v "" ^< "data\image_price_dataset.csv"') do set ROWS=%%R
if %ROWS% LSS 150 (
  echo Existing dataset is small (%ROWS% rows). Rebuilding from available images...
  ".venv\Scripts\python.exe" prepare_image_price_dataset.py --skip-download
  if errorlevel 1 (
    echo Dataset rebuild failed.
    exit /b 1
  )
)

echo [4/5] Ensuring model exists...
if not exist "models\image_price_regressor\best_model.pt" (
  if not exist "models" mkdir models
  if not exist "models\image_price_regressor" mkdir models\image_price_regressor
  ".venv\Scripts\python.exe" train_image_price_model.py --csv data\image_price_dataset.csv --epochs 6 --batch-size 8
  if errorlevel 1 (
    echo Model training failed.
    exit /b 1
  )
)

echo [5/5] Starting API...
start "art-price-api" cmd /k ".venv\Scripts\python.exe -m uvicorn image_price_api:app --host 127.0.0.1 --port 8000"

timeout /t 2 >nul
start "" "http://127.0.0.1:8000/docs"
start "" "%cd%\frontend_upload_demo.html"

echo Done. API docs and demo page opened.
exit /b 0
