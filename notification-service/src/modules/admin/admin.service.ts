import { Injectable, Logger } from '@nestjs/common';
import { sendMail } from '../../service/mail.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  async sendAdminEmail(data: { to: string; subject: string; html: string }) {
    this.logger.log(`Sending admin email to ${data.to} with subject: ${data.subject}`);
    try {
      await sendMail(data.to, data.subject, data.html);
      this.logger.log(`Admin email sent to ${data.to}`);
      return { success: true, message: `Admin email sent to ${data.to}` };
    } catch (error) {
      this.logger.error(`Failed to send admin email to ${data.to}: ${error.message}`, error.stack);
      throw new Error(`Failed to send admin email: ${error.message}`);
    }
  }
}