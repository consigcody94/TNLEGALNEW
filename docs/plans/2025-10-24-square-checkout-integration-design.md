# Square Checkout Integration Design

**Date:** 2025-10-24
**Status:** Approved
**Author:** Design Session with Client

## Overview

Integrate Square-hosted checkout for all paid services on tnlegal.ca, enabling customers to pay immediately for fixed-price offerings while maintaining existing contact flows for custom quotes.

## Business Requirements

### Services with Checkout Integration

1. **Business Registration Packages** (services-request.html)
   - Sole Proprietorship ($120)
   - General Partnership/LLP ($120)
   - Provincial Corporation ($450)
   - Federal Corporation ($300)
   - Professional Corporation ($550)
   - Non-Profit Corporation ($350)
   - Extra-Provincial Registration ($400)
   - Plus 15+ optional add-ons ($40-$300 each)

2. **Commissioner/Notary Services** (services-request.html)
   - Pricing based on notarization type and number of signatures
   - Includes file upload to Dropbox before checkout

3. **Online Services Pricing Cards** (online-services.html)
   - Virtual Notary Session: $45
   - On-Site Visit: $95
   - Corporate Documents: Custom (no checkout - keep contact flow)

### Customer Journey

1. Customer fills out service request form
2. Form validates and shows order summary with total price
3. Customer clicks "Proceed to Payment"
4. System creates Square checkout session
5. Customer redirects to Square-hosted checkout page (branded)
6. Customer completes payment on Square
7. Square redirects back to success page
8. Square sends receipt email to customer (automatic)
9. Square webhook notifies our system
10. System emails admin@tnlegal.ca with order details

## Architecture

### Tech Stack

- **Frontend:** Vanilla JavaScript integrated with existing forms
- **Backend:** Netlify Functions (serverless)
- **Payment:** Square Checkout API (hosted checkout)
- **Notifications:** Square automatic receipts + custom admin emails
- **Hosting:** Netlify

### Square Credentials

- **Environment:** Production
- **Application ID:** sq0idp-KQogkY0tAu30VK5r30zQiw
- **Access Token:** Stored in Netlify environment variables
- **Admin Email:** admin@tnlegal.ca

### Components

#### 1. Netlify Functions

**`netlify/functions/create-square-checkout.js`**
- Receives order details from browser (POST request)
- Validates order data
- Creates Square checkout session via Square Checkout API
- Returns checkout URL to browser
- Handles errors gracefully

**`netlify/functions/square-webhook.js`**
- Receives payment confirmation webhooks from Square
- Verifies webhook signature for security
- Extracts order details from payment
- Sends notification email to admin@tnlegal.ca
- Returns 200 OK to Square

#### 2. Frontend Integration

**`js/square-checkout.js`**
- Integrates with existing forms on services-request.html and online-services.html
- Captures form data and builds order object
- Calls create-square-checkout Netlify Function
- Handles loading states and errors
- Redirects to Square checkout URL

#### 3. Success/Failure Pages

**`payment-success.html`**
- Matches site design (header, footer, navigation, styling)
- Confirms successful payment
- Provides next steps for customer
- Links back to home or services

**`payment-failed.html`**
- Matches site design
- Explains payment failure
- Offers retry options
- Provides contact information

### Data Flow

```
Customer Form Submission
    ↓
Form Validation
    ↓
Build Order Object {
  items: [...],
  amount: total,
  customerEmail: email,
  customerName: name,
  serviceType: "business" | "notary" | "online"
}
    ↓
POST to /.netlify/functions/create-square-checkout
    ↓
Netlify Function creates Square Checkout Session
    ↓
Square returns checkout URL
    ↓
Browser redirects to Square checkout page
    ↓
Customer completes payment
    ↓
Square redirects to payment-success.html
    ↓
Square webhook → /.netlify/functions/square-webhook
    ↓
Email sent to admin@tnlegal.ca
```

## Integration Points

### Business Registration Form

**Current behavior:**
- Multi-step wizard
- Collects business type + add-ons
- Live order summary sidebar
- Submits to Netlify Forms
- Shows "we'll send payment link" message

**New behavior:**
- Keep all existing functionality
- After form validation, instead of Netlify Forms submission:
  - Build order object from selectedBusinessType + selectedAddons
  - Call create-square-checkout with order details
  - Redirect to Square checkout
- After payment: customer sees success page, admin gets email notification

### Notary Request Form

**Current behavior:**
- Single form for notary/commissioner services
- Uploads documents to Dropbox
- Submits to Netlify Forms

**New behavior:**
- Add pricing calculation based on:
  - Notarization type (from dropdown)
  - Number of signatures (from dropdown)
- Upload to Dropbox first (keep existing flow)
- Then create checkout session
- Redirect to Square checkout
- After payment: success page + admin notification

### Online Services Pricing Cards

**Current behavior:**
- Three pricing cards with static prices
- "Request an Appointment" buttons → email/contact

**New behavior:**
- Virtual Notary ($45): "Book & Pay Now" → Quick form modal (name, email, phone, date preference) → Square checkout
- On-Site Visit ($95): "Book & Pay Now" → Quick form modal → Square checkout
- Corporate Documents (Custom): Keep existing "Contact Us" button (no checkout)

## Error Handling

### Square API Failures
- Display user-friendly error message
- Log error details for debugging
- Allow customer to retry
- Provide fallback contact option

### Abandoned Payments
- Customer can return and re-submit
- No charges if checkout not completed
- Square sessions expire after 24 hours

### Webhook Failures
- Square still sends receipt to customer
- Admin can manually check Square dashboard
- Implement webhook retry logic on Square's end

### Network Issues
- Loading states during API calls
- Timeout handling (30 second max)
- Clear error messages with next steps

## Environment Variables

Required in Netlify dashboard:

```
SQUARE_ACCESS_TOKEN=EAAAl0VJQc6sDLoraPM2ubmjEEUe1lrx8Ci41iR2qYJcM1mzu8Og1QLB4NM0xvhK
SQUARE_APPLICATION_ID=sq0idp-KQogkY0tAu30VK5r30zQiw
SQUARE_ENVIRONMENT=production
ADMIN_EMAIL=admin@tnlegal.ca
```

## Security Considerations

1. **Webhook Verification:** Verify Square webhook signatures to prevent spoofing
2. **Environment Variables:** Never commit credentials to git
3. **HTTPS Only:** All API calls over secure connections
4. **Input Validation:** Validate all form inputs before creating checkout
5. **Amount Verification:** Server-side price calculation (never trust client)

## Testing Plan

1. **Sandbox Testing:** Test with Square sandbox credentials first
2. **Production Testing:** Small test transactions ($1) before going live
3. **Test Cases:**
   - Business registration with no add-ons
   - Business registration with multiple add-ons
   - Notary service with 1 signature
   - Notary service with 5+ signatures
   - Online service booking
   - Payment abandonment
   - Payment failure scenarios
   - Webhook delivery

## Deployment Steps

1. Create Netlify Functions
2. Create JavaScript integration file
3. Create success/failure pages
4. Update existing forms to integrate Square checkout
5. Add environment variables to Netlify
6. Configure Square webhook URL in Square dashboard
7. Test in sandbox mode
8. Switch to production credentials
9. Test with small real transaction
10. Monitor first few real customer transactions

## Post-Launch Monitoring

- Monitor Square dashboard for successful payments
- Check admin email notifications are arriving
- Review customer feedback on checkout experience
- Track payment success/failure rates
- Monitor webhook delivery success

## Future Enhancements

- Add support for discount codes
- Implement subscription/recurring payments for annual services
- Add payment plan options for expensive packages
- Integrate with CRM for automated follow-up
- Custom quote calculator with instant pricing
