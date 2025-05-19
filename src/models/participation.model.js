import { Schema, model } from "mongoose";

const participationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "Auth", required: true },
  contestId: { type: Schema.Types.ObjectId, ref: "Contest", required: true },
  answers: [[Number]],
  score: { type: Number, default: 0 },
  submittedAt: { type: Date },
});

export const Participation = model("Participation", participationSchema);
