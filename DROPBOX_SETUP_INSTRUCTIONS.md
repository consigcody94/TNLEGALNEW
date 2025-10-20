# Dropbox Integration Setup Instructions

## ⚠️ IMPORTANT: Secure Your API Token

**NEVER commit your Dropbox API token to Git or include it in your code.**

The token you generated must be added as an **environment variable** in Netlify, not in your code files.

---

## Step 1: Add Token to Netlify

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Select your site (tnlegal.ca or your site name)
3. Go to **Site settings** → **Environment variables**
4. Click **Add a variable** or **Add environment variables**
5. Add the following:
   - **Key**: `DROPBOX_TOKEN`
   - **Value**: [Paste your Dropbox access token here]
   - **Scopes**: Select "All scopes" or choose specific deploy contexts if needed
6. Click **Save**

## Step 2: Redeploy Your Site

After adding the environment variable:

1. Go to **Deploys** tab in Netlify
2. Click **Trigger deploy** → **Clear cache and deploy site**

OR simply push a new commit to your Git repository to trigger a deployment.

---

## How It Works

### File Upload Flow:

1. **User submits form** → Files are selected
2. **JavaScript reads files** → Converts to base64
3. **Sends to Netlify Function** → `/.netlify/functions/dropbox-upload`
4. **Function reads DROPBOX_TOKEN** → From environment variables (secure!)
5. **Uploads to Dropbox API** → Files saved to `/notary-uploads/` folder
6. **Files are named:** `FirstName LastName - DocumentType - YYYY-MM-DD - filename.pdf`

### Security Features:

✅ Token stored in Netlify environment (never in code)
✅ Token never exposed to browser/client
✅ Function runs server-side only
✅ Users can only upload, not view/access Dropbox

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
