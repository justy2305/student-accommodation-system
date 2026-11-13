const applicationModel = require("../models/applicationModel");
const applicationStatusModel = require("../models/applicationStatusModel");

// Status changes are made by the automatic review (src/services/applicationReview.js).
// Here: viewing the history, and the student signing their lease.

const toId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

// View the status history of one of the student's own applications
const getApplicationStatusHistory = async (req, res) => {
  try {
    const applicationId = toId(req.params.id);

    if (!applicationId) {
      return res.status(400).json({
        message: "Invalid application ID",
      });
    }

    const application =
      await applicationModel.getApplicationById(applicationId);

    if (!application || Number(application.student_id) !== Number(req.user.id)) {
      return res.status(404).json({
        message: "Application not found",
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
    const applicationId = toId(req.params.id);

    if (!applicationId) {
      return res.status(400).json({
        message: "Invalid application ID",
      });
    }

    const application =
      await applicationModel.getApplicationById(applicationId);

    if (!application || Number(application.student_id) !== Number(req.user.id)) {
      return res.status(404).json({
        message: "Application not found",
      });
    }

    if (application.status !== "Approved") {
      return res.status(400).json({
        message: "Only approved applications have a lease to sign",
      });
    }

    if (!application.lease_start || !application.lease_end) {
      return res.status(400).json({
        message: "This application has no lease dates yet",
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
  getApplicationStatusHistory,
  signLease,
};
