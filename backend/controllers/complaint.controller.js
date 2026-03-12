const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { Resend } = require("resend");
const User = require("../models/User");
const Complaint = require("../models/Complaint");
const { uploadToCloudinary } = require("../config/cloudinary.config");
const aiService = require("../services/ai.service");
const automationService = require("../services/automation.service");
const controlUnitService = require("../services/controlUnit.service");
const { enqueueAI } = require("../queues/ai.queue");

const resend = new Resend(process.env.RESEND_API_KEY);
const sendEmail = async ({ email, subject, html }) => {
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
    to: email,
    subject,
    html,
  });
  if (error) throw new Error(error.message);
};

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
    if (!req.user && !contactEmail) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide your email address so you can login and track your complaint.",
      });
    }
    if (
      contactEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    // Prepare complaint data with safe defaults — AI will refine asynchronously
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
      // Use user-selected category if provided; AI will refine if not
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

    // Initial SLA assignment with default priority (AI will refine and re-assign)
    await automationService.assignDepartmentAndSLA(complaint);

    // Enqueue AI processing — runs in background, does not block the response.
    // The worker will update category/priority/sentiment and re-dispatch if needed.
    await enqueueAI(complaint._id, title, description || "");

    // Populate user details (only if linked to a user)
    if (complaint.userId) {
      await complaint.populate("userId", "name email");
    }

    // ── Auto-create account + send password setup email for guest submissions ──
    // If the user submitted without logging in, ensure they have an account so
    // they can login to track their complaint. A password-setup link is sent.
    if (!req.user && complaintData.contactEmail) {
      try {
        const cleanEmail = complaintData.contactEmail.toLowerCase();
        let accountUser = await User.findOne({ email: cleanEmail });
        let isNewAccount = false;

        if (!accountUser) {
          // Derive a readable name from the email prefix
          const prefix = cleanEmail.split("@")[0].replace(/[._\-]/g, " ");
          const name =
            prefix.charAt(0).toUpperCase() + prefix.slice(1) || "User";
          const tempPassword = await bcrypt.hash(
            crypto.randomBytes(16).toString("hex"),
            10,
          );
          accountUser = await User.create({
            name,
            email: cleanEmail,
            password: tempPassword,
          });
          isNewAccount = true;
        }

        // Generate a 24-hour password-setup token
        const setupToken = crypto.randomBytes(32).toString("hex");
        accountUser.resetPasswordToken = crypto
          .createHash("sha256")
          .update(setupToken)
          .digest("hex");
        accountUser.resetPasswordExpire = Date.now() + 24 * 60 * 60 * 1000;
        await accountUser.save({ validateBeforeSave: false });

        const setupUrl = `${process.env.FRONTEND_URL}/reset-password/${setupToken}`;
        const html = `
          <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
            <div style="background:linear-gradient(135deg,#1e3a8a,#1d4ed8);padding:28px 32px">
              <h1 style="margin:0;color:#fff;font-size:22px">&#128646; RailMadad</h1>
              <p style="margin:4px 0 0;color:#bfdbfe;font-size:14px">Railway Complaint Management System</p>
            </div>
            <div style="padding:32px">
              <h2 style="color:#1e293b;margin-top:0">&#9989; Complaint Registered Successfully</h2>
              <p style="color:#475569">Hi <strong>${accountUser.name}</strong>,</p>
              <p style="color:#475569">Your complaint has been received and is being reviewed by the concerned railway authority.</p>
              ${
                isNewAccount
                  ? `<p style="color:#475569">We've created a <strong>RailMadad account</strong> for you using this email. Set your password using the button below to login and track your complaint status in real time.</p>`
                  : `<p style="color:#475569">Use the button below to set a new password and then login to track your complaint.</p>`
              }
              <div style="text-align:center;margin:28px 0">
                <a href="${setupUrl}" style="background:#1d4ed8;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px">Set Password &amp; Track Complaint</a>
              </div>
              <p style="color:#94a3b8;font-size:12px;word-break:break-all">${setupUrl}</p>
              <p style="color:#94a3b8;font-size:12px">This link expires in <strong>24 hours</strong>. If you didn't submit a complaint, you can safely ignore this email.</p>
            </div>
          </div>`;

        await sendEmail({
          email: cleanEmail,
          subject: "RailMadad — Set Your Password to Track Your Complaint",
          html,
        });
        // Link this complaint to the user account so it appears in their dashboard
        await Complaint.findByIdAndUpdate(complaint._id, {
          userId: accountUser._id,
        });
      } catch (accountErr) {
        // Don't fail the complaint submission if account setup email fails
        console.error("Auto account setup error:", accountErr.message);
      }
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
    // Fetch complaints owned by userId OR matched by contactEmail (guest submissions
    // that were later linked when account was auto-created)
    const complaints = await Complaint.find({
      $or: [
        { userId: req.user.id },
        { contactEmail: req.user.email, userId: null },
      ],
    })
      .sort({ createdAt: -1 })
      .populate("userId", "name email");

    // Silently back-link any unlinked email-matched complaints
    const unlinked = complaints.filter(
      (c) => !c.userId && c.contactEmail === req.user.email,
    );
    if (unlinked.length > 0) {
      await Complaint.updateMany(
        { _id: { $in: unlinked.map((c) => c._id) } },
        { userId: req.user.id },
      );
    }

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
    // complaint.userId is populated (User object) or null for guest complaints
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

    // Make sure user owns the complaint
    if (!complaint.userId || complaint.userId.toString() !== req.user.id) {
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
    if (!complaint.userId || complaint.userId.toString() !== req.user.id) {
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

    if (!complaint.userId || complaint.userId.toString() !== req.user.id) {
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

// @desc    User closes their own complaint (satisfied with resolution)
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

    // Allow closure if complaint is owned by this user OR matched by email/phone
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

    complaint.status = "resolved";
    complaint.resolvedAt = new Date();
    complaint.trackingStatus = "resolved";
    complaint.customerMarkedDone = true;
    complaint.customerMarkedAt = new Date();
    complaint.trackingHistory.push({
      stage: "resolved",
      updatedAt: new Date(),
      note: "Complaint closed by user — satisfied with resolution.",
    });
    complaint.automationLog.push({
      action: "CLOSED_BY_USER",
      details:
        "User manually closed the complaint as satisfied with the resolution.",
      performedAt: new Date(),
    });

    await complaint.save();

    res.status(200).json({
      success: true,
      message: "Complaint closed successfully. Thank you for your feedback!",
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
        "title description category priority status trackingStatus trackingHistory pnrNumber trainNumber contactMobile contactEmail createdAt resolvedAt assignedDepartment authorityMarkedDone authorityActionNotes customerMarkedDone userId satisfactionRating closureBlocked closureBlockedReason automationLog",
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
