import * as nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
<<<<<<< Updated upstream
=======
import { renderEmailTemplate } from '../utils/template.util';
import { renderEmailTemplate as template } from '../interface/template-interface';

>>>>>>> Stashed changes
dotenv.config();

var transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT),
    auth: {
        user: process.env.MAIL_USER_NAME,
        pass: process.env.MAIL_PASSWORD
    }
});

<<<<<<< Updated upstream
console.log(process.env.MAIL_HOST);
export const sendMail = async (to: string, subject: string, text: string) => {
    const info = await transporter.sendMail({
        from: '"OTP" <rishabh@yopmail.com>', // sender address
        to, // recipient
        subject, // Subject line
        text, // plain text body
    });
=======
export const sendMail = async (to: string, subject: string, name: string, template, otp: string|null) => {
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
>>>>>>> Stashed changes

    console.log('Message sent: %s', info.messageId);
};