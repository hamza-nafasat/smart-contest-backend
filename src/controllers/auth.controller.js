import bcrypt from "bcrypt";
import { isValidObjectId } from "mongoose";
import { getEnv } from "../configs/config.js";
import { Auth } from "../models/auth.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { CustomError } from "../utils/customError.js";
import { returnMailPage } from "../utils/htmlPages.js";
import { JWTService } from "../utils/jwtService.js";
import { sendMail } from "../utils/sendMail.js";
import { sendToken } from "../utils/sendToken.js";
import { removeFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";

// register
// ---------
const register = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, email, password } = req.body;
  if (!firstName || !lastName || !email || !password) return next(new CustomError(400, "Please Provide all fields"));
  const user = await Auth.findOne({ email });
  if (user?._id) return next(new CustomError(403, "Email Already Exists"));
  const newUser = await Auth.create({
    firstName,
    lastName,
    email,
    password,
  });
  if (!newUser) return next(new CustomError(400, "Error While Registering User"));
  await sendToken(res, next, newUser, 201, "Your Account Registered Successfully");
});

// login
// ------
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) return next(new CustomError(400, "Please Provide Email and Password"));
  const user = await Auth.findOne({ email }).select("+password");
  if (!user && !user?._id) return next(new CustomError(400, "Wrong email or password"));
  const matchPwd = await bcrypt.compare(password, user.password);
  if (!matchPwd) return next(new CustomError(400, "Wrong email or password"));
  await sendToken(res, next, user, 200, "Logged In Successfully");
});

// logout
// ---------
const logout = asyncHandler(async (req, res, next) => {
  const refreshToken = req?.cookies?.[getEnv("REFRESH_TOKEN_NAME")];
  if (refreshToken) await JWTService().removeRefreshToken(refreshToken);
  res.cookie(getEnv("ACCESS_TOKEN_NAME"), "", { maxAge: 1 });
  res.cookie(getEnv("REFRESH_TOKEN_NAME"), "", { maxAge: 1 });
  return res.status(200).json({ success: true, message: "Logged Out Successfully" });
});

// forget password
// --------------
const forgetPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  if (!email) return next(new CustomError(400, "Please Provide Email"));
  const user = await Auth.findOne({ email });
  if (!user?._id) return next(new CustomError(400, "User Not Found"));
  const token = await JWTService().verificationToken(String(user?._id));
  if (!token) return next(new CustomError(400, "Error While Generating Token"));
  const resetPasswordUrl = `${getEnv("RESET_PASSWORD_URL")}/${token}`;
  let mailPage = returnMailPage(resetPasswordUrl);
  const isMailSent = await sendMail(email, "Reset Password", mailPage, true);
  if (!isMailSent) return next(new CustomError(500, "Some Error Occurred While Sending Mail"));
  return res.status(200).json({ success: true, message: "Reset Password Link Sent Successfully Check Your MailBox" });
});

// reset you password
// ------------------
const resetPassword = asyncHandler(async (req, res, next) => {
  const { resetToken, newPassword } = req.body;
  const decoded = await JWTService().verifyToken(resetToken, getEnv("VERIFICATION_TOKEN_SECRET"));
  if (!decoded?._id) return next(new CustomError(400, "Token Expired Try Again"));
  const user = await Auth.findById(decoded._id);
  if (!user) return next(new CustomError(400, "User Not Found"));
  user.password = newPassword;
  await user.save();
  return res.status(200).json({ success: true, message: "Password Reset Successfully Now You Can Login" });
});

// get My Profile
// ---------------
const getMyProfile = asyncHandler(async (req, res, next) => {
  const userId = req?.user?._id;
  if (!isValidObjectId(userId)) return next(new CustomError(400, "Invalid User Id"));
  const user = await Auth.findById(userId);
  if (!user) return next(new CustomError(400, "User Not Found"));
  return res.status(200).json({ success: true, data: user });
});

// update my profile
// -----------------
const updateMyProfile = asyncHandler(async (req, res, next) => {
  const userId = req?.user?._id;
  if (!isValidObjectId(userId)) return next(new CustomError(400, "Invalid User Id"));
  const user = await Auth.findById(userId);
  if (!user) return next(new CustomError(400, "User Not Found"));
  const image = req.file;
  const { firstName, lastName, contact, address, country, state } = req.body;
  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (contact) user.contact = contact;
  if (address) user.address = address;
  if (country) user.country = country;
  if (state) user.state = state;
  if (image) {
    if (user?.image?.public_id) await removeFromCloudinary(user?.image?.public_id, "image");
    const newImage = await uploadOnCloudinary(image, "auth");
    if (!newImage) return next(new CustomError(400, "Error While Uploading Image"));
    user.image = { public_id: newImage.public_id, url: newImage.secure_url };
  }
  await user.save();
  return res.status(200).json({ success: true, message: "Profile Updated Successfully" });
});

export { forgetPassword, getMyProfile, login, logout, register, resetPassword, updateMyProfile };
