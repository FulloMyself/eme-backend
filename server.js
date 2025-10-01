// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ---------------------------
// Middleware
// ---------------------------
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------------------------
// CORS Configuration
// ---------------------------
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://127.0.0.1:5500",
  "http://localhost:5500",
];
app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "OPTIONS"],
  })
);

// ---------------------------
// Rate Limiter
// ---------------------------
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // max 5 requests per IP per window
  message: { success: false, message: "Too many requests. Please try again later." },
});
app.use("/api/contact", limiter);

// ---------------------------
// Contact API
// ---------------------------
app.post("/api/contact", async (req, res) => {
  const { name, email, phone, service, message } = req.body;

  if (!name || !email || !service || !message) {
    return res
      .status(400)
      .json({ success: false, message: "Please fill all required fields." });
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.SMTP_HOST) {
    return res
      .status(500)
      .json({ success: false, message: "Email server not configured properly." });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Email to company
    const companyMailOptions = {
      from: `"EME Website" <${process.env.SMTP_USER}>`,
      to: process.env.COMPANY_EMAIL || "info@eme4you.co.za",
      subject: `New Contact Form Submission from ${name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || "N/A"}</p>
        <p><strong>Service:</strong> ${service}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    };

    // Email to user
    const userMailOptions = {
      from: `"EME Website" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Thank you for contacting EME, ${name}`,
      html: `
        <h2>Thank you for reaching out!</h2>
        <p>Dear ${name},</p>
        <p>We have received your message regarding "<strong>${service}</strong>". Our team will get back to you shortly.</p>
        <p>Here’s a copy of your message:</p>
        <blockquote>${message}</blockquote>
        <p>— EME Team</p>
      `,
    };

    // Send both emails concurrently
    await Promise.all([transporter.sendMail(companyMailOptions), transporter.sendMail(userMailOptions)]);

    return res.json({ success: true, message: "Your message has been sent successfully!" });
  } catch (error) {
    console.error("Error sending emails:", error);
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong. Please try again later." });
  }
});

// ---------------------------
// Health Check
// ---------------------------
app.get("/", (req, res) => {
  res.send("EME Backend is running!");
});

// ---------------------------
// Start Server
// ---------------------------
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
