import { Test, TestingModule } from '@nestjs/testing';
import { MidModuleController } from './mid-module.controller';
import { MidModuleService } from './mid-module.service';

describe('MidModuleController', () => {
  let controller: MidModuleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MidModuleController],
      providers: [MidModuleService],
    }).compile();

    controller = module.get<MidModuleController>(MidModuleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
