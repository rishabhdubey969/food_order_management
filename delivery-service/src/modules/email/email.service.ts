

// import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import * as nodemailer from 'nodemailer';
// import { OtpService } from '../otp/otp.service';
// import { EMAIL_CONSTANTS } from './emailConstants';


// @Injectable()
// export class EmailService {
//   private transporter;
//   private readonly logger = new Logger(EmailService.name);

//   constructor(
//     private readonly configService: ConfigService,
//     private readonly otpService: OtpService
//   ) {
//     try {
//       const emailService = this.configService.get<string>(EMAIL_CONSTANTS.CONFIG.SERVICE_KEY);
//       const userEmail = this.configService.get<string>(EMAIL_CONSTANTS.CONFIG.USER_EMAIL_KEY);
//       const userPass = this.configService.get<string>(EMAIL_CONSTANTS.CONFIG.USER_PASS_KEY);

//       if (!emailService || !userEmail || !userPass) {
//         this.logger.error(EMAIL_CONSTANTS.MESSAGES.ERROR.MISSING_CONFIG);
//         throw new InternalServerErrorException(EMAIL_CONSTANTS.MESSAGES.ERROR.TRANSPORTER_INIT_FAILED);
//       }

//       this.transporter = nodemailer.createTransport({
//         service: emailService,
//         auth: {
//           user: userEmail,
//           pass: userPass
//         },
//       });
//       this.logger.log(EMAIL_CONSTANTS.MESSAGES.SUCCESS.TRANSPORTER_INITIALIZED);
//     } catch (error) {
//       this.logger.error(`${EMAIL_CONSTANTS.MESSAGES.ERROR.TRANSPORTER_INIT_FAILED}: ${error.message}`, error.stack);
//       throw new InternalServerErrorException(EMAIL_CONSTANTS.MESSAGES.ERROR.TRANSPORTER_INIT_FAILED);
//     }
//   }

//   async sendEmail(email: string): Promise<string> {
//     this.logger.log(`Attempting to send OTP email to: ${email}`);
//     let otp: string;

//     otp = await this.otpService.generateOtp(email);
//     this.logger.debug(`Generated OTP for ${email}: ${otp}`);

//     try {
//       await this.transporter.sendMail({
//         from: EMAIL_CONSTANTS.EMAIL.SENDER_NAME,
//         to: email,
//         subject: EMAIL_CONSTANTS.EMAIL.OTP_SUBJECT,
//         text: `${EMAIL_CONSTANTS.EMAIL.OTP_TEXT_PREFIX}${otp}`
//       });
//       this.logger.log(`${EMAIL_CONSTANTS.MESSAGES.SUCCESS.OTP_EMAIL_SENT}: ${email}`);
//       return otp.toString();
//     } catch (error) {
//       this.logger.error(`Error sending email to ${email}: ${error.message}`, error.stack);
//       throw new InternalServerErrorException(EMAIL_CONSTANTS.MESSAGES.ERROR.SEND_EMAIL_FAILED);
//     }
//   }
// }


import { Injectable, InternalServerErrorException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { OtpService } from '../otp/otp.service';
import { EMAIL_CONSTANTS } from './emailConstants';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class EmailService {
  private transporter;

  constructor(
    private readonly configService: ConfigService,
    private readonly otpService: OtpService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger
  ) {

    try{
      const emailService = this.configService.get<string>(EMAIL_CONSTANTS.CONFIG.SERVICE_KEY);
      const userEmail = this.configService.get<string>(EMAIL_CONSTANTS.CONFIG.USER_EMAIL_KEY);
      const userPass = this.configService.get<string>(EMAIL_CONSTANTS.CONFIG.USER_PASS_KEY);

      if (!emailService || !userEmail || !userPass) {
        this.logger.error('Missing email configuration', {
          service: 'EmailService',
          error: EMAIL_CONSTANTS.MESSAGES.ERROR.MISSING_CONFIG
        });
        throw new InternalServerErrorException(EMAIL_CONSTANTS.MESSAGES.ERROR.TRANSPORTER_INIT_FAILED);
      }

      this.transporter = nodemailer.createTransport({
        service: emailService,
        auth: {
          user: userEmail,
          pass: userPass
        },
      });
      
      this.logger.info('Email transporter initialized successfully', {
        service: 'EmailService'
      });
    } catch (error) {
      this.logger.error('Failed to initialize email transporter', {
        service: 'EmailService',
        error: error.message,
        stack: error.stack
      });
      throw new InternalServerErrorException(EMAIL_CONSTANTS.MESSAGES.ERROR.TRANSPORTER_INIT_FAILED);
    }
  }

  async sendEmail(email: string): Promise<string> {
    this.logger.info('Sending OTP email', {
      service: 'EmailService',
      method: 'sendEmail',
      recipient: email
    });

      const otp = await this.otpService.generateOtp(email);
      
      this.logger.debug('OTP generated', {
        service: 'EmailService',
        recipient: email,
        otp: otp
      });

    try{
      await this.transporter.sendMail({
        from: EMAIL_CONSTANTS.EMAIL.SENDER_NAME,
        to: email,
        subject: EMAIL_CONSTANTS.EMAIL.OTP_SUBJECT,
        text: `${EMAIL_CONSTANTS.EMAIL.OTP_TEXT_PREFIX}${otp}`
      });
      
      this.logger.info('OTP email sent successfully', {
        service: 'EmailService',
        recipient: email
      });
      
      return otp.toString();
    } catch (error) {
      this.logger.error('Failed to send OTP email', {
        service: 'EmailService',
        method: 'sendEmail',
        recipient: email,
        error: error.message,
        stack: error.stack
      });
      throw new InternalServerErrorException(EMAIL_CONSTANTS.MESSAGES.ERROR.SEND_EMAIL_FAILED);
    }
  }
}