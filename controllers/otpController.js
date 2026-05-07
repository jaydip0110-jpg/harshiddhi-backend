const asyncHandler = require('express-async-handler');
const nodemailer   = require('nodemailer');
const axios        = require('axios');
const OTPModel     = require('../models/OTP');
const User         = require('../models/User');
const jwt          = require('jsonwebtoken');

// Generate 6-digit OTP
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// Generate JWT
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// ── Email Transporter ──
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ── Send SMS via Fast2SMS ──
const sendSMS = async (phone, otp) => {
  try {
    const response = await axios.post(
      'https://www.fast2sms.com/dev/bulkV2',
      {
        route:    'otp',
        variables_values: otp,
        numbers:  phone,
      },
      {
        headers: {
          authorization: process.env.FAST2SMS_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('✅ SMS sent:', response.data);
    return true;
  } catch (err) {
    console.error('❌ SMS error:', err.response?.data || err.message);
    return false;
  }
};

// ── Send Email OTP ──
const sendEmailOTP = async (email, otp) => {
  await transporter.sendMail({
    from:    `"Harshiddhi Fashion 🌸" <${process.env.EMAIL_USER}>`,
    to:      email,
    subject: `${otp} - OTP for Harshiddhi Saari & Dresses`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:450px;margin:0 auto;
                  border-radius:16px;overflow:hidden;border:1px solid #fce4ec;">
        <div style="background:linear-gradient(135deg,#C2185B,#e91e8c);
                    padding:24px;text-align:center;">
          <h1 style="color:white;margin:0;font-size:24px;">Harshiddhi 🌸</h1>
          <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:13px;">
            Saari & Dresses
          </p>
        </div>
        <div style="padding:30px;background:#fff;">
          <p style="color:#555;font-size:15px;margin:0 0 20px;">
            Your One-Time Password (OTP) for login:
          </p>
          <div style="background:#fff8f0;border:2px dashed #C2185B;
                      border-radius:12px;padding:24px;text-align:center;">
            <p style="margin:0;font-size:42px;font-weight:bold;
                      color:#C2185B;letter-spacing:12px;">
              ${otp}
            </p>
          </div>
          <p style="color:#999;font-size:12px;margin:20px 0 0;text-align:center;">
            ⏱️ This OTP expires in <strong>5 minutes</strong><br/>
            🔒 Do not share this OTP with anyone
          </p>
        </div>
        <div style="background:#fff8f0;padding:16px;text-align:center;">
          <p style="color:#C2185B;margin:0;font-size:12px;">
            © Harshiddhi Saari & Dresses
          </p>
        </div>
      </div>
    `,
  });
};

// @desc  Send OTP
// @route POST /api/otp/send
const sendOTP = asyncHandler(async (req, res) => {
  const { identifier } = req.body;

  if (!identifier) {
    res.status(400);
    throw new Error('Email અથવા Phone number જરૂરી છે');
  }

  const isPhone = /^[0-9]{10}$/.test(identifier);
  const isEmail = identifier.includes('@');

  if (!isPhone && !isEmail) {
    res.status(400);
    throw new Error('Valid email અથવા 10-digit phone number નાખો');
  }

  // Generate OTP
  const otp       = generateOTP();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

  // Delete old OTPs
  await OTPModel.deleteMany({ identifier });

  // Save new OTP
  await OTPModel.create({ identifier, otp, expiresAt });

  if (isEmail) {
    // ── Email OTP ──
    try {
      await sendEmailOTP(identifier, otp);
      console.log(`✅ Email OTP sent to: ${identifier}`);
      res.json({
        success: true,
        message: `OTP sent to ${identifier}`,
        type:    'email',
      });
    } catch (err) {
      console.error('Email error:', err.message);
      res.status(500);
      throw new Error('Email send failed. Check EMAIL_USER and EMAIL_PASS in .env');
    }

  } else {
    // ── SMS OTP ──
    const smsSent = await sendSMS(identifier, otp);

    if (smsSent) {
      res.json({
        success: true,
        message: `OTP sent to +91 ${identifier}`,
        type:    'phone',
      });
    } else {
      // Dev mode — return OTP in response
      if (process.env.NODE_ENV === 'development') {
        console.log(`📱 Dev OTP for ${identifier}: ${otp}`);
        res.json({
          success:    true,
          message:    `Dev mode: OTP is ${otp}`,
          type:       'phone',
          devOtp:     otp,
        });
      } else {
        res.status(500);
        throw new Error('SMS send failed. Check FAST2SMS_API_KEY in .env');
      }
    }
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
  }).sort({ createdAt: -1 });

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

  // Check OTP match
  if (otpDoc.otp !== otp.toString().trim()) {
    res.status(400);
    throw new Error('Invalid OTP. Please try again.');
  }

  // Mark as verified
  otpDoc.verified = true;
  await otpDoc.save();

  // Find or Create User
  const isPhone = /^[0-9]{10}$/.test(identifier);
  const email   = isPhone
    ? `${identifier}@harshiddhi.com`
    : identifier.toLowerCase();

  let user = await User.findOne({ email });

  if (!user) {
    // New user create
    const name = isPhone
      ? `User${identifier.slice(-4)}`
      : identifier.split('@')[0];

    user = await User.create({
      name,
      email,
      password: `OTP_${otp}_${Date.now()}_${process.env.JWT_SECRET}`,
      phone:    isPhone ? identifier : '',
    });
  }

  res.json({
    _id:   user._id,
    name:  user.name,
    email: user.email,
    role:  user.role,
    token: generateToken(user._id),
  });
});

module.exports = { sendOTP, verifyOTP };