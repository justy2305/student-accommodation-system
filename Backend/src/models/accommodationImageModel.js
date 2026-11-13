const pool = require("../config/database");

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
  getAccommodationImages,
};
