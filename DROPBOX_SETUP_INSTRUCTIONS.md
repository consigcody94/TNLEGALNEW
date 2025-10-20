# Dropbox Integration + Email Notification Setup

## ⚠️ IMPORTANT: Secure Your API Token

**NEVER commit your Dropbox API token to Git or include it in your code.**

The token must be added as an **environment variable** in Netlify, not in your code files.

---

## Step 1: Add Dropbox Token to Netlify

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Select your site (tnlegal.ca or your site name)
3. Go to **Site settings** → **Environment variables**
4. Click **Add a variable**
5. Add:
   - **Key**: `DROPBOX_TOKEN`
   - **Value**: [Paste your Dropbox access token]
   - **Scopes**: Select "All scopes"
6. Click **Save**

---

## Step 2: Setup Email Notifications (Netlify Forms)

Netlify Forms will automatically email you when someone submits the form:

1. In Netlify Dashboard, go to **Site settings** → **Forms**
2. Click **Form notifications**
3. Click **Add notification** → **Email notification**
4. Configure:
   - **Event to listen for**: New form submission
   - **Form**: Select `notary-request`
   - **Email to notify**: `info@tnlegal.ca`
5. Click **Save**

That's it! No SMTP setup needed - Netlify handles everything.

---

## Step 3: Redeploy Your Site

After adding the Dropbox token:

1. Go to **Deploys** tab in Netlify
2. Click **Trigger deploy** → **Clear cache and deploy site**

OR simply push a new commit to your Git repository to trigger a deployment.

---

## How It Works

### Complete Flow:

1. **User fills out form** → Enters name, email, phone, service type, and uploads files
2. **JavaScript reads files** → Converts to base64 in browser
3. **Files sent to Netlify Function** → `/.netlify/functions/dropbox-upload`
4. **Function uploads to Dropbox** → Using secure token from environment variables
5. **Files are auto-named:** `FirstName LastName - DocumentType - 2025-10-20 - filename.pdf`
6. **Form data submitted to Netlify Forms** → All form fields saved
7. **Netlify sends email** → info@tnlegal.ca receives notification with all form details

### Security Features:

✅ Dropbox token stored in Netlify environment (never in code)
✅ Token never exposed to browser/client
✅ Function runs server-side only
✅ Users can only upload files, not view/access your Dropbox
✅ No SMTP credentials needed

---

## File Naming Format

Uploaded files are automatically renamed to:

```
FirstName LastName - DocumentType - 2025-10-20 - original-filename.pdf
```

Example:
```
John Smith - Affidavit - 2025-10-20 - document.pdf
```

This makes it easy to organize and find files in Dropbox.

---

## Dropbox Folder Structure

All files are uploaded to:
```
/notary-uploads/
  ├── John Smith - Affidavit - 2025-10-20 - doc1.pdf
  ├── Jane Doe - Statutory Declaration - 2025-10-20 - doc2.pdf
  └── ...
```

You can change this folder path by editing the `dropboxPath` in:
`netlify/functions/dropbox-upload.js` (line 47)

---

## Testing Locally

To test the Dropbox upload function locally:

1. Create a `.env` file in the project root:
   ```
   DROPBOX_TOKEN=your_token_here
   ```

2. Run Netlify Dev:
   ```bash
   npm run dev
   ```

3. Visit `http://localhost:8888/services-request.html`

4. Submit the form with a test file

**⚠️ IMPORTANT:** Never commit the `.env` file to Git! It's already in `.gitignore`.

---

## Troubleshooting

### "Server configuration error"
- Token not added to Netlify environment variables
- Solution: Add `DROPBOX_TOKEN` in Netlify dashboard

### "Failed to upload [filename]"
- Invalid token or expired token
- Solution: Generate a new token in Dropbox App Console

### Files not appearing in Dropbox
- Check the `/notary-uploads/` folder in your Dropbox
- Check Netlify Function logs: **Netlify Dashboard → Functions → dropbox-upload**

### Not receiving email notifications
- Go to **Site settings** → **Forms** → **Form notifications** in Netlify
- Make sure you've added an email notification for the `notary-request` form
- Check your spam/junk folder for emails from Netlify

---

## Revoking/Changing the Token

If you need to change or revoke your Dropbox token:

1. Go to [Dropbox App Console](https://www.dropbox.com/developers/apps)
2. Find your app
3. Revoke the old token
4. Generate a new token
5. Update the `DROPBOX_TOKEN` in Netlify environment variables
6. Redeploy your site

---

## Questions?

If you encounter any issues, check:
- Netlify Function logs (Netlify Dashboard → Functions)
- Browser console for JavaScript errors
- Dropbox App Console for API errors
