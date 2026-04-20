const express = require('express');
const router  = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  registerUser, loginUser, getUserProfile, updateUserProfile, getAllUsers,
} = require('../controllers/userController');

router.post('/register', registerUser);
router.post('/login',    loginUser);
router.route('/profile').get(protect, getUserProfile).put(protect, updateUserProfile);
router.get('/', protect, admin, getAllUsers);

module.exports = router;
