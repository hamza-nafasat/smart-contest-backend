import express from "express";
import {
  forgetPassword,
  getMyProfile,
  login,
  logout,
  register,
  resetPassword,
  updateMyProfile,
} from "../controllers/auth.controller.js";
import { isAuthenticated } from "../middlewares/authMiddleware.js";
import { singleUpload } from "../middlewares/multer.js";

const app = express();

app.post("/register", register);
app.post("/login", login);
app.get("/logout", isAuthenticated, logout);
app.post("/forget-password", forgetPassword);
app.post("/reset-password", resetPassword);
app.get("/my-profile", isAuthenticated, getMyProfile);
app.put("/my-profile", isAuthenticated, singleUpload, updateMyProfile);

export default app;
