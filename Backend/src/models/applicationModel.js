
const pool = require("../config/database");

// Submit a new application
const createApplication = async (studentId, accommodationId) => {
  const result = await pool.query(
    `INSERT INTO applications (student_id, accommodation_id)
     VALUES ($1, $2)
     RETURNING *`,
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
       accommodations.price AS accommodation_price,
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

// Get all applications for administration
const getAllApplications = async () => {
  const result = await pool.query(
    `SELECT
       applications.*,
       users.first_name,
       users.last_name,
       users.email,
       accommodations.name AS accommodation_name,
       accommodations.location AS accommodation_location
     FROM applications
     JOIN users ON applications.student_id = users.id
     JOIN accommodations
       ON applications.accommodation_id = accommodations.id
     ORDER BY applications.created_at DESC`
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

module.exports = {
  createApplication,
  getApplicationsByStudent,
  getAllApplications,
  getApplicationById,
};
