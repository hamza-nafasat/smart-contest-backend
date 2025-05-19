import { Schema, model } from "mongoose";

const questionSchema = new Schema({
  contestId: { type: Schema.Types.ObjectId, ref: "Contest", required: true },
  questionText: { type: String, required: true },
  type: { type: String, enum: ["single-select", "multi-select", "true-false"], required: true },
  options: [{ type: String }],
  correctAnswer: [{ type: Number }],
});

export const Question = model("Question", questionSchema);
