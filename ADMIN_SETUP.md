# Quick Start: Admin Setup

## 1. Create Admin Account

```bash
cd arthive-backend
node scripts/createAdmin.js
```

Follow the prompts to create admin account.

## 2. Login as Admin

Go to: `http://localhost:3000/login`

Enter your admin email and password.

## 3. Access Admin Dashboard

You'll be automatically redirected to: `http://localhost:3000/admin`

## Admin Features

✅ **Pending Artworks** - Approve/Reject artwork submissions
✅ **Pending Artists** - Verify artist profiles before they can upload
✅ **All Buyers** - View registered users
✅ **Dashboard Stats** - See platform statistics

---

**Why Manual Admin Creation?**
- Security: Prevents unauthorized admin access
- Control: Only designated people can be admins
- Audit: Admin creation is traceable

For detailed information, see: `arthive-backend/ADMIN_LOGIN_GUIDE.md`
