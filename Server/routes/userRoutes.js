import { Router } from "express";
import {
  register,
  login,
  logout,
  getProfile,
  forgot,
  reset,
  changePassword,
  updateUser,
} from "../controllers/userController.js";
import { isLoggedIn } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/multerMiddleware.js";
const userRouter = Router();

userRouter.post(`/register`,upload.single('avatar'), register);
userRouter.post(`/login`, login);
userRouter.get(`/logout`, logout);
userRouter.get(`/me`, isLoggedIn, getProfile);
userRouter.post(`/reset`, forgot)
userRouter.post(`/reset/:resetToken`, reset)
userRouter.post(`/change-password`, isLoggedIn, changePassword)
userRouter.put('/update', isLoggedIn, upload.single('avatar'), updateUser)

export default userRouter;
