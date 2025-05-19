import express from "express";
import { isAuthenticated, isAdmin } from "../middlewares/authMiddleware.js";
import {
  createContest,
  getContests,
  getSingleContest,
  updateSingleContest,
  deleteSingleContest,
  setWinners,
} from "../controllers/contest.controller.js";

const router = express.Router();

router.post("/create", isAuthenticated, isAdmin, createContest);
router.route("/single/:contestId").get(getSingleContest).put(updateSingleContest).delete(deleteSingleContest);
router.get("/all", getContests);
router.post("/winner/:contestId", isAuthenticated, isAdmin, setWinners);

export default router;
