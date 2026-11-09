const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  getMyProfile,
  updateMyProfile,
} = require("../controllers/userController");

const router = express.Router();

// All of these act on the logged-in user only
router.use(authMiddleware);

router.get("/me", getMyProfile);
router.put("/me", updateMyProfile);

module.exports = router;
