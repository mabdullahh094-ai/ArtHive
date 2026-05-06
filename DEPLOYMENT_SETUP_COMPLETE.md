# 🚀 ArtHive Non-Docker Deployment Setup

## What's Included

This non-Docker deployment setup includes:

✅ **GitHub Actions Workflow** - Automatic deployment on every push to `main`
✅ **Server Setup Script** - One-command server initialization
✅ **Systemd Services** - Auto-start and auto-restart management
✅ **Environment Templates** - Pre-configured for your needs
✅ **Complete Documentation** - Step-by-step guides and troubleshooting

---

## 📊 Why Non-Docker?

| Feature | Non-Docker | Docker |
|---------|-----------|--------|
| **RAM Usage** | 300-500 MB | 1-2 GB |
| **Setup Time** | 5 minutes | 20+ minutes |
| **Deployment Time** | 1-2 min | 5-10 min |
| **Server Crash Risk** | Very Low ✅ | High ❌ |
| **Debugging** | Easy ✅ | Complex |
| **Performance** | Fast ✅ | Medium |

---

## ⚡ Quick Start (5 Steps)

### Step 1: Run Server Setup (1 minute)
```bash
scp setup-server.sh ubuntu@your-server-ip:~
ssh ubuntu@your-server-ip 'bash ~/setup-server.sh'
```

### Step 2: Create Database (2 minutes)
```bash
# On your server or remote database
psql -U postgres
CREATE DATABASE arthive_db;
CREATE USER arthive_user WITH PASSWORD 'strong_password';
GRANT ALL PRIVILEGES ON DATABASE arthive_db TO arthive_user;
```

### Step 3: Configure Environment (2 minutes)
SSH to server and create `.env` files:
```bash
cat > /var/www/arthive/arthive-backend/.env << 'EOF'
NODE_ENV=production
PORT=3001
DB_HOST=localhost
DB_NAME=arthive_db
DB_USER=arthive_user
DB_PASSWORD=your_password
JWT_SECRET=$(openssl rand -base64 32)
CORS_ORIGIN=http://your-server-ip:3000
STRIPE_SECRET_KEY=sk_test_...
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=SG...
MODEL_DIR=/var/www/arthive/models
EOF
```

### Step 4: Add GitHub Secrets (3 minutes)
In your GitHub repo, go to **Settings → Secrets and variables → Actions**:
- `SERVER_IP` = your server IP
- `SSH_PRIVATE_KEY` = private SSH key (generate with `ssh-keygen`)
- `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `JWT_SECRET` = random string
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`
- And other API keys...

### Step 5: Upload ML Model (1 minute)
```bash
scp best_model.pt arthive@your-server-ip:/var/www/arthive/models/image_price_regressor_feedback_v2/
```

---

## 📝 Full Deployment Checklist

### Pre-Deployment
- [ ] Ubuntu 20.04+ server with 2GB+ RAM
- [ ] SSH access to server
- [ ] PostgreSQL database ready
- [ ] GitHub repo created
- [ ] ML model file (.pt file)

### Server Setup
- [ ] Run `setup-server.sh`
- [ ] Node.js 18 installed ✓
- [ ] Python 3.9 installed ✓
- [ ] PostgreSQL client installed ✓
- [ ] `arthive` user created ✓
- [ ] `/var/www/arthive` directory created ✓
- [ ] Systemd service files created ✓

### Database Setup
- [ ] PostgreSQL database created
- [ ] Database user created
- [ ] User has correct permissions
- [ ] Can connect from server: `psql -h host -U user -d db`

### Configuration
- [ ] Backend `.env` file created with all values
- [ ] Frontend `.env` file created
- [ ] ML model uploaded to server
- [ ] Check file permissions: `ls -la /var/www/arthive/`

### GitHub Setup
- [ ] GitHub repository created
- [ ] All secrets added (see Secrets Checklist below)
- [ ] Workflow file updated (already done!)
- [ ] `.github/workflows/deploy.yml` exists

### Deployment
- [ ] Commit changes to main branch
- [ ] Push to GitHub: `git push origin main`
- [ ] GitHub Actions starts deployment
- [ ] Watch in: GitHub repo → Actions tab
- [ ] Services start automatically on server

### Post-Deployment
- [ ] Backend running: `http://server-ip:3001`
- [ ] Frontend running: `http://server-ip:3000`
- [ ] API responds: `curl http://server-ip:3001/health`
- [ ] Database connected

---

## 🔐 GitHub Secrets Required

Add these in **Settings → Secrets and variables → Actions**:

```
SERVER_IP=your.server.ip.address
SSH_PRIVATE_KEY=-----BEGIN OPENSSH PRIVATE KEY-----\n...\n-----END OPENSSH PRIVATE KEY-----
DB_HOST=localhost
DB_PORT=5432
DB_NAME=arthive_db
DB_USER=arthive_user
DB_PASSWORD=your_database_password
JWT_SECRET=random-string-from-openssl-rand-base64-32
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
EMAIL_SERVICE=sendgrid
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=app-password
EMAIL_FROM=noreply@arthive.com
SENDGRID_API_KEY=SG...
```

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `DEPLOYMENT_GUIDE_NO_DOCKER.md` | **📖 Full guide** - Read this first! |
| `DEPLOYMENT_QUICK_REFERENCE.md` | **⚡ Quick commands** - Bookmark this! |
| `SYSTEMD_SERVICES.md` | **🔧 Service configuration** - Reference |
| `setup-server.sh` | **🚀 Server setup automation** - Run once |
| `.env.production.example` | **⚙️ Environment template** - Copy and fill |

---

## 🔑 SSH Key Setup

Generate deployment SSH key:

```bash
# On your local machine
ssh-keygen -t ed25519 -f arthive-deploy-key -C "arthive-deploy"
# Don't set passphrase!

# Copy to server
cat arthive-deploy-key.pub | ssh ubuntu@your-server-ip 'sudo -u arthive bash -c "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"'

# Add to GitHub Secrets
cat arthive-deploy-key
# Copy entire output to SSH_PRIVATE_KEY secret
```

---

## 🚀 Deployment Process

```
Your Code Push
    ↓
GitHub Actions Triggered
    ↓
SSH to Your Server
    ↓
Pull Latest Code
    ↓
Install Dependencies
    ↓
Build Frontend
    ↓
Stop Old Services
    ↓
Start New Services
    ↓
✅ Live!
```

---

## 📊 Performance

Expected resource usage:
- **Backend**: ~150-200 MB RAM
- **Frontend**: ~100-150 MB RAM
- **Database**: ~200-300 MB RAM (varies)
- **Total**: ~500-700 MB RAM (vs 2GB with Docker)

---

## 🔍 Monitor Deployment

### Watch GitHub Actions
1. Go to your GitHub repo
2. Click **Actions** tab
3. Click the latest workflow run
4. Watch deployment in real-time

### Check server after deployment
```bash
ssh arthive@your-server-ip << 'EOF'
# Check services
sudo systemctl status arthive-backend
sudo systemctl status arthive-frontend

# Check logs
sudo journalctl -u arthive-backend -n 20
sudo journalctl -u arthive-frontend -n 20

# Check ports
netstat -tulpn | grep node
EOF
```

---

## 🆘 Troubleshooting

### Deployment fails in GitHub Actions
1. Check GitHub Actions logs
2. SSH to server: `ssh arthive@server`
3. Check error logs: `sudo journalctl -u arthive-backend -n 50`
4. Verify `.env` file exists
5. Check database connection

### Services won't start
```bash
# Check if ports are in use
sudo lsof -i :3001
sudo lsof -i :3000

# Manually start and check errors
/usr/bin/node /var/www/arthive/arthive-backend/server.js
```

### Database connection error
```bash
# Test connection
psql -h localhost -U arthive_user -d arthive_db -c "SELECT 1"

# Check .env file
cat /var/www/arthive/arthive-backend/.env | grep DB_
```

### See [DEPLOYMENT_GUIDE_NO_DOCKER.md](DEPLOYMENT_GUIDE_NO_DOCKER.md) for more troubleshooting

---

## 📞 Getting Help

1. **Read the docs** in this folder
2. **Check logs**: `sudo journalctl -u arthive-backend`
3. **Check GitHub Actions**: repo → Actions tab
4. **Test manually**: SSH and run commands to debug

---

## ✅ What's Next?

1. ✅ You've got the files!
2. 👉 **Read**: [DEPLOYMENT_GUIDE_NO_DOCKER.md](DEPLOYMENT_GUIDE_NO_DOCKER.md)
3. 👉 **Run**: `bash setup-server.sh` on your server
4. 👉 **Configure**: `.env` files and GitHub Secrets
5. 👉 **Deploy**: `git push origin main`

---

## 💡 Tips

- **Save SSH key**: `ssh-keygen -t ed25519` (strong security!)
- **Test locally**: Make sure app works on your machine first
- **Monitor logs**: `tail -f /var/log/syslog` to catch issues
- **Use PM2**: If you want more process management features
- **Set up backups**: Important for production databases!

---

## 🎉 Success!

Once deployed, your app will:
- ✅ Auto-start on server reboot
- ✅ Auto-restart if it crashes
- ✅ Deploy automatically on every push to main
- ✅ Use only 500-700 MB RAM (vs 2GB with Docker)
- ✅ Be fast and reliable

Happy deploying! 🚀

---

**Created**: 2024
**For**: ArtHive Project
**Type**: Non-Docker Deployment Guide
