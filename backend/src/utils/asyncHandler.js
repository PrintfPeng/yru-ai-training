/**
 * Wrap async route handlers so thrown errors reach Express error middleware
 * without needing try/catch in every controller.
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
