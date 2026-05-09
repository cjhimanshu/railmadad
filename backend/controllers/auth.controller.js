const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { Resend } = require("resend");
const User = require("../models/User");
const Complaint = require("../models/Complaint");
const OtpModel = require("../models/Otp");

// ─── Resend email helper ──────────────────────────────────────────────────────
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

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

const PROFILE_COMPLETION_FIELDS = [
  { key: "name", label: "Full name" },
  { key: "email", label: "Email address" },
  { key: "phone", label: "Mobile number" },
  { key: "gender", label: "Gender" },
  { key: "dateOfBirth", label: "Date of birth" },
  { key: "occupation", label: "Occupation" },
  { key: "preferredLanguage", label: "Preferred language" },
  { key: "nationality", label: "Nationality" },
  { key: "addressLine1", label: "Address line 1" },
  { key: "city", label: "City" },
  { key: "district", label: "District" },
  { key: "state", label: "State" },
  { key: "pincode", label: "PIN code" },
];

const isFilledProfileValue = (value) => {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (value instanceof Date) {
    return !Number.isNaN(value.getTime());
  }

  return true;
};

const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) {
    return null;
  }

  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const hasBirthdayPassed =
    today.getMonth() > dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());

  if (!hasBirthdayPassed) {
    age -= 1;
  }

  return age >= 0 ? age : null;
};

const buildProfileCompletion = (user) => {
  const completedFields = PROFILE_COMPLETION_FIELDS.filter(({ key }) =>
    isFilledProfileValue(user[key]),
  );

  return {
    percentage: Math.round(
      (completedFields.length / PROFILE_COMPLETION_FIELDS.length) * 100,
    ),
    completedFields: completedFields.length,
    totalFields: PROFILE_COMPLETION_FIELDS.length,
    missingFields: PROFILE_COMPLETION_FIELDS.filter(
      ({ key }) => !isFilledProfileValue(user[key]),
    ).map(({ label }) => label),
  };
};

const serializeUser = (user) => {
  if (!user) {
    return null;
  }

  const record = user.toObject ? user.toObject() : user;

  return {
    id: record._id,
    name: record.name,
    email: record.email,
    role: record.role,
    phone: record.phone || "",
    gender: record.gender || "",
    dateOfBirth: record.dateOfBirth || null,
    occupation: record.occupation || "",
    preferredLanguage: record.preferredLanguage || "",
    nationality: record.nationality || "",
    addressLine1: record.addressLine1 || "",
    addressLine2: record.addressLine2 || "",
    city: record.city || "",
    district: record.district || "",
    state: record.state || "",
    pincode: record.pincode || "",
    isOtpUser: Boolean(record.isOtpUser),
    profileCompletion: buildProfileCompletion(record),
    demographicsSummary: {
      age: calculateAge(record.dateOfBirth),
      location: [record.city, record.district, record.state]
        .filter(Boolean)
        .join(", "),
    },
  };
};

const normalizeProfileValue = (value) => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed || undefined;
};

const TRACKING_ID_PATTERN = /^TRK-[A-Z0-9]{8}$/;

const createTrackingProfile = async ({ complaint }) => {
  const fallbackName = complaint.contactEmail
    ? complaint.contactEmail.split("@")[0]
    : `RailMadad-${complaint.trackingUserId.slice(-4)}`;

  // Tracking IDs are globally unique, so this generated email is safe.
  const trackingEmail = `${complaint.trackingUserId.toLowerCase()}@tracker.railmadad.local`;
  const randomPassword = crypto.randomBytes(24).toString("hex");
  const hashedPassword = await bcrypt.hash(randomPassword, 10);

  const profile = await User.create({
    name: fallbackName.slice(0, 50),
    email: trackingEmail,
    password: hashedPassword,
    isOtpUser: true,
  });

  complaint.userId = profile._id;
  await complaint.save();

  return profile;
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    // Validate phone format if provided
    if (phone && !/^\d{10}$/.test(phone.trim())) {
      return res.status(400).json({
        success: false,
        message: "Phone number must be exactly 10 digits",
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      phone: phone ? phone.trim() : undefined,
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: serializeUser(user),
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const identifier = String(email || "").trim();

    // Validate identifier & password
    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email/mobile/tracking ID and password",
      });
    }

    // Determine identifier type (mobile, tracking ID, or email)
    const normalizedIdentifier = identifier.toUpperCase();
    const isMobile = /^\d{10}$/.test(identifier);
    const isTrackingId = TRACKING_ID_PATTERN.test(normalizedIdentifier);

    let user = null;

    if (isTrackingId) {
      const complaint = await Complaint.findOne({
        trackingUserId: normalizedIdentifier,
      }).select(
        "+trackingPasswordHash userId contactEmail contactMobile trackingUserId",
      );

      if (!complaint) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      const trackerPasswordMatch = await bcrypt.compare(
        password,
        complaint.trackingPasswordHash,
      );

      if (!trackerPasswordMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      if (complaint.userId) {
        user = await User.findById(complaint.userId);

        if (user && !user.isOtpUser) {
          return res.status(403).json({
            success: false,
            message:
              "This tracking ID is linked to a registered account. Please login using email/mobile password.",
          });
        }
      }

      if (!user) {
        user = await createTrackingProfile({ complaint });
      }
    } else {
      // Check for user by email OR phone
      user = await User.findOne(
        isMobile ? { phone: identifier } : { email: identifier.toLowerCase() },
      ).select("+password");

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // Check if password matches
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Your account has been deactivated",
      });
    }

    // Block admin accounts from using the regular login endpoint
    if (user.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin accounts must use the Admin Login page.",
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: serializeUser(user),
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin-only login (rejects non-admin accounts)
// @route   POST /api/auth/admin-login
// @access  Public
exports.adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. This portal is for administrators only.",
      });
    }

    // Only the fixed admin account may use this portal
    if (user.email !== process.env.ADMIN_EMAIL) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Unauthorised admin account.",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Your account has been deactivated",
      });
    }

    const token = generateToken(user._id);

    // Record last login time
    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    res.status(200).json({
      success: true,
      message: "Admin login successful",
      data: {
        user: serializeUser(user),
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register a new admin (requires ADMIN_SECRET_KEY)
// @route   POST /api/auth/admin-register
// @access  Public (protected by secret key)
exports.adminRegister = async (req, res, next) => {
  try {
    const { name, email, password, phone, adminKey } = req.body;

    // Verify the admin secret key
    if (!adminKey || adminKey !== process.env.ADMIN_SECRET_KEY) {
      return res.status(403).json({
        success: false,
        message: "Invalid admin secret key",
      });
    }

    const userExists = await User.findOne({
      email: email.trim().toLowerCase(),
    });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      phone: phone ? phone.trim() : undefined,
      role: "admin",
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: "Admin account created successfully",
      data: {
        user: serializeUser(user),
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password — sends reset link to email
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide your email address" });
    }
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(200).json({
        success: true,
        message:
          "If an account with that email exists, a reset link has been sent.",
      });
    }
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save({ validateBeforeSave: false });
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#1e3a8a,#1d4ed8);padding:28px 32px">
          <h1 style="margin:0;color:#fff;font-size:22px">🚆 RailMadad</h1>
          <p style="margin:4px 0 0;color:#bfdbfe;font-size:14px">Railway Complaint Management System</p>
        </div>
        <div style="padding:32px">
          <h2 style="color:#1e293b;margin-top:0">Password Reset Request</h2>
          <p style="color:#475569">Hi <strong>${user.name}</strong>,</p>
          <p style="color:#475569">We received a request to reset your password. Click the button below. This link expires in <strong>10 minutes</strong>.</p>
          <div style="text-align:center;margin:28px 0">
            <a href="${resetUrl}" style="background:#1d4ed8;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px">Reset My Password</a>
          </div>
          <p style="color:#94a3b8;font-size:12px;word-break:break-all">${resetUrl}</p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
          <p style="color:#94a3b8;font-size:12px">If you didn't request this, you can safely ignore this email.</p>
        </div>
      </div>`;
    try {
      await sendEmail({
        email: user.email,
        subject: "RailMadad — Password Reset Link",
        html,
      });
      res.status(200).json({
        success: true,
        message: "Password reset link sent to your email",
      });
    } catch (emailErr) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return next(emailErr);
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password using token from email
// @route   PUT /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Reset link is invalid or has expired",
      });
    }
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    res.status(200).json({
      success: true,
      message:
        "Password reset successful. You can now log in with your new password.",
    });
  } catch (error) {
    next(error);
  }
};

// ─── OTP helper ───────────────────────────────────────────────────────────────
const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit

// @desc    Send OTP to email for login
// @route   POST /api/auth/send-otp
// @access  Public
exports.sendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Generate OTP
    const otp = generateOtp();
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otp, salt);

    // Upsert: delete any previous OTP for this email then insert fresh
    await OtpModel.deleteMany({ identifier: cleanEmail });
    await OtpModel.create({
      identifier: cleanEmail,
      otpHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    // Send via Resend email
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#1e3a8a,#1d4ed8);padding:24px 32px">
          <h1 style="margin:0;color:#fff;font-size:20px">🚆 RailMadad</h1>
          <p style="margin:4px 0 0;color:#bfdbfe;font-size:13px">Railway Complaint Management System</p>
        </div>
        <div style="padding:32px">
          <h2 style="color:#1e293b;margin-top:0">Your Login OTP</h2>
          <p style="color:#475569">Use the code below to sign in to RailMadad. It expires in <strong>10 minutes</strong>.</p>
          <div style="text-align:center;margin:28px 0">
            <div style="display:inline-block;background:#f1f5f9;border:2px dashed #94a3b8;border-radius:12px;padding:16px 40px">
              <span style="font-size:2.5rem;font-weight:900;letter-spacing:0.3em;color:#1e3a8a;font-family:monospace">${otp}</span>
            </div>
          </div>
          <p style="color:#94a3b8;font-size:12px">If you didn't request this OTP, you can safely ignore this email.</p>
        </div>
      </div>`;

    await sendEmail({
      email: cleanEmail,
      subject: "RailMadad — Your Login OTP",
      html,
    });

    res.status(200).json({
      success: true,
      message: "OTP sent to your email address",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP and log in (auto-creates account if new email)
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Find the stored OTP record
    const otpRecord = await OtpModel.findOne({ identifier: cleanEmail });
    if (!otpRecord || otpRecord.expiresAt < new Date()) {
      await OtpModel.deleteMany({ identifier: cleanEmail });
      return res.status(400).json({
        success: false,
        message: "OTP has expired or is invalid. Please request a new one.",
      });
    }

    const isMatch = await bcrypt.compare(otp.trim(), otpRecord.otpHash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP. Please try again.",
      });
    }

    // OTP is valid — delete it so it can't be reused
    await OtpModel.deleteMany({ identifier: cleanEmail });

    // Find or auto-create the user account linked to this email
    let user = await User.findOne({ email: cleanEmail });

    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const randomPasswd = await bcrypt.hash(
        crypto.randomBytes(32).toString("hex"),
        salt,
      );

      user = await User.create({
        name: cleanEmail.split("@")[0], // use email prefix as display name
        email: cleanEmail,
        password: randomPasswd,
        isOtpUser: true,
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Your account has been deactivated",
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: "OTP verified. Logged in successfully.",
      data: {
        user: serializeUser(user),
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: serializeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update current user profile
// @route   PUT /api/auth/me
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const incomingPhone = normalizeProfileValue(req.body.phone);
    if (incomingPhone) {
      const existingPhoneOwner = await User.findOne({
        phone: incomingPhone,
        _id: { $ne: req.user.id },
      });

      if (existingPhoneOwner) {
        return res.status(400).json({
          success: false,
          message: "This mobile number is already linked to another account.",
        });
      }
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "name")) {
      user.name = req.body.name.trim();
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "phone")) {
      user.phone = incomingPhone;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "gender")) {
      user.gender = normalizeProfileValue(req.body.gender);
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "dateOfBirth")) {
      user.dateOfBirth = req.body.dateOfBirth
        ? new Date(req.body.dateOfBirth)
        : undefined;
    }

    [
      "occupation",
      "preferredLanguage",
      "nationality",
      "addressLine1",
      "addressLine2",
      "city",
      "district",
      "state",
      "pincode",
    ].forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        user[field] = normalizeProfileValue(req.body[field]);
      }
    });

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: serializeUser(user),
    });
  } catch (error) {
    next(error);
  }
};
