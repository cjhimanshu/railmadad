const Complaint = require("../models/Complaint");
const { uploadToCloudinary } = require("../config/cloudinary.config");
const automationService = require("../services/automation.service");
const { enqueueAI } = require("../queues/ai.queue");
const {
  createComplaintTrackingCredentials,
  sendComplaintAccessCredentials,
  sendComplaintProgressUpdate,
  serializePublicComplaint,
  verifyComplaintTracker,
} = require("../services/complaintTracking.service");

// @desc    Create new complaint
// @route   POST /api/complaints
// @access  Public
exports.createComplaint = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category: userCategory,
      pnrNumber,
      trainNumber,
      contactMobile,
      contactEmail,
    } = req.body;

    const normalizedEmail = (contactEmail || req.user?.email || "")
      .trim()
      .toLowerCase();
    const normalizedMobile = (contactMobile || req.user?.phone || "").trim();

    if (!normalizedEmail || !normalizedMobile) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide both mobile number and email address to receive tracking credentials.",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    if (!/^\d{10}$/.test(normalizedMobile)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid 10-digit mobile number.",
      });
    }

    const trackingCredentials = await createComplaintTrackingCredentials();

    const complaintData = {
      userId: req.user ? req.user.id : null,
      complaintNumber: trackingCredentials.complaintNumber,
      trackingUserId: trackingCredentials.trackingUserId,
      trackingPasswordHash: trackingCredentials.trackingPasswordHash,
      title: title.trim(),
      description: description ? description.trim() : "",
      pnrNumber: pnrNumber ? pnrNumber.trim() : null,
      trainNumber: trainNumber ? trainNumber.trim() : null,
      contactMobile: normalizedMobile,
      contactEmail: normalizedEmail,
      category: userCategory || "other",
      priority: "medium",
      sentiment: "neutral",
      aiProcessed: false,
      trackingStatus: "registered",
      trackingHistory: [
        {
          stage: "registered",
          updatedAt: new Date(),
          note: "Complaint submitted successfully.",
        },
      ],
      aiSuggestions: {
        suggestedCategory: null,
        suggestedPriority: null,
        suggestedResponse: null,
        confidence: 0,
      },
    };

    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file.buffer);
        complaintData.imageURL = result.secure_url;
        complaintData.imagePublicId = result.public_id;
      } catch (uploadError) {
        console.error("Image upload error:", uploadError);
      }
    }

    const complaint = await Complaint.create(complaintData);
    await automationService.assignDepartmentAndSLA(complaint);
    await enqueueAI(complaint._id, title, description || "");

    if (complaint.userId) {
      await complaint.populate("userId", "name email");
    }

    const responseComplaint = complaint.toObject();
    delete responseComplaint.trackingPasswordHash;
    responseComplaint.trackingCredentials = {
      complaintNumber: trackingCredentials.complaintNumber,
      trackingUserId: trackingCredentials.trackingUserId,
      trackingPassword: trackingCredentials.trackingPassword,
    };

    res.status(201).json({
      success: true,
      message: "Complaint submitted successfully",
      data: responseComplaint,
    });

    setImmediate(async () => {
      try {
        await sendComplaintAccessCredentials({
          complaint,
          trackingPassword: trackingCredentials.trackingPassword,
        });
      } catch (deliveryError) {
        console.error(
          "Complaint access delivery error:",
          deliveryError.message,
        );
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Track a complaint with complaint-specific credentials
// @route   POST /api/complaints/track
// @access  Public
exports.trackComplaintWithCredentials = async (req, res, next) => {
  try {
    const { trackingUserId, password } = req.body;

    if (!trackingUserId || !password) {
      return res.status(400).json({
        success: false,
        message: "Tracking ID and password are required.",
      });
    }

    const complaint = await verifyComplaintTracker({ trackingUserId, password });

    if (!complaint) {
      return res.status(400).json({
        success: false,
        message: "Invalid tracking ID or password.",
      });
    }

    res.status(200).json({
      success: true,
      data: serializePublicComplaint(complaint),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all complaints for logged in user
// @route   GET /api/complaints
// @access  Private
exports.getUserComplaints = async (req, res, next) => {
  try {
    const complaints = await Complaint.find({
      $or: [{ userId: req.user.id }, { contactEmail: req.user.email }],
    })
      .sort({ createdAt: -1 })
      .populate("userId", "name email");

    res.status(200).json({
      success: true,
      count: complaints.length,
      data: complaints,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single complaint
// @route   GET /api/complaints/:id
// @access  Private
exports.getComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id).populate(
      "userId",
      "name email",
    );

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    if (
      (!complaint.userId || complaint.userId._id.toString() !== req.user.id) &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this complaint",
      });
    }

    res.status(200).json({
      success: true,
      data: complaint,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update complaint
// @route   PUT /api/complaints/:id
// @access  Private
exports.updateComplaint = async (req, res, next) => {
  try {
    let complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    if (!complaint.userId || complaint.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this complaint",
      });
    }

    if (complaint.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Cannot update complaint that is already being processed",
      });
    }

    const { title: nextTitle, description: nextDescription } = req.body;

    complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { title: nextTitle, description: nextDescription },
      {
        new: true,
        runValidators: true,
      },
    ).populate("userId", "name email");

    res.status(200).json({
      success: true,
      message: "Complaint updated successfully",
      data: complaint,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete complaint
// @route   DELETE /api/complaints/:id
// @access  Private
exports.deleteComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    if (!complaint.userId || complaint.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this complaint",
      });
    }

    if (complaint.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete complaint that is already being processed",
      });
    }

    await complaint.deleteOne();

    res.status(200).json({
      success: true,
      message: "Complaint deleted successfully",
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

// @desc    User submits satisfaction rating
// @route   PUT /api/complaints/:id/satisfaction
// @access  Private
exports.submitSatisfaction = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ success: false, message: "Rating must be between 1 and 5" });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res
        .status(404)
        .json({ success: false, message: "Complaint not found" });
    }

    if (!complaint.userId || complaint.userId.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    complaint.satisfactionRating = rating;
    complaint.satisfactionComment = comment || null;
    complaint.satisfactionSubmittedAt = new Date();

    if (rating < 3) {
      complaint.closureBlocked = true;
      complaint.closureBlockedReason = `Customer rated ${rating}/5: "${comment || "No comment"}"`;
      complaint.customerMarkedDone = false;
      complaint.status = "in_progress";
      complaint.automationLog.push({
        action: "CLOSURE_BLOCKED_LOW_RATING",
        details: `Customer gave ${rating}/5 stars. Complaint reopened for further action.`,
        performedAt: new Date(),
      });
    } else {
      complaint.closureBlocked = false;
      complaint.automationLog.push({
        action: "SATISFACTION_SUBMITTED",
        details: `Customer rated ${rating}/5 stars.`,
        performedAt: new Date(),
      });
    }

    await complaint.save();

    res.status(200).json({
      success: true,
      message:
        rating < 3
          ? "Rating submitted. Complaint reopened for further action due to low satisfaction."
          : "Thank you for your feedback!",
      data: complaint,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Customer confirms resolution
// @route   PUT /api/complaints/:id/confirm-resolved
// @access  Private
exports.customerConfirmResolved = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res
        .status(404)
        .json({ success: false, message: "Complaint not found" });
    }

    if (!complaint.userId || complaint.userId.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    if (!complaint.authorityMarkedDone) {
      return res.status(400).json({
        success: false,
        message: "Authority has not taken action yet. Please wait.",
      });
    }

    if (
      complaint.satisfactionRating !== null &&
      complaint.satisfactionRating < 3
    ) {
      return res.status(400).json({
        success: false,
        message:
          "You gave a low rating. Complaint cannot be closed until the issue is re-addressed.",
      });
    }

    const previousTrackingStatus = complaint.trackingStatus;
    const previousStatus = complaint.status;

    complaint.customerMarkedDone = true;
    complaint.customerMarkedAt = new Date();

    if (
      complaint.authorityMarkedDone &&
      complaint.customerMarkedDone &&
      !complaint.closureBlocked
    ) {
      complaint.status = "resolved";
      complaint.resolvedAt = new Date();
      complaint.trackingStatus = "resolved";
      complaint.trackingHistory.push({
        stage: "resolved",
        updatedAt: new Date(),
        note: "Complaint resolved after both authority and customer confirmation.",
      });
      complaint.automationLog.push({
        action: "AUTO_CLOSED_DUAL_VERIFICATION",
        details:
          "Complaint closed after both authority and customer confirmed resolution.",
        performedAt: new Date(),
      });
    }

    await complaint.save();

    setImmediate(async () => {
      try {
        await sendComplaintProgressUpdate({
          complaint,
          previousTrackingStatus,
          previousStatus,
        });
      } catch (notificationError) {
        console.error("Resolution notification error:", notificationError.message);
      }
    });

    res.status(200).json({
      success: true,
      message:
        complaint.status === "resolved"
          ? "Complaint successfully closed. Thank you!"
          : "Your confirmation has been recorded.",
      data: complaint,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    User closes their own complaint
// @route   PUT /api/complaints/:id/close
// @access  Private
exports.closeComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res
        .status(404)
        .json({ success: false, message: "Complaint not found" });
    }

    const userOwns =
      complaint.userId && complaint.userId.toString() === req.user.id;
    const userMatchesContact =
      (req.user.email &&
        complaint.contactEmail &&
        complaint.contactEmail.toLowerCase() ===
          req.user.email.toLowerCase()) ||
      (req.user.phone &&
        complaint.contactMobile &&
        complaint.contactMobile === req.user.phone.trim());

    if (!userOwns && !userMatchesContact) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    if (complaint.status === "resolved") {
      return res
        .status(400)
        .json({ success: false, message: "Complaint is already resolved." });
    }

    if (complaint.status === "rejected") {
      return res
        .status(400)
        .json({ success: false, message: "Complaint is already closed." });
    }

    const previousTrackingStatus = complaint.trackingStatus;
    const previousStatus = complaint.status;

    complaint.status = "resolved";
    complaint.resolvedAt = new Date();
    complaint.trackingStatus = "resolved";
    complaint.customerMarkedDone = true;
    complaint.customerMarkedAt = new Date();
    complaint.trackingHistory.push({
      stage: "resolved",
      updatedAt: new Date(),
      note: "Complaint closed by user after satisfactory resolution.",
    });
    complaint.automationLog.push({
      action: "CLOSED_BY_USER",
      details:
        "User manually closed the complaint as satisfied with the resolution.",
      performedAt: new Date(),
    });

    await complaint.save();

    setImmediate(async () => {
      try {
        await sendComplaintProgressUpdate({
          complaint,
          previousTrackingStatus,
          previousStatus,
        });
      } catch (notificationError) {
        console.error("Resolution notification error:", notificationError.message);
      }
    });

    res.status(200).json({
      success: true,
      message: "Complaint closed successfully. Thank you for your feedback!",
      data: complaint,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Track complaints for logged-in user
// @route   GET /api/complaints/track
// @access  Private
exports.trackComplaintByContact = async (req, res, next) => {
  try {
    const { pnrNumber, trainNumber, dateFrom, dateTo } = req.query;

    const userEmail = req.user.email;
    const userPhone = req.user.phone;

    const orConditions = [];
    if (userEmail) {
      orConditions.push({ contactEmail: userEmail.toLowerCase() });
    }
    if (userPhone) {
      orConditions.push({ contactMobile: userPhone.trim() });
    }
    orConditions.push({ userId: req.user._id });

    const query = { $or: orConditions };

    if (pnrNumber && pnrNumber.trim()) {
      query.pnrNumber = pnrNumber.trim();
    }

    if (trainNumber && trainNumber.trim()) {
      query.trainNumber = { $regex: trainNumber.trim(), $options: "i" };
    }

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) {
        query.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const complaints = await Complaint.find(query)
      .sort({ createdAt: -1 })
      .select(
        "complaintNumber trackingUserId title description category priority status trackingStatus trackingHistory pnrNumber trainNumber contactMobile contactEmail createdAt resolvedAt assignedDepartment authorityMarkedDone authorityActionNotes customerMarkedDone userId satisfactionRating closureBlocked closureBlockedReason automationLog",
      );

    res.status(200).json({
      success: true,
      count: complaints.length,
      data: complaints,
    });
  } catch (error) {
    next(error);
  }
};
