
const pool = require("../config/database");

const createAccommodationImage = async (accommodationId, imageUrl) => {
  const result = await pool.query(
    `INSERT INTO accommodation_images (accommodation_id, image_url)
     VALUES ($1, $2)
     RETURNING *`,
    [accommodationId, imageUrl]
  );

  return result.rows[0];
};

const getAccommodationImages = async (accommodationId) => {
  const result = await pool.query(
    `SELECT * FROM accommodation_images
     WHERE accommodation_id = $1
     ORDER BY id DESC`,
    [accommodationId]
  );

  return result.rows;
};

module.exports = {
  createAccommodationImage,
  getAccommodationImages,
};
