import { Router } from "express";
import {
    createCourse,
  getAllCourses,
  getLecturesByCourseId,
} from "../controllers/courseController.js";
import {isLoggedIn} from '../middlewares/authMiddleware.js'

const courseRouter = Router();

courseRouter.get("/", getAllCourses);
courseRouter.post("/create-course", createCourse);
courseRouter.get("/:id", isLoggedIn,getLecturesByCourseId );

export default courseRouter;
