const https = require('https');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse request body
    const orderData = JSON.parse(event.body);

    // Validate required fields
    if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid order data: items array required' })
      };
    }

    if (!orderData.amount || orderData.amount <= 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid order data: amount must be greater than 0' })
      };
    }

    if (!orderData.customerEmail) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid order data: customer email required' })
      };
    }

    // Build line items for Square
    const lineItems = orderData.items.map(item => ({
      name: item.name,
      quantity: '1',
      base_price_money: {
        amount: Math.round(item.price * 100), // Convert dollars to cents
        currency: 'CAD'
      }
    }));

    // Create checkout payload
    const checkoutPayload = {
      idempotency_key: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
      order: {
        location_id: process.env.SQUARE_LOCATION_ID || 'main',
        line_items: lineItems,
        metadata: {
          service_type: orderData.serviceType || 'general',
          customer_name: orderData.customerName || '',
          customer_phone: orderData.customerPhone || '',
          order_notes: orderData.notes || ''
        }
      },
      checkout_options: {
        redirect_url: `${process.env.URL || 'https://tnlegal.ca'}/payment-success.html`,
        ask_for_shipping_address: false,
        merchant_support_email: process.env.ADMIN_EMAIL || 'admin@tnlegal.ca'
      },
      pre_populate_buyer_email: orderData.customerEmail
    };

    // Call Square Checkout API
    const squareResponse = await callSquareAPI(
      '/v2/online-checkout/payment-links',
      'POST',
      checkoutPayload
    );

    if (!squareResponse.payment_link || !squareResponse.payment_link.url) {
      console.error('Square API response missing payment link:', squareResponse);
      throw new Error('Failed to create checkout session');
    }

    // Return checkout URL
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        checkoutUrl: squareResponse.payment_link.url,
        orderId: squareResponse.payment_link.id
      })
    };

  } catch (error) {
    console.error('Error creating Square checkout:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to create checkout session',
        message: error.message
      })
    };
  }
};

// Helper function to call Square API
function callSquareAPI(path, method, body) {
  return new Promise((resolve, reject) => {
    const accessToken = process.env.SQUARE_ACCESS_TOKEN;
    const environment = process.env.SQUARE_ENVIRONMENT || 'production';

    if (!accessToken) {
      reject(new Error('SQUARE_ACCESS_TOKEN environment variable not set'));
      return;
    }

    const host = environment === 'sandbox'
      ? 'connect.squareupsandbox.com'
      : 'connect.squareup.com';

    const options = {
      hostname: host,
      port: 443,
      path: path,
      method: method,
      headers: {
        'Square-Version': '2024-10-17',
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);

          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            console.error('Square API error:', parsed);
            reject(new Error(parsed.errors?.[0]?.detail || 'Square API error'));
          }
        } catch (e) {
          reject(new Error('Failed to parse Square API response'));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}
