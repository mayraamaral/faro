import { AdoptionRepository } from '../domain/repositories/adoption.repository';
import { AdoptionEntity } from '../domain/entities/adoption.entity';
import { scheduleVisitSchema } from '../schemas/adoption.schema';
import { AdoptionError } from '../domain/errors/adoption.error';

export class ScheduleAdoptionVisitUseCase {
  constructor(private readonly adoptionRepository: AdoptionRepository) {}

  async execute(data: unknown): Promise<AdoptionEntity> {
    const parseResult = scheduleVisitSchema.safeParse(data);
    if (!parseResult.success) {
      throw new AdoptionError('Invalid schedule visit data', 'INVALID_INPUT', parseResult.error.format());
    }

    const { adoptionId, visitScheduledFor } = parseResult.data;

    const existingAdoption = await this.adoptionRepository.getAdoptionById(adoptionId);
    if (!existingAdoption) {
      throw new AdoptionError('Adoption not found', 'ADOPTION_NOT_FOUND');
    }

    existingAdoption.scheduleVisit(visitScheduledFor);
    return await this.adoptionRepository.updateAdoption(existingAdoption);
  }
}
