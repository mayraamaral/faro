import { AdoptionRepository } from '../domain/repositories/adoption.repository';
import { AdoptionEntity } from '../domain/entities/adoption.entity';
import { rejectAdoptionSchema } from '../schemas/adoption.schema';
import { AdoptionError } from '../domain/errors/adoption.error';

export class RejectAdoptionUseCase {
  constructor(private readonly adoptionRepository: AdoptionRepository) {}

  async execute(data: unknown): Promise<AdoptionEntity> {
    const parseResult = rejectAdoptionSchema.safeParse(data);
    if (!parseResult.success) {
      throw new AdoptionError('Invalid reject adoption data', 'INVALID_INPUT', parseResult.error.format());
    }

    const { adoptionId, cancelReason, decisionNotes } = parseResult.data;

    const existingAdoption = await this.adoptionRepository.getAdoptionById(adoptionId);
    if (!existingAdoption) {
      throw new AdoptionError('Adoption not found', 'ADOPTION_NOT_FOUND');
    }

    existingAdoption.reject(cancelReason, decisionNotes);
    return await this.adoptionRepository.updateAdoption(existingAdoption);
  }
}
