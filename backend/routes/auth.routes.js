const express = require("express");
const { body } = require("express-validator");
const {
  register,
  login,
  adminLogin,
  adminRegister,
  getMe,
  updateProfile,
  forgotPassword,
  resetPassword,
} = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth.middleware");
const validate = require("../middleware/validation.middleware");

const router = express.Router();

// Validation rules
const registerValidation = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Please provide a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

const loginValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Please provide your email, mobile number, or tracking ID")
    .custom((value) => {
      const isMobile = /^\d{10}$/.test(value);
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      const isTrackingId = /^TRK-[A-Z0-9]{8}$/i.test(value);
      if (!isMobile && !isEmail && !isTrackingId) {
        throw new Error(
          "Please provide a valid email, 10-digit mobile number, or tracking ID",
        );
      }
      return true;
    }),
  body("password").notEmpty().withMessage("Password is required"),
];

const adminRegisterValidation = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Please provide a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("adminKey").notEmpty().withMessage("Admin secret key is required"),
];

const profileValidation = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Name cannot be empty")
    .isLength({ max: 50 })
    .withMessage("Name cannot be more than 50 characters"),
  body("phone")
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^\d{10}$/)
    .withMessage("Phone number must be exactly 10 digits"),
  body("gender")
    .optional({ checkFalsy: true })
    .isIn(["male", "female", "transgender", "non_binary", "prefer_not_to_say"])
    .withMessage("Please select a valid gender"),
  body("dateOfBirth")
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage("Please provide a valid date of birth"),
  body("occupation")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 80 })
    .withMessage("Occupation cannot be more than 80 characters"),
  body("preferredLanguage")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 50 })
    .withMessage("Preferred language cannot be more than 50 characters"),
  body("nationality")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 60 })
    .withMessage("Nationality cannot be more than 60 characters"),
  body("addressLine1")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 120 })
    .withMessage("Address line 1 cannot be more than 120 characters"),
  body("addressLine2")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 120 })
    .withMessage("Address line 2 cannot be more than 120 characters"),
  body("city")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 60 })
    .withMessage("City cannot be more than 60 characters"),
  body("district")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 60 })
    .withMessage("District cannot be more than 60 characters"),
  body("state")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 60 })
    .withMessage("State cannot be more than 60 characters"),
  body("pincode")
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^\d{6}$/)
    .withMessage("PIN code must be exactly 6 digits"),
];

// Routes
router.post("/register", registerValidation, validate, register);
router.post("/login", loginValidation, validate, login);
router.post("/admin-login", loginValidation, validate, adminLogin);
router.post(
  "/admin-register",
  adminRegisterValidation,
  validate,
  adminRegister,
);
router.get("/me", protect, getMe);
router.put("/me", protect, profileValidation, validate, updateProfile);
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:token", resetPassword);

module.exports = router;
