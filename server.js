const express = require('express');
const cors    = require('cors');
const dotenv  = require('dotenv');
const path    = require('path');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

// CORS — બધા devices allow કરો
app.use(cors({
  origin:      '*',
  methods:     ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/users',    require('./routes/userRoutes'));
app.use('/api/orders',   require('./routes/orderRoutes'));
app.use('/api/upload',   require('./routes/uploadRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));

app.get('/', (req, res) => {
  res.json({ message: '🌸 Harshiddhi API is running' });
});

// Error handler
app.use((err, req, res, next) => {
  const status = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(status).json({ message: err.message });
});

const PORT = process.env.PORT || 5000;

// 0.0.0.0 — બધા devices connect કરી શકે
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌸 Harshiddhi server running on port ${PORT}`);
});