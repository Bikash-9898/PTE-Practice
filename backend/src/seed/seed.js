/**
 * Secure administrator seeder.
 *
 * Creates the backend admin user WITHOUT hard-coding a password in source.
 * Credentials are read from the environment:
 *
 *   ADMIN_EMAIL      admin email   (default: admin@gmail.com)
 *   ADMIN_NAME       display name  (default: Administrator)
 *   ADMIN_PASSWORD   password      (required: >= 8 chars). When omitted, a strong random
 *                                   password is generated and printed ONCE.
 *
 * The password is always stored as a bcrypt hash (the User model's pre-save
 * hook), so even a database leak never exposes it in plain text.
 *
 * Run: npm run seed:admin
 */

import "dotenv/config";
import crypto from "node:crypto";
import { pathToFileURL } from "node:url";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "admin@gmail.com")
  .toLowerCase()
  .trim();
const ADMIN_NAME = process.env.ADMIN_NAME || "Administrator";

// Keep provided passwords at least 8 characters; generated passwords are stronger.
export function validateProvidedPassword(password) {
  if (typeof password !== "string" || password.length < 8) {
    throw new Error("ADMIN_PASSWORD must be at least 8 characters long.");
  }
  return password;
}

// Cryptographically random password that always contains the char classes a
// strong password checker expects.
export function randomStrongPassword(length = 16) {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const symbols = "!@#$%^&*()-_=+";
  const all = upper + lower + digits + symbols;
  const pick = (alphabet) => alphabet[crypto.randomInt(alphabet.length)];

  const parts = [pick(upper), pick(lower), pick(digits), pick(symbols)];
  while (parts.length < length) parts.push(pick(all));
  for (let i = parts.length - 1; i > 0; i -= 1) {
    const j = crypto.randomInt(i + 1);
    [parts[i], parts[j]] = [parts[j], parts[i]];
  }
  return parts.join("");
}

/**
 * Create the admin user, or update its password if ADMIN_PASSWORD is set and
 * differs from what is stored. Returns the admin document.
 */
export async function ensureAdmin() {
  const provided = process.env.ADMIN_PASSWORD;
  let generated = false;

  // password is a `select: false` field, so pull it explicitly to compare.
  let admin = await User.findOne({ email: ADMIN_EMAIL }).select("+password");

  // The general demo seeder imports this function. Never rotate an existing
  // admin password just because the seed command was run again.
  if (admin && !provided) {
    console.log(`• Admin ${ADMIN_EMAIL} already exists — password unchanged.`);
    return admin;
  }

  const password = provided ? validateProvidedPassword(provided) : randomStrongPassword();
  generated = !provided;

  if (admin) {
    const matches = await admin.matchPassword(password);
    if (matches) {
      console.log(
        `• Admin ${ADMIN_EMAIL} already exists with the expected password — no change needed.`
      );
    } else {
      admin.password = password; // pre-save hook hashes it again
      await admin.save();
      console.log(`✓ Updated admin password hash for ${ADMIN_EMAIL}.`);
    }
  } else {
    admin = await User.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password,
      role: "admin",
    });
    console.log(`✓ Created admin user ${ADMIN_EMAIL}.`);
  }

  console.log("─────────────────────────────────────────────────────────────");
  console.log(`  Admin email   : ${ADMIN_EMAIL}`);
  if (generated) {
    console.log(`  Admin password: ${password}`);
    console.log(
      "  A random password was generated because ADMIN_PASSWORD was not set."
    );
    console.log(
      "  It is shown only this once — change it after your first login."
    );
  } else {
    console.log(
      "  Password taken from ADMIN_PASSWORD (never hard-coded in source)."
    );
  }
  console.log("─────────────────────────────────────────────────────────────");

  return admin;
}

async function main() {
  await connectDB();
  try {
    await ensureAdmin();
    console.log("\n✅ Admin seed complete.\n");
  } catch (err) {
    console.error("❌  Admin seed failed:", err.message);
    process.exitCode = 1;
  } finally {
    // Give Mongoose a tick to drain in-flight ops before exiting.
    setTimeout(() => process.exit(process.exitCode || 0), 200);
  }
}

// Run only when executed directly (`npm run seed:admin`), not when imported
// by the full demo seeder.
const isDirectRun =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) main();