const roomModel = require("../models/roomModel");

// Create a room
const createRoom = async (req, res) => {
  try {
    const {
      accommodation_id,
      room_number,
      price,
      status
    } = req.body;

    if (
      !accommodation_id ||
      !room_number ||
      price === undefined ||
      price === null
    ) {
      return res.status(400).json({
        message: "Please provide all required fields"
      });
    }

    const room = await roomModel.createRoom(
      accommodation_id,
      room_number,
      price,
      status || "Available"
    );

    res.status(201).json({
      message: "Room created successfully",
      room
    });
  } catch (error) {
    console.error("Create room error:", error);

    res.status(500).json({
      message: "Server error"
    });
  }
};

// Get all rooms
const getAllRooms = async (req, res) => {
  try {
    const rooms = await roomModel.getAllRooms();

    res.json({ rooms });
  } catch (error) {
    console.error("Get rooms error:", error);

    res.status(500).json({
      message: "Server error"
    });
  }
};

// Get one room
const getRoomById = async (req, res) => {
  try {
    const room = await roomModel.getRoomById(req.params.id);

    if (!room) {
      return res.status(404).json({
        message: "Room not found"
      });
    }

    res.json({ room });
  } catch (error) {
    console.error("Get room error:", error);

    res.status(500).json({
      message: "Server error"
    });
  }
};

module.exports = {
  createRoom,
  getAllRooms,
  getRoomById
};