const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  getMyProfile,
  updateMyProfile,
  deleteMyAccount,
} = require("../controllers/userController");

const router = express.Router();

// All of these act on the logged-in user only
router.use(authMiddleware);

router.get("/me", getMyProfile);
router.put("/me", updateMyProfile);
router.delete("/me", deleteMyAccount);

module.exports = router;
