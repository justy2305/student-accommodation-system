const express = require("express");
const cors = require("cors");
require("dotenv").config();

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is missing from Backend/.env");
  process.exit(1);
}

const pool = require("./config/database");
const authRoutes = require("./routes/authRoutes");
const accommodationRoutes = require("./routes/accommodationRoutes");
const roomRoutes = require("./routes/roomRoutes");
const authMiddleware = require("./middleware/authMiddleware");
const accommodationImageRoutes = require("./routes/accommodationImageRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const adminRoutes = require("./routes/adminRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();

// Middleware
// The React app calls the API through the Vite proxy (same origin), so CORS is
// only needed if the frontend calls the API directly. Credentials are allowed
// so the login cookie is sent.
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express.json());

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/accommodations", accommodationRoutes);
app.use("/api/accommodation-images", accommodationImageRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);

// Home route
app.get("/", (req, res) => {
  res.json({
    message: "Student Accommodation API is running"
  });
});

// Test database connection
app.get("/api/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      message: "Database connected successfully",
      time: result.rows[0].now
    });
  } catch (error) {
    console.error("Database connection error:", error);

    res.status(500).json({
      message: "Database connection failed"
    });
  }
});

// Protected profile route
app.get("/api/profile", authMiddleware, (req, res) => {
  res.json({
    message: "You are logged in",
    user: req.user
  });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
