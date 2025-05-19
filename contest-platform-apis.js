// Project Structure Overview
// - controllers/
// - models/
// - routes/
// - middleware/
// - utils/
// - app.js
// - server.js

// This code sets up the full API structure.

/* ============================ */
/* ======= server.js ========= */
/* ============================ */
import express from 'express';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import contestRoutes from './routes/contest.routes.js';
import userRoutes from './routes/user.routes.js';
import submissionRoutes from './routes/submission.routes.js';
dotenv.config();

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/contests', contestRoutes);
app.use('/api/users', userRoutes);
app.use('/api/submissions', submissionRoutes);

mongoose.connect(process.env.MONGO_URI).then(() => {
  app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
  });
});

/* ============================ */
/* ======= middleware/auth.js ====== */
/* ============================ */
import jwt from 'jsonwebtoken';

export const protect = (roles = []) => (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ msg: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ msg: 'Forbidden' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ msg: 'Invalid token' });
  }
};

/* ============================ */
/* ======= models/User.js ====== */
/* ============================ */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ['admin', 'vip', 'user'], default: 'user' },
  prizes: [String],
});

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.matchPassword = function (password) {
  return bcrypt.compare(password, this.password);
};

export default mongoose.model('User', userSchema);

/* ============================ */
/* ======= models/Contest.js ====== */
/* ============================ */
import mongoose from 'mongoose';

const contestSchema = new mongoose.Schema({
  name: String,
  description: String,
  accessLevel: { type: String, enum: ['normal', 'vip'] },
  startTime: Date,
  endTime: Date,
  prize: String,
  questions: [
    {
      type: { type: String, enum: ['single', 'multi', 'boolean'] },
      questionText: String,
      options: [String],
      correctAnswers: [String],
    },
  ],
});

export default mongoose.model('Contest', contestSchema);

/* ============================ */
/* ======= models/Submission.js ====== */
/* ============================ */
import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  contestId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contest' },
  answers: [String],
  score: Number,
});

export default mongoose.model('Submission', submissionSchema);

/* ============================ */
/* ======= routes/auth.routes.js ====== */
/* ============================ */
import express from 'express';
import { register, login, logout, getMe } from '../controllers/auth.controller.js';
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', getMe);

export default router;

/* ============================ */
/* ======= routes/contest.routes.js ====== */
/* ============================ */
import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  createContest,
  getContests,
  getContest,
  joinContest,
  getContestQuestions,
} from '../controllers/contest.controller.js';

const router = express.Router();

router.post('/', protect(['admin']), createContest);
router.get('/', protect(['admin', 'vip', 'user']), getContests);
router.get('/:id', protect(['admin', 'vip', 'user']), getContest);
router.post('/:id/join', protect(['vip', 'user']), joinContest);
router.get('/:id/questions', protect(['vip', 'user']), getContestQuestions);

export default router;

/* ============================ */
/* ======= routes/user.routes.js ====== */
/* ============================ */
import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getAllUsers,
  upgradeUserRole,
  getUserHistory,
  getUserPrizes,
  getUserInProgress,
} from '../controllers/user.controller.js';

const router = express.Router();

router.get('/', protect(['admin']), getAllUsers);
router.put('/:id/upgrade-role', protect(['admin']), upgradeUserRole);
router.get('/me/history', protect(), getUserHistory);
router.get('/me/prizes', protect(), getUserPrizes);
router.get('/me/in-progress', protect(), getUserInProgress);

export default router;

/* ============================ */
/* ======= routes/submission.routes.js ====== */
/* ============================ */
import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  submitAnswers,
  getLeaderboard,
  getResult,
} from '../controllers/submission.controller.js';

const router = express.Router();

router.post('/:contestId/submit', protect(['vip', 'user']), submitAnswers);
router.get('/:contestId/leaderboard', protect(['admin', 'vip', 'user']), getLeaderboard);
router.get('/:contestId/result', protect(['vip', 'user']), getResult);

export default router;

/* ============================ */
/* ======= controllers/auth.controller.js ====== */
/* ============================ */
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

export const register = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const user = await User.create({ name, email, password });
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
    res.cookie('token', token, { httpOnly: true }).json({ msg: 'Registered', user });
  } catch (err) {
    res.status(400).json({ msg: 'User exists or invalid data' });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ msg: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
  res.cookie('token', token, { httpOnly: true }).json({ msg: 'Logged in', user });
};

export const logout = (req, res) => {
  res.clearCookie('token').json({ msg: 'Logged out' });
};

export const getMe = async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json(user);
};

/* ============================ */
/* ======= controllers/contest.controller.js ====== */
/* ============================ */
import Contest from '../models/Contest.js';

export const createContest = async (req, res) => {
  const contest = await Contest.create(req.body);
  res.json(contest);
};

export const getContests = async (req, res) => {
  const contests = await Contest.find({
    $or: [
      { accessLevel: 'normal' },
      { accessLevel: 'vip', ...(req.user.role === 'vip' && {}) },
    ],
  });
  res.json(contests);
};

export const getContest = async (req, res) => {
  const contest = await Contest.findById(req.params.id);
  res.json(contest);
};

export const joinContest = async (req, res) => {
  res.json({ msg: 'Joined contest (frontend tracks progress)' });
};

export const getContestQuestions = async (req, res) => {
  const contest = await Contest.findById(req.params.id);
  res.json(contest.questions);
};

/* ============================ */
/* ======= controllers/user.controller.js ====== */
import User from '../models/User.js';
import Submission from '../models/Submission.js';

export const getAllUsers = async (req, res) => {
  const users = await User.find();
  res.json(users);
};

export const upgradeUserRole = async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { role: 'vip' }, { new: true });
  res.json(user);
};

export const getUserHistory = async (req, res) => {
  const submissions = await Submission.find({ userId: req.user.id });
  res.json(submissions);
};

export const getUserPrizes = async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json(user.prizes);
};

export const getUserInProgress = async (req, res) => {
  res.json([]);
};

/* ============================ */
/* ======= controllers/submission.controller.js ====== */
/* ============================ */
import Submission from '../models/Submission.js';
import Contest from '../models/Contest.js';

export const submitAnswers = async (req, res) => {
  const { answers } = req.body;
  const contest = await Contest.findById(req.params.contestId);
  let score = 0;
  contest.questions.forEach((q, i) => {
    const correct = q.correctAnswers.sort().join(',');
    const submitted = (answers[i] || []).sort().join(',');
    if (correct === submitted) score++;
  });
  const submission = await Submission.create({
    userId: req.user.id,
    contestId: contest._id,
    answers,
    score,
  });
  res.json({ msg: 'Submission successful', score });
};

export const getLeaderboard = async (req, res) => {
  const leaderboard = await Submission.find({ contestId: req.params.contestId })
    .populate('userId', 'name')
    .sort({ score: -1 });
  res.json(leaderboard);
};

export const getResult = async (req, res) => {
  const submission = await Submission.findOne({
    contestId: req.params.contestId,
    userId: req.user.id,
  });
  res.json(submission);
};
