import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('EMAIL_HOST'),
      port: this.configService.get<number>('EMAIL_PORT'),
      secure: false,
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASSWORD'),
      },
    });
  }
}

//   async sendVerificationEmail(to: string, token: string): Promise<void> {
//     const appName = this.configService.get<string>('APP_NAME', 'Our App');
//     const from = this.configService.get<string>('EMAIL_FROM');
    
//     try {
//       await this.transporter.sendMail({
//         from: "${appName}" <${from}>,
//         to,
//         subject: 
//       });
//     } catch (error) {
//       throw error;
//     }
//   }

//   async sendPasswordResetOTP(to: string, otp: string): Promise<void> {
//     const appName = this.configService.get<string>('APP_NAME', 'Our App');
//     const from = this.configService.get<string>('EMAIL_FROM');

//     try {
//       await this.transporter.sendMail({
//         from: "${appName}" <${from}>,
//         to,
//         subject: passwordResetSubject(appName),
//         html: passwordResetTemplate(appName, otp),
//       });

//       logger.info(Password reset OTP sent to: ${to});
//     } catch (error) {
//       logger.error(Failed to send password reset OTP to ${to}: ${error.message});
//       throw error;
//     }
//   }
// }