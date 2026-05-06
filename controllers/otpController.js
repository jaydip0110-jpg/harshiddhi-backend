const asyncHandler = require('express-async-handler');
const nodemailer   = require('nodemailer');
const OTPModel     = require('../models/OTP');
const User         = require('../models/User');
const jwt          = require('jsonwebtoken');

// Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Generate JWT
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// @desc  Send OTP
// @route POST /api/otp/send
const sendOTP = asyncHandler(async (req, res) => {
  const { identifier } = req.body; // email or phone

  if (!identifier) {
    res.status(400);
    throw new Error('Email અથવા Phone number જરૂરી છે');
  }

  // Generate OTP
  const otp       = generateOTP();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  // Delete old OTP
  await OTPModel.deleteMany({ identifier });

  // Save new OTP
  await OTPModel.create({ identifier, otp, expiresAt });

  const isEmail = identifier.includes('@');

  if (isEmail) {
    // Send Email OTP
    await transporter.sendMail({
      from:    `"Harshiddhi Fashion 🌸" <${process.env.EMAIL_USER}>`,
      to:      identifier,
      subject: 'Your OTP - Harshiddhi Saari & Dresses',
      html: `
        <div style="font-family: Arial; max-width: 400px; margin: 0 auto;
                    border: 1px solid #fce4ec; border-radius: 16px; padding: 30px;">
          <h2 style="color: #C2185B; text-align: center;">Harshiddhi 🌸</h2>
          <p style="color: #666; text-align: center;">Your OTP for login:</p>
          <div style="background: #C2185B; color: white; font-size: 36px;
                      font-weight: bold; text-align: center; padding: 20px;
                      border-radius: 12px; letter-spacing: 8px; margin: 20px 0;">
            ${otp}
          </div>
          <p style="color: #999; text-align: center; font-size: 13px;">
            This OTP expires in <strong>5 minutes</strong>.<br/>
            Do not share this with anyone.
          </p>
        </div>
      `,
    });

    console.log(`✅ OTP sent to email: ${identifier}`);
    res.json({ message: 'OTP sent to email', type: 'email' });

  } else {
    // Phone — Console માં print (Twilio integration માટે)
    console.log(`📱 OTP for ${identifier}: ${otp}`);

    // Development: OTP directly return
    if (process.env.NODE_ENV === 'development') {
      return res.json({
        message: 'OTP sent (dev mode)',
        type: 'phone',
        otp,  // Dev mode only — production માં remove
      });
    }

    res.json({ message: 'OTP sent to phone', type: 'phone' });
  }
});

// @desc  Verify OTP
// @route POST /api/otp/verify
const verifyOTP = asyncHandler(async (req, res) => {
  const { identifier, otp } = req.body;

  if (!identifier || !otp) {
    res.status(400);
    throw new Error('Identifier and OTP required');
  }

  // Find OTP
  const otpDoc = await OTPModel.findOne({
    identifier,
    verified: false,
  });

  if (!otpDoc) {
    res.status(400);
    throw new Error('OTP not found. Please request a new one.');
  }

  // Check expiry
  if (new Date() > otpDoc.expiresAt) {
    await OTPModel.deleteOne({ _id: otpDoc._id });
    res.status(400);
    throw new Error('OTP expired. Please request a new one.');
  }

  // Check OTP
  if (otpDoc.otp !== otp.toString()) {
    res.status(400);
    throw new Error('Invalid OTP. Please try again.');
  }

  // Mark verified
  otpDoc.verified = true;
  await otpDoc.save();

  // Find or create user
  const isEmail = identifier.includes('@');
  const email   = isEmail ? identifier : `${identifier}@harshiddhi.com`;

  let user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    // New user — create
    const name = isEmail
      ? identifier.split('@')[0]
      : `User${identifier.slice(-4)}`;

    user = await User.create({
      name,
      email:    email.toLowerCase(),
      password: otp + process.env.JWT_SECRET + Date.now(),
      phone:    isEmail ? '' : identifier,
    });
  }

  // Return user with token
  res.json({
    _id:   user._id,
    name:  user.name,
    email: user.email,
    role:  user.role,
    token: generateToken(user._id),
    message: 'OTP verified successfully',
  });
});

module.exports = { sendOTP, verifyOTP };