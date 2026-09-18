/**
 * Uniform application error. Thrown by services/controllers.
 * errorHandler middleware turns this into a JSON response with matching status.
 *
 * `code` is a string constant frontend can switch on
 * (e.g. 'OVER_CAPACITY', 'DUPLICATE_REGISTRATION', 'INVALID_CREDENTIALS').
 */
export class AppError extends Error {
  constructor(code, message, status = 400, details = null) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}
