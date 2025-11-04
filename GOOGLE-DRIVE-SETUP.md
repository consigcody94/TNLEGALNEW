# Google Drive Integration Setup Guide

This guide will walk you through setting up Google Drive integration for the notary request form.

## What You'll Need
- Google account with access to the Drive where files should be saved
- About 10-15 minutes

---

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a project"** at the top
3. Click **"NEW PROJECT"**
4. Name it: **"TN Legal Website"**
5. Click **"CREATE"**
6. Wait for the project to be created (about 10 seconds)

---

## Step 2: Enable Google Drive API

1. Make sure your new project is selected at the top
2. Click the hamburger menu (☰) → **"APIs & Services"** → **"Library"**
3. Search for: **"Google Drive API"**
4. Click on it
5. Click **"ENABLE"**

---

## Step 3: Create Service Account

1. Click the hamburger menu (☰) → **"APIs & Services"** → **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** at the top
3. Select **"Service account"**
4. Fill in:
   - **Service account name:** `tnlegal-form-uploader`
   - **Service account ID:** (auto-filled)
   - **Description:** "Uploads notary request files to Google Drive"
5. Click **"CREATE AND CONTINUE"**
6. For "Grant this service account access to project":
   - Skip this (click **"CONTINUE"**)
7. For "Grant users access to this service account":
   - Skip this (click **"DONE"**)

---

## Step 4: Create and Download JSON Key

1. You should now see your service account in the list
2. Click on the service account email (looks like: `tnlegal-form-uploader@...`)
3. Click the **"KEYS"** tab
4. Click **"ADD KEY"** → **"Create new key"**
5. Select **"JSON"**
6. Click **"CREATE"**
7. A JSON file will download automatically - **SAVE THIS FILE SECURELY**
8. **Important:** This file contains sensitive credentials - never share it publicly

---

## Step 5: Share Google Drive Folder with Service Account

1. Open the JSON file you just downloaded
2. Find and copy the **"client_email"** value (looks like: `tnlegal-form-uploader@your-project.iam.gserviceaccount.com`)
3. Go to [Google Drive](https://drive.google.com/)
4. Find your **"TN Legal Site Documents"** folder
5. Right-click the folder → **"Share"**
6. Paste the service account email
7. Set permission to **"Editor"**
8. **Uncheck** "Notify people" (it's a service account, not a person)
9. Click **"Share"**

---

## Step 6: Get Folder ID

1. Open the **"TN Legal Site Documents"** folder in Google Drive
2. Look at the URL in your browser:
   ```
   https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOpQrStUvWxYz
                                          ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑
                                          This is your FOLDER_ID
   ```
3. Copy everything after `/folders/` - that's your **FOLDER_ID**

---

## Step 7: Set Up Gmail App Password (for Email Notifications)

1. Go to your [Google Account](https://myaccount.google.com/)
2. Click **"Security"** in the left sidebar
3. Under "How you sign in to Google", enable **"2-Step Verification"** (if not already enabled)
4. After enabling 2FA, scroll down and click **"App passwords"**
5. Select:
   - App: **Mail**
   - Device: **Other** (name it: "TN Legal Website")
6. Click **"Generate"**
7. Copy the 16-character password that appears (looks like: `abcd efgh ijkl mnop`)
8. **Save this password** - you'll need it for SMTP_PASSWORD

---

## Step 8: Configure Environment Variables in Netlify

1. Log into your [Netlify](https://app.netlify.com/) account
2. Select your TN Legal website
3. Go to **"Site configuration"** → **"Environment variables"**
4. Add the following variables:

### GOOGLE_SERVICE_ACCOUNT_JSON
- Click **"Add a variable"**
- Key: `GOOGLE_SERVICE_ACCOUNT_JSON`
- Value: Open your downloaded JSON file, copy **ALL** contents, paste it here
- Click **"Create variable"**

### GOOGLE_DRIVE_FOLDER_ID
- Click **"Add a variable"**
- Key: `GOOGLE_DRIVE_FOLDER_ID`
- Value: Paste the folder ID from Step 6
- Click **"Create variable"**

### SMTP_HOST
- Key: `SMTP_HOST`
- Value: `smtp.gmail.com`

### SMTP_PORT
- Key: `SMTP_PORT`
- Value: `587`

### SMTP_USER
- Key: `SMTP_USER`
- Value: Your Gmail address (e.g., `youremail@gmail.com`)

### SMTP_PASSWORD
- Key: `SMTP_PASSWORD`
- Value: The 16-character app password from Step 7

### EMAIL_FROM
- Key: `EMAIL_FROM`
- Value: `noreply@tnlegal.ca`

---

## Step 9: Deploy and Test

1. Commit and push your code to your Git repository
2. Netlify will automatically redeploy
3. Once deployed, test the form:
   - Go to `https://yoursite.netlify.app/notary-request.html`
   - Fill out the form
   - Upload a test document
   - Submit
4. Check:
   - ✓ Files appear in "TN Legal Site Documents" folder
   - ✓ Email arrives at info@tnlegal.ca with file links

---

## Troubleshooting

### Files not uploading to Drive
- Verify you shared the folder with the service account email
- Check the GOOGLE_DRIVE_FOLDER_ID is correct
- Ensure Google Drive API is enabled

### Emails not sending
- Verify 2-Step Verification is enabled on Gmail account
- Verify App Password was generated correctly
- Check SMTP_USER and SMTP_PASSWORD are correct

### Form submission errors
- Check Netlify function logs: Site → Functions → notary-request
- Verify all environment variables are set correctly

---

## Security Notes

- ✓ The Service Account JSON contains sensitive credentials - never commit it to Git
- ✓ Use environment variables in Netlify (already configured)
- ✓ Keep your App Password secure
- ✓ Service account only has access to the shared folder, not your entire Drive

---

## Need Help?

If you encounter issues:
1. Check Netlify function logs for error messages
2. Verify all environment variables are set correctly
3. Test with a small file first (under 1MB)
4. Ensure the Drive folder is shared with the service account

---

**That's it! Your form will now upload files to Google Drive and send email notifications automatically.**
