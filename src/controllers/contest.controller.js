import { asyncHandler } from "../utils/asyncHandler.js";
import { CustomError } from "../utils/customError.js";
import { Contest } from "../models/contest.model.js";
import { isValidObjectId } from "mongoose";
import { Participation } from "../models/participation.model.js";

// create contest
const createContest = asyncHandler(async (req, res, next) => {
  const { name, description, startTime, endTime, accessLevel, prizeInfo } = req.body;
  if (!name || !startTime || !endTime || !accessLevel)
    return next(new CustomError(400, "Please provide all required fields"));
  const contest = await Contest.create({ name, description, startTime, endTime, accessLevel, prizeInfo });
  res.status(201).json({ success: true, message: "Contest created successfully", data: contest });
});

// get all contests
const getContests = asyncHandler(async (req, res, next) => {
  const contests = await Contest.find();
  res.status(200).json({ success: true, data: contests });
});

// get single contest
const getSingleContest = asyncHandler(async (req, res, next) => {
  const contestId = req?.params?.contestId;
  if (!isValidObjectId(contestId)) return next(new CustomError(400, "Invalid Contest Id"));
  const contest = await Contest.findById(contestId).populate("questions");
  if (!contest) return next(new CustomError(404, "Contest not found"));
  res.status(200).json({ success: true, data: contest });
});

const updateSingleContest = asyncHandler(async (req, res, next) => {
  const contestId = req?.params?.contestId;
  if (!isValidObjectId(contestId)) return next(new CustomError(400, "Invalid Contest Id"));
  const { name, description, startTime, endTime, accessLevel, prizeInfo } = req.body;
  if (!name && !startTime && !endTime && !accessLevel && !prizeInfo && !prizeInfo)
    return next(new CustomError(400, "Please provide at least one field to update"));
  const contest = await Contest.findById(contestId);
  if (!contest) return next(new CustomError(404, "Contest not found"));
  if (name) contest.name = name;
  if (description) contest.description = description;
  if (startTime) contest.startTime = startTime;
  if (endTime) contest.endTime = endTime;
  if (accessLevel) contest.accessLevel = accessLevel;
  if (prizeInfo) contest.prizeInfo = prizeInfo;
  await contest.save();
  res.status(200).json({ success: true, message: "Contest updated successfully", data: contest });
});

const deleteSingleContest = asyncHandler(async (req, res, next) => {
  const contestId = req?.params?.contestId;
  if (!isValidObjectId(contestId)) return next(new CustomError(400, "Invalid Contest Id"));
  const contest = await Contest.findByIdAndDelete(contestId);
  if (!contest) return next(new CustomError(404, "Contest not found"));
  res.status(200).json({ success: true, message: "Contest deleted successfully" });
});

const setWinners = asyncHandler(async (req, res, next) => {
  const contestId = req.params?.contestId;
  if (!isValidObjectId(contestId)) return next(new CustomError(400, "Invalid Contest Id"));
  const contest = await Contest.findById(contestId);
  if (!contest) return next(new CustomError(404, "Contest not found"));
  if (new Date() < contest?.endTime) return next(new CustomError(400, "Contest has not ended yet"));
  const participations = await Participation.find({ contestId, submittedAt: { $ne: null } }).sort({ score: -1 });
  if (participations.length === 0) {
    contest.winners = [];
  } else {
    const highestScore = participations[0].score;
    const winners = participations.filter((p) => p.score === highestScore).map((p) => p.userId);
    contest.winners = winners;
  }
  await contest.save();
  res.status(200).json({ success: true, message: "Winners set successfully", data: { winners: contest.winners } });
});

export { createContest, getContests, getSingleContest, updateSingleContest, deleteSingleContest, setWinners };
