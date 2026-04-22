const Razorpay    = require('razorpay');
const crypto      = require('crypto');
const asyncHandler = require('express-async-handler');
const Order       = require('../models/Order');

// Razorpay instance
const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @desc  Create Razorpay Order
// @route POST /api/payment/create-order
// @access Protected
const createPaymentOrder = asyncHandler(async (req, res) => {
  const { amount } = req.body;

  const options = {
    amount:   Math.round(amount * 100), // Paise માં convert
    currency: 'INR',
    receipt:  `receipt_${Date.now()}`,
  };

  const order = await razorpay.orders.create(options);
  res.json({
    orderId:  order.id,
    amount:   order.amount,
    currency: order.currency,
    keyId:    process.env.RAZORPAY_KEY_ID,
  });
});

// @desc  Verify Payment
// @route POST /api/payment/verify
// @access Protected
const verifyPayment = asyncHandler(async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    orderId,
  } = req.body;

  // Signature verify
  const body      = razorpay_order_id + '|' + razorpay_payment_id;
  const expected  = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest('hex');

  if (expected !== razorpay_signature) {
    res.status(400);
    throw new Error('Payment verification failed');
  }

  // Order update
  const order = await Order.findById(orderId);
  if (order) {
    order.isPaid   = true;
    order.paidAt   = Date.now();
    order.status   = 'Processing';
    order.paymentResult = {
      id:         razorpay_payment_id,
      status:     'completed',
      updateTime: Date.now().toString(),
    };
    await order.save();
  }

  res.json({
    success: true,
    message: 'Payment verified successfully',
    paymentId: razorpay_payment_id,
  });
});

// @desc  Get Razorpay Key
// @route GET /api/payment/key
// @access Public
const getKey = asyncHandler(async (req, res) => {
  res.json({ key: process.env.RAZORPAY_KEY_ID });
});

module.exports = { createPaymentOrder, verifyPayment, getKey };