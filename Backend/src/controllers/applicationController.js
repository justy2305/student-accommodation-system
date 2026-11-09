const applicationModel = require("../models/applicationModel");
const accommodationModel = require("../models/accommodationModel");
const notificationModel = require("../models/notificationModel");

// Submit an application
const createApplication = async (req, res) => {
  try {
    // The student ID comes from the verified login token
    const studentId = req.user.id;
    const { accommodation_id } = req.body;

    if (!accommodation_id) {
      return res.status(400).json({
        message: "Please provide an accommodation_id",
      });
    }

    if (
      !Number.isInteger(Number(accommodation_id)) ||
      Number(accommodation_id) <= 0
    ) {
      return res.status(400).json({
        message: "Invalid accommodation_id",
      });
    }

    // Check that the accommodation exists
    const accommodation =
      await accommodationModel.getAccommodationById(
        Number(accommodation_id)
      );

    if (!accommodation) {
      return res.status(404).json({
        message: "Accommodation not found",
      });
    }

    const application =
      await applicationModel.createApplication(
        studentId,
        Number(accommodation_id)
      );

    // Let the student know it arrived. The application is already saved,
    // so a failed notification is logged but does not fail the request.
    try {
      await notificationModel.createNotification(
        studentId,
        application.id,
        `We've received your application for ${accommodation.name}. We'll let you know when its status changes.`
      );
    } catch (notificationError) {
      console.error("Application notification error:", notificationError.message);
    }

    return res.status(201).json({
      message: "Application submitted successfully",
      application,
    });
  } catch (error) {
    console.error("Create application error:", error);

    return res.status(500).json({
      message: "Server error while submitting application",
    });
  }
};


// Get the logged-in student's applications
const getMyApplications = async (req, res) => {
  try {
    const studentId = req.user.id;

    const applications =
      await applicationModel.getApplicationsByStudent(studentId);

    return res.status(200).json({
      count: applications.length,
      applications,
    });
  } catch (error) {
    console.error("Get student applications error:", error);

    return res.status(500).json({
      message: "Server error while retrieving applications",
    });
  }
};


// Get all applications (admin only)
const getAllApplications = async (req, res) => {
  try {
    const applications =
      await applicationModel.getAllApplications();

    return res.status(200).json({
      count: applications.length,
      applications,
    });
  } catch (error) {
    console.error("Get all applications error:", error);

    return res.status(500).json({
      message: "Server error while retrieving applications",
    });
  }
};


// Get one application
const getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      return res.status(400).json({
        message: "Invalid application ID",
      });
    }

    const application =
      await applicationModel.getApplicationById(Number(id));

    if (!application) {
      return res.status(404).json({
        message: "Application not found",
      });
    }

    // Students can only view their own applications.
    // Admins can view any application.
    if (
      req.user.role !== "admin" &&
      Number(application.student_id) !== Number(req.user.id)
    ) {
      return res.status(403).json({
        message: "You are not allowed to view this application",
      });
    }

    return res.status(200).json({
      application,
    });
  } catch (error) {
    console.error("Get application error:", error);

    return res.status(500).json({
      message: "Server error while retrieving application",
    });
  }
};

module.exports = {
  createApplication,
  getMyApplications,
  getAllApplications,
  getApplicationById,
};
