/**
 * Square Checkout Integration
 * Handles creating Square checkout sessions and redirecting customers to payment
 */

class SquareCheckout {
  constructor() {
    this.apiEndpoint = '/.netlify/functions/create-square-checkout';
  }

  /**
   * Create a checkout session and redirect to Square
   * @param {Object} orderData - Order details
   * @param {Array} orderData.items - Array of items with name and price
   * @param {number} orderData.amount - Total amount in dollars
   * @param {string} orderData.customerEmail - Customer's email
   * @param {string} orderData.customerName - Customer's name
   * @param {string} orderData.customerPhone - Customer's phone (optional)
   * @param {string} orderData.serviceType - Type of service (optional)
   * @param {string} orderData.notes - Additional notes (optional)
   */
  async createCheckoutSession(orderData) {
    try {
      // Validate order data
      if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
        throw new Error('Order must contain at least one item');
      }

      if (!orderData.amount || orderData.amount <= 0) {
        throw new Error('Order amount must be greater than 0');
      }

      if (!orderData.customerEmail) {
        throw new Error('Customer email is required');
      }

      // Call Netlify Function to create checkout session
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create checkout session');
      }

      const data = await response.json();

      if (!data.checkoutUrl) {
        throw new Error('No checkout URL received from server');
      }

      // Redirect to Square checkout
      window.location.href = data.checkoutUrl;

    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }

  /**
   * Show loading state on button
   * @param {HTMLElement} button - Button element
   * @param {boolean} loading - Whether to show loading state
   */
  setButtonLoading(button, loading) {
    if (loading) {
      button.dataset.originalText = button.textContent;
      button.textContent = 'Processing...';
      button.disabled = true;
    } else {
      button.textContent = button.dataset.originalText || button.textContent;
      button.disabled = false;
      delete button.dataset.originalText;
    }
  }

  /**
   * Show error message to user
   * @param {string} message - Error message to display
   * @param {HTMLElement} container - Container element to show error in (optional)
   */
  showError(message, container) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'checkout-error';
    errorDiv.style.cssText = `
      padding: 1rem;
      background: rgba(255, 0, 0, 0.1);
      border: 1px solid rgba(255, 0, 0, 0.3);
      border-radius: 8px;
      color: #ff6b6b;
      margin-top: 1rem;
      font-size: 0.9rem;
    `;
    errorDiv.innerHTML = `
      <strong>Payment Error:</strong> ${message}<br>
      <small>Please try again or <a href="contact.html" style="color: #ff6b6b; text-decoration: underline;">contact us</a> for assistance.</small>
    `;

    if (container) {
      // Remove any existing errors
      const existingError = container.querySelector('.checkout-error');
      if (existingError) {
        existingError.remove();
      }
      container.appendChild(errorDiv);
    } else {
      alert(message);
    }
  }
}

// Export for use in other scripts
window.SquareCheckout = SquareCheckout;
