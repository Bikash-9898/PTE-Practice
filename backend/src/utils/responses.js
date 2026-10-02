/**
 * Tiny response helpers so every controller returns the same JSON shape.
 */

export function ok(res, data = {}, message = "OK", status = 200) {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
}

export function created(res, data = {}, message = "Created") {
  return ok(res, data, message, 201);
}

export function badRequest(res, message = "Bad request") {
  return res.status(400).json({ success: false, message });
}

export function unauthorized(res, message = "Unauthorized") {
  return res.status(401).json({ success: false, message });
}

export function forbidden(res, message = "Forbidden") {
  return res.status(403).json({ success: false, message });
}

export function notFound(res, message = "Not found") {
  return res.status(404).json({ success: false, message });
}

export function serverError(res, message = "Server error") {
  return res.status(500).json({ success: false, message });
}

export function paginated(res, items, total, page, limit, message = "OK") {
  return res.status(200).json({
    success: true,
    message,
    data: items,
    pagination: {
      page: Number(page) || 1,
      limit: Number(limit) || items.length,
      total,
      pages: Math.max(1, Math.ceil(total / (Number(limit) || items.length))),
    },
  });
}

/**
 * Wraps an async controller so a thrown error flows to the global error
 * handler instead of crashing the process.
 */
export function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
