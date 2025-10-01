// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Contact API
app.post("/api/contact", async (req, res) => {
  const { name, email, phone, service, message } = req.body;

  if (!name || !email ||!phone || !message || !service) {
    return res.status(400).json({ success: false, message: "Please fill all required fields." });
  }

  try {
    // Nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Email to company
    const companyMailOptions = {
      from: `"EME Website" <${process.env.SMTP_USER}>`,
      to: process.env.COMPANY_EMAIL, // e.g., info@eme4you.co.za
      subject: `New Contact Form Submission: ${name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || "N/A"}</p>
        <p><strong>Service:</strong> ${service}</p>
        <p><strong>Message:</strong> ${message}</p>
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
        <p>We have received your message regarding "${service}". Our team will get back to you shortly.</p>
        <p>Here’s a copy of your message:</p>
        <blockquote>${message}</blockquote>
        <p>— EME Team</p>
      `,
    };

    // Send emails
    await transporter.sendMail(companyMailOptions);
    await transporter.sendMail(userMailOptions);

    res.json({ success: true, message: "Your message has been sent successfully!" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ success: false, message: "Something went wrong. Please try again later." });
  }
});

// Health check endpoint
app.get("/", (req, res) => {
  res.send("EME Backend is running!");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
