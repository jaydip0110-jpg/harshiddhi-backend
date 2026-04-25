const dotenv    = require('dotenv');
const mongoose  = require('mongoose');
const bcrypt    = require('bcryptjs');
const connectDB = require('./config/db');
const Product   = require('./models/Product');
const User      = require('./models/User');
const Order     = require('./models/Order');

dotenv.config();
connectDB();

const sampleProducts = [
  {
    name: 'Kanjivaram Pure Silk Saree',
    description: 'Exquisite Kanjivaram pure silk saree with traditional zari border. Perfect for weddings and festive occasions. Each saree is handwoven by skilled artisans.',
    price: 8999,
    images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600'],
    category: 'Sarees',
    fabric: 'Pure Silk',
    color: 'Red',
    stock: 15,
    rating: 4.8,
    numReviews: 24,
    featured: true,
    discount: 10,
  },
  {
    name: 'Banarasi Georgette Saree',
    description: 'Elegant Banarasi georgette saree with intricate embroidery. Lightweight and comfortable for all-day wear.',
    price: 3499,
    images: ['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600'],
    category: 'Sarees',
    fabric: 'Georgette',
    color: 'Pink',
    stock: 20,
    rating: 4.5,
    numReviews: 18,
    featured: true,
    discount: 15,
  },
  {
    name: 'Designer Bridal Lehenga',
    description: 'Stunning bridal lehenga with heavy embroidery and mirror work. Comes with matching blouse and dupatta.',
    price: 24999,
    images: ['https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600'],
    category: 'Lehenga',
    fabric: 'Velvet',
    color: 'Maroon',
    stock: 5,
    rating: 4.9,
    numReviews: 12,
    featured: true,
    discount: 5,
  },
  {
    name: 'Cotton Anarkali Suit',
    description: 'Beautiful cotton anarkali suit with floral prints. Ideal for casual and office wear.',
    price: 1899,
    images: ['https://images.unsplash.com/photo-1594938298603-c8148c4b4468?w=600'],
    category: 'Suits',
    fabric: 'Cotton',
    color: 'Blue',
    stock: 30,
    rating: 4.3,
    numReviews: 35,
    featured: false,
    discount: 20,
  },
  {
    name: 'Chiffon Party Wear Saree',
    description: 'Glamorous chiffon saree with sequin border. Perfect for parties and evening events.',
    price: 2799,
    images: ['https://images.unsplash.com/photo-1609501676725-7186f017a4b7?w=600'],
    category: 'Sarees',
    fabric: 'Chiffon',
    color: 'Gold',
    stock: 12,
    rating: 4.6,
    numReviews: 28,
    featured: true,
    discount: 0,
  },
  {
    name: 'Silk Kurti with Palazzo',
    description: 'Trendy silk kurti paired with palazzo pants. Modern fusion of traditional and contemporary styles.',
    price: 1299,
    images: ['https://images.unsplash.com/photo-1605763240000-7e93b172d754?w=600'],
    category: 'Kurtis',
    fabric: 'Silk',
    color: 'Turquoise',
    stock: 25,
    rating: 4.4,
    numReviews: 42,
    featured: false,
    discount: 25,
  },
  {
    name: 'Chanderi Silk Saree',
    description: 'Graceful Chanderi silk saree with delicate prints. A must-have for every ethnic wardrobe.',
    price: 4599,
    images: ['https://images.unsplash.com/photo-1602614628304-2ae3d2b0a4ab?w=600'],
    category: 'Sarees',
    fabric: 'Chanderi Silk',
    color: 'Mint Green',
    stock: 18,
    rating: 4.7,
    numReviews: 15,
    featured: true,
    discount: 10,
  },
  {
    name: 'Embroidered Party Dress',
    description: 'Stylish embroidered dress perfect for festive occasions. Contemporary design with ethnic touch.',
    price: 2199,
    images: ['https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=600'],
    category: 'Dresses',
    fabric: 'Net',
    color: 'Purple',
    stock: 22,
    rating: 4.2,
    numReviews: 19,
    featured: false,
    discount: 15,
  },
];

const importData = async () => {
  try {
    await Order.deleteMany();
    await Product.deleteMany();
    await User.deleteMany();

    // Create admin user
const adminUser = await User.create({
  name:     'Admin Harshiddhi',
  email:    'admin@harshiddhi.com',
  password: 'Admin@123',
  role:     'admin',
});

    // Create test user
  await User.create({
  name:     'Test User',
  email:    'user@harshiddhi.com',
  password: 'User@123',
});

    await Product.insertMany(sampleProducts);

    console.log('✅ Data seeded successfully!');
    console.log('👤 Admin:    admin@harshiddhi.com / admin123');
    console.log('👤 Test User: user@harshiddhi.com  / user123');
    process.exit();
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

importData();
