
const applicationModel = require("../models/applicationModel");
const applicationStatusModel = require("../models/applicationStatusModel");
const notificationModel = require("../models/notificationModel");

const allowedStatuses = [
  "Pending",
  "Under Review",
  "Approved",
  "Rejected",
];

// Admin updates an application's status and notifies the student
const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;
    const applicationId = Number(id);

    if (!Number.isInteger(applicationId) || applicationId <= 0) {
      return res.status(400).json({
        message: "Invalid application ID",
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message:
          "Status must be Pending, Under Review, Approved, or Rejected",
      });
    }

    if (note !== undefined && typeof note !== "string") {
      return res.status(400).json({
        message: "Note must be text",
      });
    }

    const existingApplication =
      await applicationModel.getApplicationById(applicationId);

    if (!existingApplication) {
      return res.status(404).json({
        message: "Application not found",
      });
    }

    // Update application status and record its history
    const updatedApplication =
      await applicationStatusModel.updateApplicationStatus(
        applicationId,
        status,
        req.user.id,
        note
      );

    if (!updatedApplication) {
      return res.status(404).json({
        message: "Application not found",
      });
    }

    // Create a notification for the student
    await notificationModel.createNotification(
      existingApplication.student_id,
      applicationId,
      `Your accommodation application #${applicationId} status has been updated to: ${status}.`
    );

    return res.status(200).json({
      message:
        "Application status updated and student notified successfully",
      application: updatedApplication,
    });
  } catch (error) {
    console.error("Update application status error:", error);

    return res.status(500).json({
      message: "Server error while updating application status",
    });
  }
};

// View status history (application owner or admin)
const getApplicationStatusHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const applicationId = Number(id);

    if (!Number.isInteger(applicationId) || applicationId <= 0) {
      return res.status(400).json({
        message: "Invalid application ID",
      });
    }

    const application =
      await applicationModel.getApplicationById(applicationId);

    if (!application) {
      return res.status(404).json({
        message: "Application not found",
      });
    }

    if (
      req.user.role !== "admin" &&
      Number(application.student_id) !== Number(req.user.id)
    ) {
      return res.status(403).json({
        message: "You are not allowed to view this history",
      });
    }

    const history =
      await applicationStatusModel.getApplicationStatusHistory(
        applicationId
      );

    return res.status(200).json({
      applicationId,
      count: history.length,
      history,
    });
  } catch (error) {
    console.error("Get application status history error:", error);

    return res.status(500).json({
      message: "Server error while retrieving status history",
    });
  }
};

module.exports = {
  updateApplicationStatus,
  getApplicationStatusHistory,
};
