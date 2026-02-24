const Complaint = require("../models/Complaint");
const { uploadToCloudinary } = require("../config/cloudinary.config");
const aiService = require("../services/ai.service");
const automationService = require("../services/automation.service");
const controlUnitService = require("../services/controlUnit.service");

// @desc    Create new complaint
// @route   POST /api/complaints
// @access  Public (no login required)
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

    // Validate required contact info for guest submissions
    if (!req.user && !contactMobile && !contactEmail) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide a contact mobile or email so you can track your complaint later.",
      });
    }

    // Process complaint with AI (use title only if description is empty)
    const aiResults = await aiService.processComplaintWithAI(
      title,
      description || "",
    );

    // Prepare complaint data
    const complaintData = {
      userId: req.user ? req.user.id : null,
      title,
      description,
      pnrNumber: pnrNumber ? pnrNumber.trim() : null,
      trainNumber: trainNumber ? trainNumber.trim() : null,
      contactMobile: contactMobile ? contactMobile.trim() : null,
      contactEmail:
        contactEmail && contactEmail.trim() !== ""
          ? contactEmail.trim().toLowerCase()
          : req.user?.email || null,
      // Use user-selected category if provided, otherwise fall back to AI
      category: userCategory || aiResults.category,
      priority: aiResults.priority,
      sentiment: aiResults.sentiment,
      trackingStatus: "registered",
      trackingHistory: [
        {
          stage: "registered",
          updatedAt: new Date(),
          note: "Complaint submitted successfully.",
        },
      ],
      aiSuggestions: {
        suggestedCategory: aiResults.category,
        suggestedPriority: aiResults.priority,
        suggestedResponse: aiResults.suggestedResponse,
        confidence: aiResults.confidence.category,
      },
    };

    // Handle image upload if present
    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file.buffer);
        complaintData.imageURL = result.secure_url;
        complaintData.imagePublicId = result.public_id;
      } catch (uploadError) {
        console.error("Image upload error:", uploadError);
        // Continue without image if upload fails
      }
    }

    // Create complaint
    const complaint = await Complaint.create(complaintData);

    // Auto-assign department and SLA immediately
    await automationService.assignDepartmentAndSLA(complaint);

    // Dispatch to control unit based on priority
    if (["urgent", "high"].includes(complaint.priority)) {
      await controlUnitService.dispatchImmediate(complaint);
    } else {
      controlUnitService.queueForDispatch(complaint._id, complaint.priority);
    }

    // Populate user details (only if linked to a user)
    if (complaint.userId) {
      await complaint.populate("userId", "name email");
    }

    res.status(201).json({
      success: true,
      message: "Complaint submitted successfully",
      data: complaint,
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
    const complaints = await Complaint.find({ userId: req.user.id })
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

    // Make sure user owns the complaint or is admin
    if (
      complaint.userId._id.toString() !== req.user.id &&
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

    // Make sure user owns the complaint
    if (complaint.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this complaint",
      });
    }

    // Users can only update if status is pending
    if (complaint.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Cannot update complaint that is already being processed",
      });
    }

    const { title, description } = req.body;

    complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { title, description },
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

    // Make sure user owns the complaint
    if (complaint.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this complaint",
      });
    }

    // Users can only delete if status is pending
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

    if (complaint.userId.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    complaint.satisfactionRating = rating;
    complaint.satisfactionComment = comment || null;
    complaint.satisfactionSubmittedAt = new Date();

    // Low rating = block closure and reopen
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
      // Rating >= 3, customer is satisfied enough
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

    if (complaint.userId.toString() !== req.user.id) {
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

    complaint.customerMarkedDone = true;
    complaint.customerMarkedAt = new Date();

    // Auto-close if both sides have confirmed
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

// @desc    Track complaints for logged-in user (auto-uses their email/phone)
// @route   GET /api/complaints/track
// @access  Private
exports.trackComplaintByContact = async (req, res, next) => {
  try {
    const { pnrNumber, trainNumber, dateFrom, dateTo } = req.query;

    const userEmail = req.user.email;
    const userPhone = req.user.phone;

    const orConditions = [];
    if (userEmail) orConditions.push({ contactEmail: userEmail.toLowerCase() });
    if (userPhone) orConditions.push({ contactMobile: userPhone.trim() });
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
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const complaints = await Complaint.find(query)
      .sort({ createdAt: -1 })
      .select(
        "title description category priority status trackingStatus trackingHistory pnrNumber trainNumber contactMobile contactEmail createdAt resolvedAt assignedDepartment authorityMarkedDone authorityActionNotes customerMarkedDone",
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
