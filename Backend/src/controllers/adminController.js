
const pool = require("../config/database");

// Get all registered users
const getAllUsers = async (req, res) => {
  try {
    // Do not return password hashes
    const result = await pool.query(
      `SELECT id, first_name, last_name, email, phone, role, created_at
       FROM users
       ORDER BY id DESC`
    );

    return res.status(200).json({
      count: result.rows.length,
      users: result.rows,
    });
  } catch (error) {
    console.error("Admin get users error:", error);

    return res.status(500).json({
      message: "Server error while retrieving users",
    });
  }
};


// Get all accommodations
const getAllAccommodations = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM accommodations ORDER BY id DESC"
    );

    return res.status(200).json({
      count: result.rows.length,
      accommodations: result.rows,
    });
  } catch (error) {
    console.error("Admin get accommodations error:", error);

    return res.status(500).json({
      message: "Server error while retrieving accommodations",
    });
  }
};


// Get all student applications
const getAllApplications = async (req, res) => {
  try {
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

    return res.status(200).json({
      count: result.rows.length,
      applications: result.rows,
    });
  } catch (error) {
    console.error("Admin get applications error:", error);

    return res.status(500).json({
      message: "Server error while retrieving applications",
    });
  }
};

module.exports = {
  getAllUsers,
  getAllAccommodations,
  getAllApplications,
};

