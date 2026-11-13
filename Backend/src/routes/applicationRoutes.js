const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  createApplication,
  getMyApplications,
  getApplicationById,
  deleteApplication,
} = require("../controllers/applicationController");

const {
  getApplicationStatusHistory,
  signLease,
} = require("../controllers/applicationStatusController");

// Every route here is for the logged-in student and their own applications.
// Statuses change through the automatic review, not through the API.
router.use(authMiddleware);

// Submit an application { accommodation_id, room_type }
router.post("/", createApplication);

// View the logged-in student's applications
router.get("/my", getMyApplications);

// Student signs the lease agreement for their approved application
router.patch("/:id/sign-lease", signLease);

// View application status history
router.get("/:id/history", getApplicationStatusHistory);

// View one application
router.get("/:id", getApplicationById);

// Withdraw an application (only while Pending or Under Review)
router.delete("/:id", deleteApplication);

module.exports = router;
