import { Injectable, OnModuleInit } from '@nestjs/common';
import { SeederService } from './seed/super-admin.seeder';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(private readonly seederService: SeederService) {}

  async onModuleInit() {
    await this.seederService.seedSuperAdmin();
  }
}
