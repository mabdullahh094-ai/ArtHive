# Admin Login Guide - ArtHive

## How Admin Accounts Work

Unlike buyers and artists who can self-register, **admin accounts must be created manually** by a system administrator. This is a security best practice to prevent unauthorized admin access.

## Step 1: Create Admin Account

### Option A: Using the Admin Creation Script (Recommended)

Run this command from the project root:

```bash
cd arthive-backend
node scripts/createAdmin.js
```

This will prompt you for:
- **Email**: Admin login email (must be unique)
- **Password**: Admin password (minimum 8 characters)
- **Confirm Password**: Re-enter password to confirm
- **First Name**: Admin's first name
- **Last Name**: Admin's last name

**Example:**
```
Enter admin email: admin@arthive.com
Enter admin password: Admin@123456
Confirm admin password: Admin@123456
Enter first name: John
Enter last name: Admin

✅ Admin account created successfully!

Admin Details:
Email: admin@arthive.com
Name: John Admin
User Type: admin
Created: 1/19/2026, 10:30:15 AM
```

### Option B: Direct Database Insert

If the script doesn't work, you can insert directly into PostgreSQL:

```sql
-- Connect to your database first
-- Then run this query (replace values as needed)

INSERT INTO users (email, password_hash, first_name, last_name, user_type, status)
VALUES (
  'admin@arthive.com',
  '$2a$10$...',  -- bcrypt hashed password
  'John',
  'Admin',
  'admin',
  'active'
);
```

**To generate a bcrypt hash**, use Node.js:
```javascript
const bcrypt = require('bcryptjs');
bcrypt.hash('YourPassword123', 10).then(hash => console.log(hash));
```

## Step 2: Login as Admin

### Frontend Login (React App)

1. Go to **http://localhost:3000/login**
2. Enter:
   - **Email**: `admin@arthive.com` (or your admin email)
   - **Password**: `Admin@123456` (or your admin password)
3. Click **Login**
4. You will be redirected to the **Admin Dashboard** at `/admin`

### Admin Dashboard Access

- **URL**: http://localhost:3000/admin
- **Permissions**: 
  - View pending artworks for approval/rejection
  - View pending artists for verification
  - View all buyers/users
  - See dashboard statistics
  - Manage artist verification status

## Step 3: Verify Admin Access

The admin dashboard shows:

### 1. **Statistics Cards**
   - Total Artworks (with pending count)
   - Total Artists (with pending count)
   - Total Buyers
   - Total Revenue

### 2. **Three Management Tabs**

   **Tab 1: Pending Artworks**
   - Review artwork submissions
   - Approve/Reject artworks
   
   **Tab 2: Pending Artists** ⭐
   - Review artist profile completions
   - Approve/Reject artist verification
   - Artists can only upload after approval
   
   **Tab 3: All Buyers**
   - View registered buyers
   - Track buyer information and orders

## Complete User Onboarding Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    USER REGISTRATION FLOW                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ADMIN (Manual Creation Only)                                │
│  ├─ Run: node scripts/createAdmin.js                        │
│  ├─ Verify in Database                                      │
│  └─ Login at /login                                          │
│                                                               │
│  ARTIST (Self-Register)                                      │
│  ├─ Signup at /artist/register                              │
│  ├─ Create Artist Profile → Status: PENDING                 │
│  ├─ Upload Portfolio (4+ images)                            │
│  ├─ Admin Reviews & Approves                                │
│  ├─ Status Changes to VERIFIED                              │
│  └─ Can Now Upload Artworks                                 │
│                                                               │
│  BUYER (Self-Register)                                       │
│  ├─ Signup at /register                                     │
│  ├─ Status: ACTIVE                                          │
│  ├─ Can Browse & Add to Cart/Wishlist                       │
│  └─ Can Checkout & Place Orders                             │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Troubleshooting

### "Admin dashboard not accessible"
- ✅ Ensure you're logged in (check localStorage for token)
- ✅ Verify user_type is 'admin' in database
- ✅ Check JWT token expiry (default 24 hours)

### "Invalid credentials error when logging in"
- ✅ Double-check email and password
- ✅ Verify account exists: `SELECT * FROM users WHERE email='admin@arthive.com';`
- ✅ Ensure user_type is 'admin': `SELECT user_type FROM users WHERE email='admin@arthive.com';`

### "Script not found"
- ✅ Navigate to `arthive-backend` directory
- ✅ Ensure Node.js and npm dependencies installed
- ✅ Run: `npm install bcryptjs` if needed

### "Cannot connect to database"
- ✅ Check database is running: PostgreSQL service status
- ✅ Verify `.env` has correct DB_* variables
- ✅ Test connection: `psql -U postgres -h localhost`

## Security Notes

🔒 **Best Practices:**
- Never share admin credentials
- Change default admin password after first login
- Use strong passwords (minimum 12 characters recommended)
- Regularly audit admin activities
- Create multiple admin accounts with different responsibilities
- Revoke admin access when not needed

## Default Test Admin (Development Only)

For quick testing, you can create a default admin:

```bash
node scripts/createAdmin.js
# Email: admin@test.com
# Password: Test@12345
```

## API Endpoint for Admin Operations

**Base URL**: `http://localhost:3001/api/admin`

Protected by: `auth.verifyToken` + `auth.isAdmin` middleware

### Endpoints:
```
GET    /admin/stats              → Dashboard statistics
GET    /admin/artworks           → Pending artworks
PUT    /admin/artworks/:id       → Approve/Reject artwork
GET    /admin/artists            → Pending artists
PUT    /admin/artists/:id        → Approve/Reject artist
GET    /admin/buyers             → All buyers list
```

---

**Need Help?** Contact the development team or check the admin logs for detailed error messages.
