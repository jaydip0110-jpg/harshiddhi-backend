const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');

// @desc  Create order
// @route POST /api/orders
// @access Protected
const createOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress, paymentMethod, itemsPrice, shippingPrice, taxPrice, totalPrice } = req.body;

  if (!items || items.length === 0) {
    res.status(400); throw new Error('No order items');
  }

  const order = await Order.create({
    user: req.user._id,
    items, shippingAddress, paymentMethod,
    itemsPrice, shippingPrice, taxPrice, totalPrice,
  });
  res.status(201).json(order);
});

// @desc  Get logged-in user orders
// @route GET /api/orders/myorders
// @access Protected
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
});

// @desc  Get order by ID
// @route GET /api/orders/:id
// @access Protected
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) { res.status(404); throw new Error('Order not found'); }
  res.json(order);
});

// @desc  Update order to paid
// @route PUT /api/orders/:id/pay
// @access Protected
const updateOrderToPaid = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) { res.status(404); throw new Error('Order not found'); }
  order.isPaid = true;
  order.paidAt = Date.now();
  order.status = 'Processing';
  const updated = await order.save();
  res.json(updated);
});

// @desc  Get all orders (admin)
// @route GET /api/orders
// @access Admin
const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({}).populate('user', 'name email').sort({ createdAt: -1 });
  res.json(orders);
});

// @desc  Update order status (admin)
// @route PUT /api/orders/:id/status
// @access Admin
const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) { res.status(404); throw new Error('Order not found'); }
  order.status = req.body.status;
  if (req.body.status === 'Delivered') {
    order.isDelivered = true;
    order.deliveredAt = Date.now();
  }
  const updated = await order.save();
  res.json(updated);
});

// @desc  Cancel order by user (only Pending or Processing)
// @route PUT /api/orders/:id/cancel
// @access Protected (User)
const cancelOrderByUser = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Check if order belongs to this user
  if (order.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to cancel this order');
  }

  // Only Pending or Processing orders can be cancelled
  if (order.status !== 'Pending' && order.status !== 'Processing') {
    res.status(400);
    throw new Error(`Cannot cancel order with status: ${order.status}`);
  }

  order.status = 'Cancelled';
  const updated = await order.save();
  res.json(updated);
});

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  updateOrderToPaid,
  getAllOrders,
  updateOrderStatus,
  cancelOrderByUser,
};
