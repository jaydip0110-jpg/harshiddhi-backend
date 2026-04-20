const express    = require('express');
const router     = express.Router();
const multer     = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { protect, admin } = require('../middleware/authMiddleware');

// Cloudinary Configure
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder:          'harshiddhi-products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation:  [{ width: 800, height: 1000, crop: 'limit' }],
  },
});

// File Filter
const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|gif/;
  if (allowed.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files allowed!'), false);
  }
};

const upload = multer({ storage, fileFilter });

// POST /api/upload
router.post('/', protect, admin, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  console.log('✅ Cloudinary URL:', req.file.path);
  res.json({ url: req.file.path });
});

module.exports = router;