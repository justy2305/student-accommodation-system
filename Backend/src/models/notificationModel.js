const pool = require("../config/database");

// Create a notification
const createNotification = async (userId, applicationId, message) => {
    const result = await pool.query(
        `INSERT INTO notifications (user_id, application_id, message)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [userId, applicationId, message]
    );

    return result.rows[0];
};

// Get notifications belonging to one user
const getNotificationsByUser = async (userId) => {
    const result = await pool.query(
        `SELECT *
         FROM notifications
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
    );

    return result.rows;
};

// Mark a notification as read
const markNotificationAsRead = async (notificationId, userId) => {
    const result = await pool.query(
        `UPDATE notifications
         SET is_read = TRUE
         WHERE id = $1 AND user_id = $2
         RETURNING *`,
        [notificationId, userId]
    );

    return result.rows[0];
};

module.exports = {
    createNotification,
    getNotificationsByUser,
    markNotificationAsRead
};