const express = require('express');
const router  = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  getProducts, getFeaturedProducts, getProductById,
  createProduct, updateProduct, deleteProduct, createProductReview,
} = require('../controllers/productController');

router.route('/')
  .get(getProducts)
  .post(protect, admin, createProduct);

router.get('/featured', getFeaturedProducts);

router.route('/:id')
  .get(getProductById)
  .put(protect, admin, updateProduct)
  .delete(protect, admin, deleteProduct);

router.post('/:id/reviews', protect, createProductReview);

module.exports = router;
