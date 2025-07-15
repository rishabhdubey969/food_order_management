
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

  /**
   * Initializes the EmailService with a configured Nodemailer transporter.
   *
   * Args:
   *   configService (ConfigService): Service to retrieve environment configuration.
   *   otpService (OtpService): Service to generate OTPs for email content.
   *   logger (Logger): Winston logger for logging service events.
   *
   * Throws:
   *   InternalServerErrorException: If email configuration is missing or transporter initialization fails.
   */
  constructor(
    private readonly configService: ConfigService,
    private readonly otpService: OtpService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger
  ) {
    try {
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

  async sendEmail(email: string) {
    /**
     * Sends an OTP email to the specified recipient.
     *
     * Args:
     *   email (string): The recipient's email address.
     *
     * Returns:
     *   Promise<string>: The generated OTP sent in the email.
     *
     * Throws:
     *   InternalServerErrorException: If the email sending process fails.
     */
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

    try {
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