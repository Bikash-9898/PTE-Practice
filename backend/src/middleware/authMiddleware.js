import { verifyToken } from "../utils/generateToken.js";
import User from "../models/User.js";
import { unauthorized } from "../utils/responses.js";

/**
 * Read a JWT from either the httpOnly cookie or the Authorization header
 * and attach the corresponding user to req.user.
 */
export async function authMiddleware(req, res, next) {
  try {
    const bearer = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : null;
    const token = req.cookies?.token || bearer;

    if (!token) return unauthorized(res, "Authentication required");

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch {
      return unauthorized(res, "Invalid or expired token");
    }

    const user = await User.findById(decoded.id).select("-password");
    if (!user) return unauthorized(res, "User no longer exists");
    if (user.status && user.status !== "active") {
      return unauthorized(res, "Account is not active");
    }

    req.user = user;
    return next();
  } catch (err) {
    return unauthorized(res, "Authentication failed");
  }
}
