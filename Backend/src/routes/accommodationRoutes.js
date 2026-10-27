const express = require("express");
const adminMiddleware = require("../middleware/adminMiddleware");

const {
  createAccommodation,
  getAllAccommodations,
  getAccommodationById,
  updateAccommodation,
  deleteAccommodation,
  searchAccommodations,
} = require("../controllers/accommodationController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Search and filter accommodations
// Keep this before the /:id route
router.get("/search", searchAccommodations);

// Create accommodation - protected route
router.post("/", authMiddleware, adminMiddleware, createAccommodation);

// Get all accommodations
router.get("/", getAllAccommodations);

// Get one accommodation
router.get("/:id", getAccommodationById);

// Update accommodation - protected route
router.put("/:id", authMiddleware, adminMiddleware, updateAccommodation);

// Delete accommodation - protected route
router.delete("/:id", authMiddleware, adminMiddleware, deleteAccommodation);

module.exports = router;
