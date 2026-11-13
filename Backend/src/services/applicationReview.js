const pool = require("../config/database");
const notificationModel = require("../models/notificationModel");

// Automatic application review: the system decides, not a person.
//
//   Pending  --(1 minute)-->  Under Review  --(1 more minute)-->  Approved / Rejected
//
// The total time is APPLICATION_REVIEW_SECONDS in .env (default 120 seconds),
// counted from when the student applied: Under Review after half of it,
// the decision at the full time.
//
// An application is approved when:
//   1. the room type the student chose is available at that home
//      (is_available, and not 0 free rooms), and
//   2. the student does not already have an approved home with a lease
//      that has not ended.
// Otherwise it is rejected, with the reason saved and sent to the student.
// When approved, the lease runs from the 1st of next month to 30 November
// (the end of the academic year), and one free room is taken off the count.

const REVIEW_SECONDS = Number(process.env.APPLICATION_REVIEW_SECONDS) > 0
  ? Number(process.env.APPLICATION_REVIEW_SECONDS)
  : 120;
const STEP_SECONDS = REVIEW_SECONDS / 2;
const CHECK_EVERY_MS = Math.min(15000, STEP_SECONDS * 500);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "2026-12-01" → "1 Dec 2026"
const formatDate = (isoDate) => {
  const [year, month, day] = isoDate.split("-").map(Number);
  return `${day} ${MONTHS[month - 1]} ${year}`;
};

const toIsoDate = (year, month, day) =>
  `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

// Lease: 1st of next month to 30 November. A lease starting in November or
// December ends on 30 November of the following year.
const getLeaseDates = (today = new Date()) => {
  let year = today.getFullYear();
  let month = today.getMonth() + 2; // next month, 1-12
  if (month > 12) {
    month = 1;
    year += 1;
  }

  const endYear = month >= 11 ? year + 1 : year;

  return {
    leaseStart: toIsoDate(year, month, 1),
    leaseEnd: toIsoDate(endYear, 11, 30),
  };
};

const ROOM_LABELS = { Single: "single room", Shared: "shared room", Triple: "triple room" };
const roomLabel = (type) => ROOM_LABELS[type] ?? "room";

const addHistory = (client, applicationId, status, note) =>
  client.query(
    `INSERT INTO application_status_history (application_id, status, changed_by, note)
     VALUES ($1, $2, NULL, $3)`,
    [applicationId, status, note]
  );

// Step 1: applied STEP_SECONDS ago and still Pending → Under Review
async function startReviews() {
  const client = await pool.connect();
  const notices = [];

  try {
    await client.query("BEGIN");

    const due = await client.query(
      `SELECT applications.id, applications.student_id, accommodations.name
       FROM applications
       JOIN accommodations ON accommodations.id = applications.accommodation_id
       WHERE applications.status = 'Pending'
         AND applications.created_at <= NOW() - make_interval(secs => $1)
       ORDER BY applications.id
       FOR UPDATE OF applications SKIP LOCKED`,
      [STEP_SECONDS]
    );

    for (const application of due.rows) {
      await client.query(
        `UPDATE applications SET status = 'Under Review', status_updated_at = NOW() WHERE id = $1`,
        [application.id]
      );
      await addHistory(client, application.id, "Under Review", "Automatic review started");
      notices.push({
        studentId: application.student_id,
        applicationId: application.id,
        message: `Your application for ${application.name} is now under review. You'll get a decision in about ${Math.max(1, Math.round(STEP_SECONDS / 60))} minute${STEP_SECONDS >= 90 ? "s" : ""}.`,
      });
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }

  await sendNotices(notices);
  return notices.length;
}

// Step 2: applied REVIEW_SECONDS ago and Under Review → Approved or Rejected.
// One transaction per application, so two decisions for the same room type
// cannot both take the last free room.
async function makeDecisions() {
  const due = await pool.query(
    `SELECT id FROM applications
     WHERE status = 'Under Review'
       AND created_at <= NOW() - make_interval(secs => $1)
     ORDER BY id`,
    [REVIEW_SECONDS]
  );

  let decided = 0;
  for (const { id } of due.rows) {
    if (await decide(id)) decided += 1;
  }
  return decided;
}

async function decide(applicationId) {
  const client = await pool.connect();
  let notice = null;

  try {
    await client.query("BEGIN");

    const found = await client.query(
      `SELECT applications.*, accommodations.name AS accommodation_name
       FROM applications
       JOIN accommodations ON accommodations.id = applications.accommodation_id
       WHERE applications.id = $1 AND applications.status = 'Under Review'
       FOR UPDATE OF applications SKIP LOCKED`,
      [applicationId]
    );

    const application = found.rows[0];
    if (!application) {
      // Already decided, withdrawn, or being decided by another check
      await client.query("ROLLBACK");
      return false;
    }

    const roomType = await client.query(
      `SELECT * FROM accommodation_room_types
       WHERE accommodation_id = $1 AND room_type = $2
       FOR UPDATE`,
      [application.accommodation_id, application.room_type]
    );
    const room = roomType.rows[0];

    const currentHome = await client.query(
      `SELECT accommodations.name
       FROM applications
       JOIN accommodations ON accommodations.id = applications.accommodation_id
       WHERE applications.student_id = $1
         AND applications.id <> $2
         AND applications.status = 'Approved'
         AND (applications.lease_end IS NULL OR applications.lease_end >= CURRENT_DATE)
       LIMIT 1`,
      [application.student_id, application.id]
    );

    const label = roomLabel(application.room_type);
    let reason = null;

    if (currentHome.rows.length > 0) {
      reason = `You already have an approved home at ${currentHome.rows[0].name}.`;
    } else if (!room || !room.is_available || room.available_rooms === 0) {
      reason = `There are no ${label}s available at ${application.accommodation_name} right now.`;
    }

    if (reason) {
      await client.query(
        `UPDATE applications
         SET status = 'Rejected', status_updated_at = NOW(), decision_reason = $2
         WHERE id = $1`,
        [application.id, reason]
      );
      await addHistory(client, application.id, "Rejected", `Automatic decision: ${reason}`);
      notice = {
        studentId: application.student_id,
        applicationId: application.id,
        message: `Your application for a ${label} at ${application.accommodation_name} was not successful. ${reason} You can apply for another room type or home.`,
      };
    } else {
      const { leaseStart, leaseEnd } = getLeaseDates();

      await client.query(
        `UPDATE applications
         SET status = 'Approved', status_updated_at = NOW(), decision_reason = NULL,
             lease_start = $2, lease_end = $3, lease_signed_at = NULL
         WHERE id = $1`,
        [application.id, leaseStart, leaseEnd]
      );

      // Take one free room off the count (when the count is known)
      if (room.available_rooms !== null) {
        await client.query(
          "UPDATE accommodation_room_types SET available_rooms = available_rooms - 1 WHERE id = $1",
          [room.id]
        );
      }

      await addHistory(client, application.id, "Approved", "Automatic decision: room available");
      notice = {
        studentId: application.student_id,
        applicationId: application.id,
        message: `Good news! Your application for a ${label} at ${application.accommodation_name} has been approved. Your lease runs from ${formatDate(leaseStart)} to ${formatDate(leaseEnd)}. Sign your lease agreement on your dashboard.`,
      };
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }

  await sendNotices([notice]);
  return true;
}

// Notifications are sent after the status change is saved; a failed
// notification is logged but does not undo the decision
async function sendNotices(notices) {
  for (const notice of notices) {
    try {
      await notificationModel.createNotification(notice.studentId, notice.applicationId, notice.message);
    } catch (error) {
      console.error("Review notification error:", error.message);
    }
  }
}

// Runs both steps once. Called on a timer and whenever a student loads their
// applications or notifications, so they always see the latest status.
let running = null;
async function processDueApplications() {
  if (!running) {
    running = (async () => {
      try {
        await startReviews();
        await makeDecisions();
      } finally {
        running = null;
      }
    })();
  }
  return running;
}

// Same as processDueApplications, but never throws (logs instead)
async function processQuietly() {
  try {
    await processDueApplications();
  } catch (error) {
    console.error("Automatic review error:", error.message);
  }
}

// Start the timer (called once from server.js)
function startAutomaticReview() {
  const timer = setInterval(processQuietly, CHECK_EVERY_MS);
  timer.unref();
  processQuietly();
  console.log(`Automatic application review is on (decision after ${REVIEW_SECONDS} seconds)`);
}

module.exports = {
  REVIEW_SECONDS,
  getLeaseDates,
  processDueApplications,
  processQuietly,
  startAutomaticReview,
};
