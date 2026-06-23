import { AdoptionRepository } from '../domain/repositories/adoption.repository';
import { AdoptionEntity } from '../domain/entities/adoption.entity';
import { cancelAdoptionSchema } from '../schemas/adoption.schema';
import { AdoptionError } from '../domain/errors/adoption.error';

export class CancelAdoptionUseCase {
  constructor(private readonly adoptionRepository: AdoptionRepository) {}

  async execute(data: unknown): Promise<AdoptionEntity> {
    const parseResult = cancelAdoptionSchema.safeParse(data);
    if (!parseResult.success) {
      throw new AdoptionError('Invalid cancel adoption data', 'INVALID_INPUT', parseResult.error.format());
    }

    const { adoptionId, cancelReason } = parseResult.data;

    const existingAdoption = await this.adoptionRepository.getAdoptionById(adoptionId);
    if (!existingAdoption) {
      throw new AdoptionError('Adoption not found', 'ADOPTION_NOT_FOUND');
    }

    existingAdoption.cancel(cancelReason);
    return await this.adoptionRepository.updateAdoption(existingAdoption);
  }
}
