const express = require("express");
const {
  getAllComplaints,
  updateComplaintStatus,
  getAnalytics,
  getStats,
  getDispatchLog,
  acknowledgeDispatch,
  markAuthorityDone,
} = require("../controllers/admin.controller");
const { protect, authorize } = require("../middleware/auth.middleware");

const router = express.Router();

// All routes are protected and admin-only
router.use(protect);
router.use(authorize("admin"));

router.get("/complaints", getAllComplaints);
router.put("/complaints/:id/status", updateComplaintStatus);
router.put("/complaints/:id/mark-done", markAuthorityDone);
router.get("/analytics", getAnalytics);
router.get("/stats", getStats);
router.get("/dispatch-log", getDispatchLog);
router.put("/dispatch-log/:batchId/acknowledge", acknowledgeDispatch);

module.exports = router;
