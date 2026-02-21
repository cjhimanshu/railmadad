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
} = require("../controllers/complaint.controller");
const { protect } = require("../middleware/auth.middleware");
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
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ max: 2000 })
    .withMessage("Description cannot exceed 2000 characters"),
];

// Routes - all protected
router.use(protect);

router
  .route("/")
  .get(getUserComplaints)
  .post(upload.single("image"), complaintValidation, validate, createComplaint);

router
  .route("/:id")
  .get(getComplaint)
  .put(complaintValidation, validate, updateComplaint)
  .delete(deleteComplaint);

router.put("/:id/satisfaction", submitSatisfaction);
router.put("/:id/confirm-resolved", customerConfirmResolved);

module.exports = router;
