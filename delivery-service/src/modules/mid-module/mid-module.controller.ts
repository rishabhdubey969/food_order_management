import { Controller } from '@nestjs/common';
import { MidModuleService } from './mid-module.service';

@Controller('mid-module')
export class MidModuleController {
  constructor(private readonly midModuleService: MidModuleService) {}
}
