import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { OtpService } from '../otp/otp.service';

@Injectable()
export class EmailService {
  private transporter;

  constructor(
    private configService: ConfigService,
    private otpService: OtpService
  ) {
    
    this.transporter = nodemailer.createTransport({
      service: this.configService.get<string>('email.service'),
      auth: {
        user: this.configService.get<string>('email.userEmail'),
        pass: this.configService.get<string>('email.userPass')
      },
    });

  }

  async sendEmail(email: string) {

    const otp = await this.otpService.generateOtp(email);

    try {
      await this.transporter.sendMail({
        from: 'Foodify',
        to: email,
        subject: "OTP Verification",
        text: "OTP to Verify : "  + otp
      });
      return otp.toString();
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send email');
    }
  }
}