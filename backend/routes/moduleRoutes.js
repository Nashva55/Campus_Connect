const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  getDashboardData,
  getInternships,
  getCompanies,
  getCertifications,
  getDomains,
  getInterviewPrep,
  getEvents,
  getNotifications
} = require("../controllers/moduleController");

const router = express.Router();

router.get("/dashboard", protect, getDashboardData);
router.get("/internships", protect, getInternships);
router.get("/companies", protect, getCompanies);
router.get("/certifications", protect, getCertifications);
router.get("/domains", protect, getDomains);
router.get("/interview-prep", protect, getInterviewPrep);
router.get("/events", protect, getEvents);
router.get("/notifications", protect, getNotifications);

module.exports = router;
