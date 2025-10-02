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

app.set("trust proxy", 1);
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Allow frontend origins
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

// Limit abuse
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { success: false, message: "Too many requests. Please try again later." },
});
app.use("/api/contact", limiter);

// Contact API
app.post("/api/contact", async (req, res) => {
  const { name, email, phone, service, message } = req.body;

  if (!name || !email || !service || !message) {
    return res.status(400).json({ success: false, message: "Please fill all required fields." });
  }

  try {
    // Auth account = Afrihost mailbox (EME’s SMTP)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 465,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.COMPANY_EMAIL,   // EME authenticated sender
        pass: process.env.EMAIL_PASS,      // password from Afrihost
      },
      tls: { rejectUnauthorized: false },
    });

    // 1️⃣ Send email to EME team
    await transporter.sendMail({
      from: `"EME Website" <${process.env.COMPANY_EMAIL}>`,
      to: ["info@eme4you.co.za", "wandile@eme4you.co.za"],
      replyTo: email, // visitor's email
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
    });

    // 2️⃣ Send confirmation to visitor
    await transporter.sendMail({
      from: `"EME Support" <${process.env.COMPANY_EMAIL}>`,
      to: email,
      subject: `Thank you for contacting EME, ${name}`,
      html: `
        <h2>Thank you for reaching out!</h2>
        <p>Dear ${name},</p>
        <p>We have received your message regarding "<strong>${service}</strong>".</p>
        <p>Our team will get back to you shortly.</p>
        <blockquote>${message}</blockquote>
        <p>— EME Team</p>
      `,
    });

    return res.json({ success: true, message: "Your message has been sent successfully!" });
  } catch (error) {
    console.error("Error sending emails:", error);
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong. Please try again later." });
  }
});

// Health Check
app.get("/", (req, res) => {
  res.send("EME Backend is running!");
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
