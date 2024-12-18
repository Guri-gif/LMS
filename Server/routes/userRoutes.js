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
const router = Router();

router.post(`/register`,upload.single('avatar'), register);
router.post(`/login`, login);
router.get(`/logout`, logout);
router.get(`/me`, isLoggedIn, getProfile);
router.post(`/reset`, forgot)
router.post(`/reset/:resetToken`, reset)
router.post(`/change-password`, isLoggedIn, changePassword)
router.put('/update', isLoggedIn, upload.single('avatar'), updateUser)

export default router;
