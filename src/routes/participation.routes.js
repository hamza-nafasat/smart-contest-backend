import express from "express";
import { isAuthenticated } from "../middlewares/authMiddleware.js";
import {
  joinContest,
  submitAnswers,
  getLeaderboard,
  getMyParticipations,
  getMyPrizes,
} from "../controllers/participation.controller.js";

const router = express.Router();

router.post("/contests/:contestId/join", isAuthenticated, joinContest);
router.post("/contests/:contestId/submit", isAuthenticated, submitAnswers);
router.get("/contests/:contestId/leaderboard", getLeaderboard);
router.get("/my-participations", isAuthenticated, getMyParticipations);
router.get("/my-prizes", isAuthenticated, getMyPrizes);

export default router;
