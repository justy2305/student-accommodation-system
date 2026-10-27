
const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary-v2");

const cloudinary = require("../config/cloudinary");
const authMiddleware = require("../middleware/authMiddleware");

const {
  uploadAccommodationImage,
  getAccommodationImages,
} = require("../controllers/accommodationImageController");

const router = express.Router();

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "student-accommodations",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

// Configure Multer
const upload = multer({ storage });

// Upload an accommodation image
router.post(
  "/:accommodationId",
  authMiddleware,
  upload.single("image"),
  uploadAccommodationImage
);

// Retrieve images for an accommodation
router.get(
  "/:accommodationId",
  getAccommodationImages
);

module.exports = router;
