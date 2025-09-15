// app.js - Main backend file
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Rate limiting - prevent spam submissions
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many submissions from this IP, please try again later.'
});

app.use('/submit-form', limiter);

// Configure email transporter
const transporter = nodemailer.createTransporter({
  service: 'gmail', // You can use other services like Outlook, Yahoo etc.
  auth: {
    user: process.env.EMAIL_USER, // Your email
    pass: process.env.EMAIL_PASS  // Your app password
  }
});

// Validation function
const validateFormData = (data) => {
  const { name, email, phone, subject } = data;

  if (!name || name.trim().length < 2) {
    return { valid: false, message: 'Name must be at least 2 characters long' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return { valid: false, message: 'Please provide a valid email address' };
  }

  const phoneRegex = /^[0-9+\-\s()]{10,15}$/;
  if (!phone || !phoneRegex.test(phone)) {
    return { valid: false, message: 'Please provide a valid phone number' };
  }

  if (!subject || subject.trim().length < 1) {
    return { valid: false, message: 'Please select a subject' };
  }

  return { valid: true };
};

// Main form submission endpoint
app.post('/submit-form', async (req, res) => {
  try {
    const { name, email, phone, subject } = req.body;

    // Validate form data
    const validation = validateFormData(req.body);
    if (!validation.valid) {
      return res.status(400).json({ 
        success: false, 
        message: validation.message 
      });
    }

    // Prepare email content
    const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333; border-bottom: 2px solid #00bcd4; padding-bottom: 10px;">
        New Contact Form Submission - Digital Marketing
      </h2>

      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="color: #555; margin-top: 0;">Contact Details:</h3>

        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Subject:</strong> ${subject}</p>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">

        <p style="color: #666; font-size: 12px;">
          <strong>Submission Time:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
        </p>
        <p style="color: #666; font-size: 12px;">
          <strong>IP Address:</strong> ${req.ip || 'Unknown'}
        </p>
      </div>

      <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; border-left: 4px solid #4caf50;">
        <p style="margin: 0; color: #2e7d32;">
          <strong>Action Required:</strong> Please respond to this inquiry within 24 hours.
        </p>
      </div>
    </div>
    `;

    // Email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.RECIPIENT_EMAIL || process.env.EMAIL_USER, // Your email where you want to receive submissions
      subject: New Contact Form: ${subject} - from ${name},
      html: emailContent,
      replyTo: email // This allows you to reply directly to the person who submitted
    };

    // Send email
    await transporter.sendMail(mailOptions);

    // Success response
    res.status(200).json({
      success: true,
      message: 'Form submitted successfully! We will contact you soon.'
    });

    console.log(New form submission from ${name} (${email}) at ${new Date().toISOString()});

  } catch (error) {
    console.error('Error processing form submission:', error);
    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again later.'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Contact form backend is running',
    timestamp: new Date().toISOString()
  });
});

// Handle 404 for other routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(Contact form backend running on port ${PORT});
  console.log(Health check: http://localhost:${PORT}/health);
  console.log(Form endpoint: http://localhost:${PORT}/submit-form);
});

module.exports = app;