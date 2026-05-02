const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:    { type: String, required: true },
  rating:  { type: Number, required: true },
  comment: { type: String, required: true },
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  description: { type: String, required: true },
  price:       { type: Number, required: true, default: 0 },
  images:      [{ type: String }],
  category:    {
    type: String,
    required: true,
    enum: ['Sarees', 'Dresses', 'Lehenga', 'Suits', 'Kurtis', 'Dupattas'],
  },
  fabric:      { type: String },
  color:       { type: String },
  // ── Sizes ──
  sizes: [{
    type: String,
    enum: ['Free Size', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '4XL', '5XL'],
  }],

  // Home page category section
homeCategory: {
  type:    String,
  enum:    ['None', 'Sarees', 'Dresses', 'Lehenga', 'Suits', 'Kurtis', 'Dupattas'],
  default: 'None',
},

  stock:       { type: Number, required: true, default: 0 },
  rating:      { type: Number, default: 0 },
  numReviews:  { type: Number, default: 0 },
  reviews:     [reviewSchema],
  featured:    { type: Boolean, default: false },
  discount:    { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
