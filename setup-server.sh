#!/bin/bash
# ArtHive Server Setup Script (Non-Docker)
# Run this ONCE on your Ubuntu server to prepare for deployment

set -e

echo "========================================"
echo "ArtHive Server Setup"
echo "========================================"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
  echo "❌ Please do NOT run this script as root"
  exit 1
fi

# Detect Ubuntu version
UBUNTU_VERSION=$(lsb_release -sr)
echo "📋 Ubuntu Version: $UBUNTU_VERSION"

# Update system
echo ""
echo "📦 Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js 18
echo ""
echo "📦 Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Python 3.9
echo ""
echo "📦 Installing Python 3.9..."
sudo apt-get install -y python3.9 python3-pip python3-venv python3-dev

# Install PostgreSQL client
echo ""
echo "📦 Installing PostgreSQL client..."
sudo apt-get install -y postgresql-client

# Install build tools
echo ""
echo "📦 Installing build tools..."
sudo apt-get install -y build-essential git curl

# Install Nginx
echo ""
echo "📦 Installing Nginx..."
sudo apt-get install -y nginx

# Create arthive user
echo ""
echo "👤 Creating arthive deployment user..."
if ! id arthive >/dev/null 2>&1; then
  sudo useradd -m -s /bin/bash -G sudo arthive
  echo "User 'arthive' created"
else
  echo "User 'arthive' already exists"
fi

# Setup deployment directory
echo ""
echo "📁 Setting up deployment directory..."
DEPLOY_DIR="/var/www/arthive"
sudo mkdir -p "$DEPLOY_DIR"
sudo chown arthive:arthive "$DEPLOY_DIR"
sudo chmod 755 "$DEPLOY_DIR"

# Create upload directories
echo "Creating upload directories..."
sudo mkdir -p "$DEPLOY_DIR/arthive-backend/uploads/artist_portfolio"
sudo mkdir -p "$DEPLOY_DIR/arthive-backend/uploads/profile_pics"
sudo mkdir -p "$DEPLOY_DIR/arthive-backend/uploads/temp_predictions"
sudo mkdir -p "$DEPLOY_DIR/models/image_price_regressor_feedback_v2"
sudo chown -R arthive:arthive "$DEPLOY_DIR/arthive-backend/uploads"
sudo chown -R arthive:arthive "$DEPLOY_DIR/models"

# Create systemd service files
echo ""
echo "🔧 Creating systemd service files..."

# Backend service
sudo tee /etc/systemd/system/arthive-backend.service > /dev/null << 'BACKEND_SERVICE'
[Unit]
Description=ArtHive Backend API
After=network.target
StartLimitIntervalSec=60
StartLimitBurst=3

[Service]
Type=simple
User=arthive
WorkingDirectory=/var/www/arthive/arthive-backend
Environment="PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
Environment="NODE_ENV=production"
EnvironmentFile=/var/www/arthive/arthive-backend/.env
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=arthive-backend

[Install]
WantedBy=multi-user.target
BACKEND_SERVICE

# Frontend service
sudo tee /etc/systemd/system/arthive-frontend.service > /dev/null << 'FRONTEND_SERVICE'
[Unit]
Description=ArtHive Frontend React App
After=network.target
StartLimitIntervalSec=60
StartLimitBurst=3

[Service]
Type=simple
User=arthive
WorkingDirectory=/var/www/arthive/arthive-frontend
Environment="PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
Environment="NODE_ENV=production"
Environment="HOST=0.0.0.0"
Environment="PORT=3000"
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=arthive-frontend

[Install]
WantedBy=multi-user.target
FRONTEND_SERVICE

# Reload systemd daemon
sudo systemctl daemon-reload

# Setup SSH key for GitHub (optional but recommended)
echo ""
echo "🔑 Setting up SSH directory for arthive user..."
sudo -u arthive mkdir -p /home/arthive/.ssh
sudo chmod 700 /home/arthive/.ssh

echo ""
echo "========================================"
echo "✅ Server Setup Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo ""
echo "1️⃣  Create environment files:"
echo "   - Create /var/www/arthive/arthive-backend/.env with your configuration"
echo "   - Copy the template: sudo cp arthive-backend/.env.example /var/www/arthive/arthive-backend/.env"
echo ""
echo "2️⃣  Upload your trained ML model:"
echo "   - scp your_model.pt arthive@YOUR_SERVER:/var/www/arthive/models/image_price_regressor_feedback_v2/best_model.pt"
echo ""
echo "3️⃣  Configure GitHub secrets in your repository:"
echo "   - SERVER_IP: Your server's IP address"
echo "   - SSH_PRIVATE_KEY: The private SSH key for the arthive user"
echo "   - DB_HOST, DB_NAME, DB_USER, DB_PASSWORD: PostgreSQL credentials"
echo "   - JWT_SECRET: A random string for JWT signing"
echo "   - STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY"
echo "   - EMAIL_SERVICE, EMAIL_USER, EMAIL_PASSWORD, EMAIL_FROM"
echo ""
echo "4️⃣  Test SSH access:"
echo "   - ssh -i your_key.pem arthive@YOUR_SERVER 'echo Connected!'"
echo ""
echo "5️⃣  Push to main branch to trigger deployment:"
echo "   - git push origin main"
echo ""
