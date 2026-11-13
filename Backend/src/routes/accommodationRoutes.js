const express = require("express");

const {
  getAllAccommodations,
  getAccommodationById,
  searchAccommodations,
  getFilterOptions,
} = require("../controllers/accommodationController");

const router = express.Router();

// Homes are read-only through the API. Listings come from
// scripts/seed-accommodations.js (npm run db:seed).

// Search and filter accommodations
// Keep this before the /:id route
router.get("/search", searchAccommodations);

// Options for the Explore filters (also before /:id)
router.get("/filters", getFilterOptions);

// Get all accommodations
router.get("/", getAllAccommodations);

// Get one accommodation
router.get("/:id", getAccommodationById);

module.exports = router;
