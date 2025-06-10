import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class EmailQueue {
  constructor(@Inject('EMAIL_SERVICE') private client: ClientProxy) {}

  async sendEmailJob(emailPayload: { to: string; subject: string; html: string }) {
    this.client.emit('send_email', emailPayload);
  }
}
