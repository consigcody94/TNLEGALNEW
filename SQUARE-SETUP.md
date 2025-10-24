# Square Checkout Integration - Setup Instructions

This document explains how to configure and deploy the Square checkout integration for TN Legal Services.

## Overview

The integration enables customers to pay for services directly through Square's hosted checkout pages:
- **Business Registration Packages** (services-request.html)
- **Commissioner/Notary Services** (services-request.html)
- **Online Services Pricing Cards** (online-services.html)

## Prerequisites

1. Active Square account with payment processing enabled
2. Square Developer account with API access
3. Netlify account for hosting
4. Access to tnlegal.ca domain

## Setup Steps

### 1. Configure Square Environment Variables in Netlify

Add these environment variables in your Netlify dashboard (Site Settings > Environment Variables):

```
SQUARE_ACCESS_TOKEN=EAAAl0VJQc6sDLoraPM2ubmjEEUe1lrx8Ci41iR2qYJcM1mzu8Og1QLB4NM0xvhK
SQUARE_APPLICATION_ID=sq0idp-KQogkY0tAu30VK5r30zQiw
SQUARE_ENVIRONMENT=production
SQUARE_LOCATION_ID=main
ADMIN_EMAIL=admin@tnlegal.ca
```

**Important:** Keep your `SQUARE_ACCESS_TOKEN` secret! Never commit it to git.

### 2. Configure Square Webhooks (Optional but Recommended)

Webhooks ensure you receive order notifications even if the customer closes their browser:

1. Go to [Square Developer Dashboard](https://developer.squareup.com/apps)
2. Select your application
3. Navigate to "Webhooks" section
4. Click "Add Endpoint"
5. Set webhook URL to: `https://tnlegal.ca/.netlify/functions/square-webhook`
6. Subscribe to event: `payment.updated`
7. Copy the **Signature Key** and add to Netlify environment variables:
   ```
   SQUARE_WEBHOOK_SIGNATURE_KEY=your_signature_key_here
   ```

### 3. Deploy to Netlify

The Square integration is ready to deploy. Simply push your changes:

```bash
git add .
git commit -m "Add Square checkout integration"
git push origin main
```

Netlify will automatically:
- Deploy the updated HTML pages
- Deploy Netlify Functions for Square API integration
- Enable the Square checkout flow

### 4. Test the Integration

After deployment:

1. **Test Business Registration:**
   - Go to https://tnlegal.ca/services-request.html
   - Select "Start a Business"
   - Choose a business type (e.g., Sole Proprietorship $120)
   - Add optional add-ons
   - Fill out contact form
   - Click "Proceed to Payment"
   - Should redirect to Square checkout page

2. **Test Notary Service:**
   - Go to https://tnlegal.ca/services-request.html
   - Select "Commissioner & Document Services"
   - Fill out notary request form
   - Click "Proceed to Payment"
   - Should redirect to Square checkout page ($45-$105 depending on signatures)

3. **Test Online Services:**
   - Go to https://tnlegal.ca/online-services.html
   - Click "Book & Pay Now" on Virtual Notary ($45) or On-Site Visit ($95)
   - Enter contact info in prompts
   - Should redirect to Square checkout page

### 5. Complete a Test Payment

**IMPORTANT:** Use a real credit card for testing in production mode. Square does not have test cards for production.

1. Complete the checkout with a small amount (you can refund it later)
2. Verify:
   - Payment appears in Square Dashboard
   - Customer receives receipt email from Square
   - You receive order notification email at admin@tnlegal.ca
   - Customer is redirected to payment-success.html

### 6. Refund Test Payment (if needed)

1. Log into [Square Dashboard](https://squareup.com/dashboard)
2. Go to Transactions
3. Find your test payment
4. Click "Refund" and confirm

## How It Works

### Customer Flow

1. Customer fills out service request form
2. JavaScript validates form data
3. Frontend calls `/.netlify/functions/create-square-checkout` with order details
4. Netlify Function creates Square checkout session via Square API
5. Customer redirects to Square-hosted checkout page (branded with your logo)
6. Customer completes payment on Square
7. Square processes payment and sends receipt to customer
8. Square redirects customer to `payment-success.html`
9. Square webhook notifies `/.netlify/functions/square-webhook`
10. Webhook handler emails order details to admin@tnlegal.ca

### File Structure

```
netlify/functions/
├── create-square-checkout.js   # Creates Square checkout sessions
└── square-webhook.js            # Receives payment notifications

js/
└── square-checkout.js           # Frontend Square integration

payment-success.html             # Success page after payment
payment-failed.html              # Failure page if payment fails

services-request.html            # Updated with Square checkout
online-services.html             # Updated with Square checkout buttons
```

## Pricing Configuration

Current pricing (hardcoded in forms):

### Business Registration
- Sole Proprietorship: $120
- Partnership/LLP: $120
- Provincial Corporation: $450
- Federal Corporation: $300
- Professional Corporation: $550
- Non-Profit Corporation: $350
- Extra-Provincial: $400
- Plus 15+ optional add-ons ($40-$300 each)

### Notary Services
- Base price: $45 (first document)
- Additional documents: $15 each
- Calculated based on number of signatures selected

### Online Services
- Virtual Notary Session: $45
- On-Site Visit: $95
- Corporate Documents: Custom (contact only, no checkout)

**To change prices:** Edit the HTML files and JavaScript pricing logic.

## Troubleshooting

### Checkout session not creating
- Check Netlify Function logs for errors
- Verify `SQUARE_ACCESS_TOKEN` is set correctly
- Ensure Square API is accessible (not blocked by firewall)

### No redirect to Square
- Check browser console for JavaScript errors
- Verify `js/square-checkout.js` is loaded
- Check network tab for failed API calls

### Payment succeeds but no email notification
- Check Square webhook configuration
- Verify `ADMIN_EMAIL` environment variable is set
- Check Netlify Function logs for `square-webhook` errors
- Verify webhook signature key matches Square dashboard

### Customer sees payment-failed.html
- They may have cancelled the payment
- Their card may have been declined
- Check Square Dashboard > Failed Payments for details

## Email Notifications

Currently, email notifications from the webhook handler are **logged to console** only.

To enable actual email sending, integrate with an email service:

1. **Using SendGrid:**
   ```javascript
   // In square-webhook.js
   const sgMail = require('@sendgrid/mail');
   sgMail.setApiKey(process.env.SENDGRID_API_KEY);
   await sgMail.send({
     to: process.env.ADMIN_EMAIL,
     from: 'noreply@tnlegal.ca',
     subject: emailSubject,
     text: emailBody
   });
   ```

2. **Add SendGrid API key to Netlify environment variables**

3. **Add @sendgrid/mail to package.json and redeploy**

## Security Notes

1. **Never commit credentials to git**
   - Use Netlify environment variables
   - `.env` files are gitignored

2. **Webhook signature verification**
   - Enabled in `square-webhook.js`
   - Prevents spoofed webhook calls
   - Requires `SQUARE_WEBHOOK_SIGNATURE_KEY`

3. **Server-side price calculation**
   - Prices are calculated server-side in Netlify Functions
   - Frontend cannot manipulate final price

4. **HTTPS only**
   - All API calls use HTTPS
   - Square requires HTTPS for production

## Support

For Square-specific issues:
- [Square Developer Documentation](https://developer.squareup.com/docs)
- [Square Developer Support](https://developer.squareup.com/support)

For Netlify deployment issues:
- [Netlify Documentation](https://docs.netlify.com)
- [Netlify Support](https://www.netlify.com/support/)

For integration issues:
- Check Netlify Function logs
- Review browser console errors
- Verify all environment variables are set correctly

## Next Steps

1. ✅ Deploy to Netlify
2. ✅ Add environment variables
3. ✅ Configure Square webhooks
4. ✅ Test with real payment
5. ⬜ Enable email notifications (SendGrid/Mailgun)
6. ⬜ Monitor first real customer orders
7. ⬜ Consider adding Square SDK for inline payments (future enhancement)
