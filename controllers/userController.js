const asyncHandler = require('express-async-handler');
const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT token
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// @desc  Register new user
// @route POST /api/users/register
// @access Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const exists = await User.findOne({ email });
  if (exists) { res.status(400); throw new Error('User already exists'); }

  const user = await User.create({ name, email, password });
  res.status(201).json({
    _id:   user._id,
    name:  user.name,
    email: user.email,
    role:  user.role,
    token: generateToken(user._id),
  });
});

// @desc  Login user
// @route POST /api/users/login
// @access Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (user && (await user.matchPassword(password))) {
    res.json({
      _id:   user._id,
      name:  user.name,
      email: user.email,
      role:  user.role,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc  Get user profile
// @route GET /api/users/profile
// @access Protected
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ _id: user._id, name: user.name, email: user.email, role: user.role, address: user.address });
});

// @desc  Update user profile
// @route PUT /api/users/profile
// @access Protected
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.name    = req.body.name    || user.name;
  user.email   = req.body.email   || user.email;
  if (req.body.password) user.password = req.body.password;
  if (req.body.address)  user.address  = req.body.address;
  const updated = await user.save();
  res.json({ _id: updated._id, name: updated.name, email: updated.email, role: updated.role });
});

// @desc  Get all users (admin)
// @route GET /api/users
// @access Admin
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select('-password');
  res.json(users);
});

module.exports = { registerUser, loginUser, getUserProfile, updateUserProfile, getAllUsers };
