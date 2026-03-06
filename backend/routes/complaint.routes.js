const express = require("express");
const { body } = require("express-validator");
const {
  createComplaint,
  getUserComplaints,
  getComplaint,
  updateComplaint,
  deleteComplaint,
  submitSatisfaction,
  customerConfirmResolved,
  closeComplaint,
  trackComplaintByContact,
} = require("../controllers/complaint.controller");
const { protect, optionalProtect } = require("../middleware/auth.middleware");
const validate = require("../middleware/validation.middleware");
const upload = require("../config/upload.config");

const router = express.Router();

// Validation rules
const complaintValidation = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ max: 200 })
    .withMessage("Title cannot exceed 200 characters"),
  body("description")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Description cannot exceed 2000 characters"),
];

// ── Public: submit a complaint (no login needed) ───────────────────────
router.post(
  "/",
  optionalProtect,
  upload.single("image"),
  complaintValidation,
  validate,
  createComplaint,
);

// ── Protected: track complaints (login required) ───────────────────────
router.get("/track", protect, trackComplaintByContact);

// ── Protected: all other complaint routes ─────────────────────────────
router.use(protect);

router.get("/", getUserComplaints);

router
  .route("/:id")
  .get(getComplaint)
  .put(complaintValidation, validate, updateComplaint)
  .delete(deleteComplaint);

router.put("/:id/satisfaction", submitSatisfaction);
router.put("/:id/confirm-resolved", customerConfirmResolved);
router.put("/:id/close", closeComplaint);

module.exports = router;
