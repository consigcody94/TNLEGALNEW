# Dropbox Integration Setup (OAuth Refresh Token)

## Overview

Dropbox now uses **short-lived access tokens** (4 hours) + **refresh tokens** (never expire) for security. This guide will help you set up long-term access using refresh tokens.

---

## Step 1: Create/Configure Your Dropbox App

1. Go to [Dropbox App Console](https://www.dropbox.com/developers/apps)
2. Click **Create app** (or select your existing app)
3. Choose:
   - **Scoped access**
   - **Full Dropbox** or **App folder** (Full Dropbox recommended)
   - Give it a name (e.g., "TN Legal File Uploads")
4. Click **Create app**

---

## Step 2: Configure App Permissions

1. In your app, go to **Permissions** tab
2. Check these permissions:
   - ✅ `files.metadata.write`
   - ✅ `files.metadata.read`
   - ✅ `files.content.write`
   - ✅ `files.content.read`
3. Click **Submit** at the bottom

---

## Step 3: Get Your App Credentials

1. Go to **Settings** tab
2. Find and copy these values (you'll need them later):
   - **App key** (also called Client ID)
   - **App secret** (click "Show" to reveal it)

---

## Step 4: Generate Refresh Token

### Option A: Use Helper Script (Easiest!) ⭐

We've included a helper script to make this super easy:

1. Run this command in your project directory:
   ```bash
   node scripts/get-dropbox-refresh-token.js
   ```

2. Follow the prompts:
   - Enter your App Key
   - Enter your App Secret
   - Open the URL it gives you in your browser
   - Click "Allow" on Dropbox
   - Copy the authorization code and paste it back

3. The script will display your refresh token - **copy it!**

### Option B: Manual OAuth Flow (Advanced)

If you prefer to do it manually:

1. Go to this URL (replace `YOUR_APP_KEY` with your actual app key):
   ```
   https://www.dropbox.com/oauth2/authorize?client_id=YOUR_APP_KEY&token_access_type=offline&response_type=code
   ```

2. You'll be redirected to Dropbox - click **Allow**

3. You'll see an **authorization code** on the page - copy it

4. Now exchange the code for a refresh token using this **curl command**:

   **On Mac/Linux:**
   ```bash
   curl https://api.dropbox.com/oauth2/token \
     -d code=YOUR_AUTHORIZATION_CODE \
     -d grant_type=authorization_code \
     -d client_id=YOUR_APP_KEY \
     -d client_secret=YOUR_APP_SECRET
   ```

   **On Windows (PowerShell):**
   ```powershell
   curl -X POST https://api.dropbox.com/oauth2/token -d "code=YOUR_AUTHORIZATION_CODE&grant_type=authorization_code&client_id=YOUR_APP_KEY&client_secret=YOUR_APP_SECRET"
   ```

5. You'll get a JSON response like this:
   ```json
   {
     "access_token": "sl.xxx...",
     "token_type": "bearer",
     "expires_in": 14400,
     "refresh_token": "YOUR_REFRESH_TOKEN_HERE",
     "scope": "...",
     "uid": "...",
     "account_id": "..."
   }
   ```

6. **Copy the `refresh_token` value** - this is what you need!

---

## Step 5: Add Credentials to Netlify

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Select your site
3. Go to **Site settings** → **Environment variables**
4. Add these **three** environment variables:

   | Key | Value |
   |-----|-------|
   | `DROPBOX_APP_KEY` | Your app key from Step 3 |
   | `DROPBOX_APP_SECRET` | Your app secret from Step 3 |
   | `DROPBOX_REFRESH_TOKEN` | Your refresh token from Step 4 |

5. Click **Save**

---

## Step 6: Setup Email Notifications (Netlify Forms)

1. In Netlify Dashboard, go to **Site settings** → **Forms**
2. Click **Form notifications**
3. Click **Add notification** → **Email notification**
4. Configure:
   - **Event to listen for**: New form submission
   - **Form**: Select `notary-request`
   - **Email to notify**: `info@tnlegal.ca`
5. Click **Save**

---

## Step 7: Deploy Your Site

1. Commit and push your code changes:
   ```bash
   git add .
   git commit -m "Add Dropbox OAuth refresh token support"
   git push
   ```

2. Or manually trigger deploy in Netlify:
   - Go to **Deploys** tab
   - Click **Trigger deploy** → **Clear cache and deploy site**

---

## How It Works

### Complete Flow:

1. **User fills out form** → Uploads files
2. **Netlify Function gets refresh token** → From environment variables
3. **Function requests new access token** → Using refresh token (lasts 4 hours)
4. **Files upload to Dropbox** → Using fresh access token
5. **Files auto-named:** `FirstName LastName - DocumentType - 2025-10-20 - filename.pdf`
6. **Form submitted to Netlify Forms** → Email sent to info@tnlegal.ca

### Why Refresh Tokens?

- ✅ **Access tokens** expire after 4 hours (security)
- ✅ **Refresh tokens** never expire
- ✅ Function automatically gets new access tokens as needed
- ✅ No manual intervention required

---

## File Naming & Location

Uploaded files are saved to:
```
/notary-uploads/
  ├── John Smith - Affidavit - 2025-10-20 - doc1.pdf
  ├── Jane Doe - Statutory Declaration - 2025-10-20 - doc2.pdf
  └── ...
```

Format: `FirstName LastName - DocumentType - YYYY-MM-DD - original-filename.pdf`

---

## Troubleshooting

### "Server configuration error - missing credentials"
- **Cause:** Not all environment variables are set in Netlify
- **Solution:** Make sure you added all 3 variables: `DROPBOX_APP_KEY`, `DROPBOX_APP_SECRET`, `DROPBOX_REFRESH_TOKEN`

### "Failed to refresh token" error
- **Cause:** Invalid app credentials or refresh token
- **Solution:**
  1. Double-check your app key and app secret in Dropbox App Console
  2. Generate a new refresh token using the OAuth flow in Step 4
  3. Update all 3 environment variables in Netlify

### "missing_scope" error
- **Cause:** App doesn't have required permissions
- **Solution:**
  1. Go to Dropbox App Console → Permissions tab
  2. Enable all file permissions (metadata + content read/write)
  3. **Generate a NEW refresh token** (old tokens don't get new permissions automatically)

### Files not appearing in Dropbox
- Check `/notary-uploads/` folder in your Dropbox
- Check Netlify Function logs: **Functions** → **dropbox-upload**

### Not receiving email notifications
- Go to **Site settings** → **Forms** → **Form notifications**
- Verify email notification is configured for `notary-request` form
- Check spam/junk folder

---

## Testing Locally

To test locally:

1. Create `.env` file in project root:
   ```
   DROPBOX_APP_KEY=your_app_key
   DROPBOX_APP_SECRET=your_app_secret
   DROPBOX_REFRESH_TOKEN=your_refresh_token
   ```

2. Run:
   ```bash
   npm run dev
   ```

3. Visit `http://localhost:8888/services-request.html`

4. Test file upload

**⚠️ Never commit `.env` to Git!**

---

## Security Notes

✅ Refresh token stored securely in Netlify environment
✅ App secret never exposed to browser
✅ Access tokens generated server-side only
✅ Users can only upload, not access your Dropbox
✅ Tokens automatically refreshed as needed

---

## Need Help?

If you get stuck:
1. Check Netlify Function logs
2. Check browser console for errors
3. Verify all environment variables are set correctly
4. Make sure app has correct permissions enabled
