const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  createApplication,
  getMyApplications,
  getAllApplications,
  getApplicationById,
} = require("../controllers/applicationController");

const {
  updateApplicationStatus,
  getApplicationStatusHistory,
  signLease,
} = require("../controllers/applicationStatusController");

// Submit an application
router.post("/", authMiddleware, createApplication);

// View the logged-in student's applications
router.get("/my", authMiddleware, getMyApplications);

// Update an application's status (admin only)
router.put(
  "/:id/status",
  authMiddleware,
  (req, res, next) => {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Access denied. Admins only.",
      });
    }
    next();
  },
  updateApplicationStatus
);

// Student signs the lease agreement for their approved application
router.patch("/:id/sign-lease", authMiddleware, signLease);

// View application status history
router.get(
  "/:id/history",
  authMiddleware,
  getApplicationStatusHistory
);

// View all applications (admin only)
router.get(
  "/",
  authMiddleware,
  (req, res, next) => {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Access denied. Admins only.",
      });
    }
    next();
  },
  getAllApplications
);

// View one application
router.get("/:id", authMiddleware, getApplicationById);

module.exports = router;
