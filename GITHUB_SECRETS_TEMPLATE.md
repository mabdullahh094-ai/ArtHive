# GitHub Secrets Template for ArtHive Deployment

Add these secrets to your GitHub repository:
**Settings → Secrets and variables → Actions → New repository secret**

---

## Server Configuration

### `SERVER_IP`
**Value**: Your server's IP address or domain name
```
Example: 192.168.1.100
Example: example.com
```

### `SSH_PRIVATE_KEY`
**Value**: Your private SSH key (entire key with BEGIN/END lines)

Generate with:
```bash
ssh-keygen -t ed25519 -f arthive-deploy-key -N "" -C "arthive-deploy"
cat arthive-deploy-key
```

Copy entire output:
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUtbm9uZS1ub25lAAAAAF...
(entire key content)
...
-----END OPENSSH PRIVATE KEY-----
```

---

## Database Configuration

### `DB_HOST`
**Value**: Database server hostname
```
Example: localhost (if on same server)
Example: 192.168.1.50
Example: db.example.com
```

### `DB_PORT`
**Value**: PostgreSQL port (usually 5432)
```
Example: 5432
```

### `DB_NAME`
**Value**: Database name
```
Example: arthive_db
```

### `DB_USER`
**Value**: Database username
```
Example: arthive_user
```

### `DB_PASSWORD`
**Value**: Database password (strong password!)
```
Generate with: openssl rand -base64 32
```

---

## Authentication & JWT

### `JWT_SECRET`
**Value**: Random string for JWT token signing

Generate with:
```bash
openssl rand -base64 32
```

---

## Stripe Payment

### `STRIPE_SECRET_KEY`
**Value**: From Stripe Dashboard → Developers → API Keys
```
Example: sk_test_51KL3p...
```

### `STRIPE_PUBLISHABLE_KEY`
**Value**: From Stripe Dashboard → Developers → API Keys
```
Example: pk_test_51KL3p...
```

### `STRIPE_WEBHOOK_SECRET` (Optional)
**Value**: From Stripe Dashboard → Developers → Webhooks
```
Example: whsec_1...
```

---

## Email Configuration

### `EMAIL_SERVICE`
**Value**: Email service provider
```
Options: sendgrid, gmail, smtp
Example: sendgrid
```

### `EMAIL_USER`
**Value**: Email address for sending
```
Example: your-email@gmail.com
Example: noreply@arthive.com
```

### `EMAIL_PASSWORD`
**Value**: Email password or app-specific password

For Gmail:
```
1. Enable 2-factor authentication
2. Generate app password
3. Use that password here (not your regular password!)
```

For SendGrid:
```
This field is not used; use SENDGRID_API_KEY instead
```

### `EMAIL_FROM`
**Value**: Sender email address for notifications
```
Example: noreply@arthive.com
Example: support@arthive.com
```

---

## SendGrid Email Service

### `SENDGRID_API_KEY`
**Value**: From SendGrid Dashboard → Settings → API Keys
```
Example: SG.kK...
```

---

## Environment Specific

### `NODE_ENV`
**Value**: Environment type
```
Example: production
```

### `LOG_LEVEL`
**Value**: Logging level (optional)
```
Options: error, warn, info, debug
Example: info
```

---

## Adding Secrets to GitHub

1. Go to your GitHub repository
2. Click **Settings** (gear icon)
3. In left sidebar, click **Secrets and variables**
4. Click **Actions**
5. Click **New repository secret**
6. Enter secret name and value
7. Click **Add secret**

Repeat for each secret above.

---

## Verification

After adding all secrets, verify:

```bash
# From GitHub CLI
gh secret list -R owner/repo

# Or check manually in GitHub UI
# Settings → Secrets and variables → Actions
# You should see all secrets listed
```

---

## Security Best Practices

✅ **DO:**
- Use strong, random passwords for database
- Regenerate `JWT_SECRET` for each environment
- Keep secrets secure in GitHub (not in code)
- Rotate API keys regularly
- Use API keys with minimal required permissions

❌ **DON'T:**
- Commit `.env` files to git
- Share secrets via email or chat
- Use simple/guessable passwords
- Commit hardcoded secrets anywhere
- Push private SSH keys to GitHub

---

## Environment Variables Reference

Once deployed, these secrets are used to create `.env` files on your server:

### Backend `.env` (created from secrets)
```
NODE_ENV=production
PORT=3001
DB_HOST=<DB_HOST>
DB_PORT=<DB_PORT>
DB_NAME=<DB_NAME>
DB_USER=<DB_USER>
DB_PASSWORD=<DB_PASSWORD>
JWT_SECRET=<JWT_SECRET>
CORS_ORIGIN=http://<SERVER_IP>:3000
STRIPE_SECRET_KEY=<STRIPE_SECRET_KEY>
EMAIL_SERVICE=<EMAIL_SERVICE>
EMAIL_USER=<EMAIL_USER>
EMAIL_PASSWORD=<EMAIL_PASSWORD>
EMAIL_FROM=<EMAIL_FROM>
SENDGRID_API_KEY=<SENDGRID_API_KEY>
MODEL_DIR=/var/www/arthive/models
```

### Frontend `.env` (created from secrets)
```
REACT_APP_API_URL=http://<SERVER_IP>:3001
REACT_APP_STRIPE_KEY=<STRIPE_PUBLISHABLE_KEY>
```

---

## Troubleshooting

### "Deployment failed" in GitHub Actions
Check if all required secrets are set:
```bash
gh secret list -R owner/repo
```

### "Invalid secret format" error
- SSH key must include BEGIN/END lines
- No extra quotes around values
- Check for line breaks in secrets

### Deployment says "SSH connection failed"
- Verify `SERVER_IP` is correct
- Verify `SSH_PRIVATE_KEY` is valid
- Check public key is on server: `cat ~/.ssh/authorized_keys`

### Database connection errors
- Verify `DB_HOST`, `DB_USER`, `DB_PASSWORD`
- Test connection manually: `psql -h $DB_HOST -U $DB_USER -d $DB_NAME`

---

## Quick Copy-Paste Template

```
SERVER_IP=
SSH_PRIVATE_KEY=-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----

DB_HOST=localhost
DB_PORT=5432
DB_NAME=arthive_db
DB_USER=arthive_user
DB_PASSWORD=

JWT_SECRET=

STRIPE_SECRET_KEY=sk_test_
STRIPE_PUBLISHABLE_KEY=pk_test_

EMAIL_SERVICE=sendgrid
EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_FROM=noreply@arthive.com
SENDGRID_API_KEY=SG.
```

---

## See Also
- [DEPLOYMENT_SETUP_COMPLETE.md](DEPLOYMENT_SETUP_COMPLETE.md) - Setup overview
- [DEPLOYMENT_GUIDE_NO_DOCKER.md](DEPLOYMENT_GUIDE_NO_DOCKER.md) - Full deployment guide
- [setup-server.sh](setup-server.sh) - Server setup script
