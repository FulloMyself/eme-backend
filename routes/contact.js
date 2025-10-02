// routes/contact.js
import express from "express";
import nodemailer from "nodemailer";
const router = express.Router();

router.post("/contact", async (req, res) => {
  const { name, email, phone, service, message } = req.body;

  // Validate required fields
  if (!name || !email || !phone || !service || !message) {
    return res.status(400).json({
      success: false,
      message: "Please fill in all required fields.",
    });
  }

  // Check that SMTP env variables exist
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return res.status(500).json({
      success: false,
      message: "Email server not configured properly.",
    });
  }

  try {
    // Configure Nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,        // mail.eme4you.co.za
      port: Number(process.env.SMTP_PORT) || 465,
      secure: process.env.SMTP_SECURE === "true", // SSL
      auth: {
        user: process.env.SMTP_USER,      // info@eme4you.co.za
        pass: process.env.SMTP_PASS,
      },
      tls: { rejectUnauthorized: false }, // allow self-signed
    });

    // 1️⃣ Email to EME team
    const teamMailOptions = {
      from: `"EME Website" <${process.env.SMTP_USER}>`, // must match authenticated user
      to: process.env.COMPANY_EMAIL || "info@eme4you.co.za",
      replyTo: email, // visitor's email for direct reply
      subject: `New Contact Form Message from ${name}`,
      html: `<h2>New Contact Form Submission</h2>
             <p><strong>Name:</strong> ${name}</p>
             <p><strong>Email:</strong> ${email}</p>
             <p><strong>Phone:</strong> ${phone || "N/A"}</p>
             <p><strong>Service:</strong> ${service}</p>
             <p><strong>Message:</strong></p>
             <p>${message}</p>`,
    };

    // 2️⃣ Confirmation email to visitor
    const visitorMailOptions = {
      from: `"EME Website" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `We Received Your Message`,
      html: `<p>Hi ${name},</p>
             <p>Thank you for contacting EME! We have received your message regarding "<strong>${service}</strong>". Our team will get back to you shortly.</p>
             <p>Here’s a copy of your message:</p>
             <blockquote>${message}</blockquote>
             <p>— EME Team</p>`,
    };

    // Send both emails concurrently
    await Promise.all([
      transporter.sendMail(teamMailOptions),
      transporter.sendMail(visitorMailOptions),
    ]);

    return res.json({
      success: true,
      message: "Your message has been sent successfully!",
    });
  } catch (error) {
    console.error("Error sending emails:", error);
    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while sending emails. Please try again later.",
    });
  }
});

export default router;
