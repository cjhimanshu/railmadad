const Complaint = require("../models/Complaint");
const { uploadToCloudinary } = require("../config/cloudinary.config");
const aiService = require("../services/ai.service");
const automationService = require("../services/automation.service");
const controlUnitService = require("../services/controlUnit.service");

// @desc    Create new complaint
// @route   POST /api/complaints
// @access  Private
exports.createComplaint = async (req, res, next) => {
  try {
    const { title, description, pnrNumber, contactMobile, contactEmail } =
      req.body;

    // Process complaint with AI
    const aiResults = await aiService.processComplaintWithAI(
      title,
      description,
    );

    // Prepare complaint data
    const complaintData = {
      userId: req.user.id,
      title,
      description,
      pnrNumber: pnrNumber ? pnrNumber.trim() : null,
      contactMobile: contactMobile ? contactMobile.trim() : null,
      contactEmail:
        contactEmail && contactEmail.trim() !== ""
          ? contactEmail.trim().toLowerCase()
          : null,
      category: aiResults.category,
      priority: aiResults.priority,
      sentiment: aiResults.sentiment,
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

    // Populate user details
    await complaint.populate("userId", "name email");

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
