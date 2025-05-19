import { asyncHandler } from "../utils/asyncHandler.js";
import { CustomError } from "../utils/customError.js";
import { Contest } from "../models/contest.model.js";
import { Question } from "../models/question.model.js";
import { isValidObjectId } from "mongoose";

// create question
const createQuestion = asyncHandler(async (req, res, next) => {
  const { contestId } = req.params;
  if (!isValidObjectId(contestId)) return next(new CustomError(400, "Invalid Contest Id"));
  const { questionText, type, options, correctAnswer } = req.body;
  if (!questionText || !type || !options || !correctAnswer)
    return next(new CustomError(400, "Please provide all required fields"));
  const isExist = await Question.findOne({ questionText });
  if (isExist) return next(new CustomError(400, "Question already exists"));
  const contest = await Contest.findById(contestId);
  if (!contest) return next(new CustomError(404, "Contest not found"));
  const question = await Question.create({ contestId, questionText, type, options, correctAnswer });
  if (!question) return next(new CustomError(500, "Something went wrong while creating question"));
  contest?.questions.push(question?._id);
  await contest.save();
  res.status(201).json({ success: true, message: "Question created successfully", data: question });
});

// update question
const updateQuestion = asyncHandler(async (req, res, next) => {
  const questionId = req.params?.questionId;
  if (!isValidObjectId(questionId)) return next(new CustomError(400, "Invalid Question Id"));
  const { questionText, type, options, correctAnswer } = req.body;
  if (!questionText && !type && !options && !correctAnswer)
    return next(new CustomError(400, "Please provide at least one field to update"));
  const question = await Question.findById(questionId);
  if (!question) return next(new CustomError(404, "Question not found"));
  if (questionText) question.questionText = questionText;
  if (type) question.type = type;
  if (options) question.options = options;
  if (correctAnswer) question.correctAnswer = correctAnswer;
  await question.save();
  res.status(200).json({ success: true, message: "Question updated successfully", data: question });
});

// delete Question;
const deleteQuestion = asyncHandler(async (req, res, next) => {
  const questionId = req.params?.questionId;
  if (!isValidObjectId(questionId)) return next(new CustomError(400, "Invalid Question Id"));
  const question = await Question.findByIdAndDelete(questionId);
  if (!question) return next(new CustomError(404, "Question not found"));
  await Contest.updateOne({ _id: question?.contestId }, { $pull: { questions: question?._id } });
  res.status(200).json({ success: true, message: "Question deleted successfully" });
});

export { createQuestion, updateQuestion, deleteQuestion };
