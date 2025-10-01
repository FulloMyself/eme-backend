import express from 'express';
import nodemailer from 'nodemailer';
const router = express.Router();

router.post('/contact', async (req, res) => {
    const { name, email, phone, service, message } = req.body;

    // Validate required fields
    if (!name || !email || !service || !message) {
        return res.status(400).json({ 
            success: false, 
            message: 'Please fill in all required fields.' 
        });
    }

    try {
        // Configure Afrihost SMTP transporter
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'mail.eme4you.co.za', 
            port: 465, // SSL port
            secure: true, // true for SSL
            auth: {
                user: process.env.EMAIL_USER, // info@eme4you.co.za
                pass: process.env.EMAIL_PASS
            },
            tls: {
                rejectUnauthorized: false // allow self-signed certificates
            },
            logger: true, // log SMTP connection info
            debug: true,  // show debug info in console
            connectionTimeout: 20000 // 20s timeout
        });

        // 1️⃣ Send email to EME team
        const teamMailOptions = {
            from: `"Website Contact" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER, 
            replyTo: email, // visitor's email
            subject: `New Contact Form Message: ${name}`,
            html: `<p><strong>Name:</strong> ${name}</p>
                   <p><strong>Email:</strong> ${email}</p>
                   <p><strong>Phone:</strong> ${phone}</p>
                   <p><strong>Service:</strong> ${service}</p>
                   <p><strong>Message:</strong> ${message}</p>`
        };

        await transporter.sendMail(teamMailOptions);

        // 2️⃣ Send confirmation email to visitor
        const visitorMailOptions = {
            from: `"EME Support" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `We Received Your Message`,
            html: `<p>Hi ${name},</p>
                   <p>Thank you for contacting EME! We have received your message regarding "${service}". Our team will get back to you shortly.</p>
                   <p>Best regards,<br/>EME Team</p>`
        };

        await transporter.sendMail(visitorMailOptions);

        res.status(200).json({ 
            success: true, 
            message: 'Message sent successfully!' 
        });

    } catch (error) {
        console.error('Error sending emails:', error);

        // Provide detailed info for debugging (optional)
        const smtpError = error.response || error.message || 'Unknown SMTP error';

        res.status(500).json({
            success: false,
            message: `Email server not configured properly. Please check SMTP_HOST, EMAIL_USER, and EMAIL_PASS. Details: ${smtpError}`
        });
    }
});

export default router;
