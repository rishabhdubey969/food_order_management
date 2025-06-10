import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: 'smtp.gmail.com', // Replace with your SMTP host (e.g. smtp.gmail.com)
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: 'adrisha.gupta@appinventiv.com', // your SMTP user
          pass: 'svip njyt plyf iolp',    // your SMTP password
        },
      },
      defaults: {
        from: '"No Reply" <noreply@example.com>', // Default "from" address
      },
      template: {
        dir: join(__dirname, 'templates'), // path to email templates (optional)
        adapter: new HandlebarsAdapter(),  // use handlebars for templating (optional)
        options: {
          strict: true,
        },
      },
    }),
  ],
  exports: [MailerModule], // export so other modules can use MailerService
})
export class MailModule {}
