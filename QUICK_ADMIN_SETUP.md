# Quick Admin Setup (TL;DR)

## In 2 Minutes ⚡

### 1️⃣ Create Admin Account
```bash
cd d:\FYP\arthive-backend
node scripts/createAdmin.js admin@arthive.com Admin@12345 John Admin
```

### 2️⃣ Login
- Go to: `http://localhost:3000/login`
- Email: `admin@arthive.com`
- Password: `Admin@12345`

### 3️⃣ Access Admin Dashboard
- Automatically redirected to: `http://localhost:3000/admin`
- ✅ Can approve/reject artists and artworks
- ✅ Can view all buyers
- ✅ Can see dashboard statistics

---

## Why Manual Admin Creation?
🔒 **Security**: Prevents unauthorized admin access  
🛡️ **Control**: Only designated people can be admins  
📝 **Audit**: Admin creation is traceable

---

## File Locations
- **Creation Script**: `arthive-backend/scripts/createAdmin.js`
- **Detailed Guide**: `ADMIN_SETUP_DETAILED.md` (in root)
- **Backend Guide**: `arthive-backend/ADMIN_LOGIN_GUIDE.md`

---

## Command Line Options

**Interactive (Prompts for input):**
```bash
node scripts/createAdmin.js
```

**Direct (Fastest):**
```bash
node scripts/createAdmin.js email@example.com Password123 FirstName LastName
```

---

That's it! 🎉 You now have admin access!
