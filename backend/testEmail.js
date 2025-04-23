require('dotenv').config();
const nodemailer = require('nodemailer');

// Create a transporter
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    tls: {
        rejectUnauthorized: false,
    },
    connectionTimeout: 10000,  // 10 seconds
    logger: true,
    debug: true
});

// Define the email options
const mailOptions = {
    from: process.env.SMTP_USER,
    to: "stephen.amokoh@gmail.com", // Replace with your own email to receive the test email
    subject: "Testing Nodemailer",
    text: "This is a test email sent from your server."
};

// Send the email
transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        console.log("Error:", error);
    } else {
        console.log("Email sent successfully:", info.response);
    }
});
