import jwt from "jsonwebtoken";

/**
 * Sign a JWT carrying the user's id and role. The frontend reads it
 * either from the httpOnly cookie (preferred for security) or from the
 * Authorization header — both are supported.
 */
export function generateToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is missing");
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return jwt.sign(
    { id: user._id.toString(), role: user.role, email: user.email },
    secret,
    { expiresIn }
  );
}

/**
 * Verify a JWT and return its decoded payload. Throws on invalid/expired.
 */
export function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}
