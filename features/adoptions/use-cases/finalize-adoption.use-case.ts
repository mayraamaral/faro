import { AdoptionRepository } from '../domain/repositories/adoption.repository';
import { AdoptionEntity } from '../domain/entities/adoption.entity';
import { finalizeAdoptionSchema } from '../schemas/adoption.schema';
import { AdoptionError } from '../domain/errors/adoption.error';

export class FinalizeAdoptionUseCase {
  constructor(private readonly adoptionRepository: AdoptionRepository) {}

  async execute(data: unknown): Promise<AdoptionEntity> {
    const parseResult = finalizeAdoptionSchema.safeParse(data);
    if (!parseResult.success) {
      throw new AdoptionError('Invalid finalize adoption data', 'INVALID_INPUT', parseResult.error.format());
    }

    const { adoptionId, adoptionDate, adopterProfileId } = parseResult.data;

    const existingAdoption = await this.adoptionRepository.getAdoptionById(adoptionId);
    if (!existingAdoption) {
      throw new AdoptionError('Adoption not found', 'ADOPTION_NOT_FOUND');
    }

    existingAdoption.finalizeAdoption(adoptionDate, adopterProfileId);
    return await this.adoptionRepository.updateAdoption(existingAdoption);
  }
}
