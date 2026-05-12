import { Test, TestingModule } from '@nestjs/testing';
import { ManpowerController } from './manpower.controller';

describe('ManpowerController', () => {
  let controller: ManpowerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ManpowerController],
    }).compile();

    controller = module.get<ManpowerController>(ManpowerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
