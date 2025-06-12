import { Test, TestingModule } from '@nestjs/testing';
import { MidModuleService } from './mid-module.service';

describe('MidModuleService', () => {
  let service: MidModuleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MidModuleService],
    }).compile();

    service = module.get<MidModuleService>(MidModuleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
