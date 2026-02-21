const Complaint = require("../models/Complaint");
const User = require("../models/User");
const ControlUnitDispatch = require("../models/ControlUnitDispatch");

// @desc    Get all complaints (Admin only)
// @route   GET /api/admin/complaints
// @access  Private/Admin
exports.getAllComplaints = async (req, res, next) => {
  try {
    const { status, category, priority, department } = req.query;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (department) filter.assignedDepartment = department;

    const complaints = await Complaint.find(filter)
      .sort({ createdAt: -1 })
      .populate("userId", "name email phone");

    res.status(200).json({
      success: true,
      count: complaints.length,
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

// @desc    Authority marks action taken / done
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
    // Total complaints
    const totalComplaints = await Complaint.countDocuments();

    // Complaints by status
    const complaintsByStatus = await Complaint.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Complaints by category
    const complaintsByCategory = await Complaint.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
    ]);

    // Complaints by priority
    const complaintsByPriority = await Complaint.aggregate([
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 },
        },
      },
    ]);

    // Complaints by sentiment
    const complaintsBySentiment = await Complaint.aggregate([
      {
        $group: {
          _id: "$sentiment",
          count: { $sum: 1 },
        },
      },
    ]);

    // Recent complaints (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentComplaints = await Complaint.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    // Average resolution time (for resolved complaints)
    const resolvedComplaints = await Complaint.find({
      status: "resolved",
      resolvedAt: { $exists: true },
    });

    let avgResolutionTime = 0;
    if (resolvedComplaints.length > 0) {
      const totalTime = resolvedComplaints.reduce((acc, complaint) => {
        const resolutionTime =
          new Date(complaint.resolvedAt) - new Date(complaint.createdAt);
        return acc + resolutionTime;
      }, 0);
      avgResolutionTime = totalTime / resolvedComplaints.length;
      // Convert to hours
      avgResolutionTime = Math.round(avgResolutionTime / (1000 * 60 * 60));
    }

    // Complaints trend (last 30 days, grouped by day)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const complaintsTrend = await Complaint.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Total users
    const totalUsers = await User.countDocuments({ role: "user" });

    res.status(200).json({
      success: true,
      data: {
        totalComplaints,
        totalUsers,
        recentComplaints,
        avgResolutionTimeHours: avgResolutionTime,
        complaintsByStatus: complaintsByStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        complaintsByCategory: complaintsByCategory.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        complaintsByPriority: complaintsByPriority.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        complaintsBySentiment: complaintsBySentiment.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        complaintsTrend,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get complaint statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getStats = async (req, res, next) => {
  try {
    const stats = {
      pending: await Complaint.countDocuments({ status: "pending" }),
      inProgress: await Complaint.countDocuments({ status: "in_progress" }),
      resolved: await Complaint.countDocuments({ status: "resolved" }),
      rejected: await Complaint.countDocuments({ status: "rejected" }),
      urgent: await Complaint.countDocuments({ priority: "urgent" }),
      high: await Complaint.countDocuments({ priority: "high" }),
    };

    res.status(200).json({
      success: true,
      data: stats,
    });
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
