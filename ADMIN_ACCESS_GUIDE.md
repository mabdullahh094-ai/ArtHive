# Admin Dashboard - Where to Login & Access Guide

## ✅ What Has Been Fixed

1. ✅ **Login Page** - Now redirects admins to `/admin` dashboard after login
2. ✅ **Header Navigation** - Admin users now see "Admin Dashboard" link in their menu
3. ✅ **Routing** - `/admin` route is properly configured in the app

---

## 📋 Complete Admin Access Flow

### **Step 1: Create Admin Account**

Open terminal and run:
```bash
cd d:\FYP\arthive-backend
node scripts/createAdmin.js admin@arthive.com Admin@12345 John Admin
```

Output:
```
🔐 Admin Account Creation
✅ Admin account created successfully!

Admin Details:
Email: admin@arthive.com
Name: John Admin
User Type: admin
```

---

### **Step 2: Start the Frontend & Backend**

Make sure both servers are running:

**Backend** (Terminal 1):
```bash
cd d:\FYP\arthive-backend
npm start
# Runs on http://localhost:3001
```

**Frontend** (Terminal 2):
```bash
cd d:\FYP\arthive-frontend
npm start
# Runs on http://localhost:3000
```

---

### **Step 3: Login as Admin**

1. Open browser: `http://localhost:3000`
2. Click **Login** (or go to `http://localhost:3000/login`)
3. Enter credentials:
   - **Email**: `admin@arthive.com`
   - **Password**: `Admin@12345`
4. Click **Sign In**

---

### **Step 4: Access Admin Dashboard**

After login, you will be **automatically redirected** to:
```
http://localhost:3000/admin
```

**OR** click "Admin Dashboard" from the header menu (top-right dropdown)

---

## 📊 Admin Dashboard Overview

Once logged in, you'll see:

### **Statistics Cards**
- 📈 **Total Artworks** (with pending count)
- 👨‍🎨 **Total Artists** (with pending count)  
- 👥 **Total Buyers**
- 💰 **Total Revenue**

### **3 Management Tabs**

#### **Tab 1: Pending Artworks**
- Review artwork submissions
- **Approve** → Makes artwork visible in marketplace
- **Reject** → Artwork removed, artist notified

#### **Tab 2: Pending Artists** ⭐
- Review artist profiles who need verification
- Check:
  - ✓ Profile photo
  - ✓ Bio
  - ✓ Social media links
  - ✓ Specialization
- **Approve** → Artist can upload artworks
- **Reject** → Artist cannot upload

#### **Tab 3: All Buyers**
- View all registered buyers
- See: Name, Email, Join Date, Status, Order Count
- Monitor user growth

---

## 🎯 Quick Navigation

| Task | URL | Steps |
|------|-----|-------|
| **Login** | `http://localhost:3000/login` | Enter email & password |
| **Admin Dashboard** | `http://localhost:3000/admin` | Automatic after admin login |
| **Approve Artists** | `/admin` Tab 2 | Click "Approve" button |
| **Approve Artworks** | `/admin` Tab 1 | Click "Approve" button |
| **View Buyers** | `/admin` Tab 3 | View all buyers list |
| **Logout** | Click header menu | Select "Logout" |

---

## 🔑 Login Credentials (Example)

```
Email: admin@arthive.com
Password: Admin@12345
```

---

## 📍 Admin Dashboard URL

Direct access (if already logged in):
```
http://localhost:3000/admin
```

---

## ✨ Features Available in Admin Dashboard

✅ Approve/Reject pending artworks  
✅ Verify artist profiles before upload  
✅ View all registered buyers  
✅ Monitor platform statistics  
✅ Track total revenue  
✅ See pending approvals count  

---

## 🆘 Troubleshooting

### "Admin Dashboard not showing"
- ✅ Ensure you're logged in as admin user_type='admin'
- ✅ Check localStorage (F12 → Application → Local Storage)
- ✅ Verify token is present and not expired
- ✅ Refresh page (Ctrl+R)

### "Redirecting to home instead of admin"
- ✅ Backend didn't return user_type='admin'
- ✅ Check database: `SELECT email, user_type FROM users WHERE email='admin@arthive.com';`
- ✅ Verify script created admin correctly

### "Login page says 'Invalid credentials'"
- ✅ Double-check email and password
- ✅ Verify admin account exists in database
- ✅ Check backend is running: `http://localhost:3001`

### "Cannot see Admin Dashboard link in header"
- ✅ Refresh page completely (Ctrl+Shift+R)
- ✅ Clear browser cache
- ✅ Check token in localStorage contains user_type='admin'

---

## 🔐 Security Notes

- Admin accounts can **only be created by system administrator** using the script
- No self-registration for admin (prevents unauthorized access)
- All admin actions are logged and traceable
- JWT tokens expire after 24 hours (re-login required)
- Admin has access to all sensitive operations

---

## 📝 Summary

**To access admin dashboard:**
1. ✅ Create admin account: `node scripts/createAdmin.js ...`
2. ✅ Start both servers (backend + frontend)
3. ✅ Go to: `http://localhost:3000/login`
4. ✅ Login with admin email & password
5. ✅ Automatically redirected to: `http://localhost:3000/admin`
6. ✅ Use dashboard to manage artists, artworks, and buyers

---

**Now you're ready to manage your platform! 🚀**
