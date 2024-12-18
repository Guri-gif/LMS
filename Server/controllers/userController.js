import User from "../models/userModels.js";
import AppError from "../utilities/errorUtil.js";
import cloudinary from 'cloudinary'

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

    if(req.file){
      try {
        const result = await cloudinary.v2.uploader.upload(req.file.path,{
          folder: 'lms',
          width: 250,
          height: 250,
          gravity: 'faces',
          crop: 'fill'
        })

        if(result){
          user.avatar.public_id = result.public_id
          user.avatar.secure_url = result.secure_url

          // Deleting from local storage
          fs.rm(`uploads/${req.file.filename}`)
        }
      } catch (e) {
        return next (new AppError(error || 'Failed to add file',500))
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
  res.cookie(`token`, null,{
    secure: true,
    maxAge: 0,
    httpOnly: true
  })
  res.status(200).json({
    succes: true,
    message: 'user logged out successfully'
  })
};

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id
    const user = await User.findById(userId)

    res.status(200).json({
      success: true,
      message: `User Details`,
      user,
    })
  } catch (error) {
    return next(new AppError("Failed to fetch user details", 500));
  }
 
};

export { register, login, logout, getProfile };
