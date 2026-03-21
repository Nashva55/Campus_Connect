const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { getMyProfile, updateMyProfile } = require("../controllers/userController");

const router = express.Router();

router.get("/me", protect, getMyProfile);
router.put("/me", protect, updateMyProfile);

module.exports = router;
