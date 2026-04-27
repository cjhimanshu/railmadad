const express = require("express");
const { body, param, query } = require("express-validator");
const {
  getAllComplaints,
  updateComplaintStatus,
  getAnalytics,
  getStats,
  getDispatchLog,
  acknowledgeDispatch,
  markAuthorityDone,
  bulkSendToAuthority,
} = require("../controllers/admin.controller");
const { protect, authorize } = require("../middleware/auth.middleware");
const validate = require("../middleware/validation.middleware");

const router = express.Router();

const COMPLAINT_STATUSES = ["pending", "in_progress", "resolved", "rejected"];
const COMPLAINT_PRIORITIES = ["low", "medium", "high", "urgent"];
const COMPLAINT_CATEGORIES = [
  "cleanliness",
  "safety",
  "staff_behavior",
  "staff_complaint",
  "overcharging",
  "facilities",
  "ticketing",
  "punctuality",
  "food_quality",
  "infrastructure",
  "seat_occupied_by_other",
  "other",
];
const DEPARTMENTS = [
  "maintenance",
  "security",
  "customer_service",
  "catering",
  "operations",
  "technical",
  "unassigned",
];
const DISPATCH_TYPES = ["IMMEDIATE", "BATCH_5MIN", "BATCH_10MIN"];

const mongoIdParamValidation = [
  param("id").isMongoId().withMessage("Complaint ID must be valid"),
];

const complaintListValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer")
    .toInt(),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 200 })
    .withMessage("Limit must be an integer between 1 and 200")
    .toInt(),
  query("status")
    .optional()
    .isIn(COMPLAINT_STATUSES)
    .withMessage("Status filter is invalid"),
  query("category")
    .optional()
    .isIn(COMPLAINT_CATEGORIES)
    .withMessage("Category filter is invalid"),
  query("priority")
    .optional()
    .isIn(COMPLAINT_PRIORITIES)
    .withMessage("Priority filter is invalid"),
  query("department")
    .optional()
    .isIn(DEPARTMENTS)
    .withMessage("Department filter is invalid"),
];

const statusUpdateValidation = [
  ...mongoIdParamValidation,
  body("status")
    .optional()
    .isIn(COMPLAINT_STATUSES)
    .withMessage("Status must be valid"),
  body("assignedDepartment")
    .optional()
    .isIn(DEPARTMENTS)
    .withMessage("Assigned department must be valid"),
  body("adminNotes")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Admin notes cannot exceed 1000 characters"),
];

const authorityActionValidation = [
  ...mongoIdParamValidation,
  body("actionNotes")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Action notes cannot exceed 1000 characters"),
];

const bulkDispatchValidation = [
  body("status")
    .optional()
    .isIn(COMPLAINT_STATUSES)
    .withMessage("Status filter is invalid"),
  body("priority")
    .optional()
    .isIn(COMPLAINT_PRIORITIES)
    .withMessage("Priority filter is invalid"),
];

const dispatchLogValidation = [
  query("priority")
    .optional()
    .isIn(COMPLAINT_PRIORITIES)
    .withMessage("Priority filter is invalid"),
  query("dispatchType")
    .optional()
    .isIn(DISPATCH_TYPES)
    .withMessage("Dispatch type filter is invalid"),
  query("acknowledged")
    .optional()
    .isBoolean()
    .withMessage("Acknowledged filter must be true or false"),
];

const acknowledgeDispatchValidation = [
  param("batchId")
    .trim()
    .matches(/^[A-Z]+-\d{13}-[A-Z0-9]{5}$/i)
    .withMessage("Dispatch batch ID must be valid"),
];

// All routes are protected and admin-only
router.use(protect);
router.use(authorize("admin"));

router.get("/complaints", complaintListValidation, validate, getAllComplaints);
router.put(
  "/complaints/:id/status",
  statusUpdateValidation,
  validate,
  updateComplaintStatus,
);
router.put(
  "/complaints/:id/mark-done",
  authorityActionValidation,
  validate,
  markAuthorityDone,
);
router.post(
  "/bulk-send-to-authority",
  bulkDispatchValidation,
  validate,
  bulkSendToAuthority,
);
router.get("/analytics", getAnalytics);
router.get("/stats", getStats);
router.get("/dispatch-log", dispatchLogValidation, validate, getDispatchLog);
router.put(
  "/dispatch-log/:batchId/acknowledge",
  acknowledgeDispatchValidation,
  validate,
  acknowledgeDispatch,
);

module.exports = router;
