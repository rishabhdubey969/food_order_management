import * as nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
import { renderEmailTemplate } from '../utils/template.util';

dotenv.config();

var transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT),
    auth: {
        user: process.env.MAIL_USER_NAME,
        pass: process.env.MAIL_PASSWORD
    }
});

// This function sends an email using the configured transporter.
// It takes the recipient's email address, subject, name, template type, and an optional
export const sendMail = async (to: string, subject: string, name: string, template, otp: string|null) => {
  console.log('Sending email to:', template, otp);
  const info = await transporter.sendMail({
    from: '"foodApp" <foodapp@yopmail.com>', // sender address
    to, // recipient
    html: renderEmailTemplate(template, {
      name: to,
      otp: otp,
      year: new Date().getFullYear(),
      subject: subject,
    }),
  });

    console.log('Message sent: %s', info.messageId);
};