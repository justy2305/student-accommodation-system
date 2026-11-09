
const applicationModel = require("../models/applicationModel");
const applicationStatusModel = require("../models/applicationStatusModel");
const notificationModel = require("../models/notificationModel");

const allowedStatuses = [
  "Pending",
  "Under Review",
  "Approved",
  "Rejected",
];

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// true for a real calendar date written as YYYY-MM-DD
const isValidDate = (value) => {
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

// Admin updates an application's status and notifies the student.
// When approving, the admin can also send lease_start and lease_end (YYYY-MM-DD).
const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note, lease_start: leaseStart, lease_end: leaseEnd } = req.body;
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

    const hasLeaseDates = leaseStart !== undefined || leaseEnd !== undefined;

    if (hasLeaseDates) {
      if (status !== "Approved") {
        return res.status(400).json({
          message: "Lease dates can only be set when approving an application",
        });
      }

      if (!isValidDate(leaseStart) || !isValidDate(leaseEnd)) {
        return res.status(400).json({
          message: "lease_start and lease_end must both be dates in the format YYYY-MM-DD",
        });
      }

      if (leaseEnd <= leaseStart) {
        return res.status(400).json({
          message: "lease_end must be after lease_start",
        });
      }
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
        note,
        hasLeaseDates ? leaseStart : null,
        hasLeaseDates ? leaseEnd : null
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
      `Your accommodation application #${applicationId} status has been updated to: ${status}.` +
        (status === "Approved" && updatedApplication.lease_start && updatedApplication.lease_end
          ? ` Your lease runs from ${updatedApplication.lease_start} to ${updatedApplication.lease_end}. Please sign your lease agreement in your portal.`
          : "")
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

// Student signs the lease agreement for their approved application
const signLease = async (req, res) => {
  try {
    const applicationId = Number(req.params.id);

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

    // Only the student who applied can sign (not even an admin)
    if (Number(application.student_id) !== Number(req.user.id)) {
      return res.status(403).json({
        message: "You can only sign your own lease agreement",
      });
    }

    if (application.status !== "Approved") {
      return res.status(400).json({
        message: "Only approved applications have a lease to sign",
      });
    }

    if (!application.lease_start || !application.lease_end) {
      return res.status(400).json({
        message: "The housing team hasn't set your lease dates yet",
      });
    }

    if (application.lease_signed_at) {
      return res.status(409).json({
        message: "You have already signed this lease agreement",
      });
    }

    const signedApplication = await applicationStatusModel.signLease(
      applicationId,
      req.user.id
    );

    if (!signedApplication) {
      return res.status(409).json({
        message: "This lease could not be signed. Please refresh and try again",
      });
    }

    return res.status(200).json({
      message: "Lease agreement signed",
      application: signedApplication,
    });
  } catch (error) {
    console.error("Sign lease error:", error);

    return res.status(500).json({
      message: "Server error while signing the lease agreement",
    });
  }
};

module.exports = {
  updateApplicationStatus,
  getApplicationStatusHistory,
  signLease,
};
