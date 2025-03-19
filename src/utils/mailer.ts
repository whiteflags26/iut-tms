import nodemailer from 'nodemailer';

interface MailOptions {
    from: string;
    to: string;
    subject: string;
    text: string;
}

// Create a transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
        user: process.env.EMAIL_USER, // email address
        pass: process.env.EMAIL_PASS, // email password
    },
});

// Function to send an email
export const sendEmail = async (to: string, subject: string, text: string): Promise<void> => {
    if (process.env.EMAIL_USER === undefined || process.env.EMAIL_PASS === undefined) {
        throw new Error('Email credentials not provided');
    }

    const mailOptions: MailOptions = {
        from: process.env.EMAIL_USER, // Sender address
        to, // List of recipients
        subject, // Subject line
        text, // Plain text body
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
    } catch (error) {
        console.error('Error sending email: ', error);
        throw error;
    }
};