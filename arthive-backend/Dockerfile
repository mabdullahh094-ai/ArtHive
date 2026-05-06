FROM node:20-bookworm-slim

WORKDIR /app

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    NODE_ENV=production

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --omit=dev

COPY ml_models/requirements.txt ./ml_models/requirements.txt
RUN pip3 install --no-cache-dir --break-system-packages -r ml_models/requirements.txt

COPY . .

RUN mkdir -p uploads/artist_portfolio uploads/profile_pics uploads/temp_predictions

EXPOSE 3001

CMD ["node", "server.js"]
