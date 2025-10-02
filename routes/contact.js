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
        // --- Create SMTP transporter using COMPANY_EMAIL for auth ---
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'mail.eme4you.co.za',
            port: process.env.SMTP_PORT || 587,   // default STARTTLS
            secure: process.env.SMTP_SECURE === 'true', 
            auth: {
                user: process.env.COMPANY_EMAIL,   // login = company email
                pass: process.env.EMAIL_PASS       // password for company email
            },
            tls: { rejectUnauthorized: false },
            connectionTimeout: 20000,
            logger: true,
            debug: true
        });

        // 1️⃣ Email to EME team
        const teamMailOptions = {
            from: `"Website Contact" <${process.env.COMPANY_EMAIL}>`,
            to: [process.env.COMPANY_EMAIL, "wandile@eme4you.co.za"], 
            replyTo: email, // visitor's email so you can just hit reply
            subject: `New Contact Form Message: ${name}`,
            html: `
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Phone:</strong> ${phone}</p>
                <p><strong>Service:</strong> ${service}</p>
                <p><strong>Message:</strong> ${message}</p>
            `
        };

        await transporter.sendMail(teamMailOptions);

        // 2️⃣ Confirmation email to visitor
        const visitorMailOptions = {
            from: `"EME Support" <${process.env.COMPANY_EMAIL}>`,
            to: email,
            subject: `We Received Your Message`,
            html: `
                <p>Hi ${name},</p>
                <p>Thank you for contacting <strong>Established Media and Enterprises</strong>! 
                We have received your message regarding "<em>${service}</em>".</p>
                <p>Our team will get back to you shortly.</p>
                <p>Best regards,<br/>EME Team</p>
            `
        };

        await transporter.sendMail(visitorMailOptions);

        res.status(200).json({ 
            success: true, 
            message: 'Message sent successfully!' 
        });

    } catch (error) {
        console.error('Error sending emails:', error);
        res.status(500).json({
            success: false,
            message: `Email server not configured properly. Details: ${error.message || error}`
        });
    }
});

export default router;
