# Email Notification Setup Guide

## Overview
When an artist completes their profile and submits their portfolio, an automatic email is sent to the admin at **arthive231@gmail.com** with all artist details.

## Setup Instructions

### 1. Install Dependencies
```bash
cd arthive-backend
npm install
```

This will install the `nodemailer` package that was added to package.json.

### 2. Configure Email Settings

#### Create .env file
If you don't have a `.env` file in `arthive-backend/`, create one:

```bash
cp .env.example .env
```

#### Get Gmail App Password
Since you're using Gmail (arthive231@gmail.com), you need to create an **App Password**:

1. Go to your Google Account: https://myaccount.google.com/
2. Select **Security**
3. Under "How you sign in to Google," select **2-Step Verification** (enable it if not already enabled)
4. At the bottom, select **App passwords**
5. Select app: **Mail**
6. Select device: **Other (Custom name)** → Type "ArtHive Backend"
7. Click **Generate**
8. Copy the 16-character password (something like: `abcd efgh ijkl mnop`)

#### Update .env file
Open `arthive-backend/.env` and add/update these lines:

```env
# Email Configuration
EMAIL_USER=arthive231@gmail.com
EMAIL_PASSWORD=your_16_character_app_password_here
ADMIN_EMAIL=arthive231@gmail.com
```

**Important:** Replace `your_16_character_app_password_here` with the actual App Password you generated (remove spaces).

### 3. Start the Server

```bash
cd arthive-backend
npm start
```

## How It Works

### Artist Flow:
1. Artist signs up with email, password, name
2. Artist logs in
3. Artist goes to their dashboard
4. Artist uploads portfolio (minimum 4 images) with specialization
5. Artist can optionally upload a certificate
6. Artist clicks "Submit"

### What Happens:
1. Portfolio images are saved in `arthive-backend/uploads/artist_portfolio/`
2. Artworks are created in database with `status='pending'`
3. Artist details are updated in database
4. **Email is automatically sent to admin** at arthive231@gmail.com

### Email Contains:
- Artist's full name
- Artist's email
- Artist ID
- Bio
- Specialization
- Website URL (if provided)
- Certificate status
- Social media links (if provided)
- List of all uploaded artworks with titles and image paths
- Verification status

## Testing

### Test the Email Functionality:

1. Create a test artist account:
   - Go to signup page
   - Select "Artist" user type
   - Fill in details and create account

2. Login with artist credentials

3. Complete artist profile:
   - Upload at least 4 portfolio images
   - Add specialization
   - Optionally upload certificate
   - Click Submit

4. Check admin email (arthive231@gmail.com):
   - You should receive an email with subject: "🎨 New Artist Profile: [Artist Name]"
   - Email contains all artist details and artwork information

## Troubleshooting

### Email Not Sending?

1. **Check Console Logs:**
   - Look for: `✅ Artist profile notification email sent to admin:`
   - Or error: `❌ Error sending artist profile notification email:`

2. **Verify Gmail Settings:**
   - Make sure 2-Step Verification is enabled
   - Use App Password, not regular Gmail password
   - Check .env file has correct credentials

3. **Check Gmail Security:**
   - Login to arthive231@gmail.com
   - Check for any security alerts
   - You may need to allow "Less secure app access" or confirm it's you

4. **Test Email Configuration:**
   ```bash
   cd arthive-backend
   node -e "require('./config/email').createTransporter().verify().then(console.log).catch(console.error)"
   ```

### Common Issues:

1. **"Invalid login"** error:
   - Use App Password, not regular password
   - Remove any spaces from App Password

2. **"Authentication failed"**:
   - Verify 2-Step Verification is enabled
   - Generate a new App Password

3. **No error but email not received:**
   - Check spam/junk folder
   - Verify ADMIN_EMAIL in .env is correct
   - Check Gmail sending limits (500 emails/day)

## Files Modified

1. **package.json** - Added nodemailer dependency
2. **config/email.js** - Email transporter configuration
3. **services/emailService.js** - Email sending logic
4. **controllers/artist.controller.js** - Added email trigger on portfolio upload
5. **.env.example** - Email configuration template

## Environment Variables

Required in `.env`:
```env
EMAIL_USER=arthive231@gmail.com        # Gmail account to send from
EMAIL_PASSWORD=your_app_password        # Gmail App Password (16 chars)
ADMIN_EMAIL=arthive231@gmail.com       # Admin email to receive notifications
```

## Security Notes

- Never commit `.env` file to git
- Use App Passwords, not regular passwords
- Keep EMAIL_PASSWORD secure
- Consider using environment variables in production
- Limit email sending rate if needed

## Next Steps

1. Install dependencies: `npm install`
2. Configure Gmail App Password
3. Update .env file
4. Restart server
5. Test with a new artist registration

---

**Admin Email:** arthive231@gmail.com
**Status:** Ready to receive artist profile notifications ✅
