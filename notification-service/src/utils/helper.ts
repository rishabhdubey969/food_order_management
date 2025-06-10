// import { Injectable } from '@nestjs/common';
// import { sendMail } from 'src/service/mail.service'

// @Injectable()
// export class NotificationHelperService {
//   welcomeEmail() {
//     return sendMail('rishabh@yopmail.com', 'checking', 'new');
//   }
  
// }

import { Controller, Logger } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { sendMail } from '../service/mail.service';

@Controller()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  welcomeEmail() {
    return sendMail('rishabh@yopmail.com', 'checking', 'new');
   }
 

 
  async handleUserCreated(data: any) {
    this.logger.log(`Received user_created event for ${data.email}`);
    try {
      await sendMail(data.email, 'Welcome to Our Platform', `<h2>Welcome, ${data.email}!</h2>`);
      this.logger.log(`Welcome email sent to ${data.email}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${data.email}: ${error.message}`, error.stack);
    }
  }
    async sendEmail(to: string, subject: string, html: string) {
    try {
      await sendMail(to, subject, html);
      return { success: true, message: `Email sent to ${to}` };
    } catch (error) {
      throw new Error(`Failed to send email to ${to}: ${error.message}`);
    }
  }
}

