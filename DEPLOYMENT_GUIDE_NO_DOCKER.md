# ArtHive Non-Docker Deployment Guide

## Overview
This guide explains how to deploy ArtHive on your Ubuntu server **without Docker** using GitHub Actions workflow for automated deployments.

## Architecture
```
GitHub Push (main branch)
         ↓
GitHub Actions Workflow
         ↓
SSH to Server
         ↓
Pull latest code, install deps, build frontend
         ↓
Systemd starts/restarts services
         ↓
Nginx reverse proxy (optional)
         ↓
Your app is live!
```

## Prerequisites
- Ubuntu 20.04 or later
- Server with at least 2GB RAM (much better than Docker!)
- SSH access to the server
- GitHub repository configured
- PostgreSQL database (can be on same server or remote)

---

## Step 1: Prepare Your Server

### 1.1 SSH into your server
```bash
ssh root@your-server-ip
# or
ssh ubuntu@your-server-ip
```

### 1.2 Run the setup script
On your **local machine**, run:
```bash
# Download and run the setup script
scp setup-server.sh ubuntu@your-server-ip:~
ssh ubuntu@your-server-ip 'bash ~/setup-server.sh'
```

This will:
- Install Node.js 18
- Install Python 3.9
- Install PostgreSQL client
- Install Nginx
- Create the `arthive` user
- Create systemd service files
- Set up directory permissions

### 1.3 Verify installation
```bash
ssh arthive@your-server-ip << 'EOF'
node --version          # Should show v18.x.x
npm --version           # Should show npm version
python3 --version       # Should show Python 3.9.x
systemctl list-units | grep arthive
EOF
```

---

## Step 2: Set Up PostgreSQL Database

### 2.1 Create database and user
```sql
-- Connect to PostgreSQL (locally or remotely)
psql -h localhost -U postgres

-- Create database
CREATE DATABASE arthive_db;

-- Create user
CREATE USER arthive_user WITH PASSWORD 'your_secure_password_here';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE arthive_db TO arthive_user;

-- Run migrations/schema setup
\c arthive_db
-- Run your schema setup commands here
```

### 2.2 Test connection from server
```bash
ssh arthive@your-server-ip << 'EOF'
psql -h localhost -U arthive_user -d arthive_db -c "SELECT version();"
EOF
```

---

## Step 3: Configure Environment Variables

### 3.1 Create backend .env file
On your server:
```bash
ssh arthive@your-server-ip << 'EOF'
mkdir -p /var/www/arthive/arthive-backend
cat > /var/www/arthive/arthive-backend/.env << 'ENVFILE'
NODE_ENV=production
PORT=3001

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=arthive_db
DB_USER=arthive_user
DB_PASSWORD=your_secure_password_here

# JWT
JWT_SECRET=$(openssl rand -base64 32)

# CORS
CORS_ORIGIN=http://your-server-ip:3000

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Email
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=SG...

# Models
MODEL_DIR=/var/www/arthive/models
ENVFILE
EOF
```

### 3.2 Create frontend .env file
```bash
ssh arthive@your-server-ip << 'EOF'
mkdir -p /var/www/arthive/arthive-frontend
cat > /var/www/arthive/arthive-frontend/.env << 'ENVFILE'
REACT_APP_API_URL=http://your-server-ip:3001
REACT_APP_STRIPE_KEY=pk_test_...
ENVFILE
EOF
```

---

## Step 4: Set Up GitHub Secrets

In your GitHub repository, go to **Settings → Secrets and variables → Actions** and add:

| Secret Name | Value | Example |
|------------|-------|---------|
| `SERVER_IP` | Your server's IP address | `192.168.1.100` |
| `SSH_PRIVATE_KEY` | Private SSH key (see below) | |
| `DB_HOST` | Database hostname | `localhost` |
| `DB_PORT` | Database port | `5432` |
| `DB_NAME` | Database name | `arthive_db` |
| `DB_USER` | Database user | `arthive_user` |
| `DB_PASSWORD` | Database password | |
| `JWT_SECRET` | Random string for JWT | `$(openssl rand -base64 32)` |
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_test_...` |
| `STRIPE_PUBLISHABLE_KEY` | Stripe public key | `pk_test_...` |
| `EMAIL_SERVICE` | Email provider | `sendgrid` |
| `EMAIL_USER` | Email address | `your-email@example.com` |
| `EMAIL_PASSWORD` | Email password/token | |
| `EMAIL_FROM` | From email address | `noreply@arthive.com` |
| `SENDGRID_API_KEY` | SendGrid API key | `SG...` |

### 4.1 Generate SSH key for deployment
On your **local machine**:
```bash
ssh-keygen -t ed25519 -f arthive-deploy-key -C "arthive-deploy"
# Don't set a passphrase!

# Add public key to server
ssh-copy-id -i arthive-deploy-key.pub arthive@your-server-ip
# Or manually:
cat arthive-deploy-key.pub | ssh arthive@your-server-ip 'cat >> ~/.ssh/authorized_keys'

# Copy private key content to GitHub secret SSH_PRIVATE_KEY
cat arthive-deploy-key
# Paste the entire content into GitHub secret
```

---

## Step 5: Upload ML Model

### 5.1 Find and prepare your model
```bash
# On your local machine, find your trained model
# It should be a .pt file (PyTorch format)

# Upload to server
scp your_model.pt arthive@your-server-ip:/var/www/arthive/models/image_price_regressor_feedback_v2/best_model.pt
```

### 5.2 Verify model permissions
```bash
ssh arthive@your-server-ip << 'EOF'
ls -lh /var/www/arthive/models/image_price_regressor_feedback_v2/best_model.pt
EOF
```

---

## Step 6: Deploy!

### 6.1 Initial manual setup (optional - GitHub will do this)
For the first deployment, you might want to test manually:

```bash
ssh arthive@your-server-ip << 'EOF'
cd /var/www/arthive
git clone https://github.com/mabdullahh094-ai/ArtHive.git .

# Backend
cd arthive-backend
npm ci --omit=dev
pip3 install -q -r ml_models/requirements.txt

# Frontend
cd ../arthive-frontend
npm ci --omit=dev
npm run build
cd ..

# Start services
sudo systemctl start arthive-backend
sudo systemctl start arthive-frontend
sudo systemctl enable arthive-backend
sudo systemctl enable arthive-frontend
EOF
```

### 6.2 Automatic deployment with GitHub Actions
Once everything is set up, simply:

1. Make changes to your code
2. Commit to main branch
3. Push to GitHub
4. GitHub Actions automatically deploys to your server!

Watch the deployment:
- Go to your GitHub repo
- Click **Actions** tab
- Click on the latest workflow run
- Watch it deploy in real-time

---

## Step 7: Managing Services

### Check service status
```bash
ssh arthive@your-server-ip << 'EOF'
sudo systemctl status arthive-backend
sudo systemctl status arthive-frontend
EOF
```

### View service logs
```bash
ssh arthive@your-server-ip << 'EOF'
# View backend logs
sudo journalctl -u arthive-backend -f

# View frontend logs
sudo journalctl -u arthive-frontend -f
EOF
```

### Restart services manually
```bash
ssh arthive@your-server-ip << 'EOF'
sudo systemctl restart arthive-backend
sudo systemctl restart arthive-frontend
EOF
```

### Stop services
```bash
ssh arthive@your-server-ip << 'EOF'
sudo systemctl stop arthive-backend
sudo systemctl stop arthive-frontend
EOF
```

---

## Step 8: Configure Nginx (Optional)

If you want to use Nginx as a reverse proxy:

### 8.1 Create Nginx config
```bash
ssh arthive@your-server-ip << 'EOF'
sudo tee /etc/nginx/sites-available/arthive << 'NGINX'
upstream backend {
    server localhost:3001;
}

upstream frontend {
    server localhost:3000;
}

server {
    listen 80;
    server_name your-server-ip;

    client_max_body_size 10M;

    # API proxy
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX

# Enable site
sudo ln -sf /etc/nginx/sites-available/arthive /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
EOF
```

---

## Troubleshooting

### Services won't start
```bash
# Check logs
sudo journalctl -u arthive-backend -n 50

# Check if ports are in use
lsof -i :3001
lsof -i :3000

# Kill process on port
sudo lsof -i :3001 -t | xargs sudo kill -9
```

### Deployment fails
1. Check GitHub Actions logs for details
2. SSH to server and check:
   ```bash
   cd /var/www/arthive
   git log --oneline -5
   sudo systemctl status arthive-backend
   ```
3. Verify environment variables are set correctly

### Database connection fails
```bash
# Test from server
psql -h localhost -U arthive_user -d arthive_db -c "SELECT 1"

# Check DB credentials in .env file
cat /var/www/arthive/arthive-backend/.env | grep DB_
```

### ML model not found
```bash
ls -la /var/www/arthive/models/image_price_regressor_feedback_v2/
# Should show best_model.pt
```

---

## Performance Tips

1. **Monitor resource usage**: `htop` shows CPU/RAM usage
2. **Enable gzip compression** in Nginx config
3. **Use PM2** instead of systemd if you want more process management features
4. **Set up log rotation** to prevent disk space issues
5. **Configure PostgreSQL connection pooling** for better database performance

---

## Security Hardening

1. **Use SSH keys** (done ✓)
2. **Disable root SSH login**: Edit `/etc/ssh/sshd_config`
3. **Enable firewall**: `sudo ufw allow 22,80,443/tcp`
4. **Use HTTPS**: Set up Let's Encrypt with Certbot
5. **Keep secrets in GitHub Secrets**, never in code
6. **Regularly update** packages: `sudo apt-get update && sudo apt-get upgrade`

---

## Next Steps

1. ✅ Set up server
2. ✅ Configure database
3. ✅ Set up GitHub secrets
4. ✅ Upload ML model
5. ✅ Make first push to main
6. ✅ Watch GitHub Actions deploy
7. ✅ Access your app at `http://your-server-ip:3000`

Good luck! 🚀
