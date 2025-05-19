import path from "path";
import { fileURLToPath } from "url";
import { getEnv } from "./config.js";

export const __dirName = fileURLToPath(import.meta.url);
export const __fileName = path.dirname(__dirName);

export const accessTokenOptions = {
  httpOnly: true,
  sameSite: getEnv("NODE_ENV") != "development" ? "none" : "lax",
  secure: getEnv("NODE_ENV") != "development",
  maxAge: parseInt(getEnv("ACCESS_TOKEN_MAX_AGE")),
};

export const refreshTokenOptions = {
  httpOnly: true,
  sameSite: getEnv("NODE_ENV") != "development" ? "none" : "lax",
  secure: getEnv("NODE_ENV") != "development",
  maxAge: Number(getEnv("REFRESH_TOKEN_MAX_AGE")),
};
