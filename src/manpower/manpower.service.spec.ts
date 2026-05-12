import { Test, TestingModule } from '@nestjs/testing';
import { ManpowerService } from './manpower.service';

describe('ManpowerService', () => {
  let service: ManpowerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ManpowerService],
    }).compile();

    service = module.get<ManpowerService>(ManpowerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
