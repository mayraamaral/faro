import { AdoptionRepository } from '../domain/repositories/adoption.repository';
import { AdoptionEntity } from '../domain/entities/adoption.entity';
import { startAdaptationSchema } from '../schemas/adoption.schema';
import { AdoptionError } from '../domain/errors/adoption.error';

export class StartAdoptionAdaptationUseCase {
  constructor(private readonly adoptionRepository: AdoptionRepository) {}

  async execute(data: unknown): Promise<AdoptionEntity> {
    const parseResult = startAdaptationSchema.safeParse(data);
    if (!parseResult.success) {
      throw new AdoptionError('Invalid start adaptation data', 'INVALID_INPUT', parseResult.error.format());
    }

    const { adoptionId, adaptationStartedAt } = parseResult.data;

    const existingAdoption = await this.adoptionRepository.getAdoptionById(adoptionId);
    if (!existingAdoption) {
      throw new AdoptionError('Adoption not found', 'ADOPTION_NOT_FOUND');
    }

    existingAdoption.startAdaptation(adaptationStartedAt);
    return await this.adoptionRepository.updateAdoption(existingAdoption);
  }
}
