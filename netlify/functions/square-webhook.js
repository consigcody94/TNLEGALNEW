const crypto = require('crypto');
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
    // Verify webhook signature for security
    const signature = event.headers['x-square-hmacsha256-signature'] || event.headers['x-square-signature'];
    const webhookSignatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;

    if (webhookSignatureKey && signature) {
      const isValid = verifyWebhookSignature(event.body, signature, webhookSignatureKey);
      if (!isValid) {
        console.error('Invalid webhook signature');
        return {
          statusCode: 401,
          body: JSON.stringify({ error: 'Invalid signature' })
        };
      }
    }

    // Parse webhook payload
    const payload = JSON.parse(event.body);
    console.log('Received Square webhook:', JSON.stringify(payload, null, 2));

    // Handle payment.updated event
    if (payload.type === 'payment.updated' && payload.data && payload.data.object) {
      const payment = payload.data.object.payment;

      // Only process completed payments
      if (payment.status === 'COMPLETED') {
        await handleCompletedPayment(payment);
      }
    }

    // Return success to Square
    return {
      statusCode: 200,
      body: JSON.stringify({ received: true })
    };

  } catch (error) {
    console.error('Error processing Square webhook:', error);
    // Return 200 to Square anyway to avoid retries
    return {
      statusCode: 200,
      body: JSON.stringify({ received: true, error: error.message })
    };
  }
};

// Verify webhook signature
function verifyWebhookSignature(body, signature, key) {
  try {
    const hmac = crypto.createHmac('sha256', key);
    hmac.update(body);
    const expectedSignature = hmac.digest('base64');
    return signature === expectedSignature;
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}

// Handle completed payment
async function handleCompletedPayment(payment) {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@tnlegal.ca';

    // Extract order details from payment
    const amount = payment.amount_money ? (payment.amount_money.amount / 100).toFixed(2) : '0.00';
    const currency = payment.amount_money?.currency || 'CAD';
    const customerEmail = payment.buyer_email_address || 'Not provided';
    const receiptUrl = payment.receipt_url || 'Not available';
    const orderId = payment.order_id || payment.id;

    // Get order details if order_id exists
    let orderDetails = '';
    let customerInfo = '';

    if (payment.order_id) {
      try {
        const order = await getSquareOrder(payment.order_id);

        if (order && order.line_items) {
          orderDetails = '\n\nOrder Items:\n';
          order.line_items.forEach(item => {
            const itemPrice = item.base_price_money ? (item.base_price_money.amount / 100).toFixed(2) : '0.00';
            orderDetails += `- ${item.name}: $${itemPrice} ${currency}\n`;
          });
        }

        if (order && order.metadata) {
          customerInfo = '\n\nCustomer Information:\n';
          if (order.metadata.customer_name) {
            customerInfo += `Name: ${order.metadata.customer_name}\n`;
          }
          if (order.metadata.customer_phone) {
            customerInfo += `Phone: ${order.metadata.customer_phone}\n`;
          }
          if (order.metadata.service_type) {
            customerInfo += `Service Type: ${order.metadata.service_type}\n`;
          }
          if (order.metadata.order_notes) {
            customerInfo += `Notes: ${order.metadata.order_notes}\n`;
          }
        }
      } catch (err) {
        console.error('Error fetching order details:', err);
      }
    }

    // Compose email
    const emailSubject = `New Payment Received: $${amount} ${currency}`;
    const emailBody = `
You have received a new payment through Square:

Payment ID: ${payment.id}
Order ID: ${orderId}
Amount: $${amount} ${currency}
Customer Email: ${customerEmail}
Payment Status: ${payment.status}
Receipt URL: ${receiptUrl}
${customerInfo}${orderDetails}

View full details in your Square Dashboard:
https://squareup.com/dashboard/

---
This is an automated notification from your Square checkout integration.
    `.trim();

    // Send email notification
    await sendEmail(adminEmail, emailSubject, emailBody);

    console.log(`Payment notification sent to ${adminEmail}`);

  } catch (error) {
    console.error('Error handling completed payment:', error);
    throw error;
  }
}

// Get Square order details
function getSquareOrder(orderId) {
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
      path: `/v2/orders/${orderId}`,
      method: 'GET',
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
            resolve(parsed.order);
          } else {
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

    req.end();
  });
}

// Send email using Netlify's built-in email or external service
async function sendEmail(to, subject, body) {
  // For now, just log the email
  // You can integrate with SendGrid, Mailgun, or another service here
  console.log('=== EMAIL NOTIFICATION ===');
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body:\n${body}`);
  console.log('=========================');

  // TODO: Integrate with email service
  // Example with SendGrid:
  /*
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  await sgMail.send({
    to: to,
    from: process.env.ADMIN_EMAIL,
    subject: subject,
    text: body
  });
  */

  return true;
}
