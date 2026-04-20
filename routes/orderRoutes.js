const express = require('express');
const router  = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  createOrder, getMyOrders, getOrderById,
  updateOrderToPaid, getAllOrders, updateOrderStatus,
  cancelOrderByUser,
} = require('../controllers/orderController');

router.route('/')
  .post(protect, createOrder)
  .get(protect, admin, getAllOrders);

router.get('/myorders', protect, getMyOrders);

router.route('/:id')
  .get(protect, getOrderById);

router.put('/:id/pay',    protect, updateOrderToPaid);

// Admin — any status update
router.put('/:id/status', protect, admin, updateOrderStatus);

// User — only cancel own order
router.put('/:id/cancel', protect, cancelOrderByUser);

module.exports = router;