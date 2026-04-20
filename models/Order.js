const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name:     { type: String, required: true },
  image:    { type: String, required: true },
  price:    { type: Number, required: true },
  qty:      { type: Number, required: true },
});

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [orderItemSchema],
  shippingAddress: {
    name:    { type: String, required: true },
    phone:   { type: String, required: true },
    street:  { type: String, required: true },
    city:    { type: String, required: true },
    state:   { type: String, required: true },
    pincode: { type: String, required: true },
  },
  paymentMethod:  { type: String, required: true, default: 'COD' },
  paymentResult:  {
    id: String, status: String, updateTime: String, email: String,
  },
  itemsPrice:    { type: Number, required: true, default: 0 },
  shippingPrice: { type: Number, required: true, default: 0 },
  taxPrice:      { type: Number, required: true, default: 0 },
  totalPrice:    { type: Number, required: true, default: 0 },
  isPaid:        { type: Boolean, default: false },
  paidAt:        Date,
  isDelivered:   { type: Boolean, default: false },
  deliveredAt:   Date,
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Pending',
  },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
