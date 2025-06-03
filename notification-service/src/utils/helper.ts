import { Injectable } from '@nestjs/common';
import { sendMail } from 'src/service/mail.service'

@Injectable()
export class NotificationHelperService {
<<<<<<< Updated upstream
  welcomeEmail() {
    return sendMail('rishabh@yopmail.com', 'checking', 'new');
=======
  welcomeEmail(data: any, subject : string, template) {
    return sendMail(data.email||data, subject, data.name||null, template, data.otp?data.otp : null);
>>>>>>> Stashed changes
  }
  
}
