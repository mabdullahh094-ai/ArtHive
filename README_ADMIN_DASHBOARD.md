# ✅ ADMIN DASHBOARD - COMPLETE SETUP & ACCESS GUIDE

## 🎯 Quick Answer: Where is the Admin Dashboard?

**URL**: `http://localhost:3000/admin`

**Access**: Only visible/accessible after you login as an admin user

---

## 🚀 5-Minute Setup

### Step 1: Create Admin Account (Terminal)
```bash
cd d:\FYP\arthive-backend
node scripts/createAdmin.js admin@arthive.com Admin@12345 John Admin
```

### Step 2: Start Servers
```bash
# Terminal 1 - Backend
cd d:\FYP\arthive-backend
npm start

# Terminal 2 - Frontend
cd d:\FYP\arthive-frontend
npm start
```

### Step 3: Login as Admin
- Go to: `http://localhost:3000/login`
- Email: `admin@arthive.com`
- Password: `Admin@12345`
- Click Login

### Step 4: Access Admin Dashboard
- **Automatic redirect** to: `http://localhost:3000/admin`
- **Or** click "Admin Dashboard" from header menu

---

## 📊 What You'll See in Admin Dashboard

### Statistics Cards
- Total Artworks (pending count)
- Total Artists (pending count)
- Total Buyers
- Total Revenue

### 3 Management Tabs

| Tab | Name | Purpose |
|-----|------|---------|
| 1 | Pending Artworks | Approve/Reject artwork submissions |
| 2 | Pending Artists | Verify artist profiles (they can upload after approval) |
| 3 | All Buyers | View registered buyers |

---

## 🔄 Admin Control Flow

```
You (Admin)                Artist (User)              Buyer (User)
    │                           │                          │
    ├─ Login                     │                          │
    │  @admin                    │                          │
    │                            │                          │
    ├─ See Pending Artists ◄────┤ Signup & Complete       │
    │                            │ Profile (Pending)        │
    │                            │                          │
    ├─ Approve Artist ────────►  ├─ Now can upload art      │
    │                            │  (4+ images)             │
    │                            │                          │
    ├─ See Pending Artworks ◄────┤ Submit artworks          │
    │                            │ (waiting approval)        │
    │                            │                          │
    ├─ Approve Artwork ─────────────────────────────────►  │
    │                                                       │
    │                                                       │
    └────────────────────────────────────────┬─ Browse     │
                                              │  approved   │
                                              │  artworks   │
                                              ├─ Add cart  │
                                              └─ Checkout  │
```

---

## ✨ Key Features

✅ **Approve/Reject Artists**
- Artists must be verified before uploading
- You control who can upload on platform

✅ **Approve/Reject Artworks**
- Review submissions from verified artists
- Approve to make visible in marketplace
- Reject if not suitable

✅ **View All Buyers**
- Monitor user registrations
- Track buyer engagement
- See order history

✅ **Dashboard Statistics**
- Real-time platform metrics
- Pending items count
- Revenue tracking

---

## 🔐 Admin vs Regular Users

| Feature | Admin | Artist | Buyer |
|---------|-------|--------|-------|
| Can Login | ✓ | ✓ | ✓ |
| Access `/admin` | ✓ | ✗ | ✗ |
| Approve Artists | ✓ | ✗ | ✗ |
| Approve Artworks | ✓ | ✗ | ✗ |
| Upload Artworks | ✗ | ✓ (if verified) | ✗ |
| Browse & Buy | ✗ | ✓ | ✓ |

---

## 🆘 Troubleshooting

### Issue: "Page not found when going to /admin"
**Solution**: 
- Make sure you're logged in (check header avatar)
- Refresh page (Ctrl+Shift+R)
- Verify user_type='admin' in localStorage (F12 → Application)

### Issue: "Redirecting to home after login instead of admin"
**Solution**:
- Check database: `SELECT user_type FROM users WHERE email='admin@arthive.com';`
- Should show: `admin`
- If wrong, admin account wasn't created properly

### Issue: "Invalid credentials" on login
**Solution**:
- Double-check email and password
- Verify admin account exists: `SELECT * FROM users WHERE email='admin@arthive.com';`
- Run creation script again if needed

### Issue: "Cannot see Admin Dashboard link in header menu"
**Solution**:
- You might not be logged in as admin
- Check localStorage (F12 → Application → user object)
- user_type should be 'admin'
- Hard refresh (Ctrl+Shift+R)

---

## 📍 All Important URLs

| Page | URL |
|------|-----|
| **Home** | `http://localhost:3000` |
| **Login** | `http://localhost:3000/login` |
| **Admin Dashboard** | `http://localhost:3000/admin` |
| **Artist Signup** | `http://localhost:3000/artist/register` |
| **Buyer Signup** | `http://localhost:3000/register` |
| **Backend API** | `http://localhost:3001/api` |

---

## 📝 Admin Database Info

**Created with:**
```bash
node scripts/createAdmin.js admin@arthive.com Admin@12345 John Admin
```

**Database Check:**
```sql
SELECT id, email, user_type, status, created_at 
FROM users 
WHERE user_type = 'admin';
```

**Expected Result:**
```
id | email             | user_type | status | created_at
1  | admin@arthive.com | admin     | active | 2026-01-19
```

---

## 🎯 First Time Admin Tasks

1. **Go to Pending Artists tab**
   - Review artist profiles
   - Click "Approve" for approved artists
   - They can now upload artworks

2. **Go to Pending Artworks tab**
   - Review artwork submissions
   - Click "Approve" to make visible in marketplace
   - Click "Reject" to decline

3. **Go to All Buyers tab**
   - Monitor buyer registrations
   - Track user growth

4. **Check Statistics**
   - See real-time platform metrics
   - Monitor pending items count

---

## 🔑 Login Credentials (Example)

```
Email: admin@arthive.com
Password: Admin@12345
```

---

## 📦 Files Related to Admin

- `arthive-backend/scripts/createAdmin.js` - Admin creation script
- `arthive-frontend/src/pages/admin/AdminPanel.js` - Dashboard component
- `arthive-backend/controllers/admin.controller.js` - Backend logic
- `arthive-backend/routes/admin.routes.js` - API routes
- `arthive-backend/middleware/auth.js` - Admin verification

---

## 🚀 You're Ready!

The admin dashboard is fully functional and ready to use. 

**To access it:**
1. Create admin account with the script
2. Login with admin credentials
3. Go to `/admin`
4. Start managing your platform!

---

**Questions? Check:**
- `ADMIN_ACCESS_GUIDE.md` - Detailed access guide
- `ADMIN_VISUAL_GUIDE.md` - Visual flow diagrams
- `QUICK_ADMIN_SETUP.md` - Quick reference

**Happy managing! 🎉**
