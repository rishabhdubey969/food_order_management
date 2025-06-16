

// import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import * as nodemailer from 'nodemailer';
// import { OtpService } from '../otp/otp.service';

// @Injectable()
// export class EmailService {
//   private transporter;
//   private readonly logger = new Logger(EmailService.name); // Instantiate logger

//   constructor(
//     private configService: ConfigService,
//     private otpService: OtpService
//   ) {
//     try {
//       const emailService = this.configService.get<string>('email.service');
//       const userEmail = this.configService.get<string>('email.userEmail');
//       const userPass = this.configService.get<string>('email.userPass');

//       if (!emailService || !userEmail || !userPass) {
//         this.logger.error('Missing email configuration. Please check environment variables for email.service, email.userEmail, and email.userPass.');
//         throw new InternalServerErrorException('Email service configuration missing.');
//       }

//       this.transporter = nodemailer.createTransport({
//         service: emailService,
//         auth: {
//           user: userEmail,
//           pass: userPass
//         },
//       });
//       this.logger.log('Nodemailer transporter initialized successfully.');
//     } catch (error) {
//       this.logger.error(`Failed to initialize Nodemailer transporter: ${error.message}`, error.stack);
//       throw new InternalServerErrorException('Failed to initialize email service.');
//     }
//   }

//   async sendEmail(email: string): Promise<string> {
//     this.logger.log(`Attempting to send OTP email to: ${email}`);
//     let otp: string;

//       otp = await this.otpService.generateOtp(email);
//       this.logger.debug(`Generated OTP for ${email}: ${otp}`);

//     try {
//       await this.transporter.sendMail({
//         from: 'Foodify',
//         to: email,
//         subject: "OTP Verification",
//         text: "Your Foodify OTP to Verify: " + otp
//       });
//       this.logger.log(`OTP email sent successfully to: ${email}`);
//       return otp.toString();
//     } catch (error) {
//       this.logger.error(`Error sending email to ${email}: ${error.message}`, error.stack);
//       throw new InternalServerErrorException('Failed to send email. Please try again later.');
//     }
//   }
// }


import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { OtpService } from '../otp/otp.service';
import { EMAIL_CONSTANTS } from './emailConstants';


@Injectable()
export class EmailService {
  private transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly otpService: OtpService
  ) {
    try {
      const emailService = this.configService.get<string>(EMAIL_CONSTANTS.CONFIG.SERVICE_KEY);
      const userEmail = this.configService.get<string>(EMAIL_CONSTANTS.CONFIG.USER_EMAIL_KEY);
      const userPass = this.configService.get<string>(EMAIL_CONSTANTS.CONFIG.USER_PASS_KEY);

      if (!emailService || !userEmail || !userPass) {
        this.logger.error(EMAIL_CONSTANTS.MESSAGES.ERROR.MISSING_CONFIG);
        throw new InternalServerErrorException(EMAIL_CONSTANTS.MESSAGES.ERROR.TRANSPORTER_INIT_FAILED);
      }

      this.transporter = nodemailer.createTransport({
        service: emailService,
        auth: {
          user: userEmail,
          pass: userPass
        },
      });
      this.logger.log(EMAIL_CONSTANTS.MESSAGES.SUCCESS.TRANSPORTER_INITIALIZED);
    } catch (error) {
      this.logger.error(`${EMAIL_CONSTANTS.MESSAGES.ERROR.TRANSPORTER_INIT_FAILED}: ${error.message}`, error.stack);
      throw new InternalServerErrorException(EMAIL_CONSTANTS.MESSAGES.ERROR.TRANSPORTER_INIT_FAILED);
    }
  }

  async sendEmail(email: string): Promise<string> {
    this.logger.log(`Attempting to send OTP email to: ${email}`);
    let otp: string;

    otp = await this.otpService.generateOtp(email);
    this.logger.debug(`Generated OTP for ${email}: ${otp}`);

    try {
      await this.transporter.sendMail({
        from: EMAIL_CONSTANTS.EMAIL.SENDER_NAME,
        to: email,
        subject: EMAIL_CONSTANTS.EMAIL.OTP_SUBJECT,
        text: `${EMAIL_CONSTANTS.EMAIL.OTP_TEXT_PREFIX}${otp}`
      });
      this.logger.log(`${EMAIL_CONSTANTS.MESSAGES.SUCCESS.OTP_EMAIL_SENT}: ${email}`);
      return otp.toString();
    } catch (error) {
      this.logger.error(`Error sending email to ${email}: ${error.message}`, error.stack);
      throw new InternalServerErrorException(EMAIL_CONSTANTS.MESSAGES.ERROR.SEND_EMAIL_FAILED);
    }
  }
}