# TN Legal Services Website

Professional website for TN Legal Services Ltd. with integrated Google Drive document upload functionality for notary requests.

## Features

- Modern, responsive design
- Notary request form with file upload
- Automatic upload to Google Drive
- Email notifications with file links
- Same-day service support

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Google Drive Integration

Follow the detailed instructions in **[GOOGLE-DRIVE-SETUP.md](./GOOGLE-DRIVE-SETUP.md)**

Quick overview:
1. Create Google Cloud project
2. Enable Google Drive API
3. Create Service Account
4. Share Drive folder with service account
5. Configure environment variables in Netlify

### 3. Configure Environment Variables

In your Netlify dashboard, set these environment variables:

- `GOOGLE_SERVICE_ACCOUNT_JSON` - Service account JSON credentials
- `GOOGLE_DRIVE_FOLDER_ID` - ID of the "TN Legal Site Documents" folder
- `SMTP_HOST` - Email SMTP host (e.g., smtp.gmail.com)
- `SMTP_PORT` - SMTP port (587)
- `SMTP_USER` - Your email address
- `SMTP_PASSWORD` - App password for email
- `EMAIL_FROM` - Sender email (noreply@tnlegal.ca)

See `.env.example` for reference.

### 4. Deploy

Push to your Git repository and Netlify will automatically deploy.

## File Structure

```
tnlegal/
├── index.html              # Homepage
├── notary-request.html     # Notary request form
├── netlify/
│   └── functions/
│       └── notary-request.js  # Serverless function
├── css/                    # Stylesheets
├── js/                     # JavaScript files
├── package.json            # Dependencies
├── netlify.toml            # Netlify configuration
└── GOOGLE-DRIVE-SETUP.md   # Setup instructions
```

## How It Works

1. User fills out notary request form
2. Files are uploaded via serverless function
3. Function uploads files to Google Drive folder
4. Function sends email to info@tnlegal.ca with file links
5. User sees success message

## Support

For questions or issues:
- Phone: 613-663-TLAW (8529)
- Email: admin@tnlegal.ca

## Security Notes

- Never commit `.env` files or service account JSON to Git
- Use environment variables in Netlify for all sensitive data
- Service account only has access to shared folder
- Files are validated for type and size before upload
