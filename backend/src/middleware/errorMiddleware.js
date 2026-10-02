import { serverError } from "../utils/responses.js";

/**
 * 404 fallback for any unknown route.
 */
export function notFoundHandler(req, res) {
  return res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

/**
 * Global error handler. Hides stack traces in production.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err.statusCode || (err.status && Number(err.status)) || 500;
  const payload = {
    success: false,
    message:
      err.message ||
      (status === 500 ? "Internal server error" : "Request failed"),
  };

  if (process.env.NODE_ENV !== "production" && status === 500) {
    payload.stack = err.stack;
  }

  // Mongoose duplicate key (e.g. registration email already taken)
  if (err.code === 11000) {
    payload.status = 409;
    payload.message = "A record with this value already exists";
    return res.status(409).json(payload);
  }

  // Mongoose validation errors
  if (err.name === "ValidationError" && err.errors) {
    const first = Object.values(err.errors)[0];
    return res.status(400).json({
      success: false,
      message: first?.message || "Validation failed",
    });
  }

  // Cast errors (invalid ObjectId, etc.)
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: `Invalid ${err.path || "value"}`,
    });
  }

  if (status >= 500) {
    // eslint-disable-next-line no-console
    console.error("Unhandled error:", err);
    return serverError(res, payload.message);
  }

  return res.status(status).json(payload);
}
