import { asyncHandler } from "../utils/asyncHandler.js";
import { CustomError } from "../utils/customError.js";
import { Contest } from "../models/contest.model.js";
import { Participation } from "../models/participation.model.js";

// join contest
const joinContest = asyncHandler(async (req, res, next) => {
  const contestId = req.params?.contestId;
  const user = req.user;
  const contest = await Contest.findById(contestId);
  if (!contest) return next(new CustomError(404, "Contest not found"));
  if (contest.accessLevel === "vip" && req.user.role !== "admin" && user.role !== "vip")
    return next(new CustomError(403, "Only VIP or Admin users can access this contest"));

  const now = new Date();
  if (now < contest?.startTime || now > contest?.endTime) return next(new CustomError(400, "Contest is already over"));
  const existingParticipation = await Participation.findOne({ userId: user?._id, contestId });
  if (existingParticipation) return next(new CustomError(400, "You have already joined this contest"));

  const participation = await Participation.create({
    userId: user?._id,
    contestId,
    answers: [],
    score: 0,
    submittedAt: null,
  });
  res.status(201).json({ success: true, message: "Joined contest successfully", data: participation });
});

// submit answers
const submitAnswers = asyncHandler(async (req, res, next) => {
  const contestId = req.params?.contestId;
  const userId = req.user?._id;
  const { answers } = req.body;
  const contest = await Contest.findById(contestId).populate("questions");
  if (!contest) return next(new CustomError(404, "Contest not found"));
  const now = new Date();
  if (now > contest.endTime) return next(new CustomError(400, "Contest has ended"));
  const participation = await Participation.findOne({ userId, contestId });
  if (!participation) return next(new CustomError(400, "You have not joined this contest"));
  if (participation.submittedAt) return next(new CustomError(400, "You have already submitted your answers"));
  if (!Array.isArray(answers) || answers?.length !== contest?.questions?.length)
    return next(new CustomError(400, "Invalid answers"));
  let score = 0;
  contest?.questions?.forEach((question, index) => {
    const userAnswer = answers[index];
    if (!Array.isArray(userAnswer)) return;
    if (question?.type === "single-select" || question?.type === "true-false") {
      if (userAnswer?.length === 1 && userAnswer[0] === question?.correctAnswer[0]) score += 1;
    } else if (question?.type === "multi-select") {
      const sortedUserAnswer = [...userAnswer].sort();
      const sortedCorrect = [...question.correctAnswer].sort();
      if (JSON.stringify(sortedUserAnswer) === JSON.stringify(sortedCorrect)) score += 1;
    }
  });
  participation.answers = answers;
  participation.score = score;
  participation.submittedAt = new Date();
  await participation.save();
  res.status(200).json({ success: true, message: "Answers submitted successfully", data: { score } });
});

// get leaderboard
const getLeaderboard = asyncHandler(async (req, res, next) => {
  const contestId = req.params?.contestId;
  const participations = await Participation.find({ contestId, submittedAt: { $ne: null } })
    .populate("userId", "firstName lastName")
    .sort({ score: -1 });
  const leaderboard = participations.map((p) => ({
    userId: p.userId._id,
    name: `${p.userId.firstName} ${p.userId.lastName}`,
    score: p.score,
  }));
  res.status(200).json({ success: true, data: leaderboard });
});

// get my participations
const getMyParticipations = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const participations = await Participation.find({ userId }).populate(
    "contestId",
    "name description startTime endTime"
  );
  const inProgress = participations.filter((p) => !p.submittedAt);
  const completed = participations.filter((p) => p.submittedAt);
  res.status(200).json({ success: true, data: { inProgress, completed } });
});

// get my prizes
const getMyPrizes = asyncHandler(async (req, res, next) => {
  const userId = req.user?._id;
  const contests = await Contest.find({ winners: { $in: [userId] } });
  const prizes = contests.map((c) => ({
    contestId: c._id,
    contestName: c.name,
    prizeInfo: c.prizeInfo,
  }));
  res.status(200).json({ success: true, data: prizes });
});

export { joinContest, submitAnswers, getLeaderboard, getMyParticipations, getMyPrizes };
