import { Schema, model } from "mongoose";

const contestSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  accessLevel: { type: String, enum: ["vip", "normal"], required: true },
  questions: [{ type: Schema.Types.ObjectId, ref: "Question" }],
  prizeInfo: { type: String },
  winners: [{ type: Schema.Types.ObjectId, ref: "Auth" }],
});

export const Contest = model("Contest", contestSchema);
