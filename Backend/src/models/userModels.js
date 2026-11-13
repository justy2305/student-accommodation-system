const pool = require("../config/database");

// Everything about a user except the password hash
const PROFILE_COLUMNS = `
  id, first_name, last_name, email, phone, created_at,
  institution, student_number, programme, year_of_study, updated_at`;

const createUser = async (
  firstName,
  lastName,
  email,
  password,
  phone
) => {
  const result = await pool.query(
    `INSERT INTO users
    (first_name, last_name, email, password, phone)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING ${PROFILE_COLUMNS}`,
    [firstName, lastName, email, password, phone]
  );

  return result.rows[0];
};

// Case-insensitive, so "Name@Example.com" and "name@example.com" match
const findUserByEmail = async (email) => {
  const result = await pool.query(
    "SELECT * FROM users WHERE LOWER(email) = LOWER($1)",
    [email]
  );

  return result.rows[0];
};

// Never selects the password hash
const findUserById = async (id) => {
  const result = await pool.query(
    `SELECT ${PROFILE_COLUMNS}
    FROM users
    WHERE id = $1`,
    [id]
  );

  return result.rows[0];
};

// Is this email already used by a different account? (case-insensitive)
const isEmailTakenByOther = async (email, userId) => {
  const result = await pool.query(
    "SELECT 1 FROM users WHERE LOWER(email) = LOWER($1) AND id <> $2",
    [email, userId]
  );

  return result.rows.length > 0;
};

// Update the student's own details. The password is never changed here.
const updateProfile = async (userId, profile) => {
  const result = await pool.query(
    `UPDATE users
     SET first_name = $2,
         last_name = $3,
         email = $4,
         phone = $5,
         institution = $6,
         student_number = $7,
         programme = $8,
         year_of_study = $9,
         updated_at = NOW()
     WHERE id = $1
     RETURNING ${PROFILE_COLUMNS}`,
    [
      userId,
      profile.firstName,
      profile.lastName,
      profile.email,
      profile.phone,
      profile.institution,
      profile.studentNumber,
      profile.programme,
      profile.yearOfStudy,
    ]
  );

  return result.rows[0];
};

// Only used to check the password before deleting an account
const getPasswordHash = async (userId) => {
  const result = await pool.query("SELECT password FROM users WHERE id = $1", [userId]);
  return result.rows[0]?.password ?? null;
};

// Delete an account. Applications and notifications go with it
// (ON DELETE CASCADE); status history keeps the row with changed_by NULL.
const deleteUser = async (userId) => {
  const result = await pool.query("DELETE FROM users WHERE id = $1 RETURNING id", [userId]);
  return result.rows[0];
};

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  isEmailTakenByOther,
  updateProfile,
  getPasswordHash,
  deleteUser
};
