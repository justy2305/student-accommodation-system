const pool = require("../config/database");

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
    RETURNING id, first_name, last_name, email, phone, role, created_at`,
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
    `SELECT id, first_name, last_name, email, phone, role, created_at
    FROM users
    WHERE id = $1`,
    [id]
  );

  return result.rows[0];
};

module.exports = {
  createUser,
  findUserByEmail,
  findUserById
};
