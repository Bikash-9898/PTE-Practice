import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const ROLES = ["student", "admin"];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
        message: "Please enter a valid email address",
      },
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ROLES,
      default: "student",
    },
    profileImage: {
      type: String,
      default: "",
    },
    targetScore: {
      type: Number,
      default: 65,
      min: 10,
      max: 90,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    streak: {
      type: Number,
      default: 0,
    },
    lastPractice: {
      type: Date,
      default: null,
    },
    practiceStats: {
      type: {
        speaking: { type: Number, default: 0 },
        writing: { type: Number, default: 0 },
        reading: { type: Number, default: 0 },
        listening: { type: Number, default: 0 },
        total: { type: Number, default: 0 },
        lastPractice: { type: Date, default: null },
      },
      default: {},
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Hash the password before saving if it was modified.
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeJSON = function () {
  const obj = this.toObject({ virtuals: true });
  delete obj.password;
  delete obj.__v;
  return obj;
};

// Lightweight projection used by the admin list endpoint.
userSchema.statics.publicList = function () {
  return this.find({}).select("-password -__v");
};

const User = mongoose.model("User", userSchema);
export default User;
