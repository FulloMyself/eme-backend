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
// CORS
// ---------------------------
const allowedOrigins = [process.env.FRONTEND_URL || "http://127.0.0.1:5500"];
app.use(cors({ origin: allowedOrigins, methods: ["GET", "POST", "OPTIONS"] }));

// ---------------------------
// Rate Limiter
// ---------------------------
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: { success: false, message: "Too many requests. Try again later." },
});

// ---------------------------
// Nodemailer transporter
// ---------------------------
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 465,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.COMPANY_EMAIL,
    pass: process.env.EMAIL_PASS,
  },
  tls: { rejectUnauthorized: false },
});

// ---------------------------
// Contact API
// ---------------------------
app.post("/api/contact", limiter, async (req, res) => {
  const { name, email, phone, service, message } = req.body;

  if (!name || !email || !service || !message) {
    return res.status(400).json({ success: false, message: "Please fill in all required fields." });
  }

  try {
    // 1️⃣ Email to EME team
    const teamMailOptions = {
      from: `"EME Website" <${process.env.COMPANY_EMAIL}>`,
      to: ["info@eme4you.co.za", "wandile@eme4you.co.za"],
      replyTo: email,
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

    // 2️⃣ Confirmation email to visitor
    const visitorMailOptions = {
      from: `"EME Support" <${process.env.COMPANY_EMAIL}>`,
      to: email,
      subject: `We Received Your Message`,
      html: `
        <h2>Thank you for contacting EME!</h2>
        <p>Hi ${name},</p>
        <p>We have received your message regarding "<strong>${service}</strong>".</p>
        <p>Our team will get back to you shortly.</p>
        <blockquote>${message}</blockquote>
        <p>— EME Team</p>
      `,
    };

    // Send both emails concurrently
    await Promise.all([transporter.sendMail(teamMailOptions), transporter.sendMail(visitorMailOptions)]);

    return res.json({ success: true, message: "Your message has been sent successfully!" });
  } catch (error) {
    console.error("Error sending emails:", error);
    return res.status(500).json({ success: false, message: "Failed to send emails. Try again later." });
  }
});

// ---------------------------
// Health Check
// ---------------------------
app.get("/", (req, res) => res.send("EME Backend is running!"));

// ---------------------------
// Start Server
// ---------------------------
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
