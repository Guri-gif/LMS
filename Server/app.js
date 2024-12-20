import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config } from "dotenv";
import morgan from "morgan";
import errorMiddleware from "./middlewares/errorMiddleware.js";
import userRouter from "./routes/userRoutes.js";
import courseRouter from "./routes/courseRouter.js";
config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}))

app.use(
  cors({
    origin: [process.env.FRONTEND_URL || "http://localhost:5000"],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(morgan(`dev`));

app.use(`/api/v1/user`, userRouter)
app.use(`/api/v1/courses`, courseRouter)

app.all("*", (req, res) => {
  res.status(404).json({ error: "OOPS! 404 page not found" });
});

app.use(errorMiddleware);

export default app;
