const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide your name"],
      trim: true,
      maxlength: [50, "Name cannot be more than 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Please provide your email"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,10})+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // Don't return password by default
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    phone: {
      type: String,
      trim: true,
      unique: true,
      sparse: true, // allows multiple null — only enforces uniqueness on non-null values
    },
    gender: {
      type: String,
      enum: ["male", "female", "transgender", "non_binary", "prefer_not_to_say"],
      default: undefined,
    },
    dateOfBirth: {
      type: Date,
      default: undefined,
      validate: {
        validator(value) {
          return !value || value.getTime() <= Date.now();
        },
        message: "Date of birth cannot be in the future",
      },
    },
    occupation: {
      type: String,
      trim: true,
      maxlength: [80, "Occupation cannot be more than 80 characters"],
    },
    preferredLanguage: {
      type: String,
      trim: true,
      maxlength: [50, "Preferred language cannot be more than 50 characters"],
    },
    nationality: {
      type: String,
      trim: true,
      maxlength: [60, "Nationality cannot be more than 60 characters"],
    },
    addressLine1: {
      type: String,
      trim: true,
      maxlength: [120, "Address line 1 cannot be more than 120 characters"],
    },
    addressLine2: {
      type: String,
      trim: true,
      maxlength: [120, "Address line 2 cannot be more than 120 characters"],
    },
    city: {
      type: String,
      trim: true,
      maxlength: [60, "City cannot be more than 60 characters"],
    },
    district: {
      type: String,
      trim: true,
      maxlength: [60, "District cannot be more than 60 characters"],
    },
    state: {
      type: String,
      trim: true,
      maxlength: [60, "State cannot be more than 60 characters"],
    },
    pincode: {
      type: String,
      trim: true,
      maxlength: [10, "PIN code cannot be more than 10 characters"],
    },
    isOtpUser: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
  }
);

// Ensure sensitive fields are removed when converting to JSON/object
userSchema.set("toJSON", {
  transform(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    delete ret.password;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpire;
    return ret;
  },
});

userSchema.set("toObject", {
  transform(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    delete ret.password;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpire;
    return ret;
  },
});

module.exports = mongoose.model("User", userSchema);
