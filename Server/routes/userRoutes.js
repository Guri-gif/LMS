import { Router } from "express";
import {
  register,
  login,
  logout,
  getProfile,
} from "../controllers/userController.js";
import { isLoggedIn } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/multerMiddleware.js";
const router = Router();

router.post(`/register`,upload.single('avatar'), register);
router.post(`/login`, login);
router.get(`/logout`, logout);
router.get(`/me`, isLoggedIn, getProfile);

export default router;
