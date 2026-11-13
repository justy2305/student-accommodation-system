const applicationModel = require("../models/applicationModel");
const accommodationModel = require("../models/accommodationModel");
const notificationModel = require("../models/notificationModel");
const { REVIEW_SECONDS, processQuietly } = require("../services/applicationReview");
const { validateLeaseChoice } = require("../utils/leaseDates");

// Statuses a student can still withdraw from
const WITHDRAWABLE_STATUSES = ["Pending", "Under Review"];

// 120 → "2 minutes", 30 → "30 seconds"
const describeWait = (seconds) => {
  if (seconds < 60) return `${Math.round(seconds)} seconds`;
  const minutes = Math.round(seconds / 60);
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
};

const toId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

// Submit an application
// POST /api/applications  { accommodation_id, room_type, move_in_date, lease_months }
const createApplication = async (req, res) => {
  try {
    // The student ID comes from the verified login token
    const studentId = req.user.id;
    const accommodationId = toId(req.body.accommodation_id);
    const roomType = req.body.room_type;
    const moveInDate = req.body.move_in_date;
    const leaseMonths = Number(req.body.lease_months);

    if (!accommodationId) {
      return res.status(400).json({
        message: "Please provide a valid accommodation_id",
      });
    }

    if (!accommodationModel.ROOM_TYPES.includes(roomType)) {
      return res.status(400).json({
        message: `Choose a room type: ${accommodationModel.ROOM_TYPES.join(", ")}`,
      });
    }

    const leaseError = validateLeaseChoice(moveInDate, leaseMonths);
    if (leaseError) {
      return res.status(400).json({
        message: leaseError,
      });
    }

    // Check that the accommodation exists and offers that room type
    const accommodation =
      await accommodationModel.getAccommodationById(accommodationId);

    if (!accommodation) {
      return res.status(404).json({
        message: "Accommodation not found",
      });
    }

    const offersRoomType = (accommodation.room_types ?? []).some(
      (room) => room.room_type === roomType
    );

    if (!offersRoomType) {
      return res.status(400).json({
        message: `${accommodation.name} doesn't offer ${roomType.toLowerCase()} rooms`,
      });
    }

    // One open application per home
    const existing = await applicationModel.findOpenApplication(
      studentId,
      accommodationId
    );

    if (existing) {
      return res.status(409).json({
        message: `You already have an application for ${accommodation.name} (${existing.status.toLowerCase()})`,
      });
    }

    const application = await applicationModel.createApplication(
      studentId,
      accommodationId,
      roomType,
      moveInDate,
      leaseMonths
    );

    // Let the student know it arrived. The application is already saved,
    // so a failed notification is logged but does not fail the request.
    try {
      await notificationModel.createNotification(
        studentId,
        application.id,
        `We've received your application for a ${roomType.toLowerCase()} room at ${accommodation.name}. You'll get a decision in about ${describeWait(REVIEW_SECONDS)}.`
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
    // Bring any due automatic decisions up to date first
    await processQuietly();

    const applications =
      await applicationModel.getApplicationsByStudent(req.user.id);

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

// Get one of the student's own applications
const getApplicationById = async (req, res) => {
  try {
    const id = toId(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: "Invalid application ID",
      });
    }

    // Bring any due automatic decisions up to date first
    await processQuietly();

    const application = await applicationModel.getApplicationById(id);

    // Someone else's application gets "not found", so ids can't be probed
    if (!application || Number(application.student_id) !== Number(req.user.id)) {
      return res.status(404).json({
        message: "Application not found",
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

// Withdraw (delete) one of the student's own applications, while it is
// Pending or Under Review
// DELETE /api/applications/:id
const deleteApplication = async (req, res) => {
  try {
    const id = toId(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: "Invalid application ID",
      });
    }

    const application = await applicationModel.getApplicationById(id);

    if (!application || Number(application.student_id) !== Number(req.user.id)) {
      return res.status(404).json({
        message: "Application not found",
      });
    }

    if (!WITHDRAWABLE_STATUSES.includes(application.status)) {
      return res.status(409).json({
        message: `This application is ${application.status.toLowerCase()} and can no longer be withdrawn`,
      });
    }

    const deleted = await applicationModel.deleteApplication(id);

    return res.status(200).json({
      message: "Application withdrawn",
      application: deleted,
    });
  } catch (error) {
    console.error("Delete application error:", error);

    return res.status(500).json({
      message: "Server error while withdrawing application",
    });
  }
};

module.exports = {
  createApplication,
  getMyApplications,
  getApplicationById,
  deleteApplication,
};
