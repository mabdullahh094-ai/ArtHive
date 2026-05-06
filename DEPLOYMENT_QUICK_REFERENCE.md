# ArtHive Deployment Quick Reference

## 🚀 Quick Deploy Steps

```bash
# 1. On your server (one time setup)
bash ~/setup-server.sh

# 2. Create .env files (as shown in DEPLOYMENT_GUIDE_NO_DOCKER.md)
# Fill in database credentials, API keys, etc.

# 3. Upload ML model
scp best_model.pt arthive@SERVER:/var/www/arthive/models/image_price_regressor_feedback_v2/

# 4. Add GitHub Secrets (SERVER_IP, SSH_PRIVATE_KEY, etc.)
# Go to: GitHub repo → Settings → Secrets and variables → Actions

# 5. Push to main branch
git push origin main

# That's it! GitHub Actions will deploy automatically
```

---

## 📋 GitHub Secrets Checklist

- [ ] `SERVER_IP` - Your server IP
- [ ] `SSH_PRIVATE_KEY` - Private SSH key for arthive user
- [ ] `DB_HOST` - Database hostname
- [ ] `DB_NAME` - Database name
- [ ] `DB_USER` - Database username
- [ ] `DB_PASSWORD` - Database password
- [ ] `JWT_SECRET` - Random string (use: `openssl rand -base64 32`)
- [ ] `STRIPE_SECRET_KEY` - From Stripe dashboard
- [ ] `STRIPE_PUBLISHABLE_KEY` - From Stripe dashboard
- [ ] `EMAIL_SERVICE` - (sendgrid, gmail, or smtp)
- [ ] `EMAIL_USER` - Email address
- [ ] `EMAIL_PASSWORD` - Email password/app token
- [ ] `EMAIL_FROM` - Sender email
- [ ] `SENDGRID_API_KEY` - SendGrid API key (if using SendGrid)

---

## 🔍 Common Commands

### Check service status
```bash
ssh arthive@SERVER 'sudo systemctl status arthive-backend'
ssh arthive@SERVER 'sudo systemctl status arthive-frontend'
ssh arthive@SERVER 'sudo systemctl status nginx'
```

### View logs
```bash
# Last 50 lines
ssh arthive@SERVER 'sudo journalctl -u arthive-backend -n 50'

# Follow logs in real-time
ssh arthive@SERVER 'sudo journalctl -u arthive-backend -f'

# Nginx error logs
ssh arthive@SERVER 'sudo tail -f /var/log/nginx/error.log'

# Nginx access logs
ssh arthive@SERVER 'sudo tail -f /var/log/nginx/access.log'
```

### Restart services
```bash
ssh arthive@SERVER 'sudo systemctl restart arthive-backend'
ssh arthive@SERVER 'sudo systemctl restart arthive-frontend'
ssh arthive@SERVER 'sudo systemctl restart nginx'

# Or restart all at once
ssh arthive@SERVER 'sudo systemctl restart arthive-backend arthive-frontend nginx'
```

### Reload Nginx (graceful - no connection drop)
```bash
ssh arthive@SERVER 'sudo systemctl reload nginx'
```

### Test Nginx configuration
```bash
ssh arthive@SERVER 'sudo nginx -t'
```

### Manual deployment (without GitHub)
```bash
ssh arthive@SERVER << 'EOF'
cd /var/www/arthive
git fetch origin main
git reset --hard origin/main
cd arthive-backend && npm ci --omit=dev && cd ..
cd arthive-frontend && npm ci --omit=dev && npm run build && cd ..
sudo systemctl restart arthive-backend
sudo systemctl restart arthive-frontend
EOF
```

### Check disk space
```bash
ssh arthive@SERVER 'df -h'
```

### Check running processes
```bash
ssh arthive@SERVER 'ps aux | grep node'
```

---

## ⚠️ Troubleshooting

### Port already in use
```bash
# Find process using port 3001
ssh arthive@SERVER 'sudo lsof -i :3001'

# Kill it
ssh arthive@SERVER 'sudo lsof -i :3001 -t | xargs sudo kill -9'
```

### Service won't start
```bash
# Check logs for errors
ssh arthive@SERVER 'sudo journalctl -u arthive-backend -n 100'

# Check if .env file exists
ssh arthive@SERVER 'cat /var/www/arthive/arthive-backend/.env | head -5'

# Check permissions
ssh arthive@SERVER 'ls -la /var/www/arthive/arthive-backend/'
```

### Database connection failed
```bash
# Test from server
ssh arthive@SERVER 'psql -h DB_HOST -U DB_USER -d DB_NAME -c "SELECT 1"'

# Check .env
ssh arthive@SERVER 'grep DB_ /var/www/arthive/arthive-backend/.env'
```

### ML model not found
```bash
ssh arthive@SERVER 'ls -la /var/www/arthive/models/image_price_regressor_feedback_v2/'
```

### High CPU/Memory usage
```bash
ssh arthive@SERVER 'htop'
# Press 'q' to exit

ssh arthive@SERVER 'free -h'  # Check memory
```

---

## 🌐 Accessing Your Application

### Main Access (via Nginx)
```
http://51.21.111.113
```
- Frontend automatically served at: `/`
- API automatically routed to: `/api/`

### Direct Access (if needed)
```
Frontend: http://51.21.111.113:3000
Backend API: http://51.21.111.113:3001
```

### Verify Nginx is working
```bash
# Check Nginx status
ssh arthive@SERVER 'sudo systemctl status nginx'

# Test configuration
ssh arthive@SERVER 'sudo nginx -t'

# Check if listening on port 80
ssh arthive@SERVER 'sudo lsof -i :80'
```

| Aspect | Non-Docker | Docker |
|--------|-----------|--------|
| Memory | ~300-500 MB | 1-2 GB |
| CPU | Lower | Higher |
| Startup time | 30 seconds | 2+ minutes |
| Update time | 1-2 minutes | 5-10 minutes |
| Simplicity | Medium | High |
| Troubleshooting | Easier | Complex |

---

## 🔐 Security Checklist

- [ ] SSH key authentication only (no passwords)
- [ ] Firewall configured (`sudo ufw enable`)
- [ ] HTTPS with Let's Encrypt (optional)
- [ ] Secrets in GitHub (never in code)
- [ ] Regular updates (`apt-get upgrade`)
- [ ] Database backups scheduled
- [ ] Log monitoring set up

---

## 📞 Support

If deployment fails:
1. Check GitHub Actions logs
2. SSH to server and check service logs
3. Verify all environment variables are set
4. Ensure database is accessible
5. Check file permissions on `/var/www/arthive`

---

## 🎯 Performance Optimization

- Monitor with `htop` on server
- Enable PostgreSQL slow query logging
- Use CDN for static assets
- Enable Nginx gzip compression
- Set up database connection pooling
- Monitor Node.js memory usage

---

## 📝 Maintenance Tasks

### Weekly
- Check disk space: `df -h`
- Review error logs
- Monitor resource usage

### Monthly
- Update packages: `apt-get upgrade`
- Review database size
- Check backup status

### As needed
- Update dependencies
- Review access logs
- Performance optimization

---

Generated: 2024
Last Updated: 2024
