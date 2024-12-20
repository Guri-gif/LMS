import Course from "../models/courseModel.js";
import AppError from "../utilities/errorUtil.js";

const createCourse = async function (req, res, next) {
  try {
    const {
      title,
      description,
      category,
      createdBy,
      thumbnail,
      numberOfLectures,
    } = req.body;

    // Validate required fields
    if (
      !title ||
      !description ||
      !category ||
      !createdBy ||
      !thumbnail ||
      !thumbnail.public_id ||
      !thumbnail.secure_url
    ) {
      return next(new AppError(`All fields are required`, 400));
    }

    // Create the course
    const course = await Course.create({
      title,
      description,
      category,
      createdBy,
      thumbnail,
      numberOfLectures,
    });

    // Send response
    res.status(201).json({
      success: true,
      message: "Course created successfully",
      course,
    });
  } catch (error) {
    next(error); // Pass error to the error handling middleware
  }
};

const getAllCourses = async function (req, res, next) {
  try {
    const courses = await Course.find({}).select("-lectures");

    res.status(200).json({
      sucess: true,
      message: "List of courses",
      courses,
    });
  } catch (error) {
    return next(new AppError(e.message, 500));
  }
};

const getLecturesByCourseId = async function (req, res, next) {
  try {
    const { id } = req.params;

    const course = await Course.findById(id);

    if (!course) {
      return next(new AppError("Course not found", 404));
    }

    res.status(200).json({
      sucess: true,
      message: "Courses lectures",
      lectures: course.lectures,
    });
  } catch (error) {
    return next(new AppError(e.message, 500));
  }
};

export { getAllCourses, getLecturesByCourseId, createCourse };
