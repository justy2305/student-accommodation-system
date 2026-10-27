
const pool = require("../config/database");

// Create an accommodation
const createAccommodation = async (name, location, description, price) => {
  const result = await pool.query(
    `INSERT INTO accommodations (name, location, description, price)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [name, location, description, price]
  );

  return result.rows[0];
};

// Get all accommodations
const getAllAccommodations = async () => {
  const result = await pool.query(
    "SELECT * FROM accommodations ORDER BY id DESC"
  );

  return result.rows;
};

// Get one accommodation by ID
const getAccommodationById = async (id) => {
  const result = await pool.query(
    "SELECT * FROM accommodations WHERE id = $1",
    [id]
  );

  return result.rows[0];
};

// Update an accommodation
const updateAccommodation = async (
  id,
  name,
  location,
  description,
  price
) => {
  const result = await pool.query(
    `UPDATE accommodations
     SET name = $1,
         location = $2,
         description = $3,
         price = $4
     WHERE id = $5
     RETURNING *`,
    [name, location, description, price, id]
  );

  return result.rows[0];
};

// Delete an accommodation
const deleteAccommodation = async (id) => {
  const result = await pool.query(
    "DELETE FROM accommodations WHERE id = $1 RETURNING *",
    [id]
  );

  return result.rows[0];
};

// Search and filter accommodations
const searchAccommodations = async ({
  search,
  location,
  minPrice,
  maxPrice,
}) => {
  const conditions = [];
  const values = [];

  // Search by accommodation name OR location
  if (search) {
    values.push(`%${search}%`);
    conditions.push(
      `(name ILIKE $${values.length} OR location ILIKE $${values.length})`
    );
  }

  // Filter by a specific location
  if (location) {
    values.push(`%${location}%`);
    conditions.push(`location ILIKE $${values.length}`);
  }

  // Filter by minimum price
  if (minPrice !== undefined && minPrice !== "") {
    values.push(Number(minPrice));
    conditions.push(`price >= $${values.length}`);
  }

  // Filter by maximum price
  if (maxPrice !== undefined && maxPrice !== "") {
    values.push(Number(maxPrice));
    conditions.push(`price <= $${values.length}`);
  }

  let query = "SELECT * FROM accommodations";

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  query += " ORDER BY id DESC";

  const result = await pool.query(query, values);
  return result.rows;
};

module.exports = {
  createAccommodation,
  getAllAccommodations,
  getAccommodationById,
  updateAccommodation,
  deleteAccommodation,
  searchAccommodations,
};
