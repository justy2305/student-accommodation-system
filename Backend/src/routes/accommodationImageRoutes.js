const express = require("express");

const { getAccommodationImages } = require("../controllers/accommodationImageController");

const router = express.Router();

// Photos of an accommodation (cover first when sorted by id). Photos are
// added by scripts/seed-accommodations.js and moved to Cloudinary by
// scripts/upload-images-to-cloudinary.js.
router.get("/:accommodationId", getAccommodationImages);

module.exports = router;
