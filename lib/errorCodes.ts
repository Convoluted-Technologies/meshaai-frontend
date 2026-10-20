/**
 * lib/errorCodes.ts
 * Contract section 7.4: Comprehensive Error Code → Toast Message mapping.
 *
 * RULE (contract section 1.4): All UI/toast logic MUST branch on the `code`
 * property (stable, machine-readable), never by regex-matching `detail` strings.
 *
 * Usage:
 *   const msg = getErrorMessage(data.code);
 *   // msg is undefined if code is unknown → show a generic fallback toast
 */

const ERROR_MESSAGES: Record<string, string> = {
  // Auth
  INVALID_PHONE_NUMBER:     'Please enter a valid phone number including country code.',
  INVALID_OTP:              'Incorrect verification code. Please check and try again.',
  OTP_EXPIRED:              'Verification code has expired. Please request a new code.',
  OTP_LOCKED:               'Too many failed attempts. Your account is temporarily locked for 15 minutes.',
  RATE_LIMIT_EXCEEDED:      'Too many requests. Please wait a moment before trying again.',
  CUSTOMER_BLOCKED:         'Your account has been restricted. Please contact Meshaai customer support.',
  SMS_DELIVERY_FAILED:      'Unable to send SMS at this moment. Please try again in 1 minute.',

  // Delivery / zone
  OUT_OF_ZONE:              'Delivery is not currently available at this location.',
  KITCHEN_PAUSED:           'The kitchen serving your area is temporarily paused. Please check back shortly.',
  ORDERING_PAUSED:          'Ordering is temporarily closed for maintenance. Please check back soon.',

  // Catalog / order
  QUOTE_EXPIRED:            'Your pricing quote has expired (15-min limit). We\'ve refreshed your cart.',
  PRESET_NOT_FOUND:         'One or more items in your cart is currently sold out or unavailable.',
  PRESET_UNAVAILABLE:       'One or more items in your cart is currently sold out or unavailable.',
  INVALID_MODIFIERS:        'Invalid modifier options selected for this meal item.',
  ORDER_NOT_PAYABLE:        'Payment cannot be initiated. This order is already paid or cancelled.',
  ORDER_CANNOT_BE_CANCELLED:'Your food is already being prepared in the kitchen and cannot be cancelled.',
  ORDER_ALREADY_CANCELLED:  'This order has already been cancelled.',
  ORDER_NOT_FOUND:          'Order not found. Please check the order code and try again.',
  INVALID_EXCHANGE_RATE:    'Foreign currency exchange rate unavailable for this checkout.',
  INVALID_CURRENCY:         'Invalid currency code. Please select a valid 3-letter currency code (e.g. NGN, USD).',

  // Session
  SESSION_EXPIRED:          'Your session has expired. Please log in again.',
  SESSION_REVOKED:          'Your session has expired. Please log in again.',

  // Generic HTTP
  UNAUTHORIZED:             'Authentication required to perform this action.',
  FORBIDDEN:                'You do not have permission to access this resource.',
};

/**
 * Returns the user-facing message for a backend error code.
 * Returns `undefined` for unknown codes so callers can show a generic fallback.
 */
export function getErrorMessage(code: string | undefined | null): string | undefined {
  if (!code) return undefined;
  return ERROR_MESSAGES[code];
}

/**
 * Resolves the best user-facing message from a backend error response object.
 * Prefers the stable `code` mapping; falls back to `detail` string as last resort.
 * Never returns an empty string — always returns something actionable.
 */
export function resolveErrorMessage(
  data: { code?: string; errorCode?: string; detail?: string; message?: string; title?: string } | null | undefined,
  fallback = 'An unexpected error occurred. Please try again.'
): string {
  if (!data) return fallback;
  const code = data.code || data.errorCode;
  const mapped = getErrorMessage(code);
  if (mapped) return mapped;
  // Log unrecognised code for diagnostics
  if (code) {
    console.warn(`[meshaai] Unrecognised error code: ${code}`, data);
  }
  return data.detail || data.message || data.title || fallback;
}
