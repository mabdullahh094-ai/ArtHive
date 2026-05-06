# ✅ ArtHive Deployment Checklist - Ready to Deploy!

## Server Status: ✅ CONFIGURED
- Server IP: `51.21.111.113`
- Deploy User: `arthive`
- PostgreSQL: ✅ Installed & configured
- Environment Files: ✅ Created on server

---

## What's Been Set Up for You

### 1. ✅ GitHub Actions Workflow
- **File**: `.github/workflows/deploy.yml`
- **Updated**: Yes, for your server IP and existing setup
- **What it does**: Auto-deploys on every push to main

### 2. ✅ Deployment Script
- Skips env file creation (you already have them!)
- Verifies .env files exist before deployment
- Checks for ML model (warns if missing)
- Installs dependencies
- Builds frontend
- Restarts services
- Verifies everything is working

### 3. ✅ Setup Documentation
- `SSH_KEY_SETUP.md` - **Read this first!**
- `DEPLOYMENT_SETUP_COMPLETE.md` - Overview
- `DEPLOYMENT_QUICK_REFERENCE.md` - Common commands

---

## ONE THING LEFT TO DO

### ⚠️ Add SSH Private Key to GitHub

This is the **ONLY thing** preventing your deployment from working!

#### Quick Steps:

1. Go to your GitHub repo
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Enter:
   - **Name**: `SSH_PRIVATE_KEY`
   - **Value**: (paste entire contents of your SSH key file)

   Your key file: `C:\Users\HP\.ssh\ArtHive.pem.txt`

   Contents should be:
   ```
   -----BEGIN RSA PRIVATE KEY-----
   MIIEpAIBAAKCAQEA1utafh3GiwTy0Osc...
   (middle section)
   ...
   -----END RSA PRIVATE KEY-----
   ```

5. Click **Add secret**

---

## After Adding SSH Key: Deploy! 🚀

```bash
# In your local project directory
git add .
git commit -m "Deploy ArtHive"
git push origin main
```

Then watch it deploy:
1. Go to your GitHub repo
2. Click **Actions** tab
3. Click the latest workflow run
4. Watch the deployment in real-time ✅

---

## After Deployment: Access Your App

### Frontend
```
http://51.21.111.113:3000
```

### Backend API
```
http://51.21.111.113:3001
```

---

## Server Verification

After first deployment, verify everything is running:

```bash
# SSH to your server
ssh -i C:\Users\HP\.ssh\ArtHive.pem.txt arthive@51.21.111.113

# Check services
sudo systemctl status arthive-backend
sudo systemctl status arthive-frontend

# Check logs
sudo journalctl -u arthive-backend -n 20
```

---

## Workflow Details (What Happens on Each Push)

```
1. ✅ Pull your latest code from GitHub
2. ✅ Verify .env files exist on server
3. ✅ Create upload directories
4. ✅ Stop current services
5. ✅ Install backend dependencies (npm)
6. ✅ Install Python ML dependencies
7. ✅ Build frontend React app
8. ✅ Start both services (systemd)
9. ✅ Verify services are running
10. ✅ Show deployment summary
```

**Total deployment time**: ~2-3 minutes

---

## Important Reminders

✅ **Do:**
- Add SSH key to GitHub Secrets (secure & encrypted)
- Use strong database password
- Keep backups of your ML model file
- Monitor logs after first deployment

❌ **Don't:**
- Commit .env files to GitHub
- Share your SSH private key
- Commit database passwords to code

---

## If Something Goes Wrong

### Deployment fails in GitHub Actions
1. Check GitHub Actions logs (red X)
2. Scroll through logs to find error message
3. Common issues:
   - SSH_PRIVATE_KEY not added to GitHub
   - .env files missing on server
   - Services can't start

### Services won't start
```bash
# SSH to server and check logs
ssh -i C:\Users\HP\.ssh\ArtHive.pem.txt arthive@51.21.111.113
sudo journalctl -u arthive-backend -n 100
sudo systemctl status arthive-backend -l
```

### Database connection error
```bash
# Verify database credentials in .env
cat /var/www/arthive/arthive-backend/.env | grep DB_

# Test connection from server
psql -h localhost -U arthive_user -d arthive_db -c "SELECT 1"
```

---

## Quick Command Reference

```bash
# Deploy
git push origin main

# View deployment
# → Go to GitHub repo → Actions tab

# SSH to server
ssh -i C:\Users\HP\.ssh\ArtHive.pem.txt arthive@51.21.111.113

# View backend logs
ssh ... 'sudo journalctl -u arthive-backend -f'

# Restart services
ssh ... 'sudo systemctl restart arthive-backend arthive-frontend'

# Check service status
ssh ... 'sudo systemctl status arthive-backend'

# View database
ssh ... 'psql -h localhost -U arthive_user -d arthive_db'
```

---

## Status Summary

| Item | Status |
|------|--------|
| Server configured | ✅ Ready |
| PostgreSQL setup | ✅ Ready |
| Environment files | ✅ Created |
| GitHub workflow | ✅ Updated |
| ML model | ⚠️ Verify uploaded |
| SSH key in GitHub | ⏳ TODO |
| Ready to deploy | ⏳ After SSH key |

---

## Next: Add SSH Key & Deploy! 🚀

1. Open this file: [SSH_KEY_SETUP.md](SSH_KEY_SETUP.md)
2. Follow "Step 1: Add SSH Private Key to GitHub Secrets"
3. Push to main branch
4. Watch it deploy! ✅

---

**Setup Date**: May 6, 2026
**Server IP**: 51.21.111.113
**Status**: 🟢 Ready for Deployment
