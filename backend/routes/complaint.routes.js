const express = require("express");
const { body } = require("express-validator");
const rateLimit = require("express-rate-limit");
const {
  createComplaint,
  getUserComplaints,
  getComplaint,
  updateComplaint,
  deleteComplaint,
  submitSatisfaction,
  customerConfirmResolved,
  closeComplaint,
  trackComplaintWithCredentials,
  trackComplaintByContact,
} = require("../controllers/complaint.controller");
const { protect, optionalProtect } = require("../middleware/auth.middleware");
const validate = require("../middleware/validation.middleware");
const upload = require("../config/upload.config");

const router = express.Router();

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

const trackCredentialsValidation = [
  body("trackingUserId")
    .trim()
    .matches(/^TRK-[A-Z0-9]{8}$/i)
    .withMessage("Tracking ID must be in TRK-XXXXXXXX format"),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
];

const trackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many complaint tracking attempts. Please try again after 15 minutes.",
  },
});

router.post(
  "/",
  optionalProtect,
  upload.single("image"),
  complaintValidation,
  validate,
  createComplaint,
);

router.post(
  "/track",
  trackLimiter,
  trackCredentialsValidation,
  validate,
  trackComplaintWithCredentials,
);
router.get("/track", protect, trackComplaintByContact);

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
