/**
 * Centralized error code constants
 * Shared between frontend and backend for consistent error handling
 */

export const ERROR_CODES = {
  // Session errors
  SESSION_NOT_FOUND: {
    code: "SESSION_NOT_FOUND",
    message: "Session not found or does not exist",
    httpStatus: 404
  },
  SESSION_EXPIRED: {
    code: "SESSION_EXPIRED",
    message: "Session has expired",
    httpStatus: 410
  },
  SESSION_CREATE_FAILED: {
    code: "SESSION_CREATE_FAILED",
    message: "Failed to create session",
    httpStatus: 500
  },
  SESSION_JOIN_FAILED: {
    code: "SESSION_JOIN_FAILED",
    message: "Failed to join session",
    httpStatus: 500
  },

  // Location errors
  LOCATION_PERMISSION_DENIED: {
    code: "LOCATION_PERMISSION_DENIED",
    message: "Location permission denied by user",
    httpStatus: 403
  },
  LOCATION_TIMEOUT: {
    code: "LOCATION_TIMEOUT",
    message: "Location request timed out",
    httpStatus: 408
  },
  LOCATION_INVALID_COORDINATES: {
    code: "LOCATION_INVALID_COORDINATES",
    message: "Invalid latitude or longitude coordinates",
    httpStatus: 400
  },
  LOCATION_ADDRESS_NOT_FOUND: {
    code: "LOCATION_ADDRESS_NOT_FOUND",
    message: "Address not found for given coordinates",
    httpStatus: 404
  },
  LOCATION_NOT_CONFIRMED: {
    code: "LOCATION_NOT_CONFIRMED",
    message: "Location has not been confirmed by participant",
    httpStatus: 400
  },

  // Ranking errors
  RANKING_INPUTS_NOT_READY: {
    code: "RANKING_INPUTS_NOT_READY",
    message: "Ranking inputs not ready from both participants",
    httpStatus: 400
  },
  RANKING_GENERATION_FAILED: {
    code: "RANKING_GENERATION_FAILED",
    message: "Failed to generate ranking results",
    httpStatus: 500
  },
  RANKING_PROVIDER_ERROR: {
    code: "RANKING_PROVIDER_ERROR",
    message: "External ranking provider error",
    httpStatus: 502
  },

  // Decision errors
  DECISION_SHORTLIST_FULL: {
    code: "DECISION_SHORTLIST_FULL",
    message: "Shortlist has reached maximum capacity",
    httpStatus: 400
  },
  DECISION_ALREADY_SHORTLISTED: {
    code: "DECISION_ALREADY_SHORTLISTED",
    message: "Venue already in shortlist",
    httpStatus: 409
  },
  DECISION_CONFIRMATION_FAILED: {
    code: "DECISION_CONFIRMATION_FAILED",
    message: "Failed to confirm venue",
    httpStatus: 500
  },

  // Validation errors
  VALIDATION_INVALID_SPLIT: {
    code: "VALIDATION_INVALID_SPLIT",
    message: "Invalid willingness split format (expected XX_YY where XX + YY = 100)",
    httpStatus: 400
  },
  VALIDATION_INVALID_TAGS: {
    code: "VALIDATION_INVALID_TAGS",
    message: "Invalid preference tags",
    httpStatus: 400
  },
  VALIDATION_MISSING_REQUIRED_FIELD: {
    code: "VALIDATION_MISSING_REQUIRED_FIELD",
    message: "Required field is missing",
    httpStatus: 400
  },

  // Server errors
  SERVER_INTERNAL_ERROR: {
    code: "SERVER_INTERNAL_ERROR",
    message: "Internal server error",
    httpStatus: 500
  },
  SERVER_DATABASE_ERROR: {
    code: "SERVER_DATABASE_ERROR",
    message: "Database operation failed",
    httpStatus: 500
  },
  SERVER_EXTERNAL_SERVICE_ERROR: {
    code: "SERVER_EXTERNAL_SERVICE_ERROR",
    message: "External service unavailable",
    httpStatus: 503
  }
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
export type ErrorCodeKey = keyof typeof ERROR_CODES;

/**
 * Helper to get error code by key
 */
export function getErrorCode(key: ErrorCodeKey): ErrorCode {
  return ERROR_CODES[key];
}

/**
 * Helper to get error code string for client
 */
export function getErrorCodeString(key: ErrorCodeKey): string {
  return ERROR_CODES[key].code;
}