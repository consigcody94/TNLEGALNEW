/**
 * Netlify Function: Secure Dropbox File Upload
 *
 * This function receives file uploads from the notary form and uploads them
 * to Dropbox securely. Email notifications are handled by Netlify Forms.
 *
 * Environment Variables Required:
 * - DROPBOX_TOKEN: Your Dropbox API access token
 */

const https = require('https');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Check for Dropbox token
  const DROPBOX_TOKEN = process.env.DROPBOX_TOKEN;
  if (!DROPBOX_TOKEN) {
    console.error('DROPBOX_TOKEN environment variable is not set');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server configuration error' })
    };
  }

  try {
    // Parse the incoming request body
    const { fileName, fileContent, fullName, notarizationType, email, phone } = JSON.parse(event.body);

    if (!fileName || !fileContent) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing file data' })
      };
    }

    // Generate formatted filename: "FirstName LastName - DocumentType - Date.pdf"
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const docType = notarizationType || 'Document';
    const formattedFileName = `${fullName || 'Unknown'} - ${docType} - ${date} - ${fileName}`;

    // Convert base64 to buffer
    const fileBuffer = Buffer.from(fileContent, 'base64');

    // Upload to Dropbox
    const dropboxPath = `/notary-uploads/${formattedFileName}`;

    const uploadResult = await uploadToDropbox(
      DROPBOX_TOKEN,
      dropboxPath,
      fileBuffer
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'File uploaded successfully',
        fileName: formattedFileName,
        dropboxPath: dropboxPath
      })
    };

  } catch (error) {
    console.error('Upload error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to upload file',
        details: error.message
      })
    };
  }
};

/**
 * Upload a file to Dropbox using the v2 API
 */
function uploadToDropbox(token, path, fileBuffer) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'content.dropboxapi.com',
      path: '/2/files/upload',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/octet-stream',
        'Dropbox-API-Arg': JSON.stringify({
          path: path,
          mode: 'add',
          autorename: true,
          mute: false
        })
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Dropbox API error: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(fileBuffer);
    req.end();
  });
}
