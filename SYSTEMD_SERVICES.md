# Systemd Service Files for ArtHive

These service files are created automatically by the setup-server.sh script.
If you need to modify them, edit the files at:
- `/etc/systemd/system/arthive-backend.service`
- `/etc/systemd/system/arthive-frontend.service`

Then run:
```bash
sudo systemctl daemon-reload
sudo systemctl restart arthive-backend arthive-frontend
```

---

## Backend Service (`arthive-backend.service`)

```ini
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
```

**Key Features:**
- Runs as `arthive` user (non-root for security)
- Auto-restarts on failure
- Loads environment variables from `.env` file
- Logs to systemd journal
- Starts after network is available

---

## Frontend Service (`arthive-frontend.service`)

```ini
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
```

**Key Features:**
- Runs as `arthive` user
- Listens on all interfaces (0.0.0.0)
- Uses npm start to serve the built React app
- Auto-restarts on failure
- Logs to systemd journal

---

## Common Systemd Commands

```bash
# View all services
sudo systemctl list-units --type=service

# Start service
sudo systemctl start arthive-backend

# Stop service
sudo systemctl stop arthive-backend

# Restart service
sudo systemctl restart arthive-backend

# Enable on boot
sudo systemctl enable arthive-backend

# Disable on boot
sudo systemctl disable arthive-backend

# View service status
sudo systemctl status arthive-backend

# View logs
sudo journalctl -u arthive-backend -f

# View last 50 lines
sudo journalctl -u arthive-backend -n 50

# View logs since last boot
sudo journalctl -u arthive-backend -b

# Filter by priority (err, warn, info, debug)
sudo journalctl -u arthive-backend -p err

# Reload systemd daemon after editing service files
sudo systemctl daemon-reload
```

---

## Restart Behavior

Both services are configured with:
```ini
Restart=on-failure
RestartSec=10
StartLimitIntervalSec=60
StartLimitBurst=3
```

This means:
- Service restarts automatically if it crashes
- Waits 10 seconds between restart attempts
- If service fails 3 times within 60 seconds, it stops trying
- Manual restart required if restart limit is exceeded

---

## Monitoring Services

### Check if services are running
```bash
sudo systemctl is-active arthive-backend
sudo systemctl is-active arthive-frontend
```

### Get service status details
```bash
sudo systemctl show arthive-backend
```

### Monitor in real-time
```bash
watch -n 1 'sudo systemctl status arthive-backend'
```

---

## Troubleshooting Services

### Service fails to start
```bash
# Check logs for error messages
sudo journalctl -u arthive-backend -n 100

# Check if .env file exists
ls -la /var/www/arthive/arthive-backend/.env

# Check if Node.js is installed
which node
node --version
```

### Service keeps restarting
```bash
# View recent logs
sudo journalctl -u arthive-backend --no-pager

# Check if port is already in use
sudo lsof -i :3001

# Check file permissions
ls -la /var/www/arthive/arthive-backend/
```

### Port already in use
```bash
# Find process using port
sudo lsof -i :3001

# Kill the process
sudo kill -9 <PID>

# Or use
sudo fuser -k 3001/tcp
```

---

## Advanced Configuration

### Increase resource limits
Edit `/etc/systemd/system/arthive-backend.service` and add:
```ini
[Service]
LimitNOFILE=65536
LimitNPROC=8192
MemoryLimit=1G
```

### Set environment-specific variables
Edit the service file:
```ini
Environment="DEBUG=arthive:*"
Environment="LOG_LEVEL=debug"
```

### Change working directory
Modify `WorkingDirectory` in the service file

### Change startup order
Use `After=` and `Before=` directives:
```ini
After=postgresql.service
Before=nginx.service
```

---

## Performance Tuning

### Increase file descriptor limit
```bash
sudo systemctl edit arthive-backend
```
Add:
```ini
[Service]
LimitNOFILE=65536
```

### Monitor process
```bash
ps aux | grep node
top -p <PID>
```

### View memory usage
```bash
sudo pmap -x $(pgrep -f 'node server.js')
```

---

## Backup & Recovery

### Backup service files
```bash
sudo cp /etc/systemd/system/arthive-backend.service ~/backup/
sudo cp /etc/systemd/system/arthive-frontend.service ~/backup/
```

### Restore service files
```bash
sudo cp ~/backup/arthive-backend.service /etc/systemd/system/
sudo cp ~/backup/arthive-frontend.service /etc/systemd/system/
sudo systemctl daemon-reload
```

---

## See Also
- [DEPLOYMENT_GUIDE_NO_DOCKER.md](DEPLOYMENT_GUIDE_NO_DOCKER.md) - Full deployment guide
- [DEPLOYMENT_QUICK_REFERENCE.md](DEPLOYMENT_QUICK_REFERENCE.md) - Quick reference commands
- [setup-server.sh](setup-server.sh) - Server setup automation script
