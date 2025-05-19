import express from "express";
import { getMyProfile, login, logout, register } from "../controllers/auth.controller.js";
import { isAuthenticated } from "../middlewares/authMiddleware.js";

const app = express();

app.post("/register", register);
app.post("/login", login);
app.get("/logout", isAuthenticated, logout);
app.get("/my-profile", isAuthenticated, getMyProfile);

export default app;
