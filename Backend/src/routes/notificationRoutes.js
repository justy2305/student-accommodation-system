const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
    getMyNotifications,
    markNotificationAsRead
} = require("../controllers/notificationController");

// View the logged-in user's notifications
router.get("/", authMiddleware, getMyNotifications);

// Mark a notification as read
router.patch("/:id/read", authMiddleware, markNotificationAsRead);

module.exports = router;