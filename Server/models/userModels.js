import { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const userSchema = new Schema(
  {
    fullName: {
      type: `String`,
      required: [true, `Name is Required`],
      minLength: [5, `Name must be 5 character`],
      maxLength: [25, `Name should be less than 25 character`],
      lowercase: true,
      trim: true,
    },
    email: {
      type: `String`,
      required: [true, `email is Required`],
      lowercase: true,
      trim: true,
      unique: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        `Please fill a valid email address`,
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minLength: [8, "Password must be at least 8 characters long"],
      select: false,
      match: [
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/,
        "Please enter a valid password with at least one letter and one number",
      ],
    },

    avatar: {
      public_id: {
        type: `String`,
        unique: true,
      },
      secure_url: {
        type: `String`,
      },
    },
    role: {
      type: `String`,
      enum: [`USER`, `ADMIN`],
      default: `USER`,
    },
    forgotPasswordToken: String,
    forgotPasswordExpiry: Date,
  },
  {
    timestamps: true,
  }
);

userSchema.pre(`save`, async function (next) {
  if (!this.isModified(`password`)) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods = {
  generateJWTToken: async function () {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined in environment variables");
    }

    return await jwt.sign(
      {
        id: this.id,
        email: this.email,
        subscription: this.subscription,
        role: this.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRY || "7d",
      }
    );
  },
  comparePassword: async function (plainTextPassword) {
    return await bcrypt.compare(plainTextPassword, this.password);
  },

  generatePasswordResetToken: async function () {
    const resetToken = crypto.randomBytes(20).toString("hex");

    this.forgotPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    this.forgotPasswordExpiry = Date.now() + 15 * 60 * 1000;
  },
};
const User = model(`User`, userSchema);

export default User;
