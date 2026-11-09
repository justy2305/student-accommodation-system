const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
    getMyNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead
} = require("../controllers/notificationController");

// View the logged-in user's notifications
router.get("/", authMiddleware, getMyNotifications);

// Mark all notifications as read (before /:id so "read-all" is not taken as an id)
router.patch("/read-all", authMiddleware, markAllNotificationsAsRead);

// Mark a notification as read
router.patch("/:id/read", authMiddleware, markNotificationAsRead);

module.exports = router;