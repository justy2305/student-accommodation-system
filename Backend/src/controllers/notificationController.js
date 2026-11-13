const notificationModel = require("../models/notificationModel");
const { processQuietly } = require("../services/applicationReview");

// Get the logged-in user's notifications
const getMyNotifications = async (req, res) => {
    try {
        const userId = req.user.id;

        // Bring any due automatic decisions up to date first
        await processQuietly();

        const notifications =
            await notificationModel.getNotificationsByUser(userId);

        return res.status(200).json({
            message: "Notifications retrieved successfully",
            notifications
        });
    } catch (error) {
        console.error("Get notifications error:", error.message);

        return res.status(500).json({
            message: "Failed to retrieve notifications"
        });
    }
};

// Mark one of the user's notifications as read
const markNotificationAsRead = async (req, res) => {
    try {
        const notificationId = Number(req.params.id);

        if (!Number.isInteger(notificationId) || notificationId <= 0) {
            return res.status(400).json({
                message: "Invalid notification ID"
            });
        }

        const notification =
            await notificationModel.markNotificationAsRead(
                notificationId,
                req.user.id
            );

        if (!notification) {
            return res.status(404).json({
                message: "Notification not found"
            });
        }

        return res.status(200).json({
            message: "Notification marked as read",
            notification
        });
    } catch (error) {
        console.error("Mark notification read error:", error.message);

        return res.status(500).json({
            message: "Failed to update notification"
        });
    }
};

// Mark all of the logged-in user's notifications as read
const markAllNotificationsAsRead = async (req, res) => {
    try {
        const updated =
            await notificationModel.markAllNotificationsAsRead(req.user.id);

        return res.status(200).json({
            message: "All notifications marked as read",
            updated
        });
    } catch (error) {
        console.error("Mark all notifications read error:", error.message);

        return res.status(500).json({
            message: "Failed to update notifications"
        });
    }
};

module.exports = {
    getMyNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead
};