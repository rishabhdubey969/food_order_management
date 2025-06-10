import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  private transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'your-email@gmail.com',
      pass: 'your-app-password', // 2FA
    },
  });

  async sendEmail(to: string, subject: string, html: string) {
    try {
      await this.transporter.sendMail({
        from: 'your-email@gmail.com',
        to,
        subject,
        html,
      });
    } catch (err) {
      console.error('Failed to send email:', err);
      throw new InternalServerErrorException('Email failed to send');
    }
  }
}
