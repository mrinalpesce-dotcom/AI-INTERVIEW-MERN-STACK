import multer from "multer";
import fs from "fs";

const uploadDir = "public";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public");
  },
  filename: function (req, file, cb) {
    const filename = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, filename);
  }
});

export const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 5 }
});
