import { Injectable } from '@nestjs/common';
import { sendMail } from 'src/service/mail.service'

@Injectable()
export class NotificationHelperService {
  welcomeEmail() {
    return sendMail('rishabh@yopmail.com', 'checking', 'new');
  }
  
}
