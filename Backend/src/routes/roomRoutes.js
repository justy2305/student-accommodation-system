const express = require("express");

const {
  createRoom,
  getAllRooms,
  getRoomById
} = require("../controllers/roomController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Create a room - requires a valid JWT token
router.post("/", authMiddleware, createRoom);

// View all rooms
router.get("/", getAllRooms);

// View one room
router.get("/:id", getRoomById);

module.exports = router;