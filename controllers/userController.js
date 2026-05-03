const asyncHandler = require('express-async-handler');
const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// @desc  Register
// @route POST /api/users/register
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  // Validation
  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please fill all required fields');
  }

  // Email format check
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    res.status(400);
    throw new Error('Invalid email format');
  }

  // Password strength check
  const hasUpper   = /[A-Z]/.test(password);
  const hasLower   = /[a-z]/.test(password);
  const hasNumber  = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  if (!hasUpper || !hasLower || !hasNumber || !hasSpecial || password.length < 6) {
    res.status(400);
    throw new Error('Password માં uppercase, lowercase, number અને special character (@#$) હોવો જોઈએ — ઉદા: Name@123');
  }

  // Check existing user
  const exists = await User.findOne({ email: email.toLowerCase().trim() });
  if (exists) {
    res.status(400);
    throw new Error('આ email already registered છે');
  }

  const user = await User.create({
    name:     name.trim(),
    email:    email.toLowerCase().trim(),
    password: password,
    phone:    phone || '',
  });

  if (user) {
    res.status(201).json({
      _id:   user._id,
      name:  user.name,
      email: user.email,
      role:  user.role,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('User create failed');
  }
});
// @desc  Login
// @route POST /api/users/login
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  console.log('Login attempt:', email);

  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  // Case-insensitive email search
  const user = await User.findOne({
    email: email.toLowerCase().trim()
  });

  console.log('User found:', user ? user.email : 'NOT FOUND');

  if (!user) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  const isMatch = await user.matchPassword(password);
  console.log('Password match:', isMatch);

  if (!isMatch) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  res.json({
    _id:   user._id,
    name:  user.name,
    email: user.email,
    role:  user.role,
    token: generateToken(user._id),
  });
});

// @desc  Get Profile
// @route GET /api/users/profile
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) { res.status(404); throw new Error('User not found'); }
  res.json({
    _id:   user._id,
    name:  user.name,
    email: user.email,
    role:  user.role,
  });
});

// @desc  Update Profile
// @route PUT /api/users/profile
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) { res.status(404); throw new Error('User not found'); }

  user.name  = req.body.name  || user.name;
  user.email = req.body.email || user.email;
  if (req.body.password) user.password = req.body.password;

  const updated = await user.save();
  res.json({
    _id:   updated._id,
    name:  updated.name,
    email: updated.email,
    role:  updated.role,
    token: generateToken(updated._id),
  });
});

// @desc  Get All Users (Admin)
// @route GET /api/users
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select('-password');
  res.json(users);
});

// @desc  Google Login
// @route POST /api/users/google-login
const googleLogin = asyncHandler(async (req, res) => {
  const { name, email, googleId, avatar } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Email required');
  }

  // User exist check — email થી
  let user = await User.findOne({ email: email.toLowerCase() });

  if (user) {
    // Already exists — login
    res.json({
      _id:    user._id,
      name:   user.name,
      email:  user.email,
      role:   user.role,
      avatar: user.avatar || avatar,
      token:  generateToken(user._id),
    });
  } else {
    // New user — create
    user = await User.create({
      name,
      email:    email.toLowerCase(),
      password: googleId + process.env.JWT_SECRET, // Random secure password
      avatar,
      googleId,
    });

    res.status(201).json({
      _id:    user._id,
      name:   user.name,
      email:  user.email,
      role:   user.role,
      avatar: user.avatar,
      token:  generateToken(user._id),
    });
  }
});

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  googleLogin,
};