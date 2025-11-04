// Quick script to get your Square location ID
const https = require('https');

const accessToken = process.env.SQUARE_ACCESS_TOKEN || 'EAAAl0VJQc6sDLoraPM2ubmjEEUe1lrx8Ci41iR2qYJcM1mzu8Og1QLB4NM0xvhK';
const environment = process.env.SQUARE_ENVIRONMENT || 'production';

const host = environment === 'sandbox'
  ? 'connect.squareupsandbox.com'
  : 'connect.squareup.com';

const options = {
  hostname: host,
  port: 443,
  path: '/v2/locations',
  method: 'GET',
  headers: {
    'Square-Version': '2024-10-17',
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
};

console.log('Fetching your Square locations...\n');

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);

      if (res.statusCode >= 200 && res.statusCode < 300) {
        if (parsed.locations && parsed.locations.length > 0) {
          console.log('✅ Found your Square locations:\n');
          parsed.locations.forEach((location, index) => {
            console.log(`Location ${index + 1}:`);
            console.log(`  Name: ${location.name}`);
            console.log(`  ID: ${location.id}`);
            console.log(`  Status: ${location.status}`);
            console.log('');
          });
          console.log(`\n📝 Update your .env file with:`);
          console.log(`SQUARE_LOCATION_ID=${parsed.locations[0].id}`);
        } else {
          console.log('❌ No locations found in your Square account');
        }
      } else {
        console.error('❌ Square API error:', parsed);
      }
    } catch (e) {
      console.error('❌ Failed to parse response:', e.message);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error.message);
});

req.end();
