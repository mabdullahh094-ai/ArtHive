# Nginx Configuration for ArtHive

Your server is set up with Nginx as a reverse proxy. This guide explains the Nginx setup and how to manage it.

---

## What Nginx Does

Nginx acts as a **reverse proxy** for your ArtHive application:

```
User Request (http://51.21.111.113)
         ↓
    Nginx (port 80)
         ↓
    Routes to:
    - Frontend: localhost:3000 (React app)
    - Backend: localhost:3001 (API endpoints)
         ↓
    Sends response back to user
```

**Benefits:**
- Single entry point (no need to remember ports)
- Can serve static files efficiently
- Can handle SSL/HTTPS
- Better performance with caching
- Professional setup

---

## Nginx Configuration Location

Your Nginx config is likely at one of these locations:

```bash
# Main config
/etc/nginx/nginx.conf

# Site-specific config
/etc/nginx/sites-available/arthive
/etc/nginx/sites-enabled/arthive

# Or possibly in config.d
/etc/nginx/conf.d/arthive.conf
```

---

## Typical Nginx Configuration for ArtHive

Here's what your Nginx setup probably looks like:

```nginx
# /etc/nginx/sites-available/arthive
upstream backend {
    server localhost:3001;
}

upstream frontend {
    server localhost:3000;
}

server {
    listen 80;
    server_name 51.21.111.113;

    client_max_body_size 10M;

    # API routes
    location /api/ {
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

    # Frontend (React app)
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Check Current Nginx Configuration

```bash
# SSH to your server
ssh -i C:\Users\HP\.ssh\ArtHive.pem.txt arthive@51.21.111.113

# Test Nginx configuration
sudo nginx -t

# View Nginx status
sudo systemctl status nginx

# View Nginx config (main)
sudo cat /etc/nginx/nginx.conf

# View site-specific config
sudo cat /etc/nginx/sites-available/arthive
```

---

## Common Nginx Commands

### Check if Nginx is running
```bash
sudo systemctl status nginx
```

### Start Nginx
```bash
sudo systemctl start nginx
```

### Stop Nginx
```bash
sudo systemctl stop nginx
```

### Restart Nginx (full restart)
```bash
sudo systemctl restart nginx
```

### Reload Nginx (graceful reload - doesn't drop connections)
```bash
sudo systemctl reload nginx
```

### Enable Nginx on boot
```bash
sudo systemctl enable nginx
```

### Check Nginx logs
```bash
# Access logs (successful requests)
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log

# Both combined
sudo tail -f /var/log/nginx/error.log /var/log/nginx/access.log
```

---

## Testing Nginx Configuration

After any changes, **always test** before reloading:

```bash
# Test syntax
sudo nginx -t

# If you see "successful", it's valid
# If there are errors, fix them first
```

---

## Common Issues & Fixes

### Nginx won't start
```bash
# Check logs
sudo systemctl status nginx -l
sudo journalctl -u nginx -n 50

# Test config
sudo nginx -t

# Check if port 80 is in use
sudo lsof -i :80
```

### "502 Bad Gateway" error
```bash
# This means Nginx can't reach backend/frontend
# Check if services are running:
sudo systemctl status arthive-backend
sudo systemctl status arthive-frontend

# Check if ports are open:
sudo lsof -i :3000
sudo lsof -i :3001

# Check Nginx error log:
sudo tail -f /var/log/nginx/error.log
```

### "Connection refused"
```bash
# Backend service may not be running
sudo systemctl start arthive-backend

# Or check if it crashed:
sudo journalctl -u arthive-backend -n 100
```

### Requests timing out
```bash
# Increase Nginx timeout in config
sudo nano /etc/nginx/sites-available/arthive

# Add these to the proxy sections:
proxy_connect_timeout 600;
proxy_send_timeout 600;
proxy_read_timeout 600;

# Then test and reload:
sudo nginx -t
sudo systemctl reload nginx
```

---

## Update Deployment Access

The GitHub Actions workflow now:
1. ✅ Verifies Nginx is running
2. ✅ Tests Nginx configuration
3. ✅ Reloads Nginx after deployment

So your app is automatically served through Nginx!

---

## Access Your App Through Nginx

After deployment:

```
http://51.21.111.113
```

That's it! Nginx will route:
- `/` → Frontend (React app)
- `/api/` → Backend (API endpoints)
- Everything else → Frontend (for React routing)

---

## Nginx Optimization Tips

### 1. Enable Gzip Compression
Add to `/etc/nginx/sites-available/arthive`:
```nginx
gzip on;
gzip_types text/plain text/css text/javascript application/json;
gzip_vary on;
```

### 2. Cache Static Files
```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 3. Set Timeouts
```nginx
proxy_connect_timeout 60s;
proxy_send_timeout 60s;
proxy_read_timeout 60s;
```

### 4. Add Security Headers
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
```

---

## SSL/HTTPS Setup (Optional)

To add HTTPS with Let's Encrypt:

```bash
ssh -i C:\Users\HP\.ssh\ArtHive.pem.txt arthive@51.21.111.113

# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate (replace with your domain/IP)
sudo certbot --nginx -d your-domain.com

# Certbot will automatically update your Nginx config!
# Renew automatically:
sudo systemctl enable certbot.timer
```

---

## Restart Services Through Nginx

When you deploy:

```bash
# Services restart automatically
# Nginx reloads automatically
# No downtime! ✅
```

The workflow handles this in the background.

---

## Monitor Nginx Performance

```bash
# Check active connections
sudo ss -an | grep :80 | wc -l

# View detailed stats
sudo ss -an | grep :80

# Monitor in real-time
watch -n 1 'sudo ss -an | grep :80 | wc -l'
```

---

## View Nginx Access Logs

```bash
# Last 50 requests
sudo tail -n 50 /var/log/nginx/access.log

# Follow in real-time
sudo tail -f /var/log/nginx/access.log

# Count requests
sudo wc -l /var/log/nginx/access.log

# Parse user agents
sudo awk '{print $12}' /var/log/nginx/access.log | sort | uniq -c | sort -nr
```

---

## Common Commands Reference

```bash
# Check status
sudo systemctl status nginx

# Test config
sudo nginx -t

# Reload (graceful)
sudo systemctl reload nginx

# Restart (full)
sudo systemctl restart nginx

# View config
sudo cat /etc/nginx/sites-available/arthive

# View error log
sudo tail -f /var/log/nginx/error.log

# View access log
sudo tail -f /var/log/nginx/access.log
```

---

## Important Notes

✅ **Remember:**
- Always test config with `sudo nginx -t` before reloading
- Use `reload` for graceful updates (no connection drop)
- Use `restart` if reload doesn't work
- Check logs if requests fail

❌ **Don't:**
- Edit Nginx config without testing
- Restart Nginx constantly
- Run Nginx as root if possible

---

## See Also
- [DEPLOYMENT_QUICK_REFERENCE.md](DEPLOYMENT_QUICK_REFERENCE.md) - Common commands
- [SSH_KEY_SETUP.md](SSH_KEY_SETUP.md) - SSH setup
- [READY_TO_DEPLOY.md](READY_TO_DEPLOY.md) - Deployment checklist
