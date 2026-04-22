const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createPaymentOrder,
  verifyPayment,
  getKey,
} = require('../controllers/paymentController');

router.get('/key',          getKey);
router.post('/create-order', protect, createPaymentOrder);
router.post('/verify',       protect, verifyPayment);

module.exports = router;