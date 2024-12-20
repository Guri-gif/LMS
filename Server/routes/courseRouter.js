import { Router } from "express";
import {
  addLecturesByCourseId,
  createCourse,
  deletecourse,
  getAllCourses,
  getLecturesByCourseId,
  updateCourse,
} from "../controllers/courseController.js";
import { authRoles, isLoggedIn } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/multerMiddleware.js";

const courseRouter = Router();

courseRouter
  .route("/")
  .get(isLoggedIn, getAllCourses)
  .post(
    isLoggedIn,
    authRoles("ADMIN"),
    upload.single("thumbnail"),
    createCourse
  );


courseRouter
  .route("/:id")
  .get(isLoggedIn, getLecturesByCourseId)
  .put(isLoggedIn, authRoles("ADMIN"), updateCourse)
  .delete(isLoggedIn, authRoles("ADMIN"), deletecourse)
  .post(
    isLoggedIn,
    authRoles("ADMIN"),
    upload.single("lecture"),
    addLecturesByCourseId
  );

  export default courseRouter;
