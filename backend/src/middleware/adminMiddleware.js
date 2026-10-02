import { forbidden } from "../utils/responses.js";

/**
 * Requires that the request was authenticated (authMiddleware ran first)
 * and that the user has role === "admin".
 */
export function adminMiddleware(req, res, next) {
  if (!req.user) return forbidden(res, "Authentication required");
  if (req.user.role !== "admin") {
    return forbidden(res, "Admin privileges required");
  }
  return next();
}
