const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');

// @desc  Get all products with filters
// @route GET /api/products
// @access Public
const getProducts = asyncHandler(async (req, res) => {
  const pageSize = Number(req.query.limit) || 12;
  const page     = Number(req.query.page)  || 1;

  const keyword  = req.query.search
    ? { name: { $regex: req.query.search, $options: 'i' } }
    : {};
  const category = req.query.category ? { category: req.query.category } : {};
  const minPrice = req.query.minPrice  ? { price: { $gte: Number(req.query.minPrice) } } : {};
  const maxPrice = req.query.maxPrice  ? { price: { $lte: Number(req.query.maxPrice) } } : {};

  const filter = { ...keyword, ...category, ...minPrice, ...maxPrice };

  const count    = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .skip(pageSize * (page - 1))
    .limit(pageSize)
    .sort({ createdAt: -1 });

  res.json({ products, page, pages: Math.ceil(count / pageSize), total: count });
});

// @desc  Get featured products
// @route GET /api/products/featured
// @access Public
const getFeaturedProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ featured: true }).limit(8);
  res.json(products);
});

// @desc  Get single product
// @route GET /api/products/:id
// @access Public
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.json(product);
});

// @desc  Create product
// @route POST /api/products
// @access Admin
const createProduct = asyncHandler(async (req, res) => {
  const {
    name, description, price, category, fabric,
    color, stock, featured, discount, images,
    sizes, homeCategory,
  } = req.body;

  const product = await Product.create({
    name, description, price, category,
    fabric:       fabric       || '',
    color:        color        || '',
    stock,
    featured:     featured     || false,
    discount:     discount     || 0,
    images:       images       || [],
    sizes:        sizes        || [],
    homeCategory: homeCategory || 'None',
  });

  res.status(201).json(product);
});

// @desc  Update product
// @route PUT /api/products/:id
// @access Admin
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) { res.status(404); throw new Error('Product not found'); }

  Object.assign(product, req.body);
  const updated = await product.save();
  res.json(updated);
});

// @desc  Delete product
// @route DELETE /api/products/:id
// @access Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) { res.status(404); throw new Error('Product not found'); }
  await product.deleteOne();
  res.json({ message: 'Product removed' });
});

// @desc  Create product review
// @route POST /api/products/:id/reviews
// @access Protected
const createProductReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const product = await Product.findById(req.params.id);
  if (!product) { res.status(404); throw new Error('Product not found'); }

  const alreadyReviewed = product.reviews.find(r => r.user.toString() === req.user._id.toString());
  if (alreadyReviewed) { res.status(400); throw new Error('Product already reviewed'); }

  product.reviews.push({ user: req.user._id, name: req.user.name, rating: Number(rating), comment });
  product.numReviews = product.reviews.length;
  product.rating     = product.reviews.reduce((a, r) => a + r.rating, 0) / product.reviews.length;
  await product.save();
  res.status(201).json({ message: 'Review added' });
});

module.exports = { getProducts, getFeaturedProducts, getProductById, createProduct, updateProduct, deleteProduct, createProductReview };
