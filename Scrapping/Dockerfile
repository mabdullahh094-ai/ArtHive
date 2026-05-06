FROM python:3.12-slim

WORKDIR /app

COPY requirements-image-model.txt ./requirements-image-model.txt
RUN pip install --no-cache-dir -r requirements-image-model.txt

COPY . .

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "image_price_api:app", "--host", "0.0.0.0", "--port", "8000"]
