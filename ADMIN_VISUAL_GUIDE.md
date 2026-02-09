# Admin Dashboard - Visual Setup Guide

## 🚀 Quick Visual Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    STEP 1: Create Admin Account              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Terminal Command:                                            │
│  cd arthive-backend                                           │
│  node scripts/createAdmin.js admin@arthive.com Admin@123 ... │
│                                                               │
│  Database Updated:                                            │
│  INSERT INTO users                                            │
│  (email, password_hash, user_type) VALUES                     │
│  ('admin@arthive.com', '<hashed>', 'admin')                   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│            STEP 2: Start Backend & Frontend                  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Backend:        Frontend:                                    │
│  Terminal 1      Terminal 2                                   │
│  │               │                                            │
│  └─ npm start    └─ npm start                                 │
│     :3001           :3000                                     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│         STEP 3: Go to Login Page (Browser)                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Open: http://localhost:3000                                 │
│                                                               │
│  ┌─────────────────────────────┐                             │
│  │        Sign In              │                             │
│  ├─────────────────────────────┤                             │
│  │ Email:  admin@arthive.com   │                             │
│  │ Password: ••••••••••••••    │                             │
│  │                             │                             │
│  │  [Sign In Button]           │                             │
│  │  Don't have account? Sign up│                             │
│  └─────────────────────────────┘                             │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│          STEP 4: Login & Auto-Redirect                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Backend Checks:                                              │
│  1. Email exists? ✓                                           │
│  2. Password matches? ✓                                       │
│  3. user_type = 'admin'? ✓                                    │
│                                                               │
│  Response:                                                    │
│  {                                                            │
│    "token": "eyJhbGc...",                                     │
│    "user": {                                                  │
│      "user_type": "admin",  ← KEY!                            │
│      "email": "admin@arthive.com"                             │
│    }                                                          │
│  }                                                            │
│                                                               │
│  Frontend Logic:                                              │
│  if (user_type === 'admin') {                                 │
│    navigate('/admin')  ← Redirect!                            │
│  }                                                            │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│        STEP 5: Admin Dashboard (URL: /admin)                 │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Admin Dashboard                                         │ │
│  ├─────────────────────────────────────────────────────────┤ │
│  │                                                         │ │
│  │  Statistics:                                            │ │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │ │
│  │  │ 156     │ │ 42      │ │ 1823    │ │ $45,000 │       │ │
│  │  │ Artworks│ │ Artists │ │ Buyers  │ │ Revenue │       │ │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘       │ │
│  │                                                         │ │
│  │  Tabs:                                                  │ │
│  │  ├─ Tab 1: Pending Artworks (with Approve/Reject)      │ │
│  │  ├─ Tab 2: Pending Artists (with Approve/Reject)       │ │
│  │  └─ Tab 3: All Buyers (view list)                      │ │
│  │                                                         │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔑 Key Points to Remember

### **Where is Admin Dashboard?**
- **URL**: `http://localhost:3000/admin`
- **Access**: Only after admin login
- **Redirect**: Automatic after successful admin login

### **How to Access?**
**Option 1: Direct URL** (after login)
```
http://localhost:3000/admin
```

**Option 2: Header Menu** (after login)
```
Click User Avatar → "Admin Dashboard"
```

### **Admin Login Credentials**
```
Email: admin@arthive.com
Password: Admin@12345
```
*(Or whatever credentials you created with the script)*

---

## 📊 What You Can Do in Admin Dashboard

### **Tab 1: Pending Artworks**
```
Artwork Submissions
├─ Review image
├─ Check artist name
├─ See price & description
└─ Approve ✓ or Reject ✗
```

### **Tab 2: Pending Artists** ⭐ IMPORTANT
```
Artist Profile Reviews
├─ View profile photo
├─ Read bio
├─ Check social media
├─ See specialization
└─ Approve → Artist can upload artworks
   Reject → Artist cannot upload artworks
```

### **Tab 3: All Buyers**
```
Buyer Management
├─ Name & Email
├─ Registration date
├─ Number of orders
└─ Account status (active/inactive)
```

---

## 🔄 Complete User Onboarding Flow

```
┌──────────────────┐
│  ADMIN (You)     │
│                  │
│ 1. Create via    │
│    Node script   │
│ 2. Login         │
│ 3. Manage users  │
└──────────────────┘

         │
         ├──→ ┌─────────────────┐
         │    │ ARTIST (User)   │
         │    │                 │
         │    │ 1. Self-signup  │
         │    │ 2. Complete     │
         │    │    profile      │
         │    │ 3. Wait pending │
         │    │ 4. Approved by  │
         │    │    admin → Can  │
         │    │    upload works │
         │    └─────────────────┘
         │
         └──→ ┌─────────────────┐
              │ BUYER (User)    │
              │                 │
              │ 1. Self-signup  │
              │ 2. Active now   │
              │ 3. Browse arts  │
              │ 4. Add to cart  │
              │ 5. Checkout    │
              └─────────────────┘
```

---

## ✅ Verification Checklist

Before you start, verify:

- [ ] Backend running on `http://localhost:3001`
- [ ] Frontend running on `http://localhost:3000`
- [ ] Admin account created: `admin@arthive.com`
- [ ] Database contains user with `user_type='admin'`
- [ ] Can login with admin credentials
- [ ] Redirected to `/admin` after login
- [ ] Can see statistics and tabs
- [ ] Can approve/reject items

---

## 🎯 Next Steps After Login

1. **Tab 2 (Pending Artists)**
   - Review any pending artist profiles
   - Click "Approve" to verify them
   - They can then upload artworks

2. **Tab 1 (Pending Artworks)**
   - Review artwork submissions
   - Click "Approve" to make them visible in marketplace
   - Click "Reject" to decline

3. **Tab 3 (All Buyers)**
   - Monitor buyer registrations
   - Track user engagement
   - See order counts

---

## 🚨 If Admin Dashboard Doesn't Show

1. **Check you're logged in**: Look at header for profile avatar
2. **Check URL**: Make sure you're at `http://localhost:3000/admin`
3. **Check user_type**: Open DevTools → Application → Local Storage → Look for 'user' key
4. **Refresh page**: Ctrl+Shift+R (hard refresh)
5. **Check backend**: Is `http://localhost:3001` running?
6. **Check browser console**: F12 → Console tab for errors

---

## 📞 Support Files

For more details, see:
- `QUICK_ADMIN_SETUP.md` - Fast setup
- `ADMIN_SETUP_DETAILED.md` - Detailed guide
- `arthive-backend/ADMIN_LOGIN_GUIDE.md` - Backend info

---

**You're all set! Your admin dashboard is ready to use! 🎉**
