const pool = require("../config/database");

// Create a room
const createRoom = async (
  accommodationId,
  roomNumber,
  price,
  status
) => {
  const result = await pool.query(
    `INSERT INTO rooms
    (accommodation_id, room_number, price, status)
    VALUES ($1, $2, $3, $4)
    RETURNING *`,
    [accommodationId, roomNumber, price, status]
  );

  return result.rows[0];
};

// Get all rooms
const getAllRooms = async () => {
  const result = await pool.query(
    "SELECT * FROM rooms ORDER BY id DESC"
  );

  return result.rows;
};

// Get one room by ID
const getRoomById = async (id) => {
  const result = await pool.query(
    "SELECT * FROM rooms WHERE id = $1",
    [id]
  );

  return result.rows[0];
};

module.exports = {
  createRoom,
  getAllRooms,
  getRoomById
};