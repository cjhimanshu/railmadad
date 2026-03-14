const Complaint = require("../models/Complaint");
const User = require("../models/User");
const ControlUnitDispatch = require("../models/ControlUnitDispatch");

// ── Simple in-memory analytics cache ─────────────────────────────────────────────────
const analyticsCache = { data: null, lastUpdated: 0, TTL: 5 * 60 * 1000 }; // 5-minute TTL
const statsCache = { data: null, lastUpdated: 0, TTL: 60 * 1000 }; // 1-minute TTL

// @desc    Get all complaints (Admin only) — paginated
// @route   GET /api/admin/complaints?page=1&limit=50&status=&category=&priority=&department=
// @access  Private/Admin
exports.getAllComplaints = async (req, res, next) => {
  try {
    const { status, category, priority, department } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, parseInt(req.query.limit) || 50);
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (department) filter.assignedDepartment = department;

    const [complaints, total] = await Promise.all([
      Complaint.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "name email phone"),
      Complaint.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: complaints.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: complaints,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update complaint status
// @route   PUT /api/admin/complaints/:id/status
// @access  Private/Admin
exports.updateComplaintStatus = async (req, res, next) => {
  try {
    const { status, assignedDepartment, adminNotes } = req.body;

    let complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    // Block direct "resolved" if closure requirements not met
    if (status === "resolved") {
      if (!complaint.authorityMarkedDone) {
        return res.status(400).json({
          success: false,
          message: "Authority must mark action as done before resolving.",
        });
      }
      if (!complaint.customerMarkedDone) {
        return res.status(400).json({
          success: false,
          message:
            "Customer must confirm resolution before complaint can be closed.",
        });
      }
      if (
        complaint.satisfactionRating !== null &&
        complaint.satisfactionRating < 3
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Customer gave a low satisfaction rating. Complaint cannot be closed. Please take further action.",
        });
      }
    }

    // Update fields
    if (status) complaint.status = status;
    if (assignedDepartment) complaint.assignedDepartment = assignedDepartment;
    if (adminNotes) complaint.adminNotes = adminNotes;

    // Set resolved date if status is resolved
    if (status === "resolved" && !complaint.resolvedAt) {
      complaint.resolvedAt = new Date();
      complaint.closureBlocked = false;
    }

    // Sync 4-level public tracking status
    if (status) {
      const prevTracking = complaint.trackingStatus;
      let newTracking = prevTracking;
      if (status === "in_progress" && prevTracking === "registered") {
        newTracking = "sent_to_authority";
      } else if (status === "resolved") {
        newTracking = "resolved";
      }
      if (newTracking !== prevTracking) {
        complaint.trackingStatus = newTracking;
        complaint.trackingHistory.push({
          stage: newTracking,
          updatedAt: new Date(),
          note:
            status === "resolved"
              ? "Complaint resolved."
              : "Complaint sent to concerned authority.",
        });
      }
    }
    if (
      assignedDepartment &&
      assignedDepartment !== "unassigned" &&
      complaint.trackingStatus === "registered"
    ) {
      complaint.trackingStatus = "sent_to_authority";
      complaint.trackingHistory.push({
        stage: "sent_to_authority",
        updatedAt: new Date(),
        note: `Assigned to ${assignedDepartment} department.`,
      });
    }

    await complaint.save();
    await complaint.populate("userId", "name email phone");

    res.status(200).json({
      success: true,
      message: "Complaint updated successfully",
      data: complaint,
    });
  } catch (error) {
    next(error);
  }
};
// @route   PUT /api/admin/complaints/:id/mark-done
// @access  Private/Admin
exports.markAuthorityDone = async (req, res, next) => {
  try {
    const { actionNotes } = req.body;

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res
        .status(404)
        .json({ success: false, message: "Complaint not found" });
    }

    complaint.authorityMarkedDone = true;
    complaint.authorityMarkedAt = new Date();
    if (actionNotes) complaint.authorityActionNotes = actionNotes;
    complaint.status = "in_progress"; // ensure status reflects action ongoing

    // Advance public tracking to "authority_taken_action"
    if (
      complaint.trackingStatus !== "resolved" &&
      complaint.trackingStatus !== "authority_taken_action"
    ) {
      complaint.trackingStatus = "authority_taken_action";
      complaint.trackingHistory.push({
        stage: "authority_taken_action",
        updatedAt: new Date(),
        note: `Authority has taken action. ${actionNotes || ""}`.trim(),
      });
    }

    complaint.automationLog.push({
      action: "AUTHORITY_MARKED_DONE",
      details: `Authority marked action taken. Notes: ${actionNotes || "None"}`,
      performedAt: new Date(),
    });

    await complaint.save();
    await complaint.populate("userId", "name email phone");

    res.status(200).json({
      success: true,
      message:
        "Complaint marked as action taken. Awaiting customer confirmation.",
      data: complaint,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard analytics
// @route   GET /api/admin/analytics
// @access  Private/Admin
exports.getAnalytics = async (req, res, next) => {
  try {
    // Serve from cache if fresh
    if (
      analyticsCache.data &&
      Date.now() - analyticsCache.lastUpdated < analyticsCache.TTL
    ) {
      return res
        .status(200)
        .json({ success: true, cached: true, data: analyticsCache.data });
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Run all heavy aggregations in parallel — single round-trip each
    const [
      totalComplaints,
      complaintsByStatus,
      complaintsByCategory,
      complaintsByPriority,
      complaintsBySentiment,
      recentComplaints,
      resolutionTimeAgg,
      complaintsTrend,
      totalUsers,
    ] = await Promise.all([
      Complaint.countDocuments(),

      Complaint.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Complaint.aggregate([
        { $group: { _id: "$category", count: { $sum: 1 } } },
      ]),
      Complaint.aggregate([
        { $group: { _id: "$priority", count: { $sum: 1 } } },
      ]),
      Complaint.aggregate([
        { $group: { _id: "$sentiment", count: { $sum: 1 } } },
      ]),

      Complaint.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),

      // Avg resolution time via aggregate — no in-memory array loading
      Complaint.aggregate([
        { $match: { status: "resolved", resolvedAt: { $exists: true } } },
        { $project: { diff: { $subtract: ["$resolvedAt", "$createdAt"] } } },
        { $group: { _id: null, avgMs: { $avg: "$diff" } } },
      ]),

      Complaint.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      User.countDocuments({ role: "user" }),
    ]);

    const avgResolutionTime = resolutionTimeAgg[0]
      ? Math.round(resolutionTimeAgg[0].avgMs / (1000 * 60 * 60))
      : 0;

    const toMap = (arr) =>
      arr.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {});

    const result = {
      totalComplaints,
      totalUsers,
      recentComplaints,
      avgResolutionTimeHours: avgResolutionTime,
      complaintsByStatus: toMap(complaintsByStatus),
      complaintsByCategory: toMap(complaintsByCategory),
      complaintsByPriority: toMap(complaintsByPriority),
      complaintsBySentiment: toMap(complaintsBySentiment),
      complaintsTrend,
    };

    // Populate cache
    analyticsCache.data = result;
    analyticsCache.lastUpdated = Date.now();

    res.status(200).json({ success: true, cached: false, data: result });
  } catch (error) {
    next(error);
  }
};

// @desc    Get complaint statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getStats = async (req, res, next) => {
  try {
    // Serve from cache if fresh
    if (
      statsCache.data &&
      Date.now() - statsCache.lastUpdated < statsCache.TTL
    ) {
      return res
        .status(200)
        .json({ success: true, cached: true, data: statsCache.data });
    }

    // All 6 counts run in parallel — one connection round-trip each
    const [pending, inProgress, resolved, rejected, urgent, high] =
      await Promise.all([
        Complaint.countDocuments({ status: "pending" }),
        Complaint.countDocuments({ status: "in_progress" }),
        Complaint.countDocuments({ status: "resolved" }),
        Complaint.countDocuments({ status: "rejected" }),
        Complaint.countDocuments({ priority: "urgent" }),
        Complaint.countDocuments({ priority: "high" }),
      ]);

    const stats = { pending, inProgress, resolved, rejected, urgent, high };
    statsCache.data = stats;
    statsCache.lastUpdated = Date.now();

    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

// @desc    Get control unit dispatch log
// @route   GET /api/admin/dispatch-log
// @access  Private/Admin
exports.getDispatchLog = async (req, res, next) => {
  try {
    const { priority, dispatchType, acknowledged } = req.query;
    const filter = {};
    if (priority) filter.priority = priority;
    if (dispatchType) filter.dispatchType = dispatchType;
    if (acknowledged !== undefined)
      filter.acknowledged = acknowledged === "true";

    const dispatches = await ControlUnitDispatch.find(filter)
      .sort({ dispatchedAt: -1 })
      .populate(
        "complaints",
        "title category priority status assignedDepartment",
      );

    // Also return queue status
    const { getQueueStatus } = require("../services/controlUnit.service");
    const queueStatus = getQueueStatus();

    res.status(200).json({
      success: true,
      count: dispatches.length,
      queueStatus,
      data: dispatches,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk send complaints to authority (update trackingStatus)
// @route   POST /api/admin/bulk-send-to-authority
// @access  Private/Admin
exports.bulkSendToAuthority = async (req, res, next) => {
  try {
    const { status, priority } = req.body;

    // Build filter — only act on complaints not already sent or resolved
    const filter = {
      trackingStatus: { $in: ["registered"] },
    };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const now = new Date();
    const result = await Complaint.updateMany(filter, {
      $set: { trackingStatus: "sent_to_authority" },
      $push: {
        trackingHistory: {
          stage: "sent_to_authority",
          updatedAt: now,
          note: "Bulk dispatched to authority by admin.",
        },
      },
    });

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} complaint(s) sent to authority.`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Acknowledge a dispatch
// @route   PUT /api/admin/dispatch-log/:batchId/acknowledge
// @access  Private/Admin
exports.acknowledgeDispatch = async (req, res, next) => {
  try {
    const dispatch = await ControlUnitDispatch.findOneAndUpdate(
      { batchId: req.params.batchId },
      { acknowledged: true, acknowledgedAt: new Date() },
      { new: true },
    );

    if (!dispatch) {
      return res
        .status(404)
        .json({ success: false, message: "Dispatch batch not found" });
    }

    res.status(200).json({ success: true, data: dispatch });
  } catch (error) {
    next(error);
  }
};
