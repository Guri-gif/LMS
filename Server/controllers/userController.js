import User from "../models/userModels.js";
import AppError from "../utilities/errorUtil.js";
import cloudinary from "cloudinary";
import fs from "fs/promises";
import sendEmail from "../utilities/sendEmail.js";
import crypto from "crypto";

const cookieOptions = {
  maxAge: 7 * 24 * 60 * 30 * 1000, // 7 days login
  httpOnly: true,
  secure: true,
};

const register = async (req, res, next) => {
  const { fullName, email, password } = req.body;

  // Check required fields
  if (!fullName || !email || !password) {
    return next(new AppError(`All fields are required`, 400));
  }

  try {
    // Check if the user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return next(new AppError(`Email Already Exists`, 400));
    }

    // Create user
    const user = await User.create({
      fullName,
      email,
      password,
      avatar: {
        public_id: email,
        secure_url: `https://res.cloudinary.com/demo/image/upload/v1699999999/sample.jpg`, // Dummy avatar URL
      },
    });

    if (!user) {
      return next(
        new AppError(`User registration failed, please try again`, 400)
      );
    }

    if (req.file) {
      console.log(req.file);
      try {
        const result = await cloudinary.v2.uploader.upload(req.file.path, {
          folder: "lms",
          width: 250,
          height: 250,
          gravity: "faces",
          crop: "fill",
        });

        if (result) {
          user.avatar.public_id = result.public_id;
          user.avatar.secure_url = result.secure_url;

          // Deleting from local storage
          fs.rm(`uploads/${req.file.filename}`);
        }
      } catch (e) {
        return next(new AppError(error || "Failed to add file", 500));
      }
    }

    await user.save();

    user.password = undefined;

    const token = await user.generateJWTToken();

    res.cookie(`token`, token, cookieOptions);

    // Respond with success
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    next(error); // Pass error to global error handler
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError(`All fields are required`, 400));
    }

    const user = await User.findOne({
      email,
    }).select("+password");

    if (!user || !user.comparePassword(password)) {
      return next(new AppError(`Email pr password doesn't match`, 400));
    }

    const token = await user.generateJWTToken();
    user.password = undefined;

    res.cookie(`token`, token, cookieOptions);

    res.status(200).json({
      succes: true,
      message: `user logged In successfully`,
      user,
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};

const logout = (req, res) => {
  res.cookie(`token`, null, {
    secure: true,
    maxAge: 0,
    httpOnly: true,
  });
  res.status(200).json({
    succes: true,
    message: "user logged out successfully",
  });
};

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    res.status(200).json({
      success: true,
      message: `User Details`,
      user,
    });
  } catch (error) {
    return next(new AppError("Failed to fetch user details", 500));
  }
};

const forgot = async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    return next(new AppError("Email required", 500));
  }

  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError("Email Not registered", 500));
  }

  const resetToken = await user.generatePasswordResetToken();

  await user.save();

  const resetPasswordURL = `${process.env.FRONTEND_URL}/forgot-password/${resetToken}`;

  const message = `you can reset your password by clicking on <a href=${resetPasswordURL} target="_blank">  `;
  const subject = "Reset Password";

  try {
    await sendEmail(email, subject, message);

    res.status(200).json({
      succes: true,
      message: "Reset password link has been sent to your registered email",
    });
  } catch (error) {
    user.forgotPasswordExpiry = undefined;
    user.forgotPasswordToken = undefined;

    await user.save();
    return next(new AppError("Failed to send", 500));
  }
};

const reset = async (req, res, next) => {
  const { resetToken } = req.params;

  const { password } = req.body;

  const forgotPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  const user = await User.findOne({
    forgotPasswordToken,
    forgotPasswordExpiry: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError(`Token has expired or not valid`, 400));
  }

  user.password = password;
  user.forgotPasswordToken = undefined;
  user.forgotPasswordExpiry = undefined;
  user.save(200);

  res.status(200).json({
    success: true,
    message: "Password changed successfully",
  });
};

const changePassword = async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;
  const { id } = req.user;

  if (!oldPassword || !newPassword) {
    return next(new AppError(`All fields are required`, 400));
  }

  const user = await User.findById(id).select("+password");

  if (!user) {
    return next(new AppError(`User does not exists`, 400));
  }

  const isPasswordValid = await user.comparePassword(oldPassword);

  if (!isPasswordValid) {
    return next(new AppError(`Old passowrd does not match`, 400));
  }

  user.password = newPassword;

  await user.save();

  user.password = undefined;

  res.status(200).json({
    success: true,
    message: "Passoword changed successfully",
  });
};

const updateUser = async () => {
  const { fullName } = req.body;
  const { id } = req.user.id;

  const user = User.findById(id);

  if (!user) {
    return next(new AppError(`User does not exists`, 400));
  }

  if (req.fullName) {
    user.fullName = fullName;
  }

  if (req.file) {
    await cloudinary.v2.uploader.destroy(user.avatar.public_id);
    try {
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: "lms",
        width: 250,
        height: 250,
        gravity: "faces",
        crop: "fill",
      });

      if (result) {
        user.avatar.public_id = result.public_id;
        user.avatar.secure_url = result.secure_url;

        // Deleting from local storage
        fs.rm(`uploads/${req.file.filename}`);
      }
    } catch (e) {
      return next(new AppError(error || "Failed to add file", 500));
    }
  }
  await user.save()

  res.status(200).json({
    success: true,
    message: "User updated Successfully"
  })
};

export {
  register,
  login,
  logout,
  getProfile,
  forgot,
  reset,
  changePassword,
  updateUser,
};
