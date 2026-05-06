# 🔐 SSH Key Setup for ArtHive GitHub Deployment

## Your Server Details
- **Server IP**: `51.21.111.113`
- **Deploy User**: `arthive`
- **SSH Key Format**: RSA (valid for deployment)

---

## Step 1: Add SSH Private Key to GitHub Secrets

### Method 1: Using GitHub Web Interface (Easiest)

1. Go to your GitHub repository
2. Click **Settings** (gear icon)
3. In left sidebar, click **Secrets and variables**
4. Click **Actions**
5. Click **New repository secret**
6. Enter Secret name: `SSH_PRIVATE_KEY`
7. **Copy the entire contents of your SSH private key file** and paste into the value field

Your SSH key file is at: `C:\Users\HP\.ssh\ArtHive.pem.txt`

```
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA1utafh3GiwTy0Osc...
(entire key content)
...
-----END RSA PRIVATE KEY-----
```

8. Click **Add secret**

### Method 2: Using GitHub CLI

```bash
# Install GitHub CLI if you haven't: https://cli.github.com/

# Login to GitHub
gh auth login

# Add the secret
gh secret set SSH_PRIVATE_KEY -b "< C:\Users\HP\.ssh\ArtHive.pem.txt"
```

---

## Step 2: Verify SSH Key is Added

In GitHub:
1. Go to **Settings → Secrets and variables → Actions**
2. You should see `SSH_PRIVATE_KEY` listed

---

## Step 3: Test SSH Connection (Optional but Recommended)

### From Your Local Machine

```bash
# Test SSH connection to your server
ssh -i C:\Users\HP\.ssh\ArtHive.pem.txt arthive@51.21.111.113

# If successful, you'll see:
# Welcome to Ubuntu ...

# Exit with: exit
```

### Troubleshooting SSH Connection

If you get permission denied:
```bash
# Check if the key is readable
ls -la C:\Users\HP\.ssh\ArtHive.pem.txt

# Try connecting with more verbose output
ssh -v -i C:\Users\HP\.ssh\ArtHive.pem.txt arthive@51.21.111.113

# Common issues:
# 1. Wrong key file - verify it's the correct private key
# 2. Wrong username - make sure it's 'arthive' user
# 3. Key permissions - should be readable by user only
```

---

## Step 4: Deploy!

Once SSH key is added to GitHub Secrets:

1. Make a change to your code
2. Commit and push to `main` branch:
   ```bash
   git add .
   git commit -m "Deploy update"
   git push origin main
   ```

3. GitHub Actions will automatically:
   - Pull your code
   - Install dependencies
   - Build frontend
   - Deploy to your server
   - Verify services are running

4. Watch deployment in real-time:
   - Go to GitHub repo
   - Click **Actions** tab
   - Click the latest workflow run
   - Watch the logs

---

## What the Workflow Does

```
Your Push to main
        ↓
GitHub Actions triggered
        ↓
SSH into server (using your private key)
        ↓
Update code from GitHub
        ↓
Verify .env files exist ✓
        ↓
Verify ML model exists ⚠️
        ↓
Create upload directories
        ↓
Stop current services
        ↓
Install backend npm packages
        ↓
Install Python ML dependencies
        ↓
Install frontend npm packages
        ↓
Build React frontend
        ↓
Start services with systemd
        ↓
Verify both services are running
        ↓
✅ Done!
```

---

## Server Access After Deployment

Once deployed, you can access:

### Frontend
```
http://51.21.111.113:3000
```

### Backend API
```
http://51.21.111.113:3001
```

### SSH into Server
```bash
ssh -i C:\Users\HP\.ssh\ArtHive.pem.txt arthive@51.21.111.113
```

### View Backend Logs
```bash
ssh -i C:\Users\HP\.ssh\ArtHive.pem.txt arthive@51.21.111.113 \
  'sudo journalctl -u arthive-backend -f'
```

### View Frontend Logs
```bash
ssh -i C:\Users\HP\.ssh\ArtHive.pem.txt arthive@51.21.111.113 \
  'sudo journalctl -u arthive-frontend -f'
```

### Restart Services
```bash
ssh -i C:\Users\HP\.ssh\ArtHive.pem.txt arthive@51.21.111.113 \
  'sudo systemctl restart arthive-backend arthive-frontend'
```

---

## Deployment Status Checks

### Check if deployment succeeded
```bash
# In GitHub Actions logs, look for:
# ✅ Deployment Complete!

# Or manually check:
ssh -i C:\Users\HP\.ssh\ArtHive.pem.txt arthive@51.21.111.113 \
  'sudo systemctl status arthive-backend arthive-frontend'
```

### If deployment fails
1. Check GitHub Actions logs (shows error details)
2. SSH to server and check:
   ```bash
   cd /var/www/arthive
   ls -la                          # Verify structure
   cat arthive-backend/.env        # Verify config
   sudo systemctl status arthive-backend    # Check service
   sudo journalctl -u arthive-backend -n 50  # View errors
   ```

---

## Important Notes

✅ **Good to Know:**
- SSH key is stored securely in GitHub Secrets (encrypted)
- SSH key is not visible in workflow logs
- Workflow only needs SSH_PRIVATE_KEY (not the public key)
- Your server IP (51.21.111.113) is hardcoded in workflow (not a secret)
- Your username (arthive) is hardcoded in workflow

❌ **Never Do:**
- Don't share your private SSH key
- Don't commit .env files to GitHub
- Don't add SSH key to regular code

---

## Troubleshooting

### "SSH connection failed" in GitHub Actions
```
Possible causes:
1. SSH key not properly added to GitHub Secrets
2. SSH key not in authorized_keys on server
3. Server IP is wrong (should be 51.21.111.113)
4. Deployment user is wrong (should be arthive)

Solution:
- Verify SSH key in GitHub Secrets
- SSH manually and test: ssh arthive@51.21.111.113
- Check server logs
```

### "Permission denied" error
```
This means SSH key isn't properly authorized on server.

Solution:
1. SSH to server with root or another admin account
2. Add the public key to arthive user's authorized_keys:
   
   ssh -i admin_key root@51.21.111.113
   cat >> /home/arthive/.ssh/authorized_keys << 'EOF'
   (paste content from C:\Users\HP\.ssh\ArtHive.pem.pub here)
   EOF
   
   OR if you only have the private key:
   ssh-keygen -y -f C:\Users\HP\.ssh\ArtHive.pem.txt
   # This shows the public key
```

### Services not starting after deployment
```bash
# Check what went wrong:
ssh -i C:\Users\HP\.ssh\ArtHive.pem.txt arthive@51.21.111.113 << 'EOF'
  sudo journalctl -u arthive-backend -n 100  # Last 100 lines
  sudo systemctl status arthive-backend -l   # With long lines
EOF
```

---

## Next Steps

1. ✅ Add SSH_PRIVATE_KEY to GitHub Secrets
2. ✅ Test: `git push origin main`
3. ✅ Watch: GitHub Actions tab
4. ✅ Access: http://51.21.111.113:3000

---

## Quick Reference

| What | Command |
|------|---------|
| Test SSH | `ssh -i C:\Users\HP\.ssh\ArtHive.pem.txt arthive@51.21.111.113` |
| View logs | `ssh ... 'sudo journalctl -u arthive-backend -f'` |
| Restart | `ssh ... 'sudo systemctl restart arthive-backend arthive-frontend'` |
| Check status | `ssh ... 'sudo systemctl status arthive-backend'` |
| Deploy | `git push origin main` |

---

**Configuration Status**: ✅ Ready to Deploy!

After adding SSH key to GitHub Secrets, your workflow will:
- ✅ Automatically deploy on every push to main
- ✅ Use your SSH private key to connect to server
- ✅ Pull latest code
- ✅ Install dependencies
- ✅ Build and start services
- ✅ Verify everything is working
