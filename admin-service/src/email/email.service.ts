

import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';


@Injectable()
export class EmailService {
  private transporter;
  private readonly logger = new Logger(EmailService.name); // Instantiate logger

  constructor(
  ) {
    try {
      const emailService = 'gmail'
      const userEmail =  process.env.SMTP_USER
      const userPass = process.env.SMTP_PASS

      if (!emailService || !userEmail || !userPass) {
        this.logger.error('Missing email configuration. Please check environment variables for email.service, email.userEmail, and email.userPass.');
        throw new InternalServerErrorException('Email service configuration missing.');
      }

      this.transporter = nodemailer.createTransport({
        service: emailService,
        auth: {
          user: userEmail,
          pass: userPass
        },
      });
      this.logger.log('Nodemailer transporter initialized successfully.');
    } catch (error) {
      this.logger.error(`Failed to initialize Nodemailer transporter: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to initialize email service.');
    }
  }

  async sendEmail(email: string, subject: string, text: any) {
    this.logger.log(`Attempting to send OTP email to: ${email}`);
    try {
      await this.transporter.sendMail({
        from: 'Foodify',
        to: email,
        subject: subject,
        text: text
      });
      this.logger.log(`email sent successfully to: ${email}`);
    } catch (error) {
      this.logger.error(`Error sending email to ${email}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to send email. Please try again later.');
    }
  }
}