import Course from "../models/courseModel.js";
import AppError from "../utilities/errorUtil.js";
import cloudinary from "cloudinary";
import fs from "fs/promises";

const createCourse = async function (req, res, next) {
  try {
    const { title, description, category, createdBy } = req.body;

    // Validate required fields
    if (!title || !description || !category || !createdBy) {
      return next(new AppError(`All fields are required`, 400));
    }

    // Check that same name course in not created again
    const existingCourse = await Course.findOne({ title });
    if (existingCourse) {
      return next(new AppError(`A course with this title already exists`, 400));
    }

    // Create the course
    const course = await Course.create({
      title,
      description,
      category,
      createdBy,
      thumbnail: {
        public_id: "Dummy",
        secure_url: "Dummy",
      },
    });

    if (!course) {
      return next(
        new AppError("Internal Server error could not create course", 500)
      );
    }

    if (req.file) {
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: "lms",
      });
      if (result) {
        course.thumbnail.public_id = result.public_id;
        course.thumbnail.secure_url = result.secure_url;
      }
    }

    fs.rm(`uploads/${req.file.filename}`);

    await course.save();

    // Send response
    res.status(200).json({
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
      message: "Course by Id",
      lectures: course.lectures,
    });
  } catch (error) {
    return next(new AppError(e.message, 500));
  }
};

const updateCourse = async function (req, res, next) {
  try {
    const { id } = req.params;

    const course = await Course.findByIdAndUpdate(
      id,
      {
        $set: req.body,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!course) {
      return res.status(404).send({ message: "Course not found" });
    }

    res.status(200).json({
      success: true,
      message: "Course updated successfully",
      course,
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};

const deletecourse = async (req, res, next) => {
  try {
    const { id } = req.params;

    const course = await Course.findByIdAndDelete(id);

    if (!course) {
      return res.status(404).send({ message: "Course not found" });
    }

    res.status(200).json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};

const addLecturesByCourseId = async (req, res, next) => {
  try {
    const { title, description } = req.body;
    const { id } = req.params;

    if (!title || !description) {
      return next(new AppError("All fields are required", 400));
    }

    const course = await Course.findById(id);

    if (!course) {
      return res.status(404).send({ message: "Course not found" });
    }

    const lectureData = {
      title,
      description,
      lecture: {},
    };

    if (req.file) {
      try {
        const result = await cloudinary.v2.uploader.upload(req.file.path, {
          folder: "lms",
        });

        if (result) {
          lectureData.lecture.public_id = result.public_id;
          lectureData.lecture.secure_url = result.secure_url;
        }
      } catch (uploadError) {
        return next(
          new AppError("Error uploading thumbnail: " + uploadError.message, 500)
        );
      }

      fs.rm(`uploads/${req.file.filename}`);
    }

    course.lectures.push(lectureData);
    course.numberOfLectures = course.lectures.length;

    // Save the updated course
    await course.save();

    // Respond with success
    res.status(200).json({
      success: true,
      message: "Lecture added successfully",
      course,
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};





export {
  getAllCourses,
  getLecturesByCourseId,
  createCourse,
  updateCourse,
  deletecourse,
  addLecturesByCourseId,
};
