import multer from "multer";
import path from "path";
import fs from "fs";
import { AppError } from "../errors/AppError.js";

const uploadRoot = path.join(process.cwd(), "uploads", "kyc");
fs.mkdirSync(uploadRoot, { recursive: true });

const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);

const extForMime = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

function createKycUploader(docKind) {
  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadRoot),
    filename: (req, file, cb) => {
      const ext =
        extForMime[file.mimetype] ||
        path.extname(file.originalname) ||
        ".jpg";
      cb(null, `${req.user.id}-${docKind}-${Date.now()}${ext}`);
    },
  });

  return multer({
    storage,
    limits: { fileSize: 4 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (!allowed.has(file.mimetype)) {
        return cb(
          new AppError(
            "Only JPG, PNG, or WebP images are allowed",
            400,
            "INVALID_FILE_TYPE",
          ),
        );
      }
      cb(null, true);
    },
  });
}

const uploadIdProof = createKycUploader("idProof");
const uploadAddressProof = createKycUploader("addressProof");

export { uploadIdProof, uploadAddressProof };
