const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// Protect - must be logged in
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Token get કરો
      token = req.headers.authorization.split(' ')[1];

      // Verify કરો
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // User find કરો
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }

      next();
    } catch (error) {
      console.error('Token error:', error.message);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Admin only
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    console.log('User role:', req.user?.role); // Debug
    return res.status(403).json({ message: 'Not authorized as admin' });
  }
};

module.exports = { protect, admin };