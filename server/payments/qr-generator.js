/**
 * QR Generator
 * Handles QR code generation for SBP payments
 */

const crypto = require('crypto');

class QRGenerator {
  /**
   * Generates a unique payment ID
   * @returns {string} Payment ID in format pm_XXXXXXXXX
   */
  generatePaymentId() {
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex');
    return `pm_${timestamp}${random}`;
  }

  /**
   * Generates a unique session ID
   * @returns {string} Session ID in format ps_XXXXXXXXX
   */
  generateSessionId() {
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex');
    return `ps_${timestamp}${random}`;
  }

  /**
   * Generates QR code data for SBP payment
   * @param {Object} params - QR code parameters
   * @param {number} params.amount - Payment amount in kopecks
   * @param {string} params.paymentId - Unique payment ID
   * @param {string} params.orderId - Order ID
   * @param {string} params.merchantInfo - Merchant information
   * @returns {Object} QR code data
   */
  generateQRData(params) {
    // Implementation will be added in task 2
    // This will interact with the bank API to get actual QR code
    throw new Error('Not implemented yet');
  }

  /**
   * Calculates expiration time for payment
   * @param {number} timeoutMinutes - Timeout in minutes (default: 15)
   * @returns {string} ISO timestamp for expiration
   */
  calculateExpirationTime(timeoutMinutes = 15) {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + timeoutMinutes);
    return expiresAt.toISOString();
  }
}

module.exports = QRGenerator;
