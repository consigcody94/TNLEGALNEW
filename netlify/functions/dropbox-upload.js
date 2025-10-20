/**
 * Netlify Function: Secure Dropbox File Upload with Refresh Token
 *
 * This function receives file uploads from the notary form and uploads them
 * to Dropbox securely using OAuth refresh tokens for long-term access.
 * Email notifications are handled by Netlify Forms.
 *
 * Environment Variables Required:
 * - DROPBOX_APP_KEY: Your Dropbox app key (client ID)
 * - DROPBOX_APP_SECRET: Your Dropbox app secret
 * - DROPBOX_REFRESH_TOKEN: Your Dropbox refresh token (doesn't expire)
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

  // Check for required credentials
  const { DROPBOX_APP_KEY, DROPBOX_APP_SECRET, DROPBOX_REFRESH_TOKEN } = process.env;

  if (!DROPBOX_APP_KEY || !DROPBOX_APP_SECRET || !DROPBOX_REFRESH_TOKEN) {
    console.error('Missing Dropbox credentials in environment variables');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server configuration error - missing credentials' })
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

    // Step 1: Get a fresh access token using refresh token
    const accessToken = await getAccessTokenFromRefreshToken(
      DROPBOX_APP_KEY,
      DROPBOX_APP_SECRET,
      DROPBOX_REFRESH_TOKEN
    );

    // Generate formatted filename: "FirstName LastName - DocumentType - Date.pdf"
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const docType = notarizationType || 'Document';
    const formattedFileName = `${fullName || 'Unknown'} - ${docType} - ${date} - ${fileName}`;

    // Convert base64 to buffer
    const fileBuffer = Buffer.from(fileContent, 'base64');

    // Upload to Dropbox
    const dropboxPath = `/notary-uploads/${formattedFileName}`;

    const uploadResult = await uploadToDropbox(
      accessToken,
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
 * Get a fresh access token using the refresh token
 * Dropbox access tokens expire after 4 hours, but refresh tokens don't expire
 */
function getAccessTokenFromRefreshToken(appKey, appSecret, refreshToken) {
  return new Promise((resolve, reject) => {
    const postData = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: appKey,
      client_secret: appSecret
    }).toString();

    const options = {
      hostname: 'api.dropboxapi.com',
      path: '/oauth2/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          const response = JSON.parse(data);
          resolve(response.access_token);
        } else {
          reject(new Error(`Failed to refresh token: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

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
