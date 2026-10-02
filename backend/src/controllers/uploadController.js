import { buildPublicUrl, audioUploader, imageUploader, safeUpload } from "../middleware/upload.js";
import { ok } from "../utils/responses.js";

export const audioMiddleware = safeUpload(audioUploader, "audio", 1);
export const imageMiddleware = safeUpload(imageUploader, "image", 1);

export const uploadAudio = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No audio file uploaded" });
  }
  return ok(
    res,
    {
      url: buildPublicUrl(req, "audio", req.file.filename),
      filename: req.file.filename,
      size: req.file.size,
      mimeType: req.file.mimetype,
    },
    "Audio uploaded"
  );
};

export const uploadImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No image file uploaded" });
  }
  return ok(
    res,
    {
      url: buildPublicUrl(req, "images", req.file.filename),
      filename: req.file.filename,
      size: req.file.size,
      mimeType: req.file.mimetype,
    },
    "Image uploaded"
  );
};
