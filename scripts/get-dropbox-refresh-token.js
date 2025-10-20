#!/usr/bin/env node

/**
 * Dropbox OAuth Refresh Token Generator
 *
 * This script helps you generate a Dropbox refresh token for long-term access.
 *
 * Usage:
 *   node scripts/get-dropbox-refresh-token.js
 */

const https = require('https');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('\n=== Dropbox Refresh Token Generator ===\n');
  console.log('This script will help you generate a refresh token for Dropbox OAuth.\n');

  // Step 1: Get app credentials
  const appKey = await question('Enter your Dropbox App Key: ');
  const appSecret = await question('Enter your Dropbox App Secret: ');

  if (!appKey || !appSecret) {
    console.error('\n❌ App Key and App Secret are required!');
    rl.close();
    return;
  }

  // Step 2: Generate authorization URL
  const authUrl = `https://www.dropbox.com/oauth2/authorize?client_id=${appKey}&token_access_type=offline&response_type=code`;

  console.log('\n✅ Step 1: Open this URL in your browser:\n');
  console.log(authUrl);
  console.log('\n');

  // Step 3: Get authorization code
  const authCode = await question('After authorizing, paste the authorization code here: ');

  if (!authCode) {
    console.error('\n❌ Authorization code is required!');
    rl.close();
    return;
  }

  // Step 4: Exchange code for refresh token
  console.log('\n🔄 Exchanging authorization code for refresh token...\n');

  try {
    const tokenData = await exchangeCodeForToken(appKey, appSecret, authCode);

    console.log('\n✅ Success! Here are your tokens:\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`App Key:        ${appKey}`);
    console.log(`App Secret:     ${appSecret}`);
    console.log(`Refresh Token:  ${tokenData.refresh_token}`);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('⚠️  IMPORTANT: Store these securely!\n');
    console.log('Add these to your Netlify environment variables:');
    console.log('  - DROPBOX_APP_KEY');
    console.log('  - DROPBOX_APP_SECRET');
    console.log('  - DROPBOX_REFRESH_TOKEN\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }

  rl.close();
}

function exchangeCodeForToken(appKey, appSecret, authCode) {
  return new Promise((resolve, reject) => {
    const postData = new URLSearchParams({
      code: authCode,
      grant_type: 'authorization_code',
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
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
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

main();
