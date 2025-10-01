import express from 'express';
import nodemailer from 'nodemailer';
const router = express.Router();

router.post('/contact', async (req, res) => {
    const { name, email, phone, service, message } = req.body;

    if (!name || !email || !service || !message) {
        return res.status(400).json({ message: 'Please fill in all required fields.' });
    }

    try {
        // Afrihost SMTP transporter
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'mail.eme4you.co.za',
            port: 465, // SSL
            secure: true,
            auth: {
                user: process.env.EMAIL_USER, // info@eme4you.co.za
                pass: process.env.EMAIL_PASS
            },
            tls: {
                rejectUnauthorized: false
            },
            connectionTimeout: 10000
        });

        // 1️⃣ Email to EME team
        await transporter.sendMail({
            from: `"Website Contact" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER, // send to info@eme4you.co.za
            replyTo: email, // user's email
            subject: `New Contact Form Message: ${name}`,
            html: `<p><strong>Name:</strong> ${name}</p>
                   <p><strong>Email:</strong> ${email}</p>
                   <p><strong>Phone:</strong> ${phone}</p>
                   <p><strong>Service:</strong> ${service}</p>
                   <p><strong>Message:</strong> ${message}</p>`
        });

        // 2️⃣ Email confirmation to user
        await transporter.sendMail({
            from: `"EME Support" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `We Received Your Message`,
            html: `<p>Hi ${name},</p>
                   <p>Thank you for contacting EME! We have received your message regarding "${service}". Our team will get back to you shortly.</p>
                   <p>Best regards,<br/>EME Team</p>`
        });

        res.status(200).json({ success: true, message: 'Message sent successfully!' });

    } catch (error) {
        console.error('Error sending emails:', error);
        res.status(500).json({ success: false, message: 'Error sending message. Please try again later.' });
    }
});

export default router;
