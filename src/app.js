import cookieParser from "cookie-parser";
import express from "express";
import { errorHandler } from "./middlewares/errorHandler.js";
import AuthRoutes from "./routes/auth.routes.js";
import ContestRoutes from "./routes/contest.routes.js";
import QuestionRoutes from "./routes/question.routes.js";
import ParticipationRoutes from "./routes/participation.routes.js";
import cors from "cors";

const app = express();

// middlewares
app.use(
  cors({
    credentials: true,
    origin: ["http://localhost:5173", "https://smart-parking-frontend-mauve.vercel.app"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// routes
app.get("/", (req, res) => res.send("Hello World!"));
app.use("/api/auth", AuthRoutes);
app.use("/api/contests", ContestRoutes);
app.use("/api/questions", QuestionRoutes);
app.use("/api/participations", ParticipationRoutes);

// error handler
app.use(errorHandler);

export default app;
