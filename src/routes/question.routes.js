import express from "express";
import { isAuthenticated, isAdmin } from "../middlewares/authMiddleware.js";
import { createQuestion, updateQuestion, deleteQuestion } from "../controllers/question.controller.js";

const router = express.Router();

router.post("/contests/:contestId/questions", isAuthenticated, isAdmin, createQuestion);
router
  .route("/questions/:questionId")
  .put(isAuthenticated, isAdmin, updateQuestion)
  .delete(isAuthenticated, isAdmin, deleteQuestion);

export default router;
