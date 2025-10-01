import express from 'express';
import nodemailer from 'nodemailer';
const router = express.Router();

router.post('/contact', async (req, res) => {
    const { name, email, phone, service, message } = req.body;

    if (!name || !email || !service || !message) {
        return res.status(400).json({ message: 'Please fill in all required fields.' });
    }

    try {
        // Configure transporter (example using Gmail SMTP)
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Email to company
        await transporter.sendMail({
            from: `"Website Contact" <${process.env.EMAIL_USER}>`,
            to: 'info@eme4you.co.za',
            subject: `New Contact Form Message: ${name}`,
            html: `<p><strong>Name:</strong> ${name}</p>
                   <p><strong>Email:</strong> ${email}</p>
                   <p><strong>Phone:</strong> ${phone}</p>
                   <p><strong>Service:</strong> ${service}</p>
                   <p><strong>Message:</strong> ${message}</p>`
        });

        // Email to user (confirmation)
        await transporter.sendMail({
            from: `"EME Support" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `We Received Your Message`,
            html: `<p>Hi ${name},</p>
                   <p>Thank you for contacting EME! We have received your message regarding "${service}". Our team will get back to you shortly.</p>
                   <p>Best regards,<br/>EME Team</p>`
        });

        res.status(200).json({ message: 'Message sent successfully!' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error sending message.' });
    }
});

export default router;
