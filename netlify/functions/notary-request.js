const { google } = require('googleapis');
const nodemailer = require('nodemailer');
const busboy = require('busboy');
const { Readable } = require('stream');

// Google Drive Folder ID for "TN Legal Site Documents"
// You'll need to get this from the folder URL
const DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || '';

// Email configuration
const EMAIL_TO = 'info@tnlegal.ca';
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@tnlegal.ca';

/**
 * Initialize Google Drive API with Service Account
 */
function getGoogleDriveClient() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '{}');

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });

  return google.drive({ version: 'v3', auth });
}

/**
 * Upload file to Google Drive
 */
async function uploadToGoogleDrive(drive, fileName, fileBuffer, mimeType) {
  try {
    const fileMetadata = {
      name: fileName,
      parents: [DRIVE_FOLDER_ID],
    };

    const media = {
      mimeType: mimeType,
      body: Readable.from(fileBuffer),
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink',
    });

    // Make the file shareable (anyone with link can view)
    await drive.permissions.create({
      fileId: file.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    return {
      id: file.data.id,
      name: file.data.name,
      link: file.data.webViewLink,
    };
  } catch (error) {
    console.error('Error uploading to Google Drive:', error);
    throw error;
  }
}

/**
 * Send email notification with file links
 */
async function sendEmailNotification(formData, uploadedFiles) {
  // Create email transporter (using Gmail SMTP)
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  // Build file links HTML
  const fileLinksHtml = uploadedFiles.length > 0
    ? `
      <h3>Uploaded Documents:</h3>
      <ul>
        ${uploadedFiles.map(file => `
          <li><a href="${file.link}">${file.name}</a></li>
        `).join('')}
      </ul>
    `
    : '<p><em>No documents uploaded</em></p>';

  // Email content
  const emailHtml = `
    <h2>New Notary Request Submission</h2>

    <h3>Client Information:</h3>
    <p><strong>Name:</strong> ${formData.fullName}</p>
    <p><strong>Email:</strong> ${formData.email}</p>
    <p><strong>Phone:</strong> ${formData.phone}</p>

    <h3>Service Details:</h3>
    <p><strong>Type of Notarization:</strong> ${formData.notarizationType}</p>
    <p><strong>Number of Signatures:</strong> ${formData.numSignatures}</p>
    <p><strong>Description:</strong></p>
    <p>${formData.description.replace(/\n/g, '<br>')}</p>

    <p><strong>Preferred Appointment:</strong> ${formData.preferredDate || 'Not specified'}</p>

    ${fileLinksHtml}

    <hr>
    <p><small>This submission was received from tnlegal.ca notary request form.</small></p>
  `;

  const mailOptions = {
    from: EMAIL_FROM,
    to: EMAIL_TO,
    subject: `New Notary Request - ${formData.fullName}`,
    html: emailHtml,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

/**
 * Parse multipart form data
 */
function parseMultipartForm(event) {
  return new Promise((resolve, reject) => {
    const formData = {};
    const files = [];

    const bb = busboy({
      headers: {
        'content-type': event.headers['content-type']
      }
    });

    bb.on('field', (fieldname, value) => {
      formData[fieldname] = value;
    });

    bb.on('file', (fieldname, file, info) => {
      const { filename, mimeType } = info;
      const chunks = [];

      file.on('data', (chunk) => {
        chunks.push(chunk);
      });

      file.on('end', () => {
        files.push({
          fieldname,
          filename,
          mimeType,
          buffer: Buffer.concat(chunks),
        });
      });
    });

    bb.on('finish', () => {
      resolve({ formData, files });
    });

    bb.on('error', (error) => {
      reject(error);
    });

    // Handle base64 encoded body from Netlify
    const body = event.isBase64Encoded
      ? Buffer.from(event.body, 'base64')
      : event.body;

    bb.write(body);
    bb.end();
  });
}

/**
 * Main handler function
 */
exports.handler = async (event) => {
  // Only accept POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    // Parse form data
    const { formData, files } = await parseMultipartForm(event);

    console.log('Form data received:', {
      fullName: formData['full-name'],
      email: formData['email'],
      fileCount: files.length,
    });

    // Initialize Google Drive client
    const drive = getGoogleDriveClient();

    // Upload files to Google Drive
    const uploadedFiles = [];
    for (const file of files) {
      if (file.fieldname === 'documents') {
        const uploadedFile = await uploadToGoogleDrive(
          drive,
          file.filename,
          file.buffer,
          file.mimeType
        );
        uploadedFiles.push(uploadedFile);
      }
    }

    console.log(`Uploaded ${uploadedFiles.length} files to Google Drive`);

    // Prepare form data for email
    const emailFormData = {
      fullName: formData['full-name'],
      email: formData['email'],
      phone: formData['phone'],
      notarizationType: formData['notarization-type'],
      numSignatures: formData['num-signatures'],
      description: formData['description'],
      preferredDate: formData['preferred-date'] || '',
    };

    // Send email notification
    await sendEmailNotification(emailFormData, uploadedFiles);

    // Return success response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        message: 'Form submitted successfully',
        filesUploaded: uploadedFiles.length,
      }),
    };
  } catch (error) {
    console.error('Error processing form:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to process form submission',
        details: error.message,
      }),
    };
  }
};
