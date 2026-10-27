
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const {
  getAllUsers,
  getAllAccommodations,
  getAllApplications,
} = require("../controllers/adminController");

// All routes in this file require an admin account
router.use(authMiddleware, adminMiddleware);

// View all registered users
router.get("/users", getAllUsers);

// View all accommodations
router.get("/accommodations", getAllAccommodations);

// View all applications
router.get("/applications", getAllApplications);

module.exports = router;
