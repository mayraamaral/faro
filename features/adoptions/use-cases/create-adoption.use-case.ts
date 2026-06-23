import { AdoptionRepository } from '../domain/repositories/adoption.repository';
import { AdoptionEntity } from '../domain/entities/adoption.entity';
import { adoptionSchema, AdoptionData } from '../schemas/adoption.schema';
import { AdoptionError } from '../domain/errors/adoption.error';

export class CreateAdoptionUseCase {
  constructor(private readonly adoptionRepository: AdoptionRepository) {}

  async execute(data: unknown): Promise<AdoptionEntity> {
    const parseResult = adoptionSchema.safeParse(data);
    if (!parseResult.success) {
      throw new AdoptionError('Invalid adoption data', 'INVALID_INPUT', parseResult.error.format());
    }

    const validData: AdoptionData = parseResult.data;
    const entity = AdoptionEntity.create(validData);
    
    if (!entity.isInProgress) {
      throw new AdoptionError('New adoptions must start in IN_PROGRESS status', 'INVALID_STATUS_TRANSITION');
    }

    return await this.adoptionRepository.createAdoption(entity);
  }
}
