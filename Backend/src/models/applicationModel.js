const pool = require("../config/database");

// Submit a new application for one room type, move-in date and lease length
const createApplication = async (studentId, accommodationId, roomType, moveInDate, leaseMonths) => {
  const result = await pool.query(
    `INSERT INTO applications (student_id, accommodation_id, room_type, move_in_date, lease_months)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [studentId, accommodationId, roomType, moveInDate, leaseMonths]
  );

  return result.rows[0];
};

// The student's open or approved application for a home, if any
// (used to stop applying twice for the same home)
const findOpenApplication = async (studentId, accommodationId) => {
  const result = await pool.query(
    `SELECT * FROM applications
     WHERE student_id = $1
       AND accommodation_id = $2
       AND status IN ('Pending', 'Under Review', 'Approved')
     LIMIT 1`,
    [studentId, accommodationId]
  );

  return result.rows[0];
};

// Get applications submitted by one student
const getApplicationsByStudent = async (studentId) => {
  const result = await pool.query(
    `SELECT
       applications.*,
       accommodations.name AS accommodation_name,
       accommodations.location AS accommodation_location,
       COALESCE(
         (SELECT Rtype.price FROM accommodation_room_types Rtype
          WHERE Rtype.accommodation_id = accommodations.id
            AND Rtype.room_type = applications.room_type),
         accommodations.price
       ) AS accommodation_price,
       (SELECT image_url FROM accommodation_images Aimage
        WHERE Aimage.accommodation_id = accommodations.id
        ORDER BY Aimage.id LIMIT 1) AS accommodation_image
     FROM applications
     JOIN accommodations
       ON applications.accommodation_id = accommodations.id
     WHERE applications.student_id = $1
     ORDER BY applications.created_at DESC`,
    [studentId]
  );

  return result.rows;
};

// Get one application by ID
const getApplicationById = async (id) => {
  const result = await pool.query(
    "SELECT * FROM applications WHERE id = $1",
    [id]
  );

  return result.rows[0];
};

// Delete an application. Its status history and notifications are deleted
// with it (ON DELETE CASCADE).
const deleteApplication = async (id) => {
  const result = await pool.query(
    "DELETE FROM applications WHERE id = $1 RETURNING *",
    [id]
  );

  return result.rows[0];
};

module.exports = {
  createApplication,
  findOpenApplication,
  getApplicationsByStudent,
  getApplicationById,
  deleteApplication,
};
