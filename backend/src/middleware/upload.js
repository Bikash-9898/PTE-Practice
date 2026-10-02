import multer from "multer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import { badRequest } from "../utils/responses.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..", "..");
const MAX_BYTES = (Number(process.env.MAX_UPLOAD_MB) || 15) * 1024 * 1024;

/**
 * Build a multer instance that writes to a named subdirectory under
 * /uploads, with a per-run random suffix so files don't overwrite each
 * other. Filename sanitisation strips anything outside [a-zA-Z0-9_-].
 */
function buildUploader(subDir, allowedMimes) {
  const dest = path.join(ROOT_DIR, "uploads", subDir);
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, dest),
    filename: (req, file, cb) => {
      const safe = path
        .basename(file.originalname)
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .slice(0, 80);
      const suffix = Math.random().toString(36).slice(2, 8);
      cb(null, `${Date.now()}-${suffix}-${safe}`);
    },
  });

  const fileFilter = (req, file, cb) => {
    if (allowedMimes.includes(file.mimetype)) return cb(null, true);
    cb(new Error(`Unsupported file type: ${file.mimetype}`));
  };

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_BYTES },
  });
}

// Audio: webm / mp3 / wav / ogg
const audioUploader = buildUploader("audio", [
  "audio/webm",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
]);

// Image: jpeg / png / gif / webp
const imageUploader = buildUploader("images", [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
]);

/**
 * Wraps the upload middleware so multer errors become clean JSON
 * responses rather than crashing the request.
 */
export function safeUpload(uploader, fieldName, maxCount = 1) {
  const handler = uploader.single(fieldName);
  return (req, res, next) => {
    handler(req, res, (err) => {
      if (!err) return next();
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return badRequest(
            res,
            `File too large. Max ${Math.round(MAX_BYTES / 1024 / 1024)} MB.`
          );
        }
        return badRequest(res, `Upload failed: ${err.message}`);
      }
      return badRequest(res, err.message || "Upload failed");
    });
  };
}

export { audioUploader, imageUploader };

/**
 * Build a public URL for an uploaded file. Used by controllers to put
 * the URL into a question's imageUrl/audioUrl field.
 */
export function buildPublicUrl(req, subDir, filename) {
  // Prefer the configured client host so the URL works in dev/staging/prod.
  const configured = process.env.PUBLIC_BASE_URL?.replace(/\/$/, "");
  const base = configured || `${req.protocol}://${req.get("host")}`;
  return `${base}/uploads/${subDir}/${filename}`;
}
