# Admin Login & Setup Instructions

## ❓ Why Can't Admin Sign Up?

Admin accounts **cannot be created through the regular signup page** for security reasons. This prevents unauthorized users from creating admin accounts. Only system administrators can create admin accounts using a dedicated script.

---

## 📋 How to Create an Admin Account

### **Step 1: Open Terminal/Command Prompt**

Navigate to the backend folder:
```bash
cd d:\FYP\arthive-backend
```

### **Step 2: Run Admin Creation Script**

**Option A: Interactive Mode (Easiest)**
```bash
node scripts/createAdmin.js
```

Then follow the prompts:
```
🔐 Admin Account Creation

Enter admin email: admin@arthive.com
Enter admin password: Admin@12345
Confirm admin password: Admin@12345
Enter first name: John
Enter last name: Admin

✅ Admin account created successfully!

Admin Details:
Email: admin@arthive.com
Name: John Admin
User Type: admin
Created: 1/19/2026, 10:30:15 AM

📌 Login at: http://localhost:3000/login
📌 Then access admin dashboard at: http://localhost:3000/admin
```

**Option B: Command Line Mode (Faster)**
```bash
node scripts/createAdmin.js admin@arthive.com Admin@12345 John Admin
```

---

## 🔑 How to Login as Admin

### **Step 1: Go to Login Page**
Open your browser and navigate to:
```
http://localhost:3000/login
```

### **Step 2: Enter Admin Credentials**
- **Email**: `admin@arthive.com` (or the email you created)
- **Password**: `Admin@12345` (or the password you set)

### **Step 3: Click Login**
You will be automatically redirected to the Admin Dashboard:
```
http://localhost:3000/admin
```

---

## 📊 Admin Dashboard Overview

Once logged in, you'll see the admin dashboard with:

### **Dashboard Statistics**
- 📈 Total Artworks (with pending count)
- 👨‍🎨 Total Artists (with pending count)
- 👥 Total Buyers
- 💰 Total Revenue

### **3 Management Tabs**

#### **Tab 1: Pending Artworks**
- View artworks waiting for approval
- **Approve**: Make artwork visible in marketplace
- **Reject**: Decline artwork (artist receives notification)

#### **Tab 2: Pending Artists** ⭐ Important
- Review artist profile completions
- Check:
  - Artist profile photo
  - Bio
  - Social media links
  - Specialization
- **Approve**: Artist can now upload artworks
- **Reject**: Artist cannot upload artworks

#### **Tab 3: All Buyers**
- View all registered buyers
- See registration date, email, order count
- Monitor user growth

---

## ✨ Complete User Flow

```
ADMIN SETUP
├─ Run: node scripts/createAdmin.js
├─ Enter: Email, Password, Name
└─ Login at http://localhost:3000/login

        ↓

ARTIST REGISTRATION (Self-Sign Up)
├─ Go to: http://localhost:3000/artist/register
├─ Fill: Name, Email, Password
├─ Complete Profile (Dashboard)
│  ├─ Upload Profile Photo
│  ├─ Write Bio
│  ├─ Add Social Media Links
│  └─ Status: PENDING
├─ Upload Portfolio (4+ images)
└─ Waiting for Admin Approval

        ↓

ADMIN APPROVAL (Your Job!)
├─ Go to: /admin/artists (Pending Artists Tab)
├─ Review Artist Profile
├─ Click: "Approve" or "Reject"
└─ Artist gets notification

        ↓

ARTIST CAN NOW UPLOAD ARTWORKS
├─ Artist logs in
├─ Goes to Dashboard
├─ Uploads artworks (4+ images)
└─ Admin reviews in "Pending Artworks" tab

        ↓

BUYER BROWSING & PURCHASING
├─ Register/Login as Buyer
├─ Browse approved artworks
├─ Add to Cart/Wishlist
└─ Checkout
```

---

## 🔒 Security Notes

✅ **Admin accounts are created manually only**  
✅ **Passwords are hashed with bcrypt**  
✅ **JWT tokens expire after 24 hours**  
✅ **Admin routes are protected by middleware**  

---

## 🆘 Troubleshooting

### Problem: "Script command not found"
**Solution:**
1. Check you're in `arthive-backend` directory
2. Run: `npm install` (to ensure all dependencies)
3. Try: `node scripts/createAdmin.js`

### Problem: "Database connection failed"
**Solution:**
1. Check PostgreSQL is running
2. Verify `.env` file has correct database credentials
3. Test connection: `psql -U postgres -h localhost`

### Problem: "Cannot login with admin credentials"
**Solution:**
1. Double-check email and password are correct
2. Verify in database:
   ```sql
   SELECT email, user_type, status FROM users WHERE email='admin@arthive.com';
   ```
3. Should show: `admin@arthive.com | admin | active`

### Problem: "Admin dashboard shows error"
**Solution:**
1. Check browser console (F12) for errors
2. Check backend logs
3. Verify JWT token is stored (check localStorage)
4. Refresh page

---

## 📝 Create Multiple Admins

You can create multiple admin accounts for different staff:

```bash
node scripts/createAdmin.js manager1@arthive.com Manager@123 John Smith
node scripts/createAdmin.js manager2@arthive.com Manager@456 Jane Doe
```

Each admin has the same access and permissions.

---

## 🎯 Quick Reference

| Action | URL | Credentials |
|--------|-----|-------------|
| Login | `http://localhost:3000/login` | email + password |
| Admin Dashboard | `http://localhost:3000/admin` | Admin only |
| Review Artists | `/admin` → Tab 2 | Pending Artists |
| Approve Artworks | `/admin` → Tab 1 | Pending Artworks |
| View Buyers | `/admin` → Tab 3 | All Buyers |
| Artist Signup | `/artist/register` | N/A |
| Buyer Signup | `/register` | N/A |

---

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Review backend console logs
3. Check frontend browser console (F12)
4. Verify database connection

---

**Happy Managing! 🚀**
