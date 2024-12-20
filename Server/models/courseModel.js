import { model, Schema } from "mongoose";

const courseSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      minLength: [8, "Title must be 8 characters long"],
      maxLength: [69, "Title should be less than 69"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      minLength: [20, "Description must be 20 characters long"],
      maxLength: [200, "Description should be less than 200"],
    },
    category: {
      type: String,
      required: [true, "category is required"],
    },
    thumbnail: {
      public_id: {
        type: String,
        required: true,
      },
      secure_url: {
        type: String,
        required: true,
      },
    },
    lectures: [
      {
        title: {
          type: String,
          required: [true, "Lecture title is required"],
        },
        description: {
          type: String,
        },
        lecture: {
          public_id: {
            type: String,
            required: [true, "Lecture public_id is required"],
          },
          secure_url: {
            type: String,
            required: [true, "Lecture secure_url is required"],
          },
        },
      },
    ],
    numberOfLectures: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Course = model("Course", courseSchema);

export default Course;
