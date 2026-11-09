const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary-v2");

const cloudinary = require("../config/cloudinary");
const { isCloudinaryConfigured } = require("../config/cloudinary");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const accommodationModel = require("../models/accommodationModel");

const {
  uploadAccommodationImage,
  getAccommodationImages,
} = require("../controllers/accommodationImageController");

const router = express.Router();

const MAX_FILE_SIZE_MB = 5;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Photos go to Cloudinary, in one folder per accommodation
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req) => ({
    folder: `student-accommodations/accommodation-${req.params.accommodationId}`,
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    resource_type: "image",
  }),
});

// Multer: one image, at most 5 MB, JPG/PNG/WebP only
const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      return callback(null, true);
    }
    const error = new Error("Only JPG, PNG or WebP images can be uploaded");
    error.status = 400;
    return callback(error);
  },
});

// Stop early, before anything is sent to Cloudinary, if uploads are not set
// up or the accommodation does not exist
const checkCanUpload = async (req, res, next) => {
  if (!isCloudinaryConfigured()) {
    return res.status(503).json({
      message:
        "Image uploads are not set up. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET to the backend .env",
    });
  }

  const id = Number(req.params.accommodationId);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: "Invalid accommodation id" });
  }

  try {
    const accommodation = await accommodationModel.getAccommodationById(id);
    if (!accommodation) {
      return res.status(404).json({ message: "Accommodation not found" });
    }
    return next();
  } catch (error) {
    console.error("Image upload check error:", error);
    return res.status(500).json({ message: "Server error while uploading image" });
  }
};

// Runs Multer and turns its errors into clear messages
const receiveImage = (req, res, next) => {
  upload.single("image")(req, res, (error) => {
    if (!error) return next();

    if (error instanceof multer.MulterError) {
      const messages = {
        LIMIT_FILE_SIZE: `Images must be ${MAX_FILE_SIZE_MB} MB or smaller`,
        LIMIT_FILE_COUNT: "Upload one image at a time",
        LIMIT_UNEXPECTED_FILE: 'Send the image in a form field called "image"',
      };
      return res.status(400).json({ message: messages[error.code] ?? error.message });
    }

    if (error.status === 400) {
      return res.status(400).json({ message: error.message });
    }

    // Cloudinary refused the upload (wrong keys, network problem, etc.)
    console.error("Cloudinary upload error:", error);
    return res.status(502).json({ message: "Couldn't save the image to Cloudinary. Please try again." });
  });
};

// Upload an accommodation image (admins only)
router.post(
  "/:accommodationId",
  authMiddleware,
  adminMiddleware,
  checkCanUpload,
  receiveImage,
  uploadAccommodationImage
);

// Retrieve images for an accommodation
router.get(
  "/:accommodationId",
  getAccommodationImages
);

module.exports = router;
