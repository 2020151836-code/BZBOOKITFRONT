
import express, { Request, Response } from 'express';
import * as dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import nodemailer from 'nodemailer';
import cors from 'cors';

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = 3001;

// Middleware to parse JSON bodies
app.use(express.json());

// Enable CORS for all routes
app.use(cors());

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/**
 * Endpoint to generate content using Gemini AI.
 * Expects a POST request with a JSON body containing a 'prompt'.
 * @route POST /gemini
 */
app.post('/gemini', async (req: Request, res: Response) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).send('Prompt is required');
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = await response.text();

        res.status(200).send({ content: text });
    } catch (error) {
        console.error('Error generating content with Gemini:', error);
        res.status(500).send('Error generating content with Gemini');
    }
});

/**
 * Endpoint to send an email.
 * Expects a POST request with a JSON body containing 'to', 'subject', and 'message'.
 * @route POST /send-email
 */
app.post('/send-email', async (req: Request, res: Response) => {
    try {
        const { to, subject, message } = req.body;
        if (!to || !subject || !message) {
            return res.status(400).send('To, subject, and message are required');
        }

        // Create a Nodemailer transporter using SMTP
        // Replace with your actual email service provider's configuration
        const transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            auth: {
                user: 'maddison53@ethereal.email',
                pass: 'jn7jnAPss4f63QBp6D'
            }
        });

        // Email options
        const mailOptions = {
            from: `"${process.env.BUSINESS_NAME}" <no-reply@example.com>`,
            to,
            subject,
            text: message,
            html: `<p>${message}</p><p>--<br>${process.env.BUSINESS_NAME}</p>`,
        };

        // Send the email
        await transporter.sendMail(mailOptions);
        res.status(200).send('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).send('Error sending email');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Notification server listening at http://localhost:${port}`);
});
