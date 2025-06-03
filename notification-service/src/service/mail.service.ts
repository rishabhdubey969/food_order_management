import * as nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
dotenv.config();

var transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT),
    auth: {
        user: process.env.MAIL_USER_NAME,
        pass: process.env.MAIL_PASSWORD
    }
});

console.log(process.env.MAIL_HOST);
export const sendMail = async (to: string, subject: string, text: string) => {
    const info = await transporter.sendMail({
        from: '"OTP" <rishabh@yopmail.com>', // sender address
        to, // recipient
        subject, // Subject line
        text, // plain text body
    });

    console.log('Message sent: %s', info.messageId);
};