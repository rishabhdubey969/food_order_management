import { Injectable } from '@nestjs/common';
import { sendMail } from 'src/service/mail.service'

@Injectable()
export class NotificationHelperService {
  
  welcomeEmail(data: any, subject : string, template) {
    return sendMail(data.email||data, subject, data.name||null, template, data.otp?data.otp : null);
  }

   resetEmail(data: any, subject : string, template) {
    const resetLink = `http://localhost:5173/reset-password/${data.token}`
    return sendMail(data.email, subject, data.name||null, template, resetLink||null);
  }

  paymentSuccess(data: any, subject : string, template){
    console.log(data.email, subject, data.name||null, template) ;
   return sendMail(data.email, subject, data.name||null, template, null);
  }

  paymentFailed(data: any, subject : string, template){
   return sendMail(data.email, subject, data.name||null, template, null);
  }
  
}