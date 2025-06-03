import * as nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
import { renderEmailTemplate } from '../utils/template.util';
import { renderEmailTemplate as template } from '../interface/template-interface';

dotenv.config();

var transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT),
    auth: {
        user: process.env.MAIL_USER_NAME,
        pass: process.env.MAIL_PASSWORD
    }
});

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

    console.log('Message sent: %s', info.messageId);
};